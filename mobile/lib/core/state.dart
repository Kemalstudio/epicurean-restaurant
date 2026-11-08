import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api.dart';
import 'i18n_app.dart';
import 'i18n_data.dart';

double _num(dynamic v, [double fallback = 0]) =>
    v is num ? v.toDouble() : (double.tryParse('$v') ?? fallback);
double round2(double v) => (v * 100).roundToDouble() / 100;

/// Language, signed-in user and delivery address.
class AppState extends ChangeNotifier {
  late SharedPreferences _prefs;
  String lang = 'en';
  Map<String, dynamic>? user;
  String address = '';

  /// Saved addresses (kit "My Address"): {label: home|work|other, address, street, post_code, apartment}.
  List<Map<String, String>> addresses = [];
  bool ready = false;

  bool get isLoggedIn => user != null;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    final deviceLang = PlatformDispatcher.instance.locale.languageCode;
    lang =
        _prefs.getString('lang') ??
        (['ru', 'tk'].contains(deviceLang) ? deviceLang : 'en');
    address = _prefs.getString('address') ?? '';
    try {
      addresses = [
        for (final a
            in jsonDecode(_prefs.getString('addresses') ?? '[]') as List)
          Map<String, String>.from(
            (a as Map).map((k, v) => MapEntry('$k', '$v')),
          ),
      ];
    } catch (_) {
      addresses = [];
    }
    Api.instance.lang = lang;
    Api.instance.token = _prefs.getString('token');
    if (Api.instance.token != null) {
      try {
        user = await Api.instance.me();
      } on ApiError catch (e) {
        if (e.status == 401) await _clearToken();
      }
    }
    ready = true;
    notifyListeners();
  }

  /// t('key') or t('key', {'count': 3}) — same keys as the website.
  String t(String key, [Map<String, Object?> vars = const {}]) {
    var s =
        kAppStrings[lang]?[key] ??
        kTranslations[lang]?[key] ??
        kTranslations['en']?[key] ??
        key;
    vars.forEach((k, v) => s = s.replaceAll('{$k}', '$v'));
    return s;
  }

  String price(num v) {
    final parts = v.toDouble().toStringAsFixed(2).split('.');
    final intPart = parts[0].replaceAllMapped(
      RegExp(r'\B(?=(\d{3})+(?!\d))'),
      (_) => ' ',
    );
    return '$intPart.${parts[1]} TMT';
  }

  Future<void> setLang(String value) async {
    lang = value;
    Api.instance.lang = value;
    await _prefs.setString('lang', value);
    notifyListeners();
  }

  Future<void> setAddress(String value) async {
    address = value;
    await _prefs.setString('address', value);
    notifyListeners();
  }

  /// Saves (or replaces at [index]) an address and makes it the delivery one.
  Future<void> saveAddress(Map<String, String> a, {int? index}) async {
    if (index != null && index >= 0 && index < addresses.length) {
      addresses[index] = a;
    } else {
      addresses.add(a);
    }
    await _prefs.setString('addresses', jsonEncode(addresses));
    await setAddress(fullAddress(a));
  }

  Future<void> deleteAddress(int index) async {
    addresses.removeAt(index);
    await _prefs.setString('addresses', jsonEncode(addresses));
    notifyListeners();
  }

  /// "Street 7, apt 12, 744000" from the saved parts.
  static String fullAddress(Map<String, String> a) => [
    a['address'],
    a['street'],
    if ((a['apartment'] ?? '').isNotEmpty) '№ ${a['apartment']}',
    a['post_code'],
  ].where((x) => (x ?? '').trim().isNotEmpty).join(', ');

  Future<void> signedIn(Map<String, dynamic> res) async {
    final token = res['access_token'] as String?;
    if (token != null) {
      Api.instance.token = token;
      await _prefs.setString('token', token);
    }
    user = res['user'] is Map
        ? Map<String, dynamic>.from(res['user'])
        : await Api.instance.me();
    notifyListeners();
  }

  Future<void> logout() async {
    await Api.instance.logout();
    await _clearToken();
    notifyListeners();
  }

  Future<void> _clearToken() async {
    Api.instance.token = null;
    user = null;
    await _prefs.remove('token');
  }
}

/// One basket line (same shape as the website basket).
class CartItem {
  final String key, productId, name, image;
  final String? size;
  final List<String> addedNames, removedNames, addedIds, removedIds;
  final double unitPrice;
  int quantity;

  CartItem({
    required this.key,
    required this.productId,
    required this.name,
    required this.image,
    this.size,
    this.addedNames = const [],
    this.removedNames = const [],
    this.addedIds = const [],
    this.removedIds = const [],
    required this.unitPrice,
    this.quantity = 1,
  });

  Map<String, dynamic> toJson() => {
    'key': key,
    'productId': productId,
    'name': name,
    'image': image,
    'size': size,
    'addedNames': addedNames,
    'removedNames': removedNames,
    'addedIds': addedIds,
    'removedIds': removedIds,
    'unitPrice': unitPrice,
    'quantity': quantity,
  };

  factory CartItem.fromJson(Map<String, dynamic> j) => CartItem(
    key: j['key'],
    productId: j['productId'],
    name: j['name'],
    image: j['image'] ?? '',
    size: j['size'],
    addedNames: List<String>.from(j['addedNames'] ?? []),
    removedNames: List<String>.from(j['removedNames'] ?? []),
    addedIds: List<String>.from(j['addedIds'] ?? []),
    removedIds: List<String>.from(j['removedIds'] ?? []),
    unitPrice: _num(j['unitPrice']),
    quantity: (j['quantity'] as num?)?.toInt() ?? 1,
  );
}

