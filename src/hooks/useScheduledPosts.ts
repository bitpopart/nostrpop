import { useState, useEffect, useCallback } from 'react';
import type { NostrEvent } from '@nostrify/nostrify';

export type MediaCategory = 'wallpaper' | 'gif' | 'avatar' | 'banner' | 'animation' | 'free' | 'custom';

export interface ScheduledMedia {
  url: string;
  title: string;
  category: MediaCategory;
}

export interface ScheduledPost {
  id: string;
  caption: string;
  media: ScheduledMedia[];
  scheduledAt: string; // ISO string
  status: 'scheduled' | 'published' | 'failed' | 'draft';
  publishedEventId?: string;
  hashtags: string[];
  createdAt: string;
  updatedAt: string;
  /** Pre-signed Nostr event, ready to broadcast at scheduledAt time */
  signedEvent?: NostrEvent;
}

const STORAGE_KEY = 'poppost_scheduled_posts';

function loadFromStorage(): ScheduledPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ScheduledPost[];
  } catch {
    return [];
  }
}

function saveToStorage(posts: ScheduledPost[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  } catch {
    // ignore storage errors
  }
}

export function useScheduledPosts() {
  const [posts, setPosts] = useState<ScheduledPost[]>(() => loadFromStorage());

  // Persist to localStorage whenever posts change
  useEffect(() => {
    saveToStorage(posts);
  }, [posts]);

  const createPost = useCallback((
    draft: Omit<ScheduledPost, 'id' | 'createdAt' | 'updatedAt'>
  ): ScheduledPost => {
    const now = new Date().toISOString();
    const post: ScheduledPost = {
      ...draft,
      id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    setPosts(prev => [...prev, post]);
    return post;
  }, []);

  const updatePost = useCallback((id: string, updates: Partial<ScheduledPost>): void => {
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );
  }, []);

  const deletePost = useCallback((id: string): void => {
    setPosts(prev => prev.filter(p => p.id !== id));
  }, []);

  const markPublished = useCallback((id: string, eventId: string): void => {
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: 'published', publishedEventId: eventId, updatedAt: new Date().toISOString() }
          : p
      )
    );
  }, []);

  const markFailed = useCallback((id: string): void => {
    setPosts(prev =>
      prev.map(p =>
        p.id === id
          ? { ...p, status: 'failed', updatedAt: new Date().toISOString() }
          : p
      )
    );
  }, []);

  // Derived: posts sorted by scheduledAt
  const sortedPosts = [...posts].sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );

  const upcomingPosts = sortedPosts.filter(
    p => p.status === 'scheduled' && new Date(p.scheduledAt) > new Date()
  );

  const pastPosts = sortedPosts.filter(
    p => p.status === 'published' || p.status === 'failed' ||
    (p.status === 'scheduled' && new Date(p.scheduledAt) <= new Date())
  );

  const draftPosts = sortedPosts.filter(p => p.status === 'draft');

  return {
    posts: sortedPosts,
    upcomingPosts,
    pastPosts,
    draftPosts,
    createPost,
    updatePost,
    deletePost,
    markPublished,
    markFailed,
  };
}
