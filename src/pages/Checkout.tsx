// src/pages/Checkout.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  CreditCard, 
  Truck, 
  Shield, 
  Lock,
  MapPin,
  Building2,
  AlertCircle,
  Home,
  Package
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import ordersService from '@/services/orders';
// import { api } from '@/services/api';

interface ShippingAddress {
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  phone: string;
}

interface OrderFormData {
  notes?: string;
  items: Array<{
    productId: number;
    quantity: number;
  }>;
}

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Shipping, 2: Payment, 3: Review
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [useNewAddress, setUseNewAddress] = useState(true);

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user?.fullName || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    phone: user?.phoneNumber || '',
  });

  const [notes, setNotes] = useState('');

  const shippingThreshold = 100;
  const shippingCost = totalPrice >= shippingThreshold ? 0 : 9.99;
  const orderTotal = totalPrice + shippingCost;

  // Redirect if cart is empty
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      toast.error('Please sign in to checkout');
    } else if (items.length === 0) {
      navigate('/cart');
      toast.error('Your cart is empty');
    }
  }, [items, user, navigate]);

  // Fetch saved addresses (if you have an endpoint)
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        // Only if you have an addresses endpoint
        // const response = await api.get('/addresses');
        // setSavedAddresses(response.data);
        setSavedAddresses([]); // Default to empty array
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };
    
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setShippingAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateShippingAddress = (): boolean => {
    const { fullName, addressLine1, city, phone } = shippingAddress;
    
    if (!fullName.trim()) {
      toast.error('Please enter your full name');
      return false;
    }
    if (!addressLine1.trim()) {
      toast.error('Please enter your address');
      return false;
    }
    if (!city.trim()) {
      toast.error('Please enter your city');
      return false;
    }
    if (!phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    return true;
  };

  const handlePlaceOrder = async () => {
    if (!validateShippingAddress()) return;

    setLoading(true);
    try {
      // Prepare order items according to CreateOrderItemDto
      const orderItems = items.map((item) => ({
        productId: parseInt(item.product_id),
        quantity: item.quantity,
      }));

      // Create order data according to CreateOrderDto
      const orderData = {
        items: orderItems,
        ...(notes.trim() && { notes: notes.trim() }), // Only include notes if provided
      };

      // Create order
      const response = await ordersService.createOrder(orderData);

      // Clear cart
      await clearCart();

      // Show success message
      toast.success('Order placed successfully!');

      // Navigate to order confirmation
      navigate(`/order-confirmation/${response.id}`);

    } catch (error: any) {
      console.error('Error placing order:', error);
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (!user || items.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="py-8 md:py-12">
      <div className="container-store">
        {/* Back button */}
        <button
          onClick={() => navigate('/cart')}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>

        <h1 className="section-heading mb-8">Checkout</h1>

        {/* Checkout Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= stepNumber
                        ? 'bg-accent text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  <span className="ml-2 text-sm hidden sm:block">
                    {stepNumber === 1 && 'Shipping'}
                    {stepNumber === 2 && 'Payment'}
                    {stepNumber === 3 && 'Review'}
                  </span>
                </div>
                {stepNumber < 3 && (
                  <div className={`w-12 h-0.5 ${
                    step > stepNumber ? 'bg-accent' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-accent" />
                Shipping Address
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      name="fullName"
                      value={shippingAddress.fullName}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={shippingAddress.phone}
                      onChange={handleInputChange}
                      placeholder="+92 234 567 8900"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="addressLine1">Address Line 1 *</Label>
                  <Input
                    id="addressLine1"
                    name="addressLine1"
                    value={shippingAddress.addressLine1}
                    onChange={handleInputChange}
                    placeholder="123 Main St"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input
                    id="addressLine2"
                    name="addressLine2"
                    value={shippingAddress.addressLine2}
                    onChange={handleInputChange}
                    placeholder="Appartment #4B"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      value={shippingAddress.city}
                      onChange={handleInputChange}
                      placeholder="Lahore"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!validateShippingAddress()}
                >
                  Continue to Payment
                </Button>
              </div>
            </motion.div>

            {/* Payment Method */}
            {step >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-accent" />
                  Payment Method
                </h2>

                <RadioGroup
                  value="card" // Default value since payment method is handled on backend
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2 border border-border rounded-lg p-4 opacity-50">
                    <RadioGroupItem value="card" id="card" disabled />
                    <Label htmlFor="card" className="flex-1 cursor-not-allowed">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Credit / Debit Card</p>
                          <p className="text-sm text-muted-foreground">
                            Pay securely with your card (Coming soon)
                          </p>
                        </div>
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border border-border rounded-lg p-4 bg-accent/5 border-accent/20">
                    <RadioGroupItem value="cod" id="cod" checked />
                    <Label htmlFor="cod" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Cash on Delivery</p>
                          <p className="text-sm text-muted-foreground">
                            Pay when you receive your order
                          </p>
                        </div>
                        <Truck className="w-5 h-5 text-accent" />
                      </div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border border-border rounded-lg p-4 opacity-50">
                    <RadioGroupItem value="bank_transfer" id="bank_transfer" disabled />
                    <Label htmlFor="bank_transfer" className="flex-1 cursor-not-allowed">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Bank Transfer</p>
                          <p className="text-sm text-muted-foreground">
                            Transfer directly to our bank account (Coming soon)
                          </p>
                        </div>
                        <Building2 className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                <div className="mt-6 p-3 bg-accent/5 rounded-lg">
                  <p className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                    <span>
                      Payment will be collected upon delivery. Our team will contact you for payment confirmation.
                    </span>
                  </p>
                </div>

                <div className="mt-6 flex justify-between">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back to Shipping
                  </Button>
                  <Button onClick={() => setStep(3)}>
                    Review Order
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Order Review */}
            {step >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-6"
              >
                <h2 className="font-display text-xl font-semibold mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-accent" />
                  Review Order
                </h2>

                {/* Order Items */}
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-secondary rounded-lg overflow-hidden shrink-0">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × ${item.product.price.toFixed(2)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Shipping Address Summary */}
                <div className="mb-6 p-4 bg-muted/30 rounded-lg">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {shippingAddress.fullName}<br />
                    {shippingAddress.addressLine1}
                    {shippingAddress.addressLine2 && <>, {shippingAddress.addressLine2}<br /></>}
                    {shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}<br />
                    {shippingAddress.phone}
                  </p>
                </div>

                {/* Order Notes */}
                <div className="mb-6">
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special instructions for your order? (e.g., delivery time preferences, gate code, etc.)"
                    className="w-full mt-1 p-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20"
                    rows={3}
                  />
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setStep(2)}>
                    Back to Payment
                  </Button>
                  <Button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="bg-gradient-accent"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Placing Order...
                      </>
                    ) : (
                      'Place Order'
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
              <h2 className="font-display text-xl font-semibold mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product.name} × {item.quantity}
                    </span>
                    <span className="font-medium">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className={`font-medium ${shippingCost === 0 ? 'text-green-600' : ''}`}>
                    {shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="text-lg text-accent">${orderTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="mt-6 p-4 bg-accent/5 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4 text-accent" />
                  <span>Secure checkout</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Your order information is encrypted and secure. Payment will be collected upon delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;