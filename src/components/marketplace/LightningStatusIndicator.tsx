import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Zap, AlertTriangle, CheckCircle } from 'lucide-react';

const LNURL_ENDPOINT = 'https://walletofsatoshi.com/.well-known/lnurlp/bitpopart';

export function LightningStatusIndicator() {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    const checkLightningStatus = async () => {
      try {
        const response = await fetch(LNURL_ENDPOINT);
        if (response.ok) {
          const data = await response.json();
          if (data.tag === 'payRequest') {
            setStatus('online');
          } else {
            setStatus('offline');
          }
        } else {
          setStatus('offline');
        }
      } catch {
        setStatus('offline');
      }
    };

    checkLightningStatus();
  }, []);

  if (status === 'checking') {
    return (
      <Badge variant="outline" className="text-xs">
        <Zap className="w-3 h-3 mr-1 animate-pulse" />
        Checking Lightning...
      </Badge>
    );
  }

  if (status === 'online') {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
        <CheckCircle className="w-3 h-3 mr-1" />
        Lightning Online
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="text-xs">
      <AlertTriangle className="w-3 h-3 mr-1" />
      Lightning Offline
    </Badge>
  );
}