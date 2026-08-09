import { type NLoginType, NUser, useNostrLogin } from '@nostrify/react/login';
import { useNostr } from '@nostrify/react';
import { useCallback, useMemo } from 'react';

import { useAuthor } from './useAuthor.ts';

export function useCurrentUser() {
  const { nostr } = useNostr();
  const { logins } = useNostrLogin();

  const loginToUser = useCallback((login: NLoginType): NUser  => {
    switch (login.type) {
      case 'nsec': // Nostr login with secret key
        return NUser.fromNsecLogin(login);
      case 'bunker': // Nostr login with NIP-46 "bunker://" URI
        return NUser.fromBunkerLogin(login, nostr);
      case 'extension': // Nostr login with NIP-07 browser extension
        return NUser.fromExtensionLogin(login);
      // Other login types can be defined here
      default:
        throw new Error(`Unsupported login type: ${login.type}`);
    }
  }, [nostr]);

  // A NIP-07 "extension" login can only sign when a browser extension has
  // injected `window.nostr`. Detect whether that is the case in this browser.
  const extensionAvailable = typeof window !== 'undefined' && 'nostr' in window;

  const users = useMemo(() => {
    const users: NUser[] = [];

    for (const login of logins) {
      try {
        const user = loginToUser(login);
        users.push(user);
      } catch (error) {
        console.warn('Skipped invalid login', login.id, error);
      }
    }

    return users;
  }, [logins, loginToUser]);

  // Pick the current user. Normally this is the first login, but if that login
  // relies on a browser extension that is not present, prefer a login method
  // that can actually sign (nsec / bunker). This keeps uploads and publishing
  // working instead of failing with "extension not available".
  const user = useMemo(() => {
    if (users.length === 0) return undefined as NUser | undefined;
    if (extensionAvailable) return users[0];
    return users.find((u) => u.method !== 'extension') ?? users[0];
  }, [users, extensionAvailable]);

  const author = useAuthor(user?.pubkey);

  return {
    user,
    users,
    ...author.data,
  };
}
