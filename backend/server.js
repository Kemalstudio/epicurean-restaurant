const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const app = express();

app.use(cors());
app.use(express.json());

// ==========================================
// 1. НАСТРОЙКА ПОЧТЫ (BREVO SMTP)
// ==========================================
const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 2525,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

let db = {
  Users: [
    {
      id: 'u1',
      email: 'kemalatayew913@gmail.com',
      password: '123456789',
      name: 'Kemal Admin',
      role: 'admin',
      verified: true
    }
  ],
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

// --- МАРШРУТЫ АВТОРИЗАЦИИ ---

app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  db.PendingUsers[email] = { password, otpCode };

  console.log(`\n--- РЕГИСТРАЦИЯ ---`);
  console.log(`Пользователь: ${email}`);
  console.log(`ТВОЙ КОД ПОДТВЕРЖДЕНИЯ (введи его на сайте): ${otpCode}`);
  console.log(`-------------------\n`);

  const mailOptions = {
    from: '"Epicurean" <kemalatayew913@gmail.com>',
    to: email,
    subject: 'Verification Code',
    text: `Your code: ${otpCode}`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ [Brevo] Письмо успешно отправлено на почту!`);
    res.json({ success: true });
  } catch (error) {
    console.log(`❌ [Brevo Error] Письмо не ушло. Причина: ${error.message}`);

    res.json({ success: true, note: "Email failed, check terminal for OTP" });
  }
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otpCode } = req.body;
  const pending = db.PendingUsers[email];
  if (pending && pending.otpCode === otpCode) {
    const newUser = { id: 'u' + Date.now(), email, password: pending.password, name: email.split('@')[0], role: 'user', verified: true };
    db.Users.push(newUser);
    delete db.PendingUsers[email];
    // Исправлено: везде используем 'fake-token-'
    res.json({ access_token: 'fake-token-' + newUser.id, user: newUser });
  } else {
    res.status(400).json({ message: 'Invalid code' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.Users.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ access_token: 'fake-token-' + user.id, user });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).send();
  const userId = auth.replace('Bearer fake-token-', '');
  const user = db.Users.find(u => u.id === userId);
  if (user) res.json(user); else res.status(401).send();
});

// --- СИСТЕМНЫЕ РОУТЫ ---

app.get('/api/settings/public', (req, res) => {
  res.json({ id: 'app', public_settings: { auth_required: false, currency: "TMT" } });
});

app.get('/api/:entity', (req, res) => {
  const entity = req.params.entity;
  const lang = req.query.lang || 'en';
  res.json(localize(db[entity] || [], lang));
});

app.post('/api/:entity/filter', (req, res) => {
  const entity = req.params.entity;
  const lang = req.query.lang || 'en';
  res.json(localize(db[entity] || [], lang));
});

app.post('/api/:entity', (req, res) => {
  const entity = req.params.entity;
  const newItem = { id: 'id' + Date.now(), created_at: new Date().toISOString(), ...req.body };
  if (!db[entity]) db[entity] = [];
  db[entity].push(newItem);
  res.json(newItem);
});

app.put('/api/:entity/:id', (req, res) => {
  const { entity, id } = req.params;
  const index = db[entity]?.findIndex(item => item.id === id);
  if (index !== -1) {
    db[entity][index] = { ...db[entity][index], ...req.body };
    res.json(db[entity][index]);
  } else res.status(404).send();
});

app.delete('/api/:entity/:id', (req, res) => {
  const { entity, id } = req.params;
  if (db[entity]) db[entity] = db[entity].filter(item => item.id !== id);
  res.sendStatus(200);
});

const PORT = 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://192.168.200.207:${PORT}`);
});