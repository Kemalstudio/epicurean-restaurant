import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Eye, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const statusLabels = {
  received: 'Received', preparing: 'Preparing', packaging: 'Packaging',
  out_for_delivery: 'Out for Delivery', delivered: 'Delivered', cancelled: 'Cancelled',
};

const statusColors = {
  received: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  preparing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  packaging: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  out_for_delivery: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const filtered = filterStatus === 'all' ? orders : orders.filter(o => o.status === filterStatus);

  const updateStatus = async (orderId, newStatus) => {
    await base44.entities.Order.update(orderId, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    toast({ title: `Order status updated to ${statusLabels[newStatus]}` });
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold">Orders</h1>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            {Object.entries(statusLabels).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-2xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Order</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Items</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Total</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{o.order_number}</td>
                  <td className="p-4">
                    <div>
                      <p className="text-foreground">{o.customer_name || 'Guest'}</p>
                      <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{o.items?.length || 0}</td>
                  <td className="p-4 font-semibold text-primary">${o.total?.toFixed(2)}</td>
                  <td className="p-4">
                    <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                      <SelectTrigger className="w-36 h-8 rounded-lg text-xs">
                        <Badge className={`${statusColors[o.status]} border-0 text-xs`}>{statusLabels[o.status]}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusLabels).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 text-right">
                    <Button size="icon" variant="ghost" onClick={() => setSelectedOrder(o)} className="w-8 h-8 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Customer:</span> <strong>{selectedOrder.customer_name}</strong></div>
                <div><span className="text-muted-foreground">Phone:</span> <strong>{selectedOrder.customer_phone}</strong></div>
                <div><span className="text-muted-foreground">Email:</span> <strong>{selectedOrder.customer_email}</strong></div>
                <div><span className="text-muted-foreground">Payment:</span> <strong className="capitalize">{selectedOrder.payment_method}</strong></div>
              </div>
              <div className="text-sm">
                <span className="text-muted-foreground">Address:</span> <strong>{selectedOrder.delivery_address}</strong>
              </div>
              {selectedOrder.customer_notes && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Notes:</span> <strong>{selectedOrder.customer_notes}</strong>
                </div>
              )}
              <div className="border-t pt-3 space-y-2">
                {selectedOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.quantity}x {item.product_name}</span>
                      {item.size && <span className="text-muted-foreground ml-2">({item.size})</span>}
                      {item.added_ingredients?.length > 0 && (
                        <p className="text-xs text-accent">+ {item.added_ingredients.join(', ')}</p>
                      )}
                      {item.removed_ingredients?.length > 0 && (
                        <p className="text-xs text-destructive">- {item.removed_ingredients.join(', ')}</p>
                      )}
                    </div>
                    <span className="font-medium">${item.total_price?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${selectedOrder.subtotal?.toFixed(2)}</span></div>
                {selectedOrder.discount_amount > 0 && (
                  <div className="flex justify-between text-accent"><span>Discount</span><span>-${selectedOrder.discount_amount?.toFixed(2)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>${selectedOrder.delivery_fee?.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Tax</span><span>${selectedOrder.tax?.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span><span className="text-primary">${selectedOrder.total?.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}