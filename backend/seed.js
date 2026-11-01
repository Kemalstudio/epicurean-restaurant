// Demo marketplace data (schema v2). Written once, when the database is created or migrated.
// All restaurants are fictional. Photos: Unsplash (free for commercial use).

// Photos are self-hosted in /public/img (downloaded once from Unsplash, converted to WebP)
const img = (id, w = 800) => `/img/${id}-${w}.webp`;
const t = (en, ru, tk) => ({ en, ru, tk });

const WEEK_10_23 = [['10:00', '23:00'], ['10:00', '23:00'], ['10:00', '23:00'], ['10:00', '23:00'], ['10:00', '00:00'], ['10:00', '00:00'], ['11:00', '22:00']];
const WEEK_8_22 = [['08:00', '22:00'], ['08:00', '22:00'], ['08:00', '22:00'], ['08:00', '22:00'], ['08:00', '22:00'], ['09:00', '22:00'], ['09:00', '20:00']];
const WEEK_12_02 = [['12:00', '02:00'], ['12:00', '02:00'], ['12:00', '02:00'], ['12:00', '02:00'], ['12:00', '03:00'], ['12:00', '03:00'], ['12:00', '01:00']];

const Cuisine = [
  { id: 'cu-burgers', slug: 'burgers', name: t('Burgers & Fast food', 'Бургеры и фастфуд', 'Burgerler we çalt nahar'), image_url: img('1568901346375-23c9450c58cd', 600), sort_order: 1 },
  { id: 'cu-pizza', slug: 'pizza', name: t('Pizza', 'Пицца', 'Pissa'), image_url: img('1590947132387-155cc02f3212', 600), sort_order: 2 },
  { id: 'cu-pasta', slug: 'pasta', name: t('Pasta & Casuals', 'Паста', 'Pasta'), image_url: img('1621996346565-e3dbc646d9a9', 600), sort_order: 3 },
  { id: 'cu-salads', slug: 'salads', name: t('Salads', 'Салаты', 'Salatlar'), image_url: img('1512621776951-a57141f2eefd', 600), sort_order: 4 },
  { id: 'cu-sushi', slug: 'sushi', name: t('Sushi & Asian', 'Суши и азиатская', 'Suşi we Aziýa'), image_url: img('1579871494447-9811cf80d66c', 600), sort_order: 5 },
  { id: 'cu-breakfast', slug: 'breakfast', name: t('Breakfast', 'Завтраки', 'Ertirlik'), image_url: img('1525351484163-7529414344d8', 600), sort_order: 6 },
  { id: 'cu-grill', slug: 'grill', name: t('Grill & Kebab', 'Гриль и шашлык', 'Gril we kebap'), image_url: img('1555939594-58d7cb561ad1', 600), sort_order: 7 },
  { id: 'cu-desserts', slug: 'desserts', name: t('Desserts', 'Десерты', 'Süýjülikler'), image_url: img('1563729784474-d77dbb933a9e', 600), sort_order: 8 },
];

const Ingredient = [
  { id: 'i1', name: t('Extra Cheese', 'Доп. сыр', 'Goşmaça peýnir'), price: 15, calories: 120 },
  { id: 'i2', name: t('Pickles', 'Огурцы', 'Duzlanan hyýar'), price: 8, calories: 10 },
  { id: 'i3', name: t('Red Onion', 'Красный лук', 'Gyzyl sogan'), price: 5, calories: 15 },
  { id: 'i4', name: t('Bacon', 'Бекон', 'Bekon'), price: 25, calories: 180 },
  { id: 'i5', name: t('Fresh Tomatoes', 'Томаты', 'Täze pomidor'), price: 10, calories: 20 },
  { id: 'i6', name: t('Garlic Sauce', 'Чесночный соус', 'Sarymsak sousy'), price: 12, calories: 70 },
  { id: 'i7', name: t('Jalapeños', 'Халапеньо', 'Halapenýo'), price: 8, calories: 5 },
  { id: 'i8', name: t('Mushrooms', 'Грибы', 'Kömelek'), price: 10, calories: 15 },
  { id: 'i9', name: t('Olives', 'Оливки', 'Zeýtun'), price: 10, calories: 40 },
  { id: 'i10', name: t('Avocado', 'Авокадо', 'Awokado'), price: 20, calories: 80 },
];

