import { useState, useCallback, useEffect } from 'react';
import {
  loadCloudUsers,
  loadCloudSession,
  saveCloudSession,
  clearCloudSession,
  type CloudSession,
} from '@/lib/cloudTypes';

/**
 * Manages Cloud private space authentication.
 *
 * - Reads the persisted session from localStorage on mount.
 * - Provides login / logout helpers.
 * - A session expires after 8 hours of inactivity (enforced in cloudTypes.ts).
 */
export function useCloudAuth() {
  const [session, setSession] = useState<CloudSession | null>(() => loadCloudSession());

  // Re-read session on focus (in case another tab logged out)
  useEffect(() => {
    const onFocus = () => setSession(loadCloudSession());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const login = useCallback((username: string, password: string): boolean => {
    const users = loadCloudUsers();

    // Special case: admin is always allowed with hard-coded credentials
    // The admin user uses the Nostr pubkey approach — but we also store
    // a synthetic "admin" user in the cloud users list with whatever
    // password they set. If no admin user exists yet, reject.
    const match = users.find(
      (u) =>
        u.id.toLowerCase() === username.toLowerCase() &&
        u.password === password,
    );

    if (!match) return false;

    const newSession = saveCloudSession(match.id, match.name);
    setSession(newSession);
    return true;
  }, []);

  const logout = useCallback(() => {
    clearCloudSession();
    setSession(null);
  }, []);

  return {
    session,
    isLoggedIn: session !== null,
    login,
    logout,
  };
}
