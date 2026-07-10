import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Apps now open in a new window directly from the /cloud page (decrypt → blob URL → window.open).
 * This route is kept only as a fallback — redirect straight to /cloud.
 */
export default function CloudAppViewer() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/cloud', { replace: true });
  }, [navigate]);
  return null;
}