const SIZES_PIZZA = [
  { name: 'Small', price_modifier: 0, weight: '25 cm' },
  { name: 'Medium', price_modifier: 30, weight: '30 cm' },
  { name: 'Large', price_modifier: 60, weight: '35 cm' },
  { name: 'XL with sauces', price_modifier: 90, weight: '40 cm' },
];

const restaurant = (r) => ({
  status: 'approved', owner_id: null, is_featured: false, discount_percent: 0,
  min_order: 50, delivery_fee: 10, free_delivery_from: 150, delivery_time: '25-35',
  rating: 4.5, review_count: 0, area: 'Ashgabat', phone: '+993 12 00-00-00', website: '',
  created_at: '2026-01-01T00:00:00.000Z', ...r,
});

const Restaurant = [
  restaurant({
    id: 'r-epicurean', slug: 'epicurean', name: 'Epicurean',
    tagline: t('Italian classics with a modern twist', 'Итальянская классика в современном прочтении', 'Häzirki zaman görnüşindäki italýan nusgawylary'),
    description: t('Fresh pasta, wood-fired pizza and premium burgers.', 'Свежая паста, пицца из печи и премиальные бургеры.', 'Täze pasta, odun peçde bişirilen pissa we ýokary hilli burgerler.'),
    logo_url: img('1504674900247-0877df9cc836', 400), cover_url: img('1414235077428-338989a2e8c0', 1400), hero_image_url: img('1473093226795-af9932fe5856', 900),
    cuisine_ids: ['cu-pasta', 'cu-pizza', 'cu-burgers'], rating: 4.8, review_count: 1, is_featured: true, discount_percent: 15,
    address: 'Magtymguly Ave 12, Ashgabat', lat: 37.9420, lng: 58.3790, hours: WEEK_10_23, delivery_time: '20-25', min_order: 60,
  }),
  restaurant({
    id: 'r-burger-lab', slug: 'burger-lab', name: 'Burger Lab',
    tagline: t('Smash burgers & crispy fries', 'Смэш-бургеры и хрустящая картошка', 'Smeş burgerler we gytyr kartoşka'),
    description: t('Grilled to order, sauces made in-house every morning.', 'Жарим на заказ, соусы готовим сами каждое утро.', 'Sargyda görä bişirýäris, souslary her gün özümiz taýýarlaýarys.'),
    logo_url: img('1586190848861-99aa4a171e90', 400), cover_url: img('1561758033-d89a9ad46330', 1400), hero_image_url: img('1594212699903-ec8a3eca50f5', 900),
    cuisine_ids: ['cu-burgers'], rating: 4.6, review_count: 0, is_featured: true, discount_percent: 40,
    address: 'Bitarap Turkmenistan Ave 45, Ashgabat', lat: 37.9301, lng: 58.3880, hours: WEEK_12_02, delivery_time: '15-25', min_order: 40,
  }),
  restaurant({
    id: 'r-napoli', slug: 'napoli-wood-fire', name: 'Napoli Wood Fire',
    tagline: t('Neapolitan pizza from a wood-fired oven', 'Неаполитанская пицца из дровяной печи', 'Odun peçden neapol pissasy'),
    description: t('48-hour dough, San Marzano tomatoes, fior di latte.', 'Тесто 48 часов, томаты Сан-Марцано, фиор-ди-латте.', '48 sagatlyk hamyr, San-Marsano pomidorlary, fior di latte.'),
    logo_url: img('1574071318508-1cdbab80d002', 400), cover_url: img('1555396273-367ea4eb4db5', 1400), hero_image_url: img('1604382354936-07c5d9983bd3', 900),
    cuisine_ids: ['cu-pizza'], rating: 4.7, is_featured: true, discount_percent: 20,
    address: 'Andalyp St 7, Ashgabat', lat: 37.9512, lng: 58.3601, hours: WEEK_12_02, delivery_time: '25-35',
  }),
  restaurant({
    id: 'r-green-bowl', slug: 'green-bowl', name: 'Green Bowl',
    tagline: t('Salads, bowls and fresh juices', 'Салаты, боулы и свежие соки', 'Salatlar, boullar we täze şireler'),
    description: t('Light, colourful and filling — made from local produce.', 'Легко, ярко и сытно — из местных продуктов.', 'Ýeňil, reňkli we doýurymly — ýerli önümlerden.'),
    logo_url: img('1546069901-ba9599a7e63c', 400), cover_url: img('1517248135467-4c7edcad34c4', 1400), hero_image_url: img('1512621776951-a57141f2eefd', 900),
    cuisine_ids: ['cu-salads'], rating: 4.5, discount_percent: 17,
    address: 'Garashsyzlyk Ave 20, Ashgabat', lat: 37.9208, lng: 58.3702, hours: WEEK_8_22, delivery_time: '20-30', min_order: 40,
  }),
  restaurant({
    id: 'r-sakura', slug: 'sakura-sushi', name: 'Sakura Sushi',
    tagline: t('Rolls, ramen and wok', 'Роллы, рамен и вок', 'Rollar, ramen we wok'),
    description: t('Japanese and pan-Asian kitchen.', 'Японская и паназиатская кухня.', 'Ýapon we Aziýa aşhanasy.'),
    logo_url: img('1617196034796-73dfa7b1fd56', 400), cover_url: img('1559339352-11d035aa65de', 1400), hero_image_url: img('1611143669185-af224c5e3252', 900),
    cuisine_ids: ['cu-sushi'], rating: 4.4, delivery_time: '30-40', min_order: 80,
    address: 'Atatürk St 82, Ashgabat', lat: 37.9150, lng: 58.4011, hours: WEEK_12_02,
  }),
  restaurant({
    id: 'r-sunrise', slug: 'sunrise-cafe', name: 'Sunrise Café',
    tagline: t('All-day breakfast', 'Завтраки весь день', 'Bütin gün ertirlik'),
    description: t('Eggs, toasts, pancakes and good coffee.', 'Яйца, тосты, панкейки и хороший кофе.', 'Ýumurtga, tost, pankeýk we gowy kofe.'),
    logo_url: img('1533089860892-a7c6f0a88666', 400), cover_url: img('1504754524776-8f4f37790ca0', 1400), hero_image_url: img('1484723091739-30a097e8f929', 900),
    cuisine_ids: ['cu-breakfast', 'cu-desserts'], rating: 4.6, delivery_time: '20-30', min_order: 40,
    address: 'Gorogly St 15, Ashgabat', lat: 37.9388, lng: 58.3511, hours: WEEK_8_22,
  }),
  restaurant({
    id: 'r-tandyr', slug: 'tandyr-grill', name: 'Tandyr Grill',
    tagline: t('Shashlik, kebab and tandyr bread', 'Шашлык, кебаб и тандырный хлеб', 'Şaşlyk, kebap we tamdyr çöregi'),
    description: t('Charcoal grill and traditional Turkmen recipes.', 'Мангал на углях и традиционные туркменские рецепты.', 'Kömür ojak we däp bolan türkmen reseptleri.'),
    logo_url: img('1599487488170-d11ec9c172f0', 400), cover_url: img('1600891964599-f61ba0e24092', 1400), hero_image_url: img('1555939594-58d7cb561ad1', 900),
    cuisine_ids: ['cu-grill'], rating: 4.9, is_featured: true, delivery_time: '30-40', min_order: 60,
    address: 'Oguzhan St 3, Ashgabat', lat: 37.9600, lng: 58.3900, hours: WEEK_10_23,
  }),
  restaurant({
    id: 'r-sweet', slug: 'sweet-corner', name: 'Sweet Corner',
    tagline: t('Cakes, cupcakes and desserts', 'Торты, капкейки и десерты', 'Tortlar, kapkeýkler we desertler'),
    description: t('Baked fresh every day.', 'Выпекаем каждый день.', 'Her gün täze bişirilýär.'),
    logo_url: img('1576618148400-f54bed99fcfd', 400), cover_url: img('1488477181946-6428a0291777', 1400), hero_image_url: img('1565958011703-44f9829ba187', 900),
    cuisine_ids: ['cu-desserts'], rating: 4.7, delivery_time: '25-35', min_order: 30,
    address: 'Turkmenbashi Ave 54, Ashgabat', lat: 37.9333, lng: 58.3822, hours: WEEK_10_23,
  }),
];

