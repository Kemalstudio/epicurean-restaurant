import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';

export default function ProductFormModal({ product, onClose, onSaved }) {
  const [form, setForm] = useState(product || {
    name: '', slug: '', description: '', short_description: '', base_price: 0,
    calories: 0, protein: 0, fat: 0, carbs: 0, weight: '', prep_time: '',
    image_url: '', category_id: '', is_new: false, is_featured: false, is_popular: false,
    is_available: true, discount_percent: 0, tags: [],
  });
  const [saving, setSaving] = useState(false);

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list(),
  });

  const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    if (product?.id) {
      await base44.entities.Product.update(product.id, form);
      toast({ title: 'Product updated' });
    } else {
      await base44.entities.Product.create(form);
      toast({ title: 'Product created' });
    }
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] bg-background rounded-2xl shadow-2xl border border-border overflow-y-auto"
      >
        <div className="sticky top-0 bg-background border-b border-border p-5 flex justify-between items-center z-10">
          <h2 className="font-display text-xl font-bold">{product ? 'Edit Product' : 'New Product'}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs mb-1">Name</Label>
              <Input value={form.name} onChange={(e) => update('name', e.target.value)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1">Slug</Label>
              <Input value={form.slug} onChange={(e) => update('slug', e.target.value)} className="rounded-xl" placeholder="auto-generated" />
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1">Short Description</Label>
            <Input value={form.short_description} onChange={(e) => update('short_description', e.target.value)} className="rounded-xl" />
          </div>

          <div>
            <Label className="text-xs mb-1">Full Description</Label>
            <Textarea value={form.description} onChange={(e) => update('description', e.target.value)} className="rounded-xl min-h-[80px]" />
          </div>

          <div>
            <Label className="text-xs mb-1">Image URL</Label>
            <Input value={form.image_url} onChange={(e) => update('image_url', e.target.value)} className="rounded-xl" />
          </div>

          <div>
            <Label className="text-xs mb-1">Category</Label>
            <Select value={form.category_id} onValueChange={(v) => update('category_id', v)}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs mb-1">Price ($)</Label>
              <Input type="number" step="0.01" value={form.base_price} onChange={(e) => update('base_price', parseFloat(e.target.value) || 0)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1">Discount %</Label>
              <Input type="number" value={form.discount_percent} onChange={(e) => update('discount_percent', parseFloat(e.target.value) || 0)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1">Weight</Label>
              <Input value={form.weight} onChange={(e) => update('weight', e.target.value)} className="rounded-xl" placeholder="350g" />
            </div>
            <div>
              <Label className="text-xs mb-1">Prep Time</Label>
              <Input value={form.prep_time} onChange={(e) => update('prep_time', e.target.value)} className="rounded-xl" placeholder="15-20 min" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs mb-1">Calories</Label>
              <Input type="number" value={form.calories} onChange={(e) => update('calories', parseFloat(e.target.value) || 0)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1">Protein (g)</Label>
              <Input type="number" value={form.protein} onChange={(e) => update('protein', parseFloat(e.target.value) || 0)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1">Fat (g)</Label>
              <Input type="number" value={form.fat} onChange={(e) => update('fat', parseFloat(e.target.value) || 0)} className="rounded-xl" />
            </div>
            <div>
              <Label className="text-xs mb-1">Carbs (g)</Label>
              <Input type="number" value={form.carbs} onChange={(e) => update('carbs', parseFloat(e.target.value) || 0)} className="rounded-xl" />
            </div>
          </div>

          <div className="flex flex-wrap gap-6">
            {[
              { key: 'is_available', label: 'Available' },
              { key: 'is_new', label: 'New' },
              { key: 'is_featured', label: 'Featured' },
              { key: 'is_popular', label: 'Popular' },
            ].map(s => (
              <div key={s.key} className="flex items-center gap-2">
                <Switch checked={form[s.key]} onCheckedChange={(v) => update(s.key, v)} />
                <Label className="text-sm">{s.label}</Label>
              </div>
            ))}
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t border-border p-5 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-primary rounded-xl">
            {saving ? 'Saving...' : product ? 'Update' : 'Create'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}