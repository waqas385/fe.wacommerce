/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/OrderDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Package, 
  Truck, 
  Calendar,
  MapPin,
  CreditCard,
  ArrowLeft,
  Printer,
  Phone,
  Home,
  Mail,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import ordersService, { Order } from '@/services/orders';
import { useAuth } from '@/contexts/AuthContext';

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/20',
  processing: 'bg-accent/20 text-accent border-accent/20',
  shipped: 'bg-primary/20 text-primary border-primary/20',
  delivered: 'bg-success/20 text-success border-success/20',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/20',
};

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await ordersService.getOrderById(parseInt(orderId!));
        setOrder(data);
      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, user, navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEstimatedDelivery = () => {
    if (!order?.createdAt) return 'N/A';
    
    const orderDate = new Date(order.createdAt);
    const estimatedDate = new Date(orderDate);
    
    // Add different days based on status
    if (order.status === 'delivered') {
      return formatDate(order.updatedAt || order.createdAt);
    } else if (order.status === 'shipped') {
      estimatedDate.setDate(orderDate.getDate() + 3);
    } else {
      estimatedDate.setDate(orderDate.getDate() + 7);
    }
    
    return formatDate(estimatedDate.toISOString());
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'delivered': return '100%';
      case 'shipped': return '75%';
      case 'processing': return '50%';
      case 'pending': return '25%';
      case 'cancelled': return '0%';
      default: return '0%';
    }
  };

  if (loading) {
    return (
      <div className="py-16 md:py-24">
        <div className="container-store text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container-store max-w-3xl">
        {/* Back Button */}
        <Link
          to="/orders"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>

        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold mb-2">Order Details</h1>
          <p className="text-muted-foreground">
            View the complete details and status of your order
          </p>
        </motion.div>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl overflow-hidden mb-6"
        >
          {/* Order Header */}
          <div className="p-6 border-b border-border bg-muted/30">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Order Number</p>
                <p className="font-mono text-lg font-semibold">#{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Order Date</p>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(order.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Order Status */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Order Status
              </h2>
              <Badge className={statusColors[order.status]}>
                {statusLabels[order.status]}
              </Badge>
            </div>
            
            {/* Status Progress Bar - Only show for non-cancelled orders */}
            {order.status !== 'cancelled' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex-1">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-accent rounded-full transition-all"
                        style={{ width: getStatusProgress(order.status) }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Pending</span>
                      <span>Processing</span>
                      <span>Shipped</span>
                      <span>Delivered</span>
                    </div>
                  </div>
                </div>
                
                {/* Estimated Delivery */}
                <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm text-muted-foreground">Estimated Delivery</p>
                  <p className="font-medium">{getEstimatedDelivery()}</p>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-destructive/10 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <p className="text-sm text-destructive">This order has been cancelled</p>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="p-6 border-b border-border">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items ({order.items?.length || 0})
            </h2>
            <div className="space-y-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden shrink-0">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × ${Number(item.price).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-semibold">
                    ${(item.quantity * Number(item.price)).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="p-6 border-b border-border">
              <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>
              <div className="space-y-1 text-muted-foreground">
                <p className="font-medium text-foreground">{order.shippingAddress?.fullName}</p>
                <p>{order.shippingAddress?.addressLine1}</p>
                {order.shippingAddress?.addressLine2 && (
                  <p>{order.shippingAddress.addressLine2}</p>
                )}
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}{' '}
                  {order.shippingAddress?.postalCode}
                </p>
                <p>{order.shippingAddress?.country}</p>
                <p className="flex items-center gap-1 mt-2">
                  <Phone className="w-4 h-4" />
                  {order.shippingAddress?.phone}
                </p>
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="p-6 border-b border-border">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium capitalize">
                  {order.paymentMethod || 'Cash on Delivery'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Status</p>
                <Badge 
                  variant="outline"
                  className={order.paymentStatus === 'paid' 
                    ? 'bg-success/20 text-success border-success/20' 
                    : 'bg-warning/20 text-warning border-warning/20'
                  }
                >
                  {order.paymentStatus || 'Pending'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${(order.total - (order.shippingCost || 0)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>${(order.shippingCost || 0).toFixed(2)}</span>
              </div>
              {order.discount && order.discount > 0 && (
                <div className="flex justify-between text-sm text-success">
                  <span className="text-muted-foreground">Discount</span>
                  <span>-${order.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 mt-2">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg text-accent">${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print Order Details
          </Button>
          <Link to="/products">
            <Button className="bg-gradient-accent">
              Continue Shopping
            </Button>
          </Link>
          <Link to="/orders">
            <Button variant="outline">
              Back to All Orders
            </Button>
          </Link>
        </motion.div>

        {/* Need Help Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted-foreground">
            Need help with this order? Contact our support team at{' '}
            <a href="mailto:support@example.com" className="text-accent hover:underline">
              support@example.com
            </a>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderDetail;