// Marketplace endpoints: home page data, restaurant list/detail, partner & rider applications,
// newsletter, owner's restaurants.
const crypto = require('crypto');
const express = require('express');
const { store } = require('./db');
const { restaurantTerms } = require('./pricing');
const { isAdmin, ownsRestaurant } = require('./access');

const router = express.Router();

const TIME_ZONE = process.env.TIME_ZONE || 'Asia/Ashgabat';
const langOf = (req) => (['en', 'ru', 'tk'].includes(req.query.lang) ? req.query.lang : 'en');
const pick = (value, lang) => (value && typeof value === 'object' && !Array.isArray(value) ? (value[lang] || value.en || '') : value);
const cleanText = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const isValidEmail = (email) => typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
const isValidPhone = (phone) => /^\+?[\d\s()-]{6,20}$/.test(phone);

/** Local weekday (0 = Monday) and minutes since midnight in the restaurant time zone. */
function localNow(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date).map(p => [p.type, p.value]));
  const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(parts.weekday);
  return { day, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}
const toMin = (hhmm) => { const [h, m] = String(hhmm).split(':').map(Number); return h * 60 + (m || 0); };

/** { open_now, closes_at } from hours = [[open, close] x 7], Monday first. Handles closing after midnight. */
function openState(hours) {
  if (!Array.isArray(hours) || hours.length !== 7) return { open_now: true, closes_at: null };
  const { day, minutes } = localNow();
  const today = hours[day], yesterday = hours[(day + 6) % 7];
  // Still open from yesterday's late shift?
  if (yesterday && toMin(yesterday[1]) < toMin(yesterday[0]) && minutes < toMin(yesterday[1])) {
    return { open_now: true, closes_at: yesterday[1] };
  }
  if (!today) return { open_now: false, closes_at: null };
  const open = toMin(today[0]), close = toMin(today[1]);
  const isOpen = close > open ? minutes >= open && minutes < close : minutes >= open;
  return { open_now: isOpen, closes_at: isOpen ? today[1] : null, opens_at: isOpen ? null : today[0] };
}

const cuisinesById = () => new Map(store.list('Cuisine').map(c => [c.id, c]));

/** Public card representation of a restaurant. */
function restaurantCard(r, lang, cuisines = cuisinesById()) {
  return {
    id: r.id, slug: r.slug, name: pick(r.name, lang), tagline: pick(r.tagline, lang), description: pick(r.description, lang),
    logo_url: r.logo_url, cover_url: r.cover_url, hero_image_url: r.hero_image_url,
    cuisines: (r.cuisine_ids || []).map(id => cuisines.get(id)).filter(Boolean).map(c => ({ id: c.id, slug: c.slug, name: pick(c.name, lang) })),
    rating: r.rating, review_count: r.review_count, delivery_time: r.delivery_time, discount_percent: r.discount_percent || 0,
    is_featured: !!r.is_featured, area: r.area, status: r.status,
    ...restaurantTerms(r), ...openState(r.hours),
  };
}

const approvedRestaurants = () => store.list('Restaurant').filter(r => r.status === 'approved');

// ---------- Home page ----------
router.get('/home', (req, res) => {
  const lang = langOf(req);
  const restaurants = approvedRestaurants();
  const cuisines = cuisinesById();
  const countByCuisine = new Map();
  restaurants.forEach(r => (r.cuisine_ids || []).forEach(id => countByCuisine.set(id, (countByCuisine.get(id) || 0) + 1)));

  const cards = restaurants.map(r => restaurantCard(r, lang, cuisines));
  const delivered = store.list('Order').filter(o => o.status === 'delivered').length;

  res.json({
    cuisines: [...cuisines.values()].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map(c => ({ id: c.id, slug: c.slug, name: pick(c.name, lang), image_url: c.image_url, restaurant_count: countByCuisine.get(c.id) || 0 })),
    deals: cards.filter(c => c.discount_percent > 0).sort((a, b) => b.discount_percent - a.discount_percent).slice(0, 6),
    popular: [...cards].sort((a, b) => Number(b.is_featured) - Number(a.is_featured) || b.rating - a.rating).slice(0, 6),
    stats: {
      restaurants: restaurants.length,
      orders_delivered: delivered,
      food_items: store.list('Product').filter(p => p.is_available !== false).length,
      riders: store.list('RiderApplication').filter(a => a.status === 'approved').length,
    },
  });
});

