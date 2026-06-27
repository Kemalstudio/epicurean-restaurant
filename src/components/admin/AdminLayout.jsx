import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Layers, ShoppingBag, Users, Tag, Settings, ChevronLeft, Menu } from 'lucide-react';

const navItems = [
  { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/products', label: 'Products', icon: Package },
  { path: '/admin/categories', label: 'Categories', icon: Layers },
  { path: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { path: '/admin/promos', label: 'Promo Codes', icon: Tag },
];

export default function AdminLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="pt-20 min-h-screen flex">
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-24 left-4 z-30 w-10 h-10 rounded-xl bg-card border border-border shadow-lg flex items-center justify-center md:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-20 h-[calc(100vh-5rem)] z-20 bg-card border-r border-border transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      } ${mobileOpen ? 'left-0' : '-left-60 md:left-0'}`}>
        <div className="p-3 flex flex-col h-full">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex w-8 h-8 rounded-lg bg-muted items-center justify-center self-end mb-4 hover:bg-muted/80 transition-colors"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>

          <nav className="space-y-1 flex-1">
            {navItems.map(item => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            {!collapsed && <span>Back to Site</span>}
          </Link>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-10 bg-black/50 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0">
        {children}
      </main>
    </div>
  );
}