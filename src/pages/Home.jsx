import React from 'react';
import HeroSection from '@/components/home/HeroSection';
import CategoriesSection from '@/components/home/CategoriesSection';
import PopularDishes from '@/components/home/PopularDishes';
import SpecialOffers from '@/components/home/SpecialOffers';
import AboutSection from '@/components/home/AboutSection';
import ReviewsSection from '@/components/home/ReviewsSection';
import FaqSection from '@/components/home/FaqSection';
import ContactSection from '@/components/home/ContactSection';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <CategoriesSection />
      <PopularDishes />
      <SpecialOffers />
      <AboutSection />
      <ReviewsSection />
      <FaqSection />
      <ContactSection />
    </div>
  );
}