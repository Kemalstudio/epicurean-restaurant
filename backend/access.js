// Who can read / create / change which entity.
// Roles: guest (no user), user, owner (runs one or more restaurants), admin.
const { store } = require('./db');

const isAdmin = (req) => req.user?.role === 'admin';
const isOwnerRole = (req) => req.user?.role === 'owner' || isAdmin(req);
const ownsItem = (req, item) => !!(item.user_id && req.user && item.user_id === req.user.id);

/** True if the current user owns the restaurant (admins own everything). */
function ownsRestaurant(req, restaurantId) {
  if (isAdmin(req)) return true;
  if (!req.user || !restaurantId) return false;
  const r = store.get('Restaurant', restaurantId);
  return !!r && r.owner_id === req.user.id;
}

/** Public visibility of anything that belongs to a restaurant. */
function restaurantVisible(req, restaurantId) {
  if (!restaurantId) return true;
  const r = store.get('Restaurant', restaurantId);
  return !!r && (r.status === 'approved' || ownsRestaurant(req, restaurantId));
}

// Fields an owner may never set (admin may). Applied on create and update by non-admins.
const OWNER_LOCKED = {
  Restaurant: ['status', 'owner_id', 'is_featured', 'rating', 'review_count', 'slug'],
  Order: null, // owners may only change `status` — see ORDER_OWNER_FIELDS
};
const ORDER_OWNER_FIELDS = ['status'];
const ORDER_STATUSES = ['received', 'preparing', 'packaging', 'out_for_delivery', 'delivered', 'cancelled'];

const ENTITIES = {
  // Global catalogue
  Cuisine:     { read: () => true, write: isAdmin },
  Ingredient:  { read: () => true, write: (req, item) => (item.restaurant_id ? ownsRestaurant(req, item.restaurant_id) : isAdmin(req)) },

  // Restaurants: approved ones are public; owner sees own; only admin creates directly
  Restaurant:  {
    read: (req, item) => item.status === 'approved' || ownsRestaurant(req, item.id),
    create: isAdmin,
    write: (req, item) => ownsRestaurant(req, item.id),
  },
  MenuSection: { read: (req, item) => restaurantVisible(req, item.restaurant_id), write: (req, item) => ownsRestaurant(req, item.restaurant_id) },
  Product:     { read: (req, item) => restaurantVisible(req, item.restaurant_id), write: (req, item) => ownsRestaurant(req, item.restaurant_id) },
  Offer:       { read: (req, item) => restaurantVisible(req, item.restaurant_id), write: (req, item) => (item.restaurant_id ? ownsRestaurant(req, item.restaurant_id) : isAdmin(req)) },

  // Reviews: public; logged-in users post; admin moderates
  Review:      { read: () => true, create: (req) => !!req.user, write: isAdmin },

  // Promo codes: admin all; owners their restaurant's codes. Customers check via POST /api/orders/promo
  PromoCode:   {
    read: (req, item) => isAdmin(req) || (item.restaurant_id && ownsRestaurant(req, item.restaurant_id)),
    write: (req, item) => (item.restaurant_id ? ownsRestaurant(req, item.restaurant_id) : isAdmin(req)),
  },

  // Orders: placed via POST /api/Order; visible to customer, restaurant owner, admin
  Order:       {
    read: (req, item) => isAdmin(req) || ownsItem(req, item) || ownsRestaurant(req, item.restaurant_id),
    create: () => false,
    write: (req, item) => ownsRestaurant(req, item.restaurant_id),
  },

  Wishlist:    { read: ownsItem, create: (req) => !!req.user, write: (req, item) => isAdmin(req) || ownsItem(req, item) },

  // Applications & newsletter: created through dedicated endpoints; admin manages
  PartnerApplication: { read: (req, item) => isAdmin(req) || ownsItem(req, item), create: () => false, write: isAdmin },
  RiderApplication:   { read: isAdmin, create: () => false, write: isAdmin },
  Subscriber:         { read: isAdmin, create: () => false, write: isAdmin },
};

module.exports = {
  ENTITIES, OWNER_LOCKED, ORDER_OWNER_FIELDS, ORDER_STATUSES,
  isAdmin, isOwnerRole, ownsItem, ownsRestaurant, restaurantVisible,
};