const section = (id, restaurant_id, name, sort_order) => ({ id, restaurant_id, name, sort_order });
const MenuSection = [
  section('s-epi-pasta', 'r-epicurean', t('Pasta', 'Паста', 'Pasta'), 1),
  section('s-epi-pizza', 'r-epicurean', t('Pizza', 'Пицца', 'Pissa'), 2),
  section('s-epi-burgers', 'r-epicurean', t('Burgers', 'Бургеры', 'Burgerler'), 3),
  section('s-bl-burgers', 'r-burger-lab', t('Burgers', 'Бургеры', 'Burgerler'), 1),
  section('s-bl-sides', 'r-burger-lab', t('Fries & sides', 'Картошка и закуски', 'Kartoşka we garnirler'), 2),
  section('s-bl-chicken', 'r-burger-lab', t('Chicken', 'Курица', 'Towuk'), 3),
  section('s-np-pizza', 'r-napoli', t('Pizzas', 'Пицца', 'Pissalar'), 1),
  section('s-np-pasta', 'r-napoli', t('Pasta', 'Паста', 'Pasta'), 2),
  section('s-gb-salads', 'r-green-bowl', t('Salads', 'Салаты', 'Salatlar'), 1),
  section('s-gb-bowls', 'r-green-bowl', t('Bowls', 'Боулы', 'Boullar'), 2),
  section('s-sk-rolls', 'r-sakura', t('Rolls & sushi', 'Роллы и суши', 'Rollar we suşi'), 1),
  section('s-sk-ramen', 'r-sakura', t('Ramen & wok', 'Рамен и вок', 'Ramen we wok'), 2),
  section('s-sr-breakfast', 'r-sunrise', t('Breakfast', 'Завтраки', 'Ertirlik'), 1),
  section('s-sr-sweet', 'r-sunrise', t('Pancakes & toasts', 'Панкейки и тосты', 'Pankeýk we tost'), 2),
  section('s-tg-grill', 'r-tandyr', t('From the grill', 'С мангала', 'Ojakdan'), 1),
  section('s-tg-mains', 'r-tandyr', t('Mains', 'Основные блюда', 'Esasy naharlar'), 2),
  section('s-sw-cakes', 'r-sweet', t('Cakes', 'Торты', 'Tortlar'), 1),
  section('s-sw-small', 'r-sweet', t('Cupcakes & donuts', 'Капкейки и пончики', 'Kapkeýk we ponçik'), 2),
];

