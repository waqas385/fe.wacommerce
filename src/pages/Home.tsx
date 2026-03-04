import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Truck, Shield, RotateCcw } from 'lucide-react';
import ProductCard from '@/components/store/ProductCard';
import { Button } from '@/components/ui/button';
import productsService, { Product } from '@/services/products';

// Extend the Product interface to include compareAtPrice for the component
interface HomeProduct {
  basePrice: number;
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  imageUrl: string | null;
  isFeatured: boolean;
}

const features = [
  {
    icon: Truck,
    title: 'Free Shipping',
    description: 'On orders over $100',
  },
  {
    icon: Shield,
    title: 'Secure Payment',
    description: '100% secure checkout',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day return policy',
  },
];

// Skeleton Loader Component
const HomePageSkeleton: React.FC = () => {
  return (
    <div className="animate-pulse">
      {/* Hero Section Skeleton */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="container-store py-16 md:py-24 lg:py-32">
          <div className="max-w-2xl space-y-6">
            <div className="w-48 h-8 bg-muted rounded-full" />
            <div className="space-y-3">
              <div className="w-3/4 h-12 bg-muted rounded-lg" />
              <div className="w-2/3 h-12 bg-muted rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="w-full h-4 bg-muted rounded" />
              <div className="w-5/6 h-4 bg-muted rounded" />
            </div>
            <div className="flex gap-4 pt-4">
              <div className="w-32 h-12 bg-muted rounded-lg" />
              <div className="w-32 h-12 bg-muted rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section Skeleton */}
      <section className="border-y border-border bg-card">
        <div className="container-store py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <div className="w-12 h-12 bg-muted rounded-xl shrink-0" />
              <div className="flex-1">
                <div className="w-32 h-4 bg-muted rounded mb-2" />
                <div className="w-24 h-3 bg-muted rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products Section Skeleton */}
      <section className="py-16 md:py-24">
        <div className="container-store">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="w-48 h-8 bg-muted rounded mb-2" />
              <div className="w-64 h-4 bg-muted rounded" />
            </div>
            <div className="w-24 h-10 bg-muted rounded hidden md:block" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <div className="aspect-square bg-muted rounded-xl mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section Skeleton */}
      <section className="bg-gradient-dark py-16 md:py-24">
        <div className="container-store text-center space-y-4">
          <div className="w-96 h-10 bg-muted/20 rounded mx-auto max-w-full" />
          <div className="w-72 h-4 bg-muted/20 rounded mx-auto" />
          <div className="w-32 h-12 bg-muted/20 rounded-lg mx-auto mt-8" />
        </div>
      </section>
    </div>
  );
};

const Home: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const minLoadingTime = new Promise(resolve => setTimeout(resolve, 800));

        const products = await productsService.getProducts({ featured: true, limit: 4 });

        const transformedProducts: HomeProduct[] = products.map(product => ({
          id: product.id,
          name: product.name,
          slug: product.slug,
          price: product.basePrice,
          basePrice: product.basePrice,
          compareAtPrice: null,
          imageUrl: product.images?.[0] || null,
          isFeatured: product.isFeatured,
        }));

        setFeaturedProducts(transformedProducts);
        await minLoadingTime;
      } catch (error) {
        console.error('Error fetching featured products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  if (loading) {
    return <HomePageSkeleton />;
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-gradient-hero overflow-hidden">
        <div className="container-store py-16 md:py-24 lg:py-32">
          <div className="max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                New Collection Available
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
                Premium Products for <span className="text-gradient">Modern Living</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Discover our curated collection of high-quality products designed to elevate your everyday experience.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/products">
                  <Button size="lg" className="bg-gradient-accent hover:opacity-90 h-12 px-8">
                    Shop Now <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/products?featured=true">
                  <Button size="lg" variant="outline" className="h-12 px-8">
                    View Featured
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1/2 h-full opacity-5 pointer-events-none">
          <div className="w-full h-full bg-accent rounded-full blur-3xl transform translate-x-1/2" />
        </div>
      </section>

      {/* Features Section */}
      <section className="border-y border-border bg-card">
        <div className="container-store py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex items-center gap-4 p-4"
            >
              <div className="w-12 h-12 bg-accent/10 text-accent rounded-xl flex items-center justify-center shrink-0">
                <feature.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-16 md:py-24">
        <div className="container-store">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="section-heading">Featured Products</h2>
              <p className="text-muted-foreground mt-2">Handpicked favorites just for you</p>
            </div>
            <Link to="/products">
              <Button variant="ghost" className="hidden md:flex">
                View All <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    slug={product.slug}
                    price={product.basePrice || product.price}
                    compareAtPrice={product.compareAtPrice}
                    imageUrl={product.imageUrl}
                    isFeatured={product.isFeatured}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/50 rounded-xl">
              <p className="text-muted-foreground">No featured products yet.</p>
              <Link to="/products" className="text-accent hover:underline mt-2 inline-block">
                Browse all products
              </Link>
            </div>
          )}

          <div className="mt-8 text-center md:hidden">
            <Link to="/products">
              <Button variant="outline">
                View All Products <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-dark py-16 md:py-24">
        <div className="container-store text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to elevate your lifestyle?
            </h2>
            <p className="text-white/70 mb-8 max-w-md mx-auto">
              Join thousands of satisfied customers who trust our premium products.
            </p>
            <Link to="/auth">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-white h-12 px-8">
                Get Started <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;