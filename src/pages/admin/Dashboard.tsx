// src/components/admin/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  ShoppingCart,
  Users,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import statsService, { DashboardStats } from '@/services/stats';
import ordersService from '@/services/orders';
import productsService from '@/services/products';
import usersService from '@/services/users';

const statCards = [
  { key: 'totalProducts', label: 'Products', icon: Package, color: 'bg-accent/10 text-accent' },
  { key: 'totalOrders', label: 'Orders', icon: ShoppingCart, color: 'bg-primary/10 text-primary' },
  { key: 'totalRevenue', label: 'Revenue', icon: DollarSign, color: 'bg-success/10 text-success', isCurrency: true },
  { key: 'totalUsers', label: 'Users', icon: Users, color: 'bg-warning/10 text-warning' },
];

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Option 1: Use the dedicated stats service (recommended)
      const dashboardStats = await statsService.getDashboardStats();
      setStats(dashboardStats);
      
      /* Option 2: If you don't have a stats endpoint, use individual services
      const [products, orders, users] = await Promise.all([
        productsService.getProducts({ limit: 1 }), // Just to get count, you might need a count endpoint
        ordersService.getOrders(),
        usersService.getUserCount(),
      ]);

      // You might need to adjust this based on your actual API responses
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
      
      setStats({
        totalProducts: products.length, // This might need adjustment
        totalOrders: orders.length,
        totalRevenue,
        totalUsers: users, // Assuming getUserCount returns just the number
        recentOrders: orders.slice(0, 5).map(order => ({
          id: order.id,
          status: order.status,
          total: order.total,
          created_at: order.created_at,
        })),
      });
      */
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // You might want to show an error toast/notification here
    } finally {
      setLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    pending: 'bg-warning/20 text-warning',
    processing: 'bg-accent/20 text-accent',
    shipped: 'bg-primary/20 text-primary',
    delivered: 'bg-success/20 text-success',
    cancelled: 'bg-destructive/20 text-destructive',
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your store overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">
                      {loading ? (
                        <span className="animate-pulse">---</span>
                      ) : stat.isCurrency ? (
                        `$${stats[stat.key as keyof DashboardStats].toLocaleString()}`
                      ) : (
                        stats[stat.key as keyof DashboardStats].toLocaleString()
                      )}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Orders</CardTitle>
          <Link to="/admin/orders" className="text-sm text-accent hover:underline">
            View All
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-muted/50 rounded-lg animate-pulse">
                  <div className="h-4 bg-muted-foreground/20 rounded w-1/4" />
                  <div className="h-4 bg-muted-foreground/20 rounded w-1/6" />
                </div>
              ))}
            </div>
          ) : stats.recentOrders.length > 0 ? (
            <div className="space-y-3">
              {stats.recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-sm text-muted-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-muted'}`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${Number(order.total).toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No orders yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
