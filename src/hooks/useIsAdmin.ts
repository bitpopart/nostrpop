import { useCurrentUser } from '@/hooks/useCurrentUser';
import { isAdminUser } from '@/lib/adminUtils';

/**
 * Hook to check if current user is admin
 */
export function useIsAdmin() {
  const { user } = useCurrentUser();
  return isAdminUser(user?.pubkey);
}