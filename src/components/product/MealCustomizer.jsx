import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, X, Plus, Minus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function MealCustomizer({ product, onIngredientsChange }) {
  const [selections, setSelections] = useState({});

  const allIngredientIds = [
    ...(product.default_ingredients || []),
    ...(product.optional_ingredients || []),
  ];

  const { data: ingredients = [], isLoading } = useQuery({
    queryKey: ['ingredients', allIngredientIds.join(',')],
    queryFn: () => base44.entities.Ingredient.list(),
    enabled: allIngredientIds.length > 0,
  });

  const relevantIngredients = ingredients.filter(ing =>
    allIngredientIds.includes(ing.id)
  );

  const defaultSet = new Set(product.default_ingredients || []);
  const optionalSet = new Set(product.optional_ingredients || []);

  useEffect(() => {
    if (relevantIngredients.length > 0 && Object.keys(selections).length === 0) {
      const initial = {};
      relevantIngredients.forEach(ing => {
        initial[ing.id] = defaultSet.has(ing.id) ? 'included' : 'available';
      });
      setSelections(initial);
    }
  }, [relevantIngredients.length]);

  useEffect(() => {
    const added = [];
    const removed = [];
    let extraPrice = 0;
    let extraCals = 0;

    Object.entries(selections).forEach(([id, status]) => {
      const ing = relevantIngredients.find(i => i.id === id);
      if (!ing) return;

      if (status === 'added' && optionalSet.has(id)) {
        added.push(ing.name);
        extraPrice += ing.price || 0;
        extraCals += ing.calories || 0;
      }
      if (status === 'removed' && defaultSet.has(id)) {
        removed.push(ing.name);
        extraCals -= ing.calories || 0;
      }
    });

    onIngredientsChange(added, removed, extraPrice, extraCals);
  }, [selections]);

  if (allIngredientIds.length === 0) return null;

  if (isLoading) return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-32" />
      {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-xl" />)}
    </div>
  );

  if (relevantIngredients.length === 0) return null;

  const toggleIngredient = (id) => {
    setSelections(prev => {
      const current = prev[id];
      if (defaultSet.has(id)) {
        return { ...prev, [id]: current === 'included' ? 'removed' : 'included' };
      } else {
        return { ...prev, [id]: current === 'available' ? 'added' : 'available' };
      }
    });
  };

  return (
    <div>
      <label className="text-sm font-semibold text-foreground mb-2 block">Customize Ingredients</label>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {relevantIngredients.map(ing => {
          const status = selections[ing.id] || 'available';
          const isActive = status === 'included' || status === 'added';

          return (
            <button
              key={ing.id}
              onClick={() => toggleIngredient(ing.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 text-left ${
                isActive
                  ? 'bg-accent/10 border border-accent/30'
                  : 'bg-muted/50 border border-transparent hover:border-border'
              }`}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs ${
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {isActive ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              </div>
              <span className={`flex-1 text-sm ${isActive ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {ing.name}
              </span>
              {ing.price > 0 && optionalSet.has(ing.id) && (
                <span className="text-xs text-primary font-semibold">+${ing.price.toFixed(2)}</span>
              )}
              {ing.calories > 0 && (
                <span className="text-xs text-muted-foreground">{ing.calories} cal</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}