import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { getAdminNpub } from '@/lib/adminUtils';

interface AdminBadgeProps {
  className?: string;
  showNpub?: boolean;
}

export function AdminBadge({ className = '', showNpub = false }: AdminBadgeProps) {
  const isAdmin = useIsAdmin();

  if (!isAdmin) {
    return null;
  }

  return (
    <Badge
      className={`bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 ${className}`}
      title={showNpub ? `Admin: ${getAdminNpub()}` : 'Administrator'}
    >
      <Shield className="w-3 h-3 mr-1" />
      Admin
      {showNpub && (
        <span className="ml-1 text-xs opacity-75">
          ({getAdminNpub().slice(0, 12)}...)
        </span>
      )}
    </Badge>
  );
}

