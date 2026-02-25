import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, MoreHorizontal, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import productsService, { Product, CreateProductData } from '@/services/products';
import categoriesService, { Category } from '@/services/categories';

interface ProductFormData {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  brand: string;
  fragranceNotes: string;
  categoryId: string;
  basePrice: string;
  images: string[];
  isFeatured: boolean;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
  stock: string;
}

const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState('');
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    brand: '',
    fragranceNotes: '',
    categoryId: 'none',
    basePrice: '',
    images: [],
    isFeatured: false,
    isActive: true,
    metaTitle: '',
    metaDescription: '',
    stock: ''
  });

  useEffect(() => {
    Promise.all([fetchProducts(), fetchCategories()])
      .catch(error => {
        console.error('Error initializing data:', error);
        toast.error('Failed to load initial data');
      });
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await productsService.getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await categoriesService.getCategories();
      setCategories(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
      setCategories([]);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleAddImage = () => {
    if (currentImageUrl && !formData.images.includes(currentImageUrl)) {
      setFormData({
        ...formData,
        images: [...formData.images, currentImageUrl]
      });
      setCurrentImageUrl('');
    }
  };

  const handleRemoveImage = (imageToRemove: string) => {
    setFormData({
      ...formData,
      images: formData.images.filter(img => img !== imageToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Parse fragrance notes if it's valid JSON, otherwise store as string
      let parsedFragranceNotes = null;
      if (formData.fragranceNotes) {
        try {
          parsedFragranceNotes = JSON.parse(formData.fragranceNotes);
        } catch {
          parsedFragranceNotes = formData.fragranceNotes;
        }
      }

      const productData: CreateProductData = {
        name: formData.name,
        slug: formData.slug || generateSlug(formData.name),
        description: formData.description,
        shortDescription: formData.shortDescription || null,
        brand: formData.brand || null,
        fragranceNotes: parsedFragranceNotes,
        categoryId: formData.categoryId === 'none' ? null : parseInt(formData.categoryId),
        basePrice: parseFloat(formData.basePrice),
        images: formData.images,
        isFeatured: formData.isFeatured,
        isActive: formData.isActive,
        metaTitle: formData.metaTitle || null,
        metaDescription: formData.metaDescription || null,
        stock: String(formData.stock)
      };

      if (editingProduct) {
        await productsService.updateProduct(editingProduct.id.toString(), productData);
        toast.success('Product updated successfully');
      } else {
        await productsService.createProduct(productData);
        toast.success('Product created successfully');
      }

      setDialogOpen(false);
      resetForm();
      await fetchProducts();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to save product');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      brand: product.brand || '',
      fragranceNotes: product.fragranceNotes ? JSON.stringify(product.fragranceNotes, null, 2) : '',
      categoryId: product.categoryId?.toString() || 'none',
      basePrice: product.basePrice.toString(),
      images: product.images || [],
      isFeatured: product.isFeatured || false,
      isActive: product.isActive ?? true,
      metaTitle: product.metaTitle || '',
      metaDescription: product.metaDescription || '',
      stock: String(product.stock) || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productsService.deleteProduct(id);
      toast.success('Product deleted successfully');
      await fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      shortDescription: '',
      brand: '',
      fragranceNotes: '',
      categoryId: 'none',
      basePrice: '',
      images: [],
      isFeatured: false,
      isActive: true,
      metaTitle: '',
      metaDescription: '',
      stock: '',
    });
    setCurrentImageUrl('');
  };

  const filteredProducts = Array.isArray(products) 
    ? products.filter((p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Helper function to get category name
  const getCategoryName = (product: Product): string => {
    // First try to use the nested category object if available
    if (product.category?.name) {
      return product.category.name;
    }
    
    // Otherwise, look up in the categories list
    if (product.categoryId) {
      const category = categories.find(c => Number(c.id) === Number(product.categoryId));
      return category?.name || '-';
    }
    
    return '-';
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Products</h1>
          <p className="text-muted-foreground">{products.length} total products</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-accent">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? 'Update the product details below. Click update when you\'re done.' 
                  : 'Fill in the product information below. Click create when you\'re done.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="images">Images</TabsTrigger>
                  <TabsTrigger value="seo">SEO</TabsTrigger>
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="auto-generated-from-name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="shortDescription">Short Description</Label>
                    <Textarea
                      id="shortDescription"
                      value={formData.shortDescription}
                      onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                      rows={2}
                      placeholder="Brief description for product listings"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Full Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={5}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="stock">Stock *</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) =>
                          setFormData({ ...formData, stock: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="basePrice">Base Price *</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.basePrice}
                        onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={formData.categoryId}
                        onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {!categoriesLoading && categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id.toString()}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details" className="space-y-4">
                  <div>
                    <Label htmlFor="brand">Brand</Label>
                    <Input
                      id="brand"
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g., Chanel, Dior, etc."
                    />
                  </div>

                  <div>
                    <Label htmlFor="fragranceNotes">Fragrance Notes (JSON)</Label>
                    <Textarea
                      id="fragranceNotes"
                      value={formData.fragranceNotes}
                      onChange={(e) => setFormData({ ...formData, fragranceNotes: e.target.value })}
                      rows={4}
                      placeholder='{"top": ["Bergamot", "Lemon"], "heart": ["Rose", "Jasmine"], "base": ["Vanilla", "Musk"]}'
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter as JSON object with top, heart, and base notes
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="isFeatured"
                        checked={formData.isFeatured}
                        onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                      />
                      <Label htmlFor="isFeatured">Featured Product</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                      />
                      <Label htmlFor="isActive">Active</Label>
                    </div>
                  </div>
                </TabsContent>

                {/* Images Tab */}
                <TabsContent value="images" className="space-y-4">
                  <div className="space-y-4">
                    <Label>Product Images</Label>
                    
                    {/* Image preview grid */}
                    {formData.images.length > 0 && (
                      <div className="grid grid-cols-4 gap-4 mb-4">
                        {formData.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Product ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveImage(image)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add new image */}
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter image URL"
                        value={currentImageUrl}
                        onChange={(e) => setCurrentImageUrl(e.target.value)}
                      />
                      <Button type="button" onClick={handleAddImage} variant="outline">
                        Add Image
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* SEO Tab */}
                <TabsContent value="seo" className="space-y-4">
                  <div>
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={formData.metaTitle}
                      onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                      placeholder="SEO title (defaults to product name)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <Textarea
                      id="metaDescription"
                      value={formData.metaDescription}
                      onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                      rows={3}
                      placeholder="SEO description"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex gap-3 pt-4 border-t">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 bg-gradient-accent">
                  {editingProduct ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-md mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto" />
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{product.brand || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">{product.basePrice?.toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {getCategoryName(product)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {product.isActive ? (
                          <Badge variant="success" className="bg-success/20 text-success hover:bg-success/30">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Draft
                          </Badge>
                        )}
                        {product.isFeatured && (
                          <Badge variant="accent" className="bg-accent/20 text-accent hover:bg-accent/30">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No products found
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProducts;