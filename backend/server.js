const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const IS_PROD = process.env.NODE_ENV === 'production';

// CORS: in production allow only the configured frontend origin
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins } : {}));
app.use(express.json({ limit: '100kb' }));

// ==========================================
// Mail (Brevo SMTP) — credentials come from .env only
// ==========================================
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: Number(process.env.SMTP_PORT) || 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
const MAIL_FROM = process.env.SMTP_FROM || '"Epicurean" <no-reply@example.com>';

// ==========================================
// Password hashing (scrypt) and sessions
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
const sessions = new Map(); // token -> { userId, expiresAt }

function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

// Never send password hashes to the client
const publicUser = ({ passwordHash, ...user }) => user;

const isValidEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
const isValidPassword = (password) => typeof password === 'string' && password.length >= 8 && password.length <= 128;

// ==========================================
// In-memory data
// ==========================================
let db = {
  Users: [],
  PendingUsers: {},


  Ingredient: [
    { id: 'i1', name: { en: 'Extra Cheese', tk: 'Goşma peýnir', ru: 'Доп. сыр' }, price: 15, calories: 120 },
    { id: 'i2', name: { en: 'Pickles', tk: 'Duzlanan hyýar', ru: 'Огурцы' }, price: 8, calories: 10 },
    { id: 'i3', name: { en: 'Red Onion', tk: 'Gyzyl sogan', ru: 'Красный лук' }, price: 5, calories: 15 },
    { id: 'i4', name: { en: 'Bacon', tk: 'Bekon', ru: 'Бекон' }, price: 25, calories: 180 },
    { id: 'i5', name: { en: 'Fresh Tomatoes', tk: 'Täze pomidor', ru: 'Томаты' }, price: 10, calories: 20 },
    { id: 'i6', name: { en: 'Garlic Sauce', tk: 'Sarymsak sousy', ru: 'Чесночный соус' }, price: 12, calories: 70 }
  ],
  Category: [
    { id: 'cat1', name: { en: 'Pizza', tk: 'Pissa', ru: 'Пицца' }, slug: 'pizza', icon: '🍕', image_url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800', sort_order: 1 },
    { id: 'cat2', name: { en: 'Burgers', tk: 'Burgerler', ru: 'Бургеры' }, slug: 'burger', icon: '🍔', image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800', sort_order: 2 },
    { id: 'cat3', name: { en: 'Salads', tk: 'Salatlar', ru: 'Салаты' }, slug: 'salad', icon: '🥗', image_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800', sort_order: 3 },
    { id: 'cat4', name: { en: 'Pasta', tk: 'Pastalar', ru: 'Паста' }, slug: 'pasta', icon: '🍝', image_url: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=800', sort_order: 4 },
    { id: 'cat5', name: { en: 'Chicken', tk: 'Towuk', ru: 'Курица' }, slug: 'chicken', icon: '🍗', image_url: 'https://images.unsplash.com/photo-1626645738196-c2a7c8d08f58?w=800', sort_order: 5 },
    { id: 'cat6', name: { en: 'Desserts', tk: 'Süýjülikler', ru: 'Десерты' }, slug: 'dessert', icon: '🍰', image_url: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800', sort_order: 6 },
    { id: 'cat7', name: { en: 'Sushi', tk: 'Suşiler', ru: 'Суши' }, slug: 'sushi', icon: '🍣', image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800', sort_order: 7 },
    { id: 'cat8', name: { en: 'Drinks', tk: 'Içgiler', ru: 'Напитки' }, slug: 'drinks', icon: '🥤', image_url: 'https://images.unsplash.com/photo-1544145945-f904253d0c7b?w=800', sort_order: 8 }
  ],
  Product: [
    {
      id: 'p1',
      name: { en: 'Truffle Pasta', tk: 'Trýufel Pastasy', ru: 'Трюфельная Паста' },
      category_id: 'cat4',
      base_price: 85.00,
      image_url: 'https://images.unsplash.com/photo-1528751014936-863e6e7a319c?w=800',
      description: { en: 'Wild mushroom & truffle', tk: 'Kömelekli we trýufelli', ru: 'Лесные грибы и трюфель' },
      prep_time: '18-22 min', rating: 4.8, is_available: true, is_popular: true,
      sizes: [
        { name: 'Small', price_modifier: 0, weight: '300g' },
        { name: 'Medium', price_modifier: 30, weight: '500g' },
        { name: 'Large', price_modifier: 60, weight: '800g' }
      ],
      default_ingredients: ['i1', 'i6'],
      optional_ingredients: ['i3', 'i4']
    },
    {
      id: 'p2',
      name: { en: 'Pepperoni Pizza', tk: 'Pepperoni Pyssasy', ru: 'Пицца Пепперони' },
      category_id: 'cat1',
      base_price: 110.00,
      image_url: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800',
      description: { en: 'Spicy pepperoni', tk: 'Ajy pepperoni', ru: 'Острые колбаски пепперони' },
      prep_time: '15-20 min', rating: 4.7, is_available: true, is_popular: true, discount_percent: 15,
      sizes: [
        { name: 'Small', price_modifier: 0, weight: '400g' },
        { name: 'Medium', price_modifier: 35, weight: '650g' },
        { name: 'Large', price_modifier: 75, weight: '900g' }
      ],
      default_ingredients: ['i1', 'i5'],
      optional_ingredients: ['i2', 'i3', 'i4']
    },
    {
      id: 'p3',
      name: { en: 'Wagyu Burger', tk: 'Wagýu Burgeri', ru: 'Вагю Бургер' },
      category_id: 'cat2',
      base_price: 145.00,
      image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
      description: { en: 'Premium beef', tk: 'Ýokary hilli et', ru: 'Премиальная говядина' },
      prep_time: '12-18 min', rating: 4.9, is_available: true, is_popular: true,
      sizes: [
        { name: 'Standard', price_modifier: 0, weight: '350g' },
        { name: 'Double Meat', price_modifier: 50, weight: '500g' }
      ],
      default_ingredients: ['i1', 'i2', 'i3'],
      optional_ingredients: ['i4', 'i5']
    }
  ],
  Review: [
    { id: 'r1', author_name: 'Sarah M.', rating: 5, comment: 'Amazing food!', created_at: new Date().toISOString(), avatar_letter: 'S' }
  ],
  Order: [],
  PromoCode: [
    { id: 'pr1', code: 'WELCOME', discount_percent: 15, is_active: true, min_order_amount: 0 }
  ],
  Wishlist: []
};

// Admin account is created from .env (ADMIN_EMAIL / ADMIN_PASSWORD), never hardcoded
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  db.Users.push({
    id: 'u1',
    email: process.env.ADMIN_EMAIL.toLowerCase(),
    passwordHash: hashPassword(process.env.ADMIN_PASSWORD),
    name: 'Admin',
    role: 'admin',
    verified: true
  });
} else {
  console.warn('⚠️  ADMIN_EMAIL / ADMIN_PASSWORD are not set in .env — no admin account was created.');
}

const localize = (data, lang) => {
  if (Array.isArray(data)) {
    return data.map(item => ({
      ...item,
      name: (item.name && typeof item.name === 'object') ? (item.name[lang] || item.name['en']) : item.name,
      description: (item.description && typeof item.description === 'object') ? (item.description[lang] || item.description['en']) : item.description,
      short_description: (item.short_description && typeof item.short_description === 'object') ? (item.short_description[lang] || item.short_description['en']) : item.short_description
    }));
  }
  return data;
};

// ==========================================
// Auth middleware
// ==========================================
app.use((req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  const session = token && sessions.get(token);
  if (session && session.expiresAt > Date.now()) {
    req.user = db.Users.find(u => u.id === session.userId) || null;
  } else {
    if (session) sessions.delete(token);
    req.user = null;
  }
  next();
});

const requireAuth = (req, res, next) => (req.user ? next() : res.status(401).json({ message: 'Authentication required' }));
const requireAdmin = (req, res, next) => (req.user?.role === 'admin' ? next() : res.status(403).json({ message: 'Admin access required' }));

// Simple in-memory rate limiter for auth endpoints
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

// ==========================================
// Auth routes
// ==========================================
const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_TRIES = 5;

async function sendOtp(email, otpCode) {
  try {
    await transporter.sendMail({ from: MAIL_FROM, to: email, subject: 'Verification Code', text: `Your code: ${otpCode}` });
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
  if (db.Users.some(u => u.email === email)) return res.status(409).json({ message: 'Email already registered' });

  const otpCode = crypto.randomInt(100000, 1000000).toString();
  db.PendingUsers[email] = { passwordHash: hashPassword(password), otpCode, expiresAt: Date.now() + OTP_TTL_MS, tries: 0 };
  await sendOtp(email, otpCode);
  res.json({ success: true });
});

app.post('/api/auth/resend-otp', rateLimit(3, 15 * 60 * 1000), async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const pending = db.PendingUsers[email];
  if (pending) {
    pending.otpCode = crypto.randomInt(100000, 1000000).toString();
    pending.expiresAt = Date.now() + OTP_TTL_MS;
    pending.tries = 0;
    await sendOtp(email, pending.otpCode);
  }
  res.json({ success: true }); // same answer either way — no user enumeration
});

app.post('/api/auth/verify-otp', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const otpCode = String(req.body.otpCode || '');
  const pending = db.PendingUsers[email];

  if (!pending || pending.expiresAt < Date.now()) {
    delete db.PendingUsers[email];
    return res.status(400).json({ message: 'Code expired. Please register again.' });
  }
  pending.tries += 1;
  if (pending.tries > OTP_MAX_TRIES) {
    delete db.PendingUsers[email];
    return res.status(429).json({ message: 'Too many attempts. Please register again.' });
  }
  if (pending.otpCode !== otpCode) return res.status(400).json({ message: 'Invalid code' });

  const newUser = { id: 'u' + crypto.randomUUID(), email, passwordHash: pending.passwordHash, name: email.split('@')[0], role: 'user', verified: true };
  db.Users.push(newUser);
  delete db.PendingUsers[email];
  res.json({ access_token: createSession(newUser.id), user: publicUser(newUser) });
});

app.post('/api/auth/login', rateLimit(10, 15 * 60 * 1000), (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = db.Users.find(u => u.email === email);
  if (!user || !verifyPassword(req.body.password, user.passwordHash)) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  res.json({ access_token: createSession(user.id), user: publicUser(user) });
});

app.post('/api/auth/logout', (req, res) => {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) sessions.delete(header.slice(7));
  res.json({ success: true });
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json(publicUser(req.user)));

// ==========================================
// System routes
// ==========================================
app.get('/api/settings/public', (req, res) => {
  res.json({ id: 'app', public_settings: { auth_required: false, currency: 'TMT' } });
});

// ==========================================
// Entity routes — only whitelisted entities, with per-entity access rules
// ==========================================
const isAdmin = (req) => req.user?.role === 'admin';
const ownsItem = (req, item) => item.user_id && req.user && item.user_id === req.user.id;

const ENTITIES = {
  // Public menu data: anyone can read, only admin can change
  Category:   { read: () => true, write: isAdmin },
  Product:    { read: () => true, write: isAdmin },
  Ingredient: { read: () => true, write: isAdmin },
  // Reviews: anyone can read, logged-in users can post, admin can moderate
  Review:     { read: () => true, create: (req) => !!req.user, write: isAdmin },
  // Promo codes: admin sees the list; customers can only look up one active code by exact value
  PromoCode:  { read: isAdmin, write: isAdmin },
  // Orders: anyone can place; users see their own; admin sees and updates all
  Order:      { read: (req, item) => isAdmin(req) || ownsItem(req, item), create: () => true, write: isAdmin },
  // Wishlist: private per user
  Wishlist:   { read: ownsItem, create: (req) => !!req.user, write: (req, item) => isAdmin(req) || ownsItem(req, item) }
};

function getRules(req, res) {
  const rules = ENTITIES[req.params.entity];
  if (!rules) { res.status(404).json({ message: 'Not found' }); return null; }
  return rules;
}

const visibleItems = (req, rules) => (db[req.params.entity] || []).filter(item => rules.read(req, item));

app.get('/api/:entity', (req, res) => {
  const rules = getRules(req, res); if (!rules) return;
  res.json(localize(visibleItems(req, rules), req.query.lang || 'en'));
});

app.post('/api/:entity/filter', (req, res) => {
  const rules = getRules(req, res); if (!rules) return;
  const query = (req.body && typeof req.body.query === 'object' && req.body.query) || {};
  const matches = (item) => Object.entries(query).every(([k, v]) => item[k] === v);

  let items;
  if (req.params.entity === 'PromoCode' && !isAdmin(req)) {
    // Exact-code lookup only — the full list of codes is never exposed
    if (typeof query.code !== 'string') return res.json([]);
    items = (db.PromoCode || []).filter(p => p.is_active && matches(p));
  } else {
    items = visibleItems(req, rules).filter(matches);
  }
  res.json(localize(items, req.query.lang || 'en'));
});

// Fields the client must never set itself
const PROTECTED_FIELDS = ['id', 'created_at', 'user_id', 'role', 'passwordHash'];
const sanitize = (body) => {
  const clean = { ...(body || {}) };
  PROTECTED_FIELDS.forEach(f => delete clean[f]);
  return clean;
};

app.post('/api/:entity', (req, res) => {
  const rules = getRules(req, res); if (!rules) return;
  const canCreate = rules.create ? rules.create(req) : rules.write(req);
  if (!canCreate) return res.status(req.user ? 403 : 401).json({ message: 'Not allowed' });

  const newItem = { ...sanitize(req.body), id: 'id' + crypto.randomUUID(), created_at: new Date().toISOString() };
  if (req.user) newItem.user_id = req.user.id;
  if (req.params.entity === 'Order') newItem.status = 'received';

  if (!db[req.params.entity]) db[req.params.entity] = [];
  db[req.params.entity].push(newItem);
  res.json(newItem);
});

app.put('/api/:entity/:id', (req, res) => {
  const rules = getRules(req, res); if (!rules) return;
  const list = db[req.params.entity] || [];
  const index = list.findIndex(item => item.id === req.params.id);
  if (index === -1) return res.status(404).send();
  if (!rules.write(req, list[index])) return res.status(req.user ? 403 : 401).json({ message: 'Not allowed' });

  list[index] = { ...list[index], ...sanitize(req.body) };
  res.json(list[index]);
});

app.delete('/api/:entity/:id', (req, res) => {
  const rules = getRules(req, res); if (!rules) return;
  const list = db[req.params.entity] || [];
  const item = list.find(i => i.id === req.params.id);
  if (!item) return res.status(404).send();
  if (!rules.write(req, item)) return res.status(req.user ? 403 : 401).json({ message: 'Not allowed' });

  db[req.params.entity] = list.filter(i => i.id !== req.params.id);
  res.sendStatus(200);
});

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});