// ---------- Restaurants ----------
router.get('/restaurants', (req, res) => {
  const lang = langOf(req);
  const q = cleanText(req.query.q, 100).toLowerCase();
  const cuisine = cleanText(req.query.cuisine, 50);
  const area = cleanText(req.query.area, 100).toLowerCase();
  const cuisines = cuisinesById();
  const cuisineId = cuisine ? [...cuisines.values()].find(c => c.slug === cuisine || c.id === cuisine)?.id : null;

  let list = approvedRestaurants();
  if (cuisineId) list = list.filter(r => (r.cuisine_ids || []).includes(cuisineId));
  if (area) list = list.filter(r => [r.area, r.address, ...(r.delivery_areas || [])].some(a => String(a || '').toLowerCase().includes(area)));
  let cards = list.map(r => restaurantCard(r, lang, cuisines));
  if (q) cards = cards.filter(c => [c.name, c.tagline, ...c.cuisines.map(x => x.name)].some(s => String(s).toLowerCase().includes(q)));
  cards.sort((a, b) => Number(b.open_now) - Number(a.open_now) || b.rating - a.rating);
  res.json(cards);
});

router.get('/restaurants/:slug', (req, res) => {
  const lang = langOf(req);
  const r = store.findBy('Restaurant', 'slug', req.params.slug) || store.get('Restaurant', req.params.slug);
  const canManage = r && ownsRestaurant(req, r.id);
  if (!r || (r.status !== 'approved' && !canManage)) return res.status(404).json({ message: 'Restaurant not found' });

  const cuisines = cuisinesById();
  const sections = store.list('MenuSection').filter(s => s.restaurant_id === r.id)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(s => ({ id: s.id, name: pick(s.name, lang), sort_order: s.sort_order }));
  const products = store.list('Product')
    .filter(p => p.restaurant_id === r.id && (p.is_available !== false || canManage))
    .map(p => ({ ...p, name: pick(p.name, lang), description: pick(p.description, lang) }));
  const offers = store.list('Offer').filter(o => o.restaurant_id === r.id && o.is_active !== false)
    .map(o => ({ ...o, title: pick(o.title, lang) }));
  const reviews = store.list('Review').filter(v => v.restaurant_id === r.id)
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 12);
  const similar = approvedRestaurants()
    .filter(x => x.id !== r.id && (x.cuisine_ids || []).some(id => (r.cuisine_ids || []).includes(id)))
    .slice(0, 6).map(x => restaurantCard(x, lang, cuisines));

  res.json({
    ...restaurantCard(r, lang, cuisines),
    address: r.address, phone: r.phone, website: r.website, lat: r.lat, lng: r.lng, hours: r.hours || null,
    can_manage: !!canManage,
    sections, products, offers, reviews, similar,
  });
});

// Restaurants the current user manages (owner dashboard)
router.get('/owner/restaurants', (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  const lang = langOf(req);
  const mine = store.list('Restaurant').filter(r => isAdmin(req) || r.owner_id === req.user.id);
  res.json(mine.map(r => ({ ...r, card: restaurantCard(r, lang) })));
});

// ---------- Partner applications ("Partner with us") ----------
router.post('/partner-applications', (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Authentication required' });
  const b = req.body || {};
  const app = {
    restaurant_name: cleanText(b.restaurant_name, 100),
    contact_name: cleanText(b.contact_name, 100),
    phone: cleanText(b.phone, 20),
    email: cleanText(b.email || req.user.email, 254).toLowerCase(),
    address: cleanText(b.address, 300),
    cuisine: cleanText(b.cuisine, 100),
    message: cleanText(b.message, 1000),
  };
  if (app.restaurant_name.length < 2 || app.contact_name.length < 2 || app.address.length < 5) return res.status(400).json({ message: 'Please fill in all required fields' });
  if (!isValidPhone(app.phone)) return res.status(400).json({ message: 'Please enter a valid phone number' });
  if (!isValidEmail(app.email)) return res.status(400).json({ message: 'Invalid email' });
  if (store.list('PartnerApplication').some(a => a.user_id === req.user.id && a.status === 'pending')) {
    return res.status(409).json({ message: 'Application already sent' });
  }
  const saved = store.save('PartnerApplication', {
    ...app, id: 'pa' + crypto.randomUUID(), user_id: req.user.id, status: 'pending', created_at: new Date().toISOString(),
  });
  res.status(201).json(saved);
});

