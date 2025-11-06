import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface Product {
  id: number;
  name: string;
  brand: string;
  thumbnail_url: string | null;
  purchase_url: string | null;
  sim_score: number;
}

const BrandProducts = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const creatorId = searchParams.get('creator_id');
  const brandName = searchParams.get('brand_name');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!creatorId || !brandName) {
        setError('Missing creator ID or brand name');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // First get the creator's internal ID
        const { data: creatorData, error: creatorError } = await supabase
          .from('creators')
          .select('creator_id')
          .eq('uuid', creatorId)
          .single();

        if (creatorError) throw creatorError;
        if (!creatorData) throw new Error('Creator not found');

        // Fetch products for this creator x brand
        const { data, error: productsError } = await supabase
          .from('creator_x_product_recommendations')
          .select('id, name, brand, thumbnail_url, purchase_url, sim_score')
          .eq('creator_id', creatorData.creator_id)
          .eq('brand', brandName)
          .order('sim_score', { ascending: false })
          .limit(50);

        if (productsError) throw productsError;

        setProducts(data || []);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [creatorId, brandName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Skeleton className="h-10 w-64 mb-8" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="w-full aspect-square mb-4 rounded" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader />
        <main className="max-w-7xl mx-auto px-6 py-8">
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate(`/insights?creator_id=${creatorId}`)}>
              Go Back
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Back Button & Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(`/insights?creator_id=${creatorId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Insights
          </Button>
          <h1 className="text-3xl font-bold text-foreground">
            {brandName} - Recommended Products
          </h1>
          <p className="text-muted-foreground mt-2">
            {products.length} products curated for you
          </p>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2">No Products Found</h2>
            <p className="text-muted-foreground">
              We couldn't find any product recommendations for this brand yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="p-4 flex flex-col hover:shadow-lg transition-shadow">
                {/* Product Image */}
                <div className="w-full aspect-square mb-4 bg-muted rounded overflow-hidden">
                  {product.thumbnail_url ? (
                    <img
                      src={product.thumbnail_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                </div>

                {/* Product Name */}
                <h3 className="font-semibold text-foreground mb-2 line-clamp-2 flex-1">
                  {product.name}
                </h3>

                {/* Similarity Score (optional, can be removed) */}
                <p className="text-xs text-muted-foreground mb-3">
                  Match Score: {(product.sim_score * 100).toFixed(0)}%
                </p>

                {/* Purchase CTA */}
                {product.purchase_url ? (
                  <Button
                    onClick={() => window.open(product.purchase_url!, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Product
                  </Button>
                ) : (
                  <Button disabled className="w-full">
                    Link Unavailable
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BrandProducts;