let n = 0;
const product = (restaurant_id, section_id, p) => ({
  id: p.id || `p-${restaurant_id.slice(2)}-${++n}`,
  restaurant_id, section_id, is_available: true, is_popular: false, rating: 4.5,
  sizes: [], default_ingredients: [], optional_ingredients: [], spice_level: 0, prep_time: '15-20 min',
  created_at: '2026-01-01T00:00:00.000Z', ...p,
});

const Product = [
  // Epicurean — ids p1..p3 kept so old orders still point to existing products
  product('r-epicurean', 's-epi-pasta', {
    id: 'p1', name: t('Truffle Pasta', 'Трюфельная паста', 'Trýufel pastasy'), base_price: 85,
    description: t('Wild mushrooms, truffle cream, parmesan.', 'Лесные грибы, трюфельный крем, пармезан.', 'Tokaý kömelekleri, trýufel kremi, parmezan.'),
    image_url: img('1473093226795-af9932fe5856'), is_popular: true, rating: 4.8, calories: 640,
    sizes: [{ name: 'Small', price_modifier: 0, weight: '300 g' }, { name: 'Medium', price_modifier: 30, weight: '450 g' }, { name: 'Large', price_modifier: 60, weight: '600 g' }],
    default_ingredients: ['i1', 'i6'], optional_ingredients: ['i3', 'i4', 'i8'],
  }),
  product('r-epicurean', 's-epi-pizza', {
    id: 'p2', name: t('Pepperoni Pizza', 'Пицца Пепперони', 'Pepperoni pissasy'), base_price: 110, discount_percent: 15,
    description: t('Spicy pepperoni, mozzarella, tomato sauce.', 'Острая пепперони, моцарелла, томатный соус.', 'Ajy pepperoni, mosarella, pomidor sousy.'),
    image_url: img('1534308983496-4fabb1a015ee'), is_popular: true, rating: 4.7, spice_level: 2, calories: 820,
    sizes: SIZES_PIZZA, default_ingredients: ['i1', 'i5'], optional_ingredients: ['i2', 'i3', 'i4', 'i7'],
  }),
  product('r-epicurean', 's-epi-burgers', {
    id: 'p3', name: t('Wagyu Burger', 'Вагю бургер', 'Wagýu burgeri'), base_price: 145,
    description: t('Premium beef, cheddar, pickles, brioche.', 'Премиальная говядина, чеддер, огурцы, бриошь.', 'Ýokary hilli sygyr eti, çedder, hyýar, brioş.'),
    image_url: img('1568901346375-23c9450c58cd'), is_popular: true, rating: 4.9, calories: 950,
    sizes: [{ name: 'Single', price_modifier: 0, weight: '350 g' }, { name: 'Double', price_modifier: 50, weight: '500 g' }],
    default_ingredients: ['i1', 'i2', 'i3'], optional_ingredients: ['i4', 'i5', 'i7'],
  }),
  product('r-epicurean', 's-epi-pasta', {
    name: t('Penne Arrabbiata', 'Пенне арраббьята', 'Penne arrabbiata'), base_price: 70, spice_level: 3,
    description: t('Tomato, garlic, chili, basil.', 'Томаты, чеснок, чили, базилик.', 'Pomidor, sarymsak, burç, reýhan.'),
    image_url: img('1621996346565-e3dbc646d9a9'),
  }),

  // Burger Lab
  product('r-burger-lab', 's-bl-burgers', {
    name: t('Classic Smash', 'Классический смэш', 'Nusgawy smeş'), base_price: 75, is_popular: true,
    description: t('Two smashed patties, cheese, onion, house sauce.', 'Две котлеты, сыр, лук, фирменный соус.', 'Iki kotlet, peýnir, sogan, öý sousy.'),
    image_url: img('1572802419224-296b0aeee0d9'), calories: 780,
    sizes: [{ name: 'Single', price_modifier: 0 }, { name: 'Double', price_modifier: 25 }, { name: 'Triple', price_modifier: 45 }],
    default_ingredients: ['i1', 'i2', 'i3'], optional_ingredients: ['i4', 'i7', 'i5'],
  }),
  product('r-burger-lab', 's-bl-burgers', {
    name: t('BBQ Bacon Burger', 'BBQ бургер с беконом', 'BBQ bekonly burger'), base_price: 95, discount_percent: 40, is_popular: true,
    description: t('Beef, bacon, cheddar, BBQ sauce, crispy onion.', 'Говядина, бекон, чеддер, соус BBQ, хрустящий лук.', 'Sygyr eti, bekon, çedder, BBQ sousy, gytyr sogan.'),
    image_url: img('1607013251379-e6eecfffe234'), calories: 980,
    default_ingredients: ['i1', 'i4'], optional_ingredients: ['i7', 'i5'],
  }),
  product('r-burger-lab', 's-bl-burgers', {
    name: t('Pulled Chicken Burger', 'Бургер с курицей', 'Towukly burger'), base_price: 70,
    description: t('Slow-cooked chicken, slaw, chipotle mayo.', 'Томлёная курица, коул-слоу, майонез чипотле.', 'Haýal bişirilen towuk, kol-slou, çipotle maýonez.'),
    image_url: img('1606755962773-d324e0a13086'), spice_level: 1,
  }),
  product('r-burger-lab', 's-bl-sides', {
    name: t('Burger & Fries Combo', 'Комбо бургер и картошка', 'Burger we kartoşka kombo'), base_price: 99,
    description: t('Classic smash, fries and a cold drink.', 'Классический смэш, картошка фри и холодный напиток.', 'Nusgawy smeş, kartoşka we sowuk içgi.'),
    image_url: img('1561758033-d89a9ad46330'),
  }),
  product('r-burger-lab', 's-bl-chicken', {
    name: t('Spicy Wings (8 pcs)', 'Острые крылышки (8 шт)', 'Ajy ganatlar (8 sany)'), base_price: 65, spice_level: 4,
    description: t('Crispy wings in hot glaze.', 'Хрустящие крылышки в острой глазури.', 'Ajy sousdaky gytyr ganatlar.'),
    image_url: img('1626074353765-517a681e40be'),
  }),
  product('r-burger-lab', 's-bl-chicken', {
    name: t('Chicken Tenders', 'Куриные стрипсы', 'Towuk stripsleri'), base_price: 55,
    description: t('Crunchy tenders with honey-mustard dip.', 'Хрустящие стрипсы с медово-горчичным соусом.', 'Bal-gorçisa sously gytyr stripsler.'),
    image_url: img('1562967914-608f82629710'),
  }),

  // Napoli Wood Fire
  product('r-napoli', 's-np-pizza', {
    name: t('Margherita', 'Маргарита', 'Margarita'), base_price: 80, is_popular: true,
    description: t('San Marzano tomatoes, fior di latte, basil.', 'Томаты Сан-Марцано, фиор-ди-латте, базилик.', 'San-Marsano pomidorlary, fior di latte, reýhan.'),
    image_url: img('1574071318508-1cdbab80d002'), sizes: SIZES_PIZZA, default_ingredients: ['i1', 'i5'], optional_ingredients: ['i8', 'i9', 'i7'],
  }),
  product('r-napoli', 's-np-pizza', {
    name: t('Diavola', 'Диавола', 'Diawola'), base_price: 95, spice_level: 3, discount_percent: 20,
    description: t('Spicy salami, chili oil, mozzarella.', 'Острая салями, масло чили, моцарелла.', 'Ajy salami, burç ýagy, mosarella.'),
    image_url: img('1565299624946-b28f40a0ae38'), sizes: SIZES_PIZZA, default_ingredients: ['i1'], optional_ingredients: ['i7', 'i3', 'i9'],
  }),
  product('r-napoli', 's-np-pizza', {
    name: t('Farmhouse', 'Деревенская', 'Oba pissasy'), base_price: 105,
    description: t('Mushrooms, peppers, olives, onion.', 'Грибы, перец, оливки, лук.', 'Kömelek, burç, zeýtun, sogan.'),
    image_url: img('1604382354936-07c5d9983bd3'), sizes: SIZES_PIZZA, default_ingredients: ['i8', 'i9', 'i3'], optional_ingredients: ['i1', 'i4'],
  }),
  product('r-napoli', 's-np-pasta', {
    name: t('Shrimp Spaghetti', 'Спагетти с креветками', 'Krewetkaly spagetti'), base_price: 120,
    description: t('Garlic, cherry tomatoes, white wine sauce.', 'Чеснок, черри, соус на белом вине.', 'Sarymsak, çerri pomidor, ak sous.'),
    image_url: img('1563379926898-05f4575a45d8'),
  }),

  // Green Bowl
  product('r-green-bowl', 's-gb-salads', {
    name: t('Greek Salad', 'Греческий салат', 'Grek salaty'), base_price: 45, is_popular: true,
    description: t('Tomato, cucumber, feta, olives, oregano.', 'Томаты, огурцы, фета, оливки, орегано.', 'Pomidor, hyýar, feta, zeýtun, oregano.'),
    image_url: img('1505253716362-afaea1d3d1af'), calories: 320, optional_ingredients: ['i10', 'i9'],
  }),
  product('r-green-bowl', 's-gb-salads', {
    name: t('Caesar Salad', 'Цезарь', 'Sezar'), base_price: 55,
    description: t('Romaine, chicken, parmesan, croutons.', 'Романо, курица, пармезан, гренки.', 'Romano, towuk, parmezan, gyzardylan çörek.'),
    image_url: img('1540189549336-e6e99c3679fe'), calories: 450,
  }),
  product('r-green-bowl', 's-gb-bowls', {
    name: t('Salmon Poke', 'Поке с лососем', 'Lososly poke'), base_price: 95, discount_percent: 17,
    description: t('Rice, salmon, avocado, edamame, sesame.', 'Рис, лосось, авокадо, эдамаме, кунжут.', 'Tüwi, losos, awokado, edamame, künji.'),
    image_url: img('1546069901-ba9599a7e63c'), calories: 560,
  }),
  product('r-green-bowl', 's-gb-bowls', {
    name: t('Rainbow Veggie Bowl', 'Овощной боул', 'Gök önümli boul'), base_price: 60,
    description: t('Quinoa, roasted veggies, hummus, greens.', 'Киноа, запечённые овощи, хумус, зелень.', 'Kinoa, bişen gök önümler, humus, gök otlar.'),
    image_url: img('1512621776951-a57141f2eefd'), calories: 420,
  }),

  // Sakura Sushi
  product('r-sakura', 's-sk-rolls', {
    name: t('Philadelphia Roll', 'Филадельфия', 'Filadelfiýa'), base_price: 110, is_popular: true,
    description: t('Salmon, cream cheese, cucumber. 8 pcs.', 'Лосось, сливочный сыр, огурец. 8 шт.', 'Losos, krem peýnir, hyýar. 8 sany.'),
    image_url: img('1579871494447-9811cf80d66c'),
  }),
  product('r-sakura', 's-sk-rolls', {
    name: t('Sushi Set "Sakura"', 'Сет «Сакура»', '«Sakura» toplumy'), base_price: 260,
    description: t('32 pieces: rolls, nigiri and maki.', '32 штуки: роллы, нигири и маки.', '32 sany: rollar, nigiri we maki.'),
    image_url: img('1553621042-f6e147245754'),
  }),
  product('r-sakura', 's-sk-ramen', {
    name: t('Tonkotsu Ramen', 'Рамен тонкоцу', 'Tonkotsu ramen'), base_price: 95, spice_level: 1,
    description: t('Pork broth, noodles, egg, chashu.', 'Свиной бульон, лапша, яйцо, чашу.', 'Et suwy, unaş, ýumurtga, çaşu.'),
    image_url: img('1569718212165-3a8278d5f624'),
  }),
  product('r-sakura', 's-sk-ramen', {
    name: t('Chicken Wok Noodles', 'Вок с курицей', 'Towukly wok'), base_price: 75, spice_level: 2,
    description: t('Egg noodles, chicken, vegetables, teriyaki.', 'Яичная лапша, курица, овощи, терияки.', 'Ýumurtgaly unaş, towuk, gök önümler, teriýaki.'),
    image_url: img('1585032226651-759b368d7246'),
  }),

  // Sunrise Café
  product('r-sunrise', 's-sr-breakfast', {
    name: t('Avocado Toast & Egg', 'Тост с авокадо и яйцом', 'Awokadoly tost we ýumurtga'), base_price: 45, is_popular: true,
    description: t('Sourdough, avocado, fried egg, chili flakes.', 'Хлеб на закваске, авокадо, яичница, хлопья чили.', 'Turşy hamyrly çörek, awokado, gowrulan ýumurtga.'),
    image_url: img('1525351484163-7529414344d8'),
  }),
  product('r-sunrise', 's-sr-breakfast', {
    name: t('Eggs Benedict', 'Яйца Бенедикт', 'Benedikt ýumurtgasy'), base_price: 60,
    description: t('Poached eggs, hollandaise, English muffin.', 'Яйца пашот, голландский соус, маффин.', 'Paşot ýumurtga, golland sousy, maffin.'),
    image_url: img('1608039829572-78524f79c4c7'),
  }),
  product('r-sunrise', 's-sr-sweet', {
    name: t('Berry French Toast', 'Французский тост с ягодами', 'Miweli fransuz tosty'), base_price: 50,
    description: t('Brioche, berries, maple syrup.', 'Бриошь, ягоды, кленовый сироп.', 'Brioş, miweler, klen şerbeti.'),
    image_url: img('1484723091739-30a097e8f929'),
  }),

  // Tandyr Grill
  product('r-tandyr', 's-tg-grill', {
    name: t('Lamb Shashlik', 'Шашлык из баранины', 'Goýun eti şaşlygy'), base_price: 90, is_popular: true,
    description: t('Charcoal-grilled lamb, onion, tandyr bread.', 'Баранина на углях, лук, тандырный хлеб.', 'Kömürde bişen goýun eti, sogan, tamdyr çöregi.'),
    image_url: img('1555939594-58d7cb561ad1'),
  }),
  product('r-tandyr', 's-tg-grill', {
    name: t('Chicken Kebab', 'Куриный кебаб', 'Towuk kebaby'), base_price: 65,
    description: t('Marinated chicken skewers with garlic sauce.', 'Маринованная курица на шампурах с чесночным соусом.', 'Sarymsak sously marinadlanan towuk.'),
    image_url: img('1599487488170-d11ec9c172f0'), optional_ingredients: ['i6'],
  }),
  product('r-tandyr', 's-tg-mains', {
    name: t('Ribeye Steak', 'Стейк рибай', 'Ribaý steýk'), base_price: 210,
    description: t('300 g ribeye, grilled vegetables.', 'Рибай 300 г, овощи гриль.', '300 g ribaý, grilde gök önümler.'),
    image_url: img('1615937657715-bc7b4b7962c1'),
  }),
  product('r-tandyr', 's-tg-mains', {
    name: t('BBQ Ribs', 'Рёбра BBQ', 'BBQ gapyrgalar'), base_price: 160,
    description: t('Slow-smoked beef ribs, BBQ glaze.', 'Говяжьи рёбра долгого копчения, соус BBQ.', 'Uzak çilimlenen gapyrgalar, BBQ sousy.'),
    image_url: img('1544025162-d76694265947'),
  }),

  // Sweet Corner
  product('r-sweet', 's-sw-cakes', {
    name: t('Raspberry Cake', 'Малиновый торт', 'Malinaly tort'), base_price: 40, is_popular: true,
    description: t('Sponge, cream, fresh raspberries. Per slice.', 'Бисквит, крем, свежая малина. За кусок.', 'Biskwit, krem, täze malina. Bir bölek.'),
    image_url: img('1565958011703-44f9829ba187'),
  }),
  product('r-sweet', 's-sw-small', {
    name: t('Cupcake Box (6)', 'Набор капкейков (6)', 'Kapkeýk toplumy (6)'), base_price: 75,
    description: t('Six assorted cupcakes.', 'Шесть разных капкейков.', 'Alty dürli kapkeýk.'),
    image_url: img('1563729784474-d77dbb933a9e'),
  }),
  product('r-sweet', 's-sw-small', {
    name: t('Glazed Donuts (4)', 'Пончики в глазури (4)', 'Glazurly ponçikler (4)'), base_price: 35,
    description: t('Four donuts with sprinkles.', 'Четыре пончика с посыпкой.', 'Dört sany bezegli ponçik.'),
    image_url: img('1551024601-bec78aea704b'),
  }),
];

