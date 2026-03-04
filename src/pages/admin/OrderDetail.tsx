/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  Truck, 
  Calendar,
  MapPin,
  CreditCard,
  ArrowLeft,
  Printer,
  Phone,
  Mail,
  AlertCircle,
  Edit,
  RefreshCw,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import ordersService, { Order } from '@/services/orders';

const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
const paymentStatusOptions = ['pending', 'paid', 'failed', 'refunded'];

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const paymentStatusLabels: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/20',
  processing: 'bg-accent/20 text-accent border-accent/20',
  shipped: 'bg-primary/20 text-primary border-primary/20',
  delivered: 'bg-success/20 text-success border-success/20',
  cancelled: 'bg-destructive/20 text-destructive border-destructive/20',
};

const paymentStatusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/20',
  paid: 'bg-success/20 text-success border-success/20',
  failed: 'bg-destructive/20 text-destructive border-destructive/20',
  refunded: 'bg-gray-500/20 text-gray-500 border-gray-500/20',
};

const AdminOrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const data = await ordersService.getOrderById(parseInt(orderId!));
        setOrder(data);
      } catch (error: any) {
        console.error('Error fetching order:', error);
        toast.error('Failed to load order details');
        navigate('/admin/orders');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId, navigate]);

  const updateOrderStatus = async (status: string) => {
    if (!order) return;
    
    try {
      setUpdatingStatus(true);
      await ordersService.updateOrderStatus(order.id, { status });
      setOrder({ ...order, status });
      toast.success(`Order status updated to ${statusLabels[status]}`);
    } catch (error: any) {
      console.error('Error updating order status:', error);
      toast.error(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const updatePaymentStatus = async (paymentStatus: string) => {
    if (!order) return;
    
    try {
      setUpdatingPayment(true);
      await ordersService.updatePaymentStatus(order.id, paymentStatus);
      setOrder({ ...order, paymentStatus });
      toast.success(`Payment status updated to ${paymentStatusLabels[paymentStatus]}`);
    } catch (error: any) {
      console.error('Error updating payment status:', error);
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    } finally {
      setUpdatingPayment(false);
    }
  };

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
      <div className="py-12">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-accent border-t-transparent rounded-full mx-auto" />
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            to="/admin/orders"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Orders
          </Link>
          <h1 className="font-display text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on {formatDate(order.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Status Update Card */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Status */}
          <div>
            <label className="text-sm font-medium mb-2 block">Order Status</label>
            <div className="flex items-center gap-4">
              <Select
                value={order.status}
                onValueChange={updateOrderStatus}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-48">
                  <SelectValue>
                    <Badge className={statusColors[order.status]}>
                      {statusLabels[order.status]}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[status]}>
                          {statusLabels[status]}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {updatingStatus && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Updating...</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <label className="text-sm font-medium mb-2 block">Payment Status</label>
            <div className="flex items-center gap-4">
              <Select
                value={order.paymentStatus || 'pending'}
                onValueChange={updatePaymentStatus}
                disabled={updatingPayment}
              >
                <SelectTrigger className="w-48">
                  <SelectValue>
                    <Badge className={paymentStatusColors[order.paymentStatus || 'pending']}>
                      {paymentStatusLabels[order.paymentStatus || 'pending']}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {paymentStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        <Badge className={paymentStatusColors[status]}>
                          {paymentStatusLabels[status]}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {updatingPayment && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Updating...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Progress Bar - Only show for non-cancelled orders */}
        {order.status !== 'cancelled' && (
          <div className="mt-6">
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
          </div>
        )}

        {order.status === 'cancelled' && (
          <div className="mt-4 p-3 bg-destructive/10 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">This order has been cancelled</p>
          </div>
        )}
      </div>

      {/* Two Column Layout for Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items ({order.items?.length || 0})
            </h2>
            <div className="space-y-4">
              {order.items?.map((item: any) => (
                <div key={item.id} className="flex gap-4 py-2">
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
                      SKU: {item.productSku || 'N/A'}
                    </p>
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
            <div className="bg-card border border-border rounded-xl p-6">
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
                {order.shippingAddress?.email && (
                  <p className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {order.shippingAddress.email}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Customer Info & Order Summary */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Customer
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{order.user?.fullName || 'Guest'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{order.user?.email || 'N/A'}</p>
              </div>
              {order.user?.phone && (
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">{order.user.phone}</p>
                </div>
              )}
              <div className="pt-2">
                <Link to={`/admin/customers/${order.user?.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View Customer Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3">
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
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg text-accent">${Number(order.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Timeline
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(order.createdAt)}</p>
              </div>
              {order.updatedAt && order.updatedAt !== order.createdAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-sm font-medium">{formatDate(order.updatedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;