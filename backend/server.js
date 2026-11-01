const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const { store, sessions, DB_PATH } = require('./db');
const { migrate } = require('./migrate');
const { PRICING, PricingError, priceOrder, resolvePromo } = require('./pricing');
const { localizeErrors } = require('./messages');
const {
  ENTITIES, OWNER_LOCKED, ORDER_OWNER_FIELDS, ORDER_STATUSES, isAdmin, ownsRestaurant,
} = require('./access');
const marketplace = require('./marketplace');

const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';

// CORS: in production allow only the configured frontend origin
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));
app.use(localizeErrors);
app.use(express.json({ limit: '100kb' }));

// ==========================================
// Mail (Brevo SMTP) — credentials come from .env only
// ==========================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});
const MAIL_FROM = process.env.SMTP_FROM || '"Ember" <no-reply@example.com>';

// ==========================================
// Password hashing (scrypt)
// ==========================================
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (!stored || typeof password !== 'string') return false;
  const [salt, hash] = stored.split(':');
  const candidate = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Never send password hashes to the client
const publicUser = ({ passwordHash, ...user }) => user;

const isValidEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
const isValidPassword = (password) => typeof password === 'string' && password.length >= 8 && password.length <= 128;
const isValidPhone = (phone) => /^\+?[\d\s()-]{6,20}$/.test(phone);
const cleanText = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const langOf = (req) => (['en', 'ru', 'tk'].includes(req.query.lang) ? req.query.lang : 'en');

// ==========================================
// Start-up: schema migration + admin account
// ==========================================
migrate(store);

// Admin account comes from .env (ADMIN_EMAIL / ADMIN_PASSWORD), never hardcoded.
// If the password in .env changes, the stored hash is updated on the next start.
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const email = process.env.ADMIN_EMAIL.trim().toLowerCase();
  const existing = store.findBy('User', 'email', email);
  if (!existing) {
    store.save('User', { id: 'u' + crypto.randomUUID(), email, passwordHash: hashPassword(process.env.ADMIN_PASSWORD), name: 'Admin', role: 'admin', verified: true, created_at: new Date().toISOString() });
  } else if (existing.role !== 'admin' || !verifyPassword(process.env.ADMIN_PASSWORD, existing.passwordHash)) {
    store.save('User', { ...existing, role: 'admin', passwordHash: hashPassword(process.env.ADMIN_PASSWORD) });
    sessions.destroyAllForUser(existing.id);
  }
} else {
  console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD are not set in .env — no admin account was created.');
}

sessions.purgeExpired();
setInterval(() => sessions.purgeExpired(), 60 * 60 * 1000).unref();

// Translatable fields are stored as { en, ru, tk } and sent as a plain string in the requested language
const I18N_FIELDS = ['name', 'description', 'short_description', 'title', 'subtitle', 'tagline'];
const localize = (data, lang) => data.map(item => {
  const out = { ...item };
  for (const f of I18N_FIELDS) {
    const v = item[f];
    if (v && typeof v === 'object' && !Array.isArray(v)) out[f] = v[lang] || v.en || '';
  }
  return out;
});
// Owners/admins editing data need the raw { en, ru, tk } values: ?raw=1
const maybeLocalize = (req, items) => (req.query.raw === '1' && req.user ? items : localize(items, langOf(req)));

// Supports "field" (ascending) and "-field" (descending)
const sortItems = (items, sort) => {
  if (typeof sort !== 'string' || !sort) return items;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return [...items].sort((a, b) => {
    const x = a[field], y = b[field];
    if (x === y) return 0;
    if (x === undefined || x === null) return 1;
    if (y === undefined || y === null) return -1;
    return (x < y ? -1 : 1) * (desc ? -1 : 1);
  });
};

const applyLimit = (items, limit) => {
  const n = Number(limit);
  return Number.isInteger(n) && n > 0 ? items.slice(0, Math.min(n, 1000)) : items;
};

// ==========================================
// Auth middleware
// ==========================================
const bearerToken = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

app.use((req, res, next) => {
  const userId = sessions.resolve(bearerToken(req));
  req.user = userId ? store.get('User', userId) : null;
  next();
});

const requireAuth = (req, res, next) => (req.user ? next() : res.status(401).json({ message: 'Authentication required' }));
const requireAdmin = (req, res, next) => (isAdmin(req) ? next() : res.status(req.user ? 403 : 401).json({ message: 'Not allowed' }));

