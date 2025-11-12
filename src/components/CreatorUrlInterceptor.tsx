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
      
      // Remove creator_id from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('creator_id');
      
      const newSearch = newSearchParams.toString();
      const cleanUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;
      
      // Replace the URL without adding to history
      navigate(cleanUrl, { replace: true });
    }
  }, [searchParams, location.pathname, navigate, setCreatorUuid, isReady]);

  return null;
};

export default CreatorUrlInterceptor;
