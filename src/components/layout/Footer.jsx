import React from 'react';
import { Link } from 'react-router-dom';

const footerLinks = {
  Menu: [{ label: 'Pizzas', path: '/menu?cat=pizza' }],
  Company: [{ label: 'About Us', path: '/#about' }],
  Support: [{ label: 'FAQ', path: '/#faq' }],
};

// Заглушка вместо иконки
const IconPlaceholder = () => <span style={{fontSize: '10px'}}>●</span>;

export default function Footer() {
  return (
    <footer className="bg-foreground/[0.97] text-background pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl font-bold">Epicurean</h2>
            <p className="text-sm mt-4">Crafting culinary experiences since 2020.</p>
          </div>
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-heading text-lg font-semibold mb-4">{title}</h4>
              <ul className="space-y-2">
                {links.map(link => (
                  <li key={link.label}>
                    <Link to={link.path} className="text-sm opacity-50 hover:opacity-100">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 pt-8 text-center text-sm opacity-40">
          © 2025 Epicurean. All rights reserved.
        </div>
      </div>
    </footer>
  );
}