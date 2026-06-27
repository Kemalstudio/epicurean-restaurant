import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DollarSign, ShoppingBag, Users, TrendingUp, Package, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import AdminLayout from '@/components/admin/AdminLayout';

const COLORS = ['hsl(18,100%,60%)', 'hsl(45,100%,51%)', 'hsl(170,55%,39%)', 'hsl(220,20%,25%)', 'hsl(0,84%,60%)'];

export default function AdminDashboard() {
  const { data: orders = [] } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => base44.entities.Order.list('-created_date'),
  });

  const { data: products = [] } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;

  const salesByDay = {};
  orders.forEach(o => {
    const day = new Date(o.created_date).toLocaleDateString('en-US', { weekday: 'short' });
    salesByDay[day] = (salesByDay[day] || 0) + (o.total || 0);
  });
  const salesData = Object.entries(salesByDay).map(([name, value]) => ({ name, value: Math.round(value) }));

  const catCount = {};
  orders.forEach(o => {
    o.items?.forEach(i => {
      catCount[i.product_name] = (catCount[i.product_name] || 0) + i.quantity;
    });
  });
  const topProducts = Object.entries(catCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([name, value]) => ({ name: name.substring(0, 15), value }));

  const stats = [
    { icon: DollarSign, label: 'Total Revenue', value: `$${totalRevenue.toFixed(0)}`, color: 'text-primary bg-primary/10' },
    { icon: ShoppingBag, label: 'Total Orders', value: orders.length, color: 'text-secondary bg-secondary/10' },
    { icon: Package, label: 'Active Orders', value: activeOrders, color: 'text-accent bg-accent/10' },
    { icon: TrendingUp, label: 'Products', value: products.length, color: 'text-primary bg-primary/10' },
  ];

  return (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-card rounded-2xl border border-border/50 p-5"
          >
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <h3 className="font-heading text-lg font-bold mb-4">Revenue Overview</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <YAxis fontSize={12} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
              />
              <Bar dataKey="value" fill="hsl(18,100%,60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-2xl border border-border/50 p-6">
          <h3 className="font-heading text-lg font-bold mb-4">Top Products</h3>
          {topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={topProducts} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                  {topProducts.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {topProducts.map((p, idx) => (
              <Badge key={idx} style={{ backgroundColor: COLORS[idx % COLORS.length] + '20', color: COLORS[idx % COLORS.length] }} className="border-0 text-xs">
                {p.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-card rounded-2xl border border-border/50 p-6">
        <h3 className="font-heading text-lg font-bold mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="text-left py-3 font-medium">Order</th>
                <th className="text-left py-3 font-medium">Customer</th>
                <th className="text-left py-3 font-medium">Items</th>
                <th className="text-left py-3 font-medium">Total</th>
                <th className="text-left py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map(o => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                  <td className="py-3 font-medium">{o.order_number}</td>
                  <td className="py-3 text-muted-foreground">{o.customer_name || 'Guest'}</td>
                  <td className="py-3 text-muted-foreground">{o.items?.length || 0}</td>
                  <td className="py-3 font-semibold text-primary">${o.total?.toFixed(2)}</td>
                  <td className="py-3">
                    <Badge variant="secondary" className="text-xs capitalize">{o.status?.replace(/_/g, ' ')}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}