const Offer = [
  { id: 'o1', restaurant_id: 'r-epicurean', title: t('First Order Discount', 'Скидка на первый заказ', 'Ilkinji sargyda arzanladyş'), discount_percent: 15, promo_code: 'WELCOME', image_url: img('1512428559087-560fa5ceab42', 800), is_active: true },
  { id: 'o2', restaurant_id: 'r-green-bowl', title: t('Vegan Discount', 'Скидка на веган-меню', 'Wegan arzanladyşy'), discount_percent: 17, promo_code: 'VEGAN17', image_url: img('1543339308-43e59d6b73a6', 800), is_active: true },
  { id: 'o3', restaurant_id: 'r-sweet', title: t('Sweet Weekdays', 'Сладкие будни', 'Süýji iş günleri'), discount_percent: 10, promo_code: 'SWEET10', image_url: img('1576618148400-f54bed99fcfd', 800), is_active: true },
];

const Review = [
  { id: 'r1', restaurant_id: 'r-epicurean', author_name: 'Sarah M.', rating: 5, comment: 'Amazing food! Fast delivery and still hot.', created_at: '2026-01-15T12:00:00.000Z', avatar_letter: 'S' },
  { id: 'r2', restaurant_id: 'r-burger-lab', author_name: 'Aman G.', rating: 5, comment: 'Best smash burger in Ashgabat.', created_at: '2026-02-03T18:20:00.000Z', avatar_letter: 'A' },
  { id: 'r3', restaurant_id: 'r-tandyr', author_name: 'Maya K.', rating: 5, comment: 'Shashlik was perfect, bread fresh from the tandyr.', created_at: '2026-02-11T19:05:00.000Z', avatar_letter: 'M' },
];

const PromoCode = [
  { id: 'pr1', code: 'WELCOME', discount_percent: 15, is_active: true, min_order_amount: 0, used_count: 0, restaurant_id: null },
  { id: 'pr-vegan17', code: 'VEGAN17', discount_percent: 17, is_active: true, min_order_amount: 0, used_count: 0, restaurant_id: 'r-green-bowl' },
  { id: 'pr-sweet10', code: 'SWEET10', discount_percent: 10, is_active: true, min_order_amount: 0, used_count: 0, restaurant_id: 'r-sweet' },
];

module.exports = { Cuisine, Ingredient, Restaurant, MenuSection, Product, Offer, Review, PromoCode };
