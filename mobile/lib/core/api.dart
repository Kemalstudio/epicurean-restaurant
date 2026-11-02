import 'dart:convert';
import 'package:http/http.dart' as http;
import 'config.dart';

/// Error with a human-readable (already translated by the server) message.
class ApiError implements Exception {
  final int status;
  final String message;
  ApiError(this.status, this.message);
  @override
  String toString() => message;
}

/// Thin JSON client for the Ember backend. The server translates names and errors by ?lang=.
class Api {
  Api._();
  static final Api instance = Api._();

  String? token;

  /// HTTP client; tests replace it with a MockClient that serves recorded responses.
  http.Client client = http.Client();
  String lang = 'en';
  static const _offline = {
    'en': 'Server is not reachable. Check your connection.',
    'ru': 'Сервер недоступен. Проверьте подключение к интернету.',
    'tk': 'Serwer elýeterli däl. Internet birikmesini barlaň.',
  };

  Uri _uri(String path, [Map<String, String>? query]) {
    final base = Uri.parse('${AppConfig.apiUrl}$path');
    return base.replace(
      queryParameters: {...base.queryParameters, ...?query, 'lang': lang},
    );
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (token != null) 'Authorization': 'Bearer $token',
  };

  Future<dynamic> _send(Future<http.Response> Function() call) async {
    http.Response res;
    try {
      res = await call().timeout(const Duration(seconds: 20));
    } catch (_) {
      throw ApiError(0, _offline[lang] ?? _offline['en']!);
    }
    final body = res.body.isEmpty
        ? null
        : jsonDecode(utf8.decode(res.bodyBytes));
    if (res.statusCode >= 400) {
      final msg = body is Map && body['message'] is String
          ? body['message'] as String
          : 'Error ${res.statusCode}';
      throw ApiError(res.statusCode, msg);
    }
    return body;
  }

  Future<dynamic> get(String path, [Map<String, String>? query]) =>
      _send(() => client.get(_uri(path, query), headers: _headers));
  Future<dynamic> post(String path, [Object? body]) => _send(
    () => client.post(
      _uri(path),
      headers: _headers,
      body: jsonEncode(body ?? {}),
    ),
  );
  Future<dynamic> put(String path, Object body) => _send(
    () => client.put(_uri(path), headers: _headers, body: jsonEncode(body)),
  );
  Future<dynamic> delete(String path) =>
      _send(() => client.delete(_uri(path), headers: _headers));

  // ---- endpoints ----
  Future<Map<String, dynamic>> home() async =>
      Map<String, dynamic>.from(await get('/home'));
  Future<List<dynamic>> restaurants({
    String? cuisine,
    String? q,
    String? area,
  }) async => List<dynamic>.from(
    await get('/restaurants', {'cuisine': ?cuisine, 'q': ?q, 'area': ?area}),
  );
  Future<Map<String, dynamic>> restaurant(String slug) async =>
      Map<String, dynamic>.from(
        await get('/restaurants/${Uri.encodeComponent(slug)}'),
      );
  Future<List<dynamic>> ingredients() async =>
      List<dynamic>.from(await get('/Ingredient'));
  Future<Map<String, dynamic>> placeOrder(Map<String, dynamic> data) async =>
      Map<String, dynamic>.from(await post('/Order', data));
  Future<Map<String, dynamic>> checkPromo(
    String code,
    double subtotal,
    String? restaurantId,
  ) async => Map<String, dynamic>.from(
    await post('/orders/promo', {
      'code': code,
      'subtotal': subtotal,
      'restaurant_id': restaurantId,
    }),
  );
  Future<Map<String, dynamic>> track(String number, String phone) async =>
      Map<String, dynamic>.from(
        await get('/orders/track', {'number': number, 'phone': phone}),
      );
  Future<List<dynamic>> myOrders(String userId) async => List<dynamic>.from(
    await post('/Order/filter', {
      'query': {'user_id': userId},
      'sortBy': '-created_at',
      'limit': 100,
    }),
  );
  Future<Map<String, dynamic>> me() async =>
      Map<String, dynamic>.from(await get('/auth/me'));
  Future<Map<String, dynamic>> login(String email, String password) async =>
      Map<String, dynamic>.from(
        await post('/auth/login', {'email': email, 'password': password}),
      );
  Future<void> register(String name, String email, String password) => post(
    '/auth/register',
    {'full_name': name, 'email': email, 'password': password},
  );
  Future<Map<String, dynamic>> verifyOtp(String email, String code) async =>
      Map<String, dynamic>.from(
        await post('/auth/verify-otp', {'email': email, 'otpCode': code}),
      );
  Future<void> resendOtp(String email) =>
      post('/auth/resend-otp', {'email': email});
  Future<void> forgotPassword(String email) =>
      post('/auth/forgot-password', {'email': email});
  Future<void> logout() async {
    try {
      await post('/auth/logout');
    } catch (_) {}
  }

  Future<void> subscribe(String email) => post('/subscribe', {'email': email});
  Future<void> applyPartner(Map<String, dynamic> data) =>
      post('/partner-applications', data);
  Future<void> applyRider(Map<String, dynamic> data) =>
      post('/rider-applications', data);

  Future<void> postReview(String restaurantId, int rating, String comment) =>
      post('/Review', {
        'restaurant_id': restaurantId,
        'rating': rating,
        'comment': comment,
      });
}
