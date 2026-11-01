// Translations of API error messages. Route code keeps writing English messages;
// the middleware below swaps { message } for the language from ?lang= (sent by the frontend).

const EXACT = {
  'Authentication required': { ru: 'Требуется вход в аккаунт', tk: 'Hasaba girmek gerek' },
  'Code expired. Please register again.': { ru: 'Срок действия кода истёк. Зарегистрируйтесь снова.', tk: 'Kodyň möhleti geçdi. Täzeden hasaba duruň.' },
  'Email already registered': { ru: 'Этот email уже зарегистрирован', tk: 'Bu email eýýäm hasaba alnan' },
  'Internal server error': { ru: 'Ошибка сервера. Попробуйте позже.', tk: 'Serwer ýalňyşlygy. Soňrak synanyşyň.' },
  'Invalid code': { ru: 'Неверный код', tk: 'Kod nädogry' },
  'Invalid credentials': { ru: 'Неверный email или пароль', tk: 'Email ýa-da açar söz nädogry' },
  'Invalid email': { ru: 'Некорректный email', tk: 'Email nädogry' },
  'Invalid JSON': { ru: 'Некорректный запрос', tk: 'Nädogry haýyş' },
  'Invalid promo code': { ru: 'Промокод не найден или неактивен', tk: 'Promokod tapylmady ýa-da işjeň däl' },
  'Not allowed': { ru: 'Недостаточно прав', tk: 'Rugsat ýok' },
  'Not found': { ru: 'Не найдено', tk: 'Tapylmady' },
  'Password must be 8–128 characters': { ru: 'Пароль должен содержать от 8 до 128 символов', tk: 'Açar söz 8–128 simwol bolmaly' },
  'Please enter a valid phone number': { ru: 'Введите корректный номер телефона', tk: 'Dogry telefon belgisini giriziň' },
  'Please enter the delivery address': { ru: 'Укажите адрес доставки', tk: 'Eltip bermek salgysyny giriziň' },
  'Please enter your name': { ru: 'Укажите имя', tk: 'Adyňyzy giriziň' },
  'Too many attempts. Please register again.': { ru: 'Слишком много попыток. Зарегистрируйтесь снова.', tk: 'Synanyşyk köp boldy. Täzeden hasaba duruň.' },
  'Too many attempts. Try again later.': { ru: 'Слишком много попыток. Попробуйте позже.', tk: 'Synanyşyk köp boldy. Soňrak synanyşyň.' },
  'Cart is empty': { ru: 'Корзина пуста', tk: 'Sebet boş' },
  'Invalid extra ingredient': { ru: 'Недопустимая добавка', tk: 'Nädogry goşmaça' },
  'Invalid removed ingredient': { ru: 'Этот ингредиент нельзя убрать', tk: 'Bu düzümi aýyryp bolmaýar' },
  'Invalid quantity': { ru: 'Некорректное количество', tk: 'Mukdar nädogry' },
  'Invalid size': { ru: 'Такого размера нет', tk: 'Beýle ölçeg ýok' },
  'Product not found': { ru: 'Блюдо не найдено — обновите корзину', tk: 'Tagam tapylmady — sebedi täzeläň' },
  'Promo code has expired': { ru: 'Срок действия промокода истёк', tk: 'Promokodyň möhleti geçdi' },
  'Promo code usage limit reached': { ru: 'Промокод больше недоступен', tk: 'Promokod indi elýeterli däl' },
  'Too many items in one order': { ru: 'Слишком много позиций в одном заказе', tk: 'Bir sargytda haryt gaty köp' },
  'Rating must be 1–5': { ru: 'Оценка должна быть от 1 до 5', tk: 'Baha 1-den 5-e çenli bolmaly' },
  'Please write a comment': { ru: 'Напишите отзыв', tk: 'Pikiriňizi ýazyň' },
  'Already in wishlist': { ru: 'Уже в избранном', tk: 'Eýýäm halanlarda' },
};

const PATTERNS = [
  {
    re: /^Minimum order for this code is (.+)$/,
    ru: (m) => `Минимальная сумма заказа для этого кода — ${m[1]} TMT`,
    tk: (m) => `Bu kod üçin iň az sargyt möçberi — ${m[1]} TMT`,
  },
  {
    re: /^"(.+)" is not available right now$/,
    ru: (m) => `«${m[1]}» сейчас недоступно`,
    tk: (m) => `«${m[1]}» häzir elýeterli däl`,
  },
];

function translateMessage(message, lang) {
  if (lang === 'en' || typeof message !== 'string') return message;
  if (EXACT[message]?.[lang]) return EXACT[message][lang];
  for (const p of PATTERNS) {
    const m = message.match(p.re);
    if (m && p[lang]) return p[lang](m);
  }
  return message;
}

/** Express middleware: translates `message` in JSON error responses. */
function localizeErrors(req, res, next) {
  const lang = ['ru', 'tk'].includes(req.query.lang) ? req.query.lang : 'en';
  if (lang === 'en') return next();
  const json = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400 && body && typeof body.message === 'string') {
      body = { ...body, message: translateMessage(body.message, lang) };
    }
    return json(body);
  };
  next();
}

module.exports = { localizeErrors, translateMessage };
