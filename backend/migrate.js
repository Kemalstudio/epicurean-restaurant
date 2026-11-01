// Schema migrations. Version is kept in the `meta` table.
//  v1 — single restaurant (Category, Product, ...)
//  v2 — marketplace: Restaurant, Cuisine, MenuSection; products/orders/reviews belong to a restaurant
const seed = require('./seed');

const SCHEMA_VERSION = 2;
const MENU_ENTITIES = ['Cuisine', 'Ingredient', 'Restaurant', 'MenuSection', 'Product', 'Offer'];

function migrate(store) {
  const current = Number(store.getMeta('schema_version') || 0);
  if (current >= SCHEMA_VERSION) return;

  store.transaction(() => {
    const isFreshDb = store.count('Product') === 0 && store.count('Restaurant') === 0;

    // Menu data is demo content: replace it with the marketplace seed
    ['Category', ...MENU_ENTITIES].forEach(e => store.wipe(e));
    MENU_ENTITIES.forEach(e => seed[e].forEach(item => store.save(e, item)));

    // Keep users, orders, wishlist; attach old single-restaurant data to "Epicurean"
    for (const order of store.list('Order')) {
      if (!order.restaurant_id) store.save('Order', { ...order, restaurant_id: 'r-epicurean', restaurant_name: 'Epicurean', fulfillment: order.fulfillment || 'delivery' });
    }
    for (const review of store.list('Review')) {
      if (!review.restaurant_id) store.save('Review', { ...review, restaurant_id: 'r-epicurean' });
    }
    if (store.count('Review') === 0) seed.Review.forEach(r => store.save('Review', r));
    for (const w of store.list('Wishlist')) {
      if (!store.get('Product', w.product_id)) store.remove('Wishlist', w.id);
    }
    // Promo codes: keep existing ones, add seed codes that don't exist yet (offers link to them)
    seed.PromoCode.forEach(p => { if (!store.findBy('PromoCode', 'code', p.code)) store.save('PromoCode', p); });
    for (const p of store.list('PromoCode')) {
      if (p.restaurant_id === undefined) store.save('PromoCode', { ...p, restaurant_id: null, used_count: p.used_count || 0 });
    }

    store.setMeta('schema_version', SCHEMA_VERSION);
    console.log(`[DB] Migrated schema ${current} -> ${SCHEMA_VERSION}${isFreshDb ? ' (fresh database)' : ''}`);
  });
}

module.exports = { migrate, SCHEMA_VERSION };
