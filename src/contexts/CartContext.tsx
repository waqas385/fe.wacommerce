/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { Product } from '@/services/products';

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    stock: number;
  };
}

// Interface for the cart item from the backend
interface BackendCartItem {
  id: string;
  quantity: number;
  product: Product;
  createdAt?: string;
  updatedAt?: string;
}

// Interface for possible API response structures
interface ApiResponse<T> {
  data: T[];
  success?: boolean;
  message?: string;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // In CartContext.tsx, update the transformCartItem function:
  const transformCartItem = (backendItem: any): CartItem => {
    // Log the actual structure to see what we're getting
    console.log('Transforming backend item:', backendItem);
    
    // Handle different possible price field names
    let price = 0;
    if (backendItem.product?.basePrice !== undefined) {
      price = backendItem.product.basePrice;
    } else if (backendItem.product?.price !== undefined) {
      price = backendItem.product.price;
    } else if (backendItem.product?.amount !== undefined) {
      price = backendItem.product.amount;
    }
    
    // Handle different possible image field names
    let imageUrl = null;
    if (backendItem.product?.images?.[0]) {
      imageUrl = backendItem.product.images[0];
    } else if (backendItem.product?.image_url) {
      imageUrl = backendItem.product.image_url;
    } else if (backendItem.product?.imageUrl) {
      imageUrl = backendItem.product.imageUrl;
    }
    
    // Handle different possible stock field names
    let stock = 10; // default
    if (backendItem.product?.stock !== undefined) {
      stock = backendItem.product.stock;
    } else if (backendItem.product?.inventory !== undefined) {
      stock = backendItem.product.inventory;
    } else if (backendItem.product?.quantity !== undefined) {
      stock = backendItem.product.quantity;
    }
    
    return {
      id: backendItem.id,
      product_id: backendItem.product?.id || backendItem.productId || '',
      quantity: backendItem.quantity || 1,
      product: {
        id: backendItem.product?.id || '',
        name: backendItem.product?.name || 'Unknown Product',
        price: price,
        image_url: imageUrl,
        stock: stock,
      }
    };
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setItems([]);
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await api.get('/cart');      
      let cartItemsData: BackendCartItem[] = [];
      
      // Handle different response structures
      if (Array.isArray(response.data)) {
        // If response is directly an array
        cartItemsData = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // If response is an object with a data property that's an array
        if (Array.isArray(response.data.data)) {
          cartItemsData = response.data.data;
        } 
        // If response is an object with items/cart property that's an array
        else if (Array.isArray(response.data.items)) {
          cartItemsData = response.data.items;
        }
        else if (Array.isArray(response.data.cart)) {
          cartItemsData = response.data.cart;
        }
        // If it's a single object (not array)
        else if (response.data.id && response.data.product) {
          cartItemsData = [response.data];
        }
      }
      
      const cartItems = cartItemsData.map(transformCartItem);
      setItems(cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      toast.error('Failed to load cart');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: string, quantity = 1) => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    try {
      const existingItem = items.find(item => item.product_id === productId);

      if (existingItem) {
        await updateQuantity(productId, existingItem.quantity + quantity);
      } else {
        await api.post('/cart/items', {
          productId: Number(productId),
          quantity,
        });
        
        await fetchCart();
        toast.success('Added to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to add to cart');
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;

    try {
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }

      await api.put(`/cart/items/${productId}`, {
        quantity,
      });
      
      await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (productId: string) => {
    if (!user) return;

    try {
      await api.delete(`/cart/items/${productId}`);
      await fetchCart();
      toast.success('Removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove from cart');
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      await api.delete('/cart');
      setItems([]);
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      toast.error('Failed to clear cart');
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{
      items,
      loading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      totalItems,
      totalPrice,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
