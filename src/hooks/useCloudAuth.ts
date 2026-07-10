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
 * - Normal users: login with username + password stored in localStorage.
 * - Admin (Nostr-logged-in): bypass via adminAutoLogin() — gets automatic
 *   access without needing a Cloud password.
 * - Sessions expire after 8 hours (enforced in cloudTypes.ts).
 */
export function useCloudAuth() {
  const [session, setSession] = useState<CloudSession | null>(() => loadCloudSession());

  // Re-read session when the tab regains focus (e.g. another tab logged out)
  useEffect(() => {
    const onFocus = () => setSession(loadCloudSession());
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  /** Standard username + password login for shared users. */
  const login = useCallback((username: string, password: string): boolean => {
    const users = loadCloudUsers();
    const match = users.find(
      u => u.id.toLowerCase() === username.toLowerCase() && u.password === password,
    );
    if (!match) return false;
    const newSession = saveCloudSession(match.id, match.name);
    setSession(newSession);
    return true;
  }, []);

  /**
   * Auto-login for the site admin (Nostr-authenticated).
   * Grants instant Cloud access without requiring a separate Cloud password.
   */
  const adminAutoLogin = useCallback(() => {
    const newSession = saveCloudSession('__admin__', 'Admin');
    setSession(newSession);
  }, []);

  const logout = useCallback(() => {
    clearCloudSession();
    setSession(null);
  }, []);

  return {
    session,
    isLoggedIn: session !== null,
    login,
    adminAutoLogin,
    logout,
  };
}
