import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

import ArrowRight from 'lucide-react/dist/esm/icons/arrow-right';
import ChevronLeft from 'lucide-react/dist/esm/icons/chevron-left';
import ChevronRight from 'lucide-react/dist/esm/icons/chevron-right';

import { Button } from '@/components/ui/button';

let useLanguage;
try {
  useLanguage = require('@/lib/LanguageContext').useLanguage;
} catch (e) {
  useLanguage = () => ({ lang: 'en' }); // Заглушка, если контекст не найден
}

const heroTranslations = {
  en: [
    {
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&q=80',
      subtitle: 'Handcrafted Artisan',
      title: 'Wood-Fired\nPerfection',
      description: 'Experience our signature pizzas made with 48-hour fermented dough and imported San Marzano tomatoes.',
      cta: 'Order Now',
      view_menu: 'View Full Menu',
      accent: 'New Season Menu',
    },
    {
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1600&q=80',
      subtitle: 'Premium Selection',
      title: 'Gourmet\nBurgers',
      description: 'Dry-aged wagyu beef, brioche buns baked in-house, and sauces crafted from scratch daily.',
      cta: 'Explore Menu',
      view_menu: 'View Full Menu',
      accent: '20% Off Today',
    },
    {
      image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=1600&q=80',
      subtitle: "Chef's Special",
      title: 'Fresh Pasta\nDaily',
      description: 'Hand-rolled pasta with farm-fresh ingredients and traditional Italian recipes passed through generations.',
      cta: 'Discover More',
      view_menu: 'View Full Menu',
      accent: 'Limited Edition',
    },
  ],
  tk: [
    {
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&q=80',
      subtitle: 'Elde taýýarlanan',
      title: 'Odun Odunda\nBişirilen',
      description: '48 sagatlap hamyry ýetirilen we italiýan pomidorlary bilen taýýarlanan meşhur pissalarymyzy dadyp görüň.',
      cta: 'Sargyt etmek',
      view_menu: 'Menýuny gör',
      accent: 'Täze Möwsüm Menýusy',
    },
    {
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1600&q=80',
      subtitle: 'Premýum Saýlaw',
      title: 'Gourmet\nBurgerler',
      description: 'Wagýu eti, öýde bişirilen brioş çörekleri we her gün täze taýýarlanýan ýörite souslar.',
      cta: 'Menýuny öwren',
      view_menu: 'Menýuny gör',
      accent: 'Şu gün 20% Arzanladyş',
    },
    {
      image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=1600&q=80',
      subtitle: 'Şef-pazdan Ýörite',
      title: 'Her gün\nTäze Pasta',
      description: 'Elde ýasalan pasta, iň täze önümler we nesilden-nesle geçip gelýän italýan reseptleri.',
      cta: 'Has giňişleýin',
      view_menu: 'Menýuny gör',
      accent: 'Çäkli Sanly',
    },
  ],
  ru: [
    {
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&q=80',
      subtitle: 'Ручная работа',
      title: 'Совершенство\nна дровах',
      description: 'Попробуйте нашу фирменную пиццу на 48-часовом тесте с импортными томатами Сан-Марцано.',
      cta: 'Заказать сейчас',
      view_menu: 'Полное меню',
      accent: 'Меню нового сезона',
    },
    {
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1600&q=80',
      subtitle: 'Премиальный выбор',
      title: 'Гурман\nБургеры',
      description: 'Выдержанная говядина вагю, булочки бриошь собственной выпечки и соусы ручной работы.',
      cta: 'Изучить меню',
      view_menu: 'Полное меню',
      accent: 'Скидка 20% сегодня',
    },
    {
      image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=1600&q=80',
      subtitle: 'Спецпредложение',
      title: 'Свежая паста\nкаждый день',
      description: 'Паста ручной работы из фермерских продуктов по традиционным итальянским рецептам.',
      cta: 'Узнать больше',
      view_menu: 'Полное меню',
      accent: 'Лимитированная серия',
    },
  ],
};

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  // Безопасное получение языка
  let lang = 'en';
  try {
    const context = useLanguage();
    lang = context.lang || 'en';
  } catch (e) {
    lang = 'en';
  }

  const slides = heroTranslations[lang] || heroTranslations['en'];

  useEffect(() => {
    const timer = setInterval(() => setCurrent(p => (p + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[current] || slides[0];

  return (
      <section className="relative h-[100svh] min-h-[600px] overflow-hidden bg-zinc-950">
        <AnimatePresence mode="wait">
          <motion.div
              key={`${lang}-${current}`}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.05, opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0"
          >
            <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
                onLoad={() => console.log("Слайд загружен:", slide.image)}
                onError={(e) => {
                  console.error("Ошибка загрузки картинки:", slide.image);
                  e.target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600';
                }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center">
          <div className="max-w-2xl">
            <AnimatePresence mode="wait">
              <motion.div
                  key={`${lang}-${current}-text`}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
              >
                <motion.span
                    className="inline-block px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary text-xs sm:text-sm font-semibold tracking-wider uppercase mb-6"
                >
                  {slide.accent}
                </motion.span>

                <p className="text-white/60 text-sm sm:text-base font-body tracking-[0.2em] uppercase mb-3">
                  {slide.subtitle}
                </p>

                <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.9] mb-6 whitespace-pre-line">
                  {slide.title}
                </h1>

                <p className="text-white/70 text-base sm:text-lg max-w-md leading-relaxed mb-8 font-body">
                  {slide.description}
                </p>

                <div className="flex flex-wrap gap-4">
                  <Link to="/menu">
                    <Button
                        size="lg"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-8 py-6 text-base font-semibold group shadow-2xl shadow-primary/30"
                    >
                      {slide.cta}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link to="/menu">
                    <Button
                        size="lg"
                        variant="outline"
                        className="border-white/30 text-white hover:bg-white/10 rounded-xl px-8 py-6 text-base backdrop-blur-sm"
                    >
                      {slide.view_menu}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slide indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {slides.map((_, idx) => (
              <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === current ? 'w-12 bg-primary' : 'w-6 bg-white/30 hover:bg-white/50'
                  }`}
              />
          ))}
        </div>
      </section>
  );
}