import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Иконки
import ShoppingBag from 'lucide-react/dist/esm/icons/shopping-bag';
import MenuIcon from 'lucide-react/dist/esm/icons/menu';
import X from 'lucide-react/dist/esm/icons/x';
import Sun from 'lucide-react/dist/esm/icons/sun';
import Moon from 'lucide-react/dist/esm/icons/moon';
import Heart from 'lucide-react/dist/esm/icons/heart';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import UserIcon from 'lucide-react/dist/esm/icons/user';
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down';
import Settings from 'lucide-react/dist/esm/icons/settings';
import Languages from 'lucide-react/dist/esm/icons/languages'; // Иконка языка

// Shadcn UI
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useCart } from '@/lib/cartStore.jsx';
import { useTheme } from '@/lib/themeStore.jsx';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext'; // Наш новый контекст

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { itemCount, setIsOpen } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { t, lang, setLang } = useLanguage(); // Используем перевод

  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [location]);

  const getInitials = (name) => {
    if (!name) return "U";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
      <>
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                scrolled ? 'bg-background/80 backdrop-blur-xl shadow-lg border-b border-border/50' : 'bg-transparent'
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-16 sm:h-20">

              {/* Логотип */}
              <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary/20">
                  <span className="text-primary-foreground font-display text-xl font-bold">E</span>
                </div>
                <span className="font-display text-xl sm:text-2xl font-bold text-foreground">Epicurean</span>
              </Link>

              {/* Навигация (Десктоп) */}
              <nav className="hidden md:flex items-center gap-1">
                <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/' ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}>
                  {t('home')}
                </Link>
                <Link to="/menu" className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${location.pathname === '/menu' ? 'text-primary bg-primary/5' : 'text-muted-foreground'}`}>
                  {t('menu')}
                </Link>
                <Link to="/#about" className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary transition-all">
                  {t('about')}
                </Link>
                <Link to="/#contact" className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-primary transition-all">
                  {t('contact')}
                </Link>
              </nav>

              {/* Инструменты */}
              <div className="flex items-center gap-2">

                {/* ВЫБОР ЯЗЫКА (Dropdown) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-2.5 rounded-xl hover:bg-muted transition-colors outline-none flex items-center gap-1">
                      <Languages className="w-5 h-5 text-foreground" />
                      <span className="text-[10px] font-bold uppercase">{lang}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl border-border/50">
                    <DropdownMenuItem onClick={() => setLang('en')} className="rounded-xl cursor-pointer py-2">
                      English
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLang('tk')} className="rounded-xl cursor-pointer py-2">
                      Türkmençe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setLang('ru')} className="rounded-xl cursor-pointer py-2">
                      Русский
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Тема */}
                <button onClick={toggleTheme} className="p-2.5 rounded-xl hover:bg-muted transition-colors">
                  {isDark ? <Sun className="w-5 h-5 text-secondary" /> : <Moon className="w-5 h-5 text-foreground" />}
                </button>

                {/* Избранное */}
                <Link to="/wishlist" className="p-2.5 rounded-xl hover:bg-muted transition-colors hidden sm:flex">
                  <Heart className="w-5 h-5 text-foreground" />
                </Link>

                {/* Корзина */}
                <button onClick={() => setIsOpen(true)} className="relative p-2.5 rounded-xl hover:bg-muted transition-colors">
                  <ShoppingBag className="w-5 h-5 text-foreground" />
                  {itemCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold border-2 border-background">
                    {itemCount}
                  </span>
                  )}
                </button>

                <div className="h-6 w-px bg-border mx-1 hidden sm:block" />

                {/* Профиль */}
                {isAuthenticated ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 p-1 pr-2 rounded-full hover:bg-muted transition-all outline-none group">
                          <Avatar className="w-8 h-8 border border-border shadow-sm">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div className="hidden lg:block text-left">
                            <p className="text-[10px] text-muted-foreground leading-none uppercase">{t('profile')}</p>
                            <p className="text-xs font-bold text-foreground max-w-[100px] truncate">{user.name}</p>
                          </div>
                          <ChevronDown className="w-3 h-3 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 mt-2 rounded-2xl p-2 shadow-xl border-border/50">
                        <DropdownMenuLabel className="px-3 py-2">
                          <p className="text-xs text-muted-foreground font-normal">{t('signed_in_as')}</p>
                          <p className="text-sm font-semibold truncate">{user.email}</p>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link to="/dashboard"><DropdownMenuItem className="rounded-xl cursor-pointer gap-2 py-2.5"><LayoutDashboard className="w-4 h-4 text-muted-foreground" /><span>{t('my_dashboard')}</span></DropdownMenuItem></Link>
                        <Link to="/wishlist"><DropdownMenuItem className="rounded-xl cursor-pointer gap-2 py-2.5"><Heart className="w-4 h-4 text-muted-foreground" /><span>{t('my_wishlist')}</span></DropdownMenuItem></Link>
                        {user?.role === 'admin' && (
                            <>
                              <DropdownMenuSeparator />
                              <Link to="/admin"><DropdownMenuItem className="rounded-xl cursor-pointer gap-2 py-2.5 text-accent font-semibold focus:text-accent focus:bg-accent/5"><Settings className="w-4 h-4" /><span>{t('admin_panel')}</span></DropdownMenuItem></Link>
                            </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => logout()} className="rounded-xl cursor-pointer gap-2 py-2.5 text-destructive focus:text-destructive focus:bg-destructive/5"><LogOut className="w-4 h-4" /><span>{t('log_out')}</span></DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <Link to="/login">
                      <button className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-full text-sm font-bold hover:opacity-90 transition-opacity">
                        <UserIcon className="w-4 h-4" /> {t('login')}
                      </button>
                    </Link>
                )}
              </div>
            </div>
          </div>
        </motion.header>
      </>
  );
}