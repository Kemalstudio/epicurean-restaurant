import React from 'react';
import { Outlet } from 'react-router-dom';
import SiteHeader from '@/components/ember/SiteHeader';
import SiteFooter from '@/components/ember/SiteFooter';
import BasketDrawer from '@/components/ember/BasketDrawer';
import { DeliveryPopup, BasketConflictPopup } from '@/components/ember/Popups';
import ScrollToTop from '@/components/ScrollToTop';

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white text-black">
      <ScrollToTop />
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-pill focus:bg-ember-orange focus:px-5 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <SiteFooter />
      <BasketDrawer />
      <DeliveryPopup />
      <BasketConflictPopup />
    </div>
  );
}
