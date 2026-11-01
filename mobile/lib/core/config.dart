/// App configuration. The API address is passed at build time:
///   flutter run --dart-define=API_URL=http://192.168.1.150:5000/api
/// Default works for the Android emulator (10.0.2.2 = the computer running the backend).
class AppConfig {
  static const String apiUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'http://10.0.2.2:5000/api',
  );

  /// Server origin without /api — photos like "/img/x.webp" are served from here.
  static String get origin => apiUrl.replaceFirst(RegExp(r'/api/?$'), '');

  /// Turns a relative photo path into an absolute URL.
  static String image(String? url) {
    if (url == null || url.isEmpty) return '';
    return url.startsWith('http') ? url : '$origin$url';
  }

  static const String currency = 'TMT';
}