// Simple in-memory rate limiter for sensitive endpoints
const attempts = new Map();
function rateLimit(max, windowMs) {
  return (req, res, next) => {
    const key = `${req.path}:${req.ip}`;
    const now = Date.now();
    const entry = attempts.get(key) || { count: 0, resetAt: now + windowMs };
    if (now > entry.resetAt) { entry.count = 0; entry.resetAt = now + windowMs; }
    entry.count += 1;
    attempts.set(key, entry);
    if (entry.count > max) return res.status(429).json({ message: 'Too many attempts. Try again later.' });
    next();
  };
}
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) if (now > entry.resetAt) attempts.delete(key);
}, 15 * 60 * 1000).unref();

// ==========================================
// Auth routes
// ==========================================
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_TRIES = 5;

async function sendOtp(email, otpCode) {
  try {
    await transporter.sendMail({ from: MAIL_FROM, to: email, subject: 'Ember verification code', text: `Your code: ${otpCode}` });
  } catch (error) {
    console.error(`[Mail] Failed to send OTP: ${error.message}`);
    // Dev only: show the code in the terminal so local testing still works
    if (!IS_PROD) console.log(`[DEV] OTP for ${email}: ${otpCode}`);
  }
}

app.post('/api/auth/register', rateLimit(5, 15 * 60 * 1000), async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const { password } = req.body;
  if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email' });
  if (!isValidPassword(password)) return res.status(400).json({ message: 'Password must be 8–128 characters' });
  if (store.findBy('User', 'email', email)) return res.status(409).json({ message: 'Email already registered' });

  const otpCode = crypto.randomInt(100000, 1000000).toString();
  store.save('PendingUser', {
    id: email,
    passwordHash: hashPassword(password),
    name: cleanText(req.body.full_name || req.body.name, 100) || null,
    otpCode, expiresAt: Date.now() + OTP_TTL_MS, tries: 0,
  });
  await sendOtp(email, otpCode);
  res.json({ success: true });
});

app.post('/api/auth/resend-otp', rateLimit(3, 15 * 60 * 1000), async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const pending = store.get('PendingUser', email);
  if (pending) {
    pending.otpCode = crypto.randomInt(100000, 1000000).toString();
    pending.expiresAt = Date.now() + OTP_TTL_MS;
    pending.tries = 0;
    store.save('PendingUser', pending);
    await sendOtp(email, pending.otpCode);
  }
  res.json({ success: true }); // same answer either way — no user enumeration
});

app.post('/api/auth/verify-otp', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otpCode = String(req.body.otpCode || '');
  const pending = store.get('PendingUser', email);

  if (!pending || pending.expiresAt < Date.now()) {
    store.remove('PendingUser', email);
    return res.status(400).json({ message: 'Code expired. Please register again.' });
  }
  pending.tries += 1;
  if (pending.tries > OTP_MAX_TRIES) {
    store.remove('PendingUser', email);
    return res.status(429).json({ message: 'Too many attempts. Please register again.' });
  }
  if (pending.otpCode !== otpCode) {
    store.save('PendingUser', pending);
    return res.status(400).json({ message: 'Invalid code' });
  }

  const newUser = {
    id: 'u' + crypto.randomUUID(), email, passwordHash: pending.passwordHash,
    name: pending.name || email.split('@')[0], role: 'user', verified: true, created_at: new Date().toISOString(),
  };
  store.transaction(() => {
    store.save('User', newUser);
    store.remove('PendingUser', email);
  });
  res.json({ access_token: sessions.create(newUser.id, SESSION_TTL_MS), user: publicUser(newUser) });
});

app.post('/api/auth/login', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = store.findBy('User', 'email', email);
  if (!user || !verifyPassword(req.body.password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json({ access_token: sessions.create(user.id, SESSION_TTL_MS), user: publicUser(user) });
});

// ---------- Password reset ----------
const RESET_TTL_MS = 30 * 60 * 1000;
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const FRONTEND_URL = (process.env.FRONTEND_URL || '').replace(/\/$/, '');

app.post('/api/auth/forgot-password', rateLimit(5, 15 * 60 * 1000), async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = isValidEmail(email) ? store.findBy('User', 'email', email) : null;
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    // Only the hash is stored; one active link per user
    store.list('PasswordReset').filter(r => r.user_id === user.id).forEach(r => store.remove('PasswordReset', r.id));
    store.save('PasswordReset', { id: sha256(token), user_id: user.id, expiresAt: Date.now() + RESET_TTL_MS });
    const origin = FRONTEND_URL || (typeof req.headers.origin === 'string' ? req.headers.origin : '');
    const link = `${origin}/reset-password?token=${token}`;
    try {
      await transporter.sendMail({
        from: MAIL_FROM, to: email, subject: 'Ember — reset your password',
        text: `To set a new password open this link (valid for 30 minutes):\n${link}\n\nIf you didn't ask for this, ignore this email.`,
      });
    } catch (error) {
      console.error(`[Mail] Failed to send reset link: ${error.message}`);
      if (!IS_PROD) console.log(`[DEV] Password reset link for ${email}: ${link}`);
    }
  }
  res.json({ success: true }); // same answer either way — no user enumeration
});

