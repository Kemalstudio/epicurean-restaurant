import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Search, SlidersHorizontal, X, Grid3X3, LayoutList } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import ProductCard from '@/components/shared/ProductCard';
import ProductDetailModal from '@/components/product/ProductDetailModal';

const moodFilters = [
  { label: 'All', value: 'all', emoji: '🍽️' },
  { label: 'Late Night', value: 'late-night', emoji: '🌙' },
  { label: 'Protein Power', value: 'protein', emoji: '💪' },
  { label: "Chef's Specials", value: 'featured', emoji: '⭐' },
  { label: 'New Arrivals', value: 'new', emoji: '✨' },
  { label: 'Deals', value: 'deals', emoji: '🔥' },
];

export default function Menu() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [moodFilter, setMoodFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.filter({ is_available: true }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('sort_order'),
  });

  const { data: wishlistItems = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => base44.entities.Wishlist.list(),
  });

  const wishlistedIds = new Set(wishlistItems.map(w => w.product_id));

  const toggleWishlist = async (productId) => {
    const existing = wishlistItems.find(w => w.product_id === productId);
    if (existing) {
      await base44.entities.Wishlist.delete(existing.id);
    } else {
      await base44.entities.Wishlist.create({ product_id: productId });
    }
  };

  const urlParams = new URLSearchParams(window.location.search);
  const catFromUrl = urlParams.get('cat');

  const effectiveCategory = catFromUrl || selectedCategory;

  const filtered = useMemo(() => {
    let result = [...products];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q))
      );
    }

    // Category
    if (effectiveCategory !== 'all') {
      const cat = categories.find(c => c.slug === effectiveCategory || c.name.toLowerCase() === effectiveCategory);
      if (cat) result = result.filter(p => p.category_id === cat.id);
    }

    // Mood filters
    if (moodFilter === 'featured') result = result.filter(p => p.is_featured);
    if (moodFilter === 'new') result = result.filter(p => p.is_new);
    if (moodFilter === 'deals') result = result.filter(p => p.discount_percent > 0);
    if (moodFilter === 'protein') result = result.filter(p => (p.protein || 0) > 20);

    // Sort
    if (sortBy === 'popular') result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sortBy === 'price-low') result.sort((a, b) => a.base_price - b.base_price);
    if (sortBy === 'price-high') result.sort((a, b) => b.base_price - a.base_price);
    if (sortBy === 'newest') result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    if (sortBy === 'calories') result.sort((a, b) => (a.calories || 0) - (b.calories || 0));

    return result;
  }, [products, search, effectiveCategory, moodFilter, sortBy, categories]);

  return (
    <div className="pt-20 min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-2"
          >
            Our Menu
          </motion.h1>
          <p className="text-muted-foreground mb-8">Discover dishes crafted with passion and finest ingredients</p>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search dishes, ingredients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 rounded-xl bg-card border-border/50 text-base"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-44 h-12 rounded-xl">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="price-low">Price: Low → High</SelectItem>
                <SelectItem value="price-high">Price: High → Low</SelectItem>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="calories">Lowest Calories</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mood filters */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {moodFilters.map(f => (
              <button
                key={f.value}
                onClick={() => setMoodFilter(f.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-300 ${
                  moodFilter === f.value
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'bg-card border border-border/50 text-muted-foreground hover:border-primary/30'
                }`}
              >
                <span>{f.emoji}</span>
                {f.label}
              </button>
            ))}
          </div>

          {/* Category pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                effectiveCategory === 'all'
                  ? 'bg-foreground text-background'
                  : 'bg-card border border-border/50 text-muted-foreground hover:border-primary/30'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug || cat.name.toLowerCase())}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  effectiveCategory === (cat.slug || cat.name.toLowerCase())
                    ? 'bg-foreground text-background'
                    : 'bg-card border border-border/50 text-muted-foreground hover:border-primary/30'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <p className="text-sm text-muted-foreground mb-6">{filtered.length} dishes found</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array(8).fill(0).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-2xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))
            : filtered.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenDetail={setSelectedProduct}
                  isWishlisted={wishlistedIds.has(product.id)}
                  onToggleWishlist={toggleWishlist}
                />
              ))
          }
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🍽️</p>
            <h3 className="font-display text-2xl font-bold text-foreground mb-2">No dishes found</h3>
            <p className="text-muted-foreground">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}