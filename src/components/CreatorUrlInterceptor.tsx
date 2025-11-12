import { useEffect } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { useCreatorContext } from '@/contexts/CreatorContext';

const CreatorUrlInterceptor = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setCreatorUuid, isReady } = useCreatorContext();

  useEffect(() => {
    if (!isReady) return;

    const creatorIdFromUrl = searchParams.get('creator_id');
    
    if (creatorIdFromUrl) {
      // Save to context + localStorage
      setCreatorUuid(creatorIdFromUrl);
      
      // Direct redirect to /insights/brands (eliminates double redirect)
      // Old flow: URL → /insights → /insights/brands
      // New flow: URL → /insights/brands directly
      if (location.pathname === '/insights' || location.pathname === '/') {
        navigate('/insights/brands', { replace: true });
      } else {
        // For other paths, just clean the URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('creator_id');
        
        const newSearch = newSearchParams.toString();
        const cleanUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
        
        navigate(cleanUrl, { replace: true });
      }
    }
  }, [searchParams, location.pathname, navigate, setCreatorUuid, isReady]);

  return null;
};

export default CreatorUrlInterceptor;
