import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44, apiErrorMessage } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { useLanguage } from '@/lib/LanguageContext';

/** Wishlist of the current user. Guests get an empty list and are sent to login on toggle. */
export function useWishlist() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const queryKey = ['wishlist', user?.id];

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => base44.entities.Wishlist.list(),
    enabled: isAuthenticated,
  });

  const wishlistedIds = new Set(wishlistItems.map(w => w.product_id));

  const toggleWishlist = async (productId) => {
    if (!isAuthenticated) {
      toast({ title: t('login_to_save') });
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    const existing = wishlistItems.find(w => w.product_id === productId);
    try {
      if (existing) {
        await base44.entities.Wishlist.delete(existing.id);
      } else {
        await base44.entities.Wishlist.create({ product_id: productId });
      }
    } catch (error) {
      toast({ title: t('wishlist_failed'), description: apiErrorMessage(error), variant: 'destructive' });
    } finally {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
  };

  return { wishlistItems, wishlistedIds, toggleWishlist, isLoading: isAuthenticated && isLoading };
}