app.post('/api/auth/reset-password', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const token = String(req.body.token || '');
  const { password } = req.body;
  if (!isValidPassword(password)) return res.status(400).json({ message: 'Password must be 8–128 characters' });
  const entry = token ? store.get('PasswordReset', sha256(token)) : null;
  if (!entry || entry.expiresAt < Date.now()) {
    if (entry) store.remove('PasswordReset', entry.id);
    return res.status(400).json({ message: 'Reset link is invalid or expired' });
  }
  const user = store.get('User', entry.user_id);
  if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired' });
  store.transaction(() => {
    store.save('User', { ...user, passwordHash: hashPassword(password) });
    store.remove('PasswordReset', entry.id);
  });
  sessions.destroyAllForUser(user.id); // log out everywhere
  res.json({ success: true });
});

app.post('/api/auth/logout', (req, res) => {
  sessions.destroy(bearerToken(req));
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json(publicUser(req.user)));

// ==========================================
// System routes
// ==========================================
app.get('/api/settings/public', (req, res) => {
  res.json({ id: 'app', public_settings: { auth_required: false, currency: 'TMT', pricing: PRICING } });
});

// ==========================================
// Marketplace (home, restaurants, applications, newsletter)
// ==========================================
app.use('/api', marketplace.router);

// ==========================================
// Admin: users
// ==========================================
app.get('/api/admin/users', requireAdmin, (req, res) => {
  res.json(sortItems(store.list('User').map(publicUser), '-created_at'));
});

app.put('/api/admin/users/:id/role', requireAdmin, (req, res) => {
  const role = req.body?.role;
  if (!['user', 'owner', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  const user = store.get('User', req.params.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  if (user.id === req.user.id && role !== 'admin') return res.status(400).json({ message: 'You cannot remove your own admin role' });
  res.json(publicUser(store.save('User', { ...user, role })));
});

// ==========================================
// Orders — priced on the server, never trusting client prices
// ==========================================
const PAYMENT_METHODS = ['cash', 'card'];

// Validates a promo code for the basket (the real check happens again when the order is placed)
app.post('/api/orders/promo', rateLimit(30, 15 * 60 * 1000), (req, res) => {
  try {
    const restaurantId = typeof req.body.restaurant_id === 'string' ? req.body.restaurant_id : null;
    const promo = resolvePromo(store, req.body.code, Number(req.body.subtotal) || 0, restaurantId);
    if (!promo) return res.status(400).json({ message: 'Invalid promo code' });
    res.json({ code: promo.code, discount_percent: promo.discount_percent, min_order_amount: promo.min_order_amount || 0 });
  } catch (err) {
    if (err instanceof PricingError) return res.status(400).json({ message: err.message });
    throw err;
  }
});

// Guest order tracking: order number + the phone used for the order. Returns no personal data.
app.get('/api/orders/track', rateLimit(30, 15 * 60 * 1000), (req, res) => {
  const number = cleanText(req.query.number, 40).toUpperCase();
  const phoneDigits = String(req.query.phone || '').replace(/\D/g, '');
  if (!number || phoneDigits.length < 6) return res.status(400).json({ message: 'Please fill in all required fields' });
  const order = store.findBy('Order', 'order_number', number);
  // Compare the last 8 digits so "+993 61 ..." and "861 ..." both match
  const matches = order && String(order.customer_phone || '').replace(/\D/g, '').slice(-8) === phoneDigits.slice(-8);
  if (!matches) return res.status(404).json({ message: 'Order not found' });
  const { order_number, status, restaurant_name, restaurant_slug, fulfillment, items, total, estimated_delivery, created_at } = order;
  res.json({
    order_number, status, restaurant_name, restaurant_slug, fulfillment, total, estimated_delivery, created_at,
    items: (items || []).map(i => ({ product_name: i.product_name, quantity: i.quantity, size: i.size })),
  });
});

app.post('/api/Order', rateLimit(20, 15 * 60 * 1000), (req, res) => {
  const body = req.body || {};
  const lang = langOf(req);

  const customer = {
    customer_name: cleanText(body.customer_name, 100),
    customer_phone: cleanText(body.customer_phone, 20),
    customer_email: cleanText(body.customer_email, 254).toLowerCase(),
    delivery_address: cleanText(body.delivery_address, 500),
    customer_notes: cleanText(body.customer_notes, 1000),
  };
  const isCollection = body.fulfillment === 'collection';
  if (customer.customer_name.length < 2) return res.status(400).json({ message: 'Please enter your name' });
  if (!isValidPhone(customer.customer_phone)) return res.status(400).json({ message: 'Please enter a valid phone number' });
  if (customer.customer_email && !isValidEmail(customer.customer_email)) return res.status(400).json({ message: 'Invalid email' });
  if (!isCollection && customer.delivery_address.length < 5) return res.status(400).json({ message: 'Please enter the delivery address' });
  const payment_method = PAYMENT_METHODS.includes(body.payment_method) ? body.payment_method : 'cash';

  try {
    const order = store.transaction(() => {
      const priced = priceOrder(store, body, lang);
      if (priced.promo) {
        store.save('PromoCode', { ...priced.promo, used_count: (priced.promo.used_count || 0) + 1 });
      }
      const r = priced.restaurant;
      return store.save('Order', {
        id: 'id' + crypto.randomUUID(),
        order_number: 'EM-' + Date.now().toString(36).toUpperCase() + crypto.randomBytes(2).toString('hex').toUpperCase(),
        status: 'received',
        restaurant_id: r.id,
        restaurant_name: typeof r.name === 'object' ? (r.name[lang] || r.name.en) : r.name,
        restaurant_slug: r.slug,
        fulfillment: priced.fulfillment,
        items: priced.items,
        subtotal: priced.subtotal,
        discount_amount: priced.discount_amount,
        delivery_fee: priced.delivery_fee,
        tax: priced.tax,
        total: priced.total,
        promo_code: priced.promo?.code || null,
        ...customer,
        payment_method,
        estimated_delivery: r.delivery_time ? `${r.delivery_time} min` : '30-45 min',
        user_id: req.user?.id || null,
        created_at: new Date().toISOString(),
      });
    });
    res.status(201).json(order);
  } catch (err) {
    if (err instanceof PricingError) return res.status(400).json({ message: err.message });
    throw err;
  }
});

// ==========================================
// Generic entity routes — only whitelisted entities, with per-entity access rules
// ==========================================

// Per-entity validation of client input on create; returns an error message or null
const validators = {
  Review: (data, req) => {
    const rating = Number(data.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) return 'Rating must be 1–5';
    data.rating = rating;
    data.comment = cleanText(data.comment, 1000);
    if (!data.comment) return 'Please write a comment';
    if (typeof data.restaurant_id !== 'string' || !store.get('Restaurant', data.restaurant_id)) return 'Restaurant not found';
    if (!isAdmin(req)) {
      data.author_name = req.user.name || req.user.email.split('@')[0];
      data.avatar_letter = data.author_name.charAt(0).toUpperCase();
    }
    return null;
  },
  Wishlist: (data, req) => {
    if (typeof data.product_id !== 'string' || !store.get('Product', data.product_id)) return 'Product not found';
    const duplicate = store.list('Wishlist').some(w => w.user_id === req.user.id && w.product_id === data.product_id);
    return duplicate ? 'Already in wishlist' : null;
  },
};

// After a review is posted, keep the restaurant rating up to date
const afterCreate = {
  Review: (review) => {
    const list = store.list('Review').filter(r => r.restaurant_id === review.restaurant_id);
    const r = store.get('Restaurant', review.restaurant_id);
    if (r && list.length) {
      const avg = list.reduce((s, x) => s + (Number(x.rating) || 0), 0) / list.length;
      store.save('Restaurant', { ...r, rating: Math.round(avg * 10) / 10, review_count: list.length });
    }
  },
};

function getRules(req, res) {
  const rules = Object.hasOwn(ENTITIES, req.params.entity) ? ENTITIES[req.params.entity] : null;
  if (!rules) { res.status(404).json({ message: 'Not found' }); return null; }
  return rules;
}

// Filter conditions: exact value, or an object with $gt/$gte/$lt/$lte/$ne/$in
const OPERATORS = {
  $gt: (a, b) => a > b,
  $gte: (a, b) => a >= b,
  $lt: (a, b) => a < b,
  $lte: (a, b) => a <= b,
  $ne: (a, b) => a !== b,
  $in: (a, b) => Array.isArray(b) && b.includes(a),
};
function matchCondition(value, cond) {
  if (cond && typeof cond === 'object' && !Array.isArray(cond)) {
    return Object.entries(cond).every(([op, arg]) => OPERATORS[op] ? OPERATORS[op](value, arg) : false);
  }
  return value === cond;
}

const visibleItems = (req, rules) => store.list(req.params.entity).filter(item => rules.read(req, item));

app.get('/api/:entity', (req, res) => {
  const rules = getRules(req, res); if (!rules) return;
  const items = applyLimit(sortItems(visibleItems(req, rules), req.query.sort), req.query.limit);
  res.json(maybeLocalize(req, items));
});

app.post('/api/:entity/filter', (req, res) => {
  const rules = getRules(req, res); if (!rules) return;
  const query = (req.body && typeof req.body.query === 'object' && req.body.query) || {};
  const matches = (item) => Object.entries(query).every(([k, cond]) => matchCondition(item[k], cond));
  const items = visibleItems(req, rules).filter(matches);
  res.json(maybeLocalize(req, applyLimit(sortItems(items, req.body?.sortBy), req.body?.limit)));
});

// Fields the client must never set itself
const PROTECTED_FIELDS = ['id', 'created_at', 'user_id', 'role', 'passwordHash'];
function sanitize(req, body) {
  const clean = body && typeof body === 'object' && !Array.isArray(body) ? { ...body } : {};
  PROTECTED_FIELDS.forEach(f => delete clean[f]);
  if (!isAdmin(req)) (OWNER_LOCKED[req.params.entity] || []).forEach(f => delete clean[f]);
  return clean;
}

// Non-admins may only attach data to restaurants they own
function checkRestaurantScope(req, data) {
  if (isAdmin(req) || !('restaurant_id' in data)) return true;
  return ownsRestaurant(req, data.restaurant_id);
}

app.post('/api/:entity', (req, res) => {
  const rules = getRules(req, res); if (!rules) return;
  const data = sanitize(req, req.body);
  // For restaurant-owned entities the write rule is evaluated against the new item
  const allowed = rules.create ? rules.create(req) : rules.write(req, data);
  if (!allowed) return res.status(req.user ? 403 : 401).json({ message: 'Not allowed' });
  if (!['Review', 'Wishlist'].includes(req.params.entity) && !checkRestaurantScope(req, data)) {
    return res.status(403).json({ message: 'Not allowed' });
  }

  const error = validators[req.params.entity]?.(data, req);
  if (error) return res.status(400).json({ message: error });

  const newItem = { ...data, id: 'id' + crypto.randomUUID(), created_at: new Date().toISOString() };
  if (req.user) newItem.user_id = req.user.id;
  const saved = store.save(req.params.entity, newItem);
  afterCreate[req.params.entity]?.(saved);
  res.status(201).json(saved);
});

app.put('/api/:entity/:id', (req, res) => {
  const rules = getRules(req, res); if (!rules) return;
  const item = store.get(req.params.entity, req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  if (!rules.write(req, item)) return res.status(req.user ? 403 : 401).json({ message: 'Not allowed' });

  let changes = sanitize(req, req.body);
  if (req.params.entity === 'Order') {
    // Restaurant owners (and admins) change only the status of an order
    changes = Object.fromEntries(Object.entries(changes).filter(([k]) => ORDER_OWNER_FIELDS.includes(k)));
    if (changes.status && !ORDER_STATUSES.includes(changes.status)) return res.status(400).json({ message: 'Invalid status' });
  }
  if (!checkRestaurantScope(req, changes)) return res.status(403).json({ message: 'Not allowed' });

  res.json(store.save(req.params.entity, { ...item, ...changes, id: item.id, updated_at: new Date().toISOString() }));
});

app.delete('/api/:entity/:id', (req, res) => {
  const rules = getRules(req, res); if (!rules) return;
  const item = store.get(req.params.entity, req.params.id);
  if (!item) return res.status(404).json({ message: 'Not found' });
  if (!rules.write(req, item)) return res.status(req.user ? 403 : 401).json({ message: 'Not allowed' });
  if (req.params.entity === 'Order' && !isAdmin(req)) return res.status(403).json({ message: 'Not allowed' });

  store.remove(req.params.entity, req.params.id);
  res.json({ success: true });
});

// Unknown API route / unexpected errors — always JSON, never a stack trace
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON' });
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
  console.log(`Database: ${DB_PATH}`);
});
