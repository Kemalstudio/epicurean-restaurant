// Server-side order pricing. The client only says WHAT it wants (product, size,
// extra/removed ingredients, quantity, promo code); every price is taken from the database.

const round2 = (n) => Math.round(n * 100) / 100;

const num = (value, fallback) => {
  const n = Number(value);
  return value !== undefined && value !== '' && Number.isFinite(n) ? n : fallback;
};

const PRICING = {
  delivery_fee: num(process.env.DELIVERY_FEE, 4.99),
  free_delivery_from: num(process.env.FREE_DELIVERY_FROM, 50),
  tax_rate: num(process.env.TAX_RATE, 0.08),
};

const MAX_LINES = 50;
const MAX_QTY = 99;

class PricingError extends Error {
  constructor(message) { super(message); this.status = 400; }
}

const pickLang = (value, lang) =>
  value && typeof value === 'object' ? (value[lang] || value.en || '') : (value || '');

const asIdList = (value) =>
  Array.isArray(value) ? [...new Set(value.filter(v => typeof v === 'string'))] : [];

/** Validates a promo code against the subtotal. Returns the promo record or throws. */
function resolvePromo(store, code, subtotal) {
  if (!code) return null;
  if (typeof code !== 'string') throw new PricingError('Invalid promo code');
  const promo = store.findBy('PromoCode', 'code', code.trim().toUpperCase());
  if (!promo || !promo.is_active) throw new PricingError('Invalid promo code');
  if (promo.expires_at && new Date(promo.expires_at) < new Date()) throw new PricingError('Promo code has expired');
  if (promo.max_uses && (promo.used_count || 0) >= promo.max_uses) throw new PricingError('Promo code usage limit reached');
  if (promo.min_order_amount && subtotal < promo.min_order_amount) {
    throw new PricingError(`Minimum order for this code is ${promo.min_order_amount}`);
  }
  return promo;
}

/**
 * Calculates all order lines and totals from database prices.
 * @returns {{ items, subtotal, discount_amount, delivery_fee, tax, total, promo }}
 */
function priceOrder(store, { items, promo_code }, lang = 'en') {
  if (!Array.isArray(items) || items.length === 0) throw new PricingError('Cart is empty');
  if (items.length > MAX_LINES) throw new PricingError('Too many items in one order');

  const ingredients = new Map(store.list('Ingredient').map(i => [i.id, i]));

  const lines = items.map((line) => {
    const product = line && typeof line.product_id === 'string' ? store.get('Product', line.product_id) : null;
    if (!product) throw new PricingError('Product not found');
    if (product.is_available === false) throw new PricingError(`"${pickLang(product.name, lang)}" is not available right now`);

    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QTY) throw new PricingError('Invalid quantity');

    let sizeModifier = 0;
    let size = null;
    if (line.size) {
      const sizeData = (product.sizes || []).find(s => s.name === line.size);
      if (!sizeData) throw new PricingError('Invalid size');
      size = sizeData.name;
      sizeModifier = Number(sizeData.price_modifier) || 0;
    }

    const optional = new Set(product.optional_ingredients || []);
    const defaults = new Set(product.default_ingredients || []);
    const addedIds = asIdList(line.added_ingredient_ids);
    const removedIds = asIdList(line.removed_ingredient_ids);
    if (addedIds.some(id => !optional.has(id) || !ingredients.has(id))) throw new PricingError('Invalid extra ingredient');
    if (removedIds.some(id => !defaults.has(id))) throw new PricingError('Invalid removed ingredient');

    const extras = addedIds.reduce((sum, id) => sum + (Number(ingredients.get(id).price) || 0), 0);
    const discount = Math.min(Math.max(Number(product.discount_percent) || 0, 0), 100);
    const unitPrice = round2((Number(product.base_price) + sizeModifier + extras) * (1 - discount / 100));

    return {
      product_id: product.id,
      product_name: pickLang(product.name, lang),
      product_image: product.image_url || null,
      quantity,
      size,
      added_ingredient_ids: addedIds,
      removed_ingredient_ids: removedIds,
      added_ingredients: addedIds.map(id => pickLang(ingredients.get(id).name, lang)),
      removed_ingredients: removedIds.map(id => pickLang(ingredients.get(id)?.name, lang) || id),
      unit_price: unitPrice,
      total_price: round2(unitPrice * quantity),
    };
  });

  const subtotal = round2(lines.reduce((sum, l) => sum + l.total_price, 0));
  const promo = resolvePromo(store, promo_code, subtotal);
  const discount_amount = round2(subtotal * ((promo?.discount_percent || 0) / 100));
  const delivery_fee = subtotal > PRICING.free_delivery_from ? 0 : PRICING.delivery_fee;
  const tax = round2((subtotal - discount_amount) * PRICING.tax_rate);
  const total = round2(subtotal - discount_amount + delivery_fee + tax);

  return { items: lines, subtotal, discount_amount, delivery_fee, tax, total, promo };
}

module.exports = { PRICING, PricingError, priceOrder, resolvePromo, round2 };
