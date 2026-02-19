import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  imageUrl,
  isFeatured,
}) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(id);
  };

  const discount = compareAtPrice ? Math.round((1 - price / compareAtPrice) * 100) : 0;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="card-product group"
    >
      <Link to={`/products/${slug}`} className="block">
        {/* Image */}
        <div className="relative aspect-square bg-secondary overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ShoppingBag className="w-12 h-12" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {discount > 0 && (
              <span className="badge-sale">-{discount}%</span>
            )}
            {isFeatured && (
              <span className="badge-status bg-primary text-primary-foreground">Featured</span>
            )}
          </div>

          {/* Quick Add Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileHover={{ opacity: 1, y: 0 }}
            className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Button
              onClick={handleAddToCart}
              className="w-full bg-primary/90 hover:bg-primary text-primary-foreground backdrop-blur-sm"
            >
              <ShoppingBag className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </motion.div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2">
            {name}
          </h3>
          <div className="mt-2 flex items-center gap-2">
            <span className={compareAtPrice ? 'price-sale text-lg' : 'font-semibold text-lg'}>
              ${price.toFixed(2)}
            </span>
            {compareAtPrice && (
              <span className="price-original">${compareAtPrice.toFixed(2)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