const slugify = (name) => {
  const base = String(name).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 50) || 'restaurant';
  let slug = base, i = 2;
  while (store.findBy('Restaurant', 'slug', slug)) slug = `${base}-${i++}`;
  return slug;
};

router.post('/partner-applications/:id/:decision', (req, res) => {
  if (!isAdmin(req)) return res.status(req.user ? 403 : 401).json({ message: 'Not allowed' });
  const app = store.get('PartnerApplication', req.params.id);
  if (!app) return res.status(404).json({ message: 'Not found' });
  if (app.status !== 'pending') return res.status(409).json({ message: 'Already processed' });
  const decision = req.params.decision;
  if (!['approve', 'reject'].includes(decision)) return res.status(404).json({ message: 'Not found' });

  const result = store.transaction(() => {
    if (decision === 'reject') {
      return { application: store.save('PartnerApplication', { ...app, status: 'rejected', decided_at: new Date().toISOString() }) };
    }
    const restaurant = store.save('Restaurant', {
      id: 'r' + crypto.randomUUID(), slug: slugify(app.restaurant_name), name: app.restaurant_name,
      tagline: '', description: '', logo_url: '', cover_url: '', hero_image_url: '',
      cuisine_ids: [], owner_id: app.user_id, status: 'approved', is_featured: false, discount_percent: 0,
      min_order: 0, delivery_fee: 10, free_delivery_from: 150, delivery_time: '30-40',
      rating: 0, review_count: 0, address: app.address, area: '', phone: app.phone, website: '',
      hours: null, created_at: new Date().toISOString(),
    });
    const user = store.get('User', app.user_id);
    if (user && user.role === 'user') store.save('User', { ...user, role: 'owner' });
    const application = store.save('PartnerApplication', { ...app, status: 'approved', restaurant_id: restaurant.id, decided_at: new Date().toISOString() });
    return { application, restaurant };
  });
  res.json(result);
});

// ---------- Rider applications ("Ride with us") ----------
router.post('/rider-applications', (req, res) => {
  const b = req.body || {};
  const app = {
    name: cleanText(b.name, 100), phone: cleanText(b.phone, 20), email: cleanText(b.email, 254).toLowerCase(),
    vehicle: ['bike', 'scooter', 'car'].includes(b.vehicle) ? b.vehicle : 'scooter', area: cleanText(b.area, 100),
  };
  if (app.name.length < 2) return res.status(400).json({ message: 'Please enter your name' });
  if (!isValidPhone(app.phone)) return res.status(400).json({ message: 'Please enter a valid phone number' });
  if (app.email && !isValidEmail(app.email)) return res.status(400).json({ message: 'Invalid email' });
  const saved = store.save('RiderApplication', {
    ...app, id: 'ra' + crypto.randomUUID(), user_id: req.user?.id || null, status: 'pending', created_at: new Date().toISOString(),
  });
  res.status(201).json({ id: saved.id, status: saved.status });
});

// ---------- Newsletter ----------
router.post('/subscribe', (req, res) => {
  const email = cleanText(req.body?.email, 254).toLowerCase();
  if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email' });
  if (store.findBy('Subscriber', 'email', email)) return res.status(409).json({ message: 'Already subscribed' });
  store.save('Subscriber', { id: 'sub' + crypto.randomUUID(), email, created_at: new Date().toISOString() });
  res.status(201).json({ success: true });
});

module.exports = { router, restaurantCard, openState };
