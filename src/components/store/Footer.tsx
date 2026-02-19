import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto">
      <div className="container-store py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-display font-bold text-xl">Store</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm">
              Premium products for modern living.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h4 className="font-display font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products?featured=true" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Featured
                </Link>
              </li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-display font-semibold mb-4">Account</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/auth" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Cart
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              <li>
                <span className="text-primary-foreground/70 text-sm">
                  help@store.com
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-primary-foreground/60 text-sm">
          © {new Date().getFullYear()} Store. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