/// Basket bound to one restaurant. The server re-prices everything when the order is placed.
class CartState extends ChangeNotifier {
  late SharedPreferences _prefs;
  Map<String, dynamic>?
  restaurant; // snapshot: id, slug, name, logo_url, delivery_fee, free_delivery_from, min_order, delivery_time
  List<CartItem> items = [];
  String? promoCode;
  double promoPercent = 0;
  String fulfillment = 'delivery';

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    final raw = _prefs.getString('basket_v2');
    if (raw != null) {
      try {
        final j = jsonDecode(raw) as Map<String, dynamic>;
        restaurant = j['restaurant'] == null
            ? null
            : Map<String, dynamic>.from(j['restaurant']);
        items = (j['items'] as List)
            .map((e) => CartItem.fromJson(Map<String, dynamic>.from(e)))
            .toList();
        promoCode = j['promoCode'];
        promoPercent = _num(j['promoPercent']);
        fulfillment = j['fulfillment'] ?? 'delivery';
      } catch (_) {
        /* corrupted — start empty */
      }
    }
  }

  void _save() {
    _prefs.setString(
      'basket_v2',
      jsonEncode({
        'restaurant': restaurant,
        'items': items.map((e) => e.toJson()).toList(),
        'promoCode': promoCode,
        'promoPercent': promoPercent,
        'fulfillment': fulfillment,
      }),
    );
    notifyListeners();
  }

  int get count => items.fold(0, (n, i) => n + i.quantity);
  double get subtotal =>
      round2(items.fold(0.0, (s, i) => s + i.unitPrice * i.quantity));
  double get discount => round2(subtotal * promoPercent / 100);
  double get minOrder => _num(restaurant?['min_order']);
  double get deliveryFee {
    if (fulfillment == 'collection' || subtotal == 0) return 0;
    return subtotal >= _num(restaurant?['free_delivery_from'], 150)
        ? 0
        : _num(restaurant?['delivery_fee'], 10);
  }

  double get total => round2(subtotal - discount + deliveryFee);
  double get missingForMin => fulfillment == 'delivery'
      ? (minOrder - subtotal).clamp(0, double.infinity).toDouble()
      : 0;

  /// True if adding from [restaurantId] would mix restaurants (UI must ask first).
  bool conflictsWith(String restaurantId) =>
      restaurant != null &&
      items.isNotEmpty &&
      restaurant!['id'] != restaurantId;

  void add({
    required Map<String, dynamic> product,
    required Map<String, dynamic> restaurantData,
    String? size,
    List<Map<String, dynamic>> added = const [],
    List<Map<String, dynamic>> removed = const [],
    int quantity = 1,
    bool replace = false,
  }) {
    if (replace) clear(keepFulfillment: true);
    final a = [...added]..sort((x, y) => '${x['id']}'.compareTo('${y['id']}'));
    final r = [...removed]
      ..sort((x, y) => '${x['id']}'.compareTo('${y['id']}'));
    final key =
        '${product['id']}|${size ?? ''}|${a.map((e) => e['id']).join(',')}|${r.map((e) => e['id']).join(',')}';
    final existing = items.where((i) => i.key == key);
    if (existing.isNotEmpty) {
      existing.first.quantity = (existing.first.quantity + quantity).clamp(
        1,
        99,
      );
    } else {
      final sizes = List<Map<String, dynamic>>.from(
        (product['sizes'] as List?)?.map((e) => Map<String, dynamic>.from(e)) ??
            [],
      );
      final sizeData = size == null
          ? null
          : sizes.where((s) => s['name'] == size).firstOrNull;
      final extras = a.fold(0.0, (s, e) => s + _num(e['price']));
      final unit =
          (_num(product['base_price']) +
              _num(sizeData?['price_modifier']) +
              extras) *
          (1 - _num(product['discount_percent']) / 100);
      items.add(
        CartItem(
          key: key,
          productId: product['id'],
          name: '${product['name']}',
          image: '${product['image_url'] ?? ''}',
          size: size,
          addedNames: a.map((e) => '${e['name']}').toList(),
          removedNames: r.map((e) => '${e['name']}').toList(),
          addedIds: a.map((e) => '${e['id']}').toList(),
          removedIds: r.map((e) => '${e['id']}').toList(),
          unitPrice: round2(unit),
          quantity: quantity,
        ),
      );
    }
    restaurant = {
      for (final k in [
        'id',
        'slug',
        'name',
        'logo_url',
        'delivery_fee',
        'free_delivery_from',
        'min_order',
        'delivery_time',
      ])
        k: restaurantData[k],
    };
    _save();
  }

  void setQuantity(CartItem item, int q) {
    if (q <= 0) {
      items.remove(item);
      if (items.isEmpty) restaurant = null;
    } else {
      item.quantity = q.clamp(1, 99);
    }
    _save();
  }

  void setPromo(String? code, double percent) {
    promoCode = code;
    promoPercent = percent;
    _save();
  }

  void setFulfillment(String value) {
    fulfillment = value;
    _save();
  }

  void clear({bool keepFulfillment = true}) {
    items = [];
    restaurant = null;
    promoCode = null;
    promoPercent = 0;
    if (!keepFulfillment) fulfillment = 'delivery';
    _save();
  }
}
