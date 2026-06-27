import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function AdminPromos() {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', discount_percent: 10, max_uses: 100, expires_at: '', is_active: true, min_order_amount: 0 });
  const queryClient = useQueryClient();

  const { data: promos = [] } = useQuery({
    queryKey: ['admin-promos'],
    queryFn: () => base44.entities.PromoCode.list('-created_date'),
  });

  const openForm = (promo = null) => {
    setEditing(promo);
    setForm(promo || { code: '', discount_percent: 10, max_uses: 100, expires_at: '', is_active: true, min_order_amount: 0 });
    setShowForm(true);
  };

  const handleSave = async () => {
    const data = { ...form, code: form.code.toUpperCase() };
    if (editing?.id) {
      await base44.entities.PromoCode.update(editing.id, data);
      toast({ title: 'Promo code updated' });
    } else {
      await base44.entities.PromoCode.create(data);
      toast({ title: 'Promo code created' });
    }
    queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promo code?')) return;
    await base44.entities.PromoCode.delete(id);
    queryClient.invalidateQueries({ queryKey: ['admin-promos'] });
    toast({ title: 'Promo code deleted' });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Promo Codes</h1>
        <Button onClick={() => openForm()} className="bg-primary rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Add Code
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {promos.map(p => (
          <div key={p.id} className="bg-card rounded-2xl border border-border/50 p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="font-mono text-lg font-bold text-primary">{p.code}</span>
                <Badge className={`ml-2 border-0 text-xs ${p.is_active ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'}`}>
                  {p.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => openForm(p)} className="w-7 h-7 rounded-lg">
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => handleDelete(p.id)} className="w-7 h-7 rounded-lg text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Discount:</span> <strong>{p.discount_percent}%</strong></div>
              <div><span className="text-muted-foreground">Uses:</span> <strong>{p.used_count || 0}/{p.max_uses}</strong></div>
              {p.min_order_amount > 0 && <div><span className="text-muted-foreground">Min:</span> <strong>${p.min_order_amount}</strong></div>}
              {p.expires_at && <div><span className="text-muted-foreground">Expires:</span> <strong>{new Date(p.expires_at).toLocaleDateString()}</strong></div>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? 'Edit Promo Code' : 'New Promo Code'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className="rounded-xl font-mono" placeholder="SAVE20" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Discount %</Label>
                <Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: parseFloat(e.target.value) || 0 })} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Max Uses</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: parseInt(e.target.value) || 0 })} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Min Order ($)</Label>
                <Input type="number" value={form.min_order_amount} onChange={(e) => setForm({ ...form, min_order_amount: parseFloat(e.target.value) || 0 })} className="rounded-xl" />
              </div>
              <div>
                <Label className="text-xs">Expires</Label>
                <Input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="rounded-xl" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <Label>Active</Label>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowForm(false)} className="rounded-xl">Cancel</Button>
              <Button onClick={handleSave} className="bg-primary rounded-xl">{editing ? 'Update' : 'Create'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}