import LZString from 'lz-string';
import { Partnership } from '../types/partnership';

const PUBLISHED_STORAGE_KEY = 'strategic_partnerships_published_v1';
const BROADCAST_CHANNEL_NAME = 'strategic_partnerships_live_sync';

/**
 * Encodes partnerships array into a compressed URL-safe string
 */
export const encodePartnershipsToUrl = (partnerships: Partnership[]): string => {
  try {
    const jsonString = JSON.stringify(partnerships);
    return LZString.compressToEncodedURIComponent(jsonString);
  } catch (err) {
    console.error('Failed to encode partnerships for URL:', err);
    return '';
  }
};

/**
 * Decodes compressed URL string back into Partnerships array
 */
export const decodePartnershipsFromUrl = (compressed: string): Partnership[] | null => {
  if (!compressed) return null;
  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (!decompressed) return null;
    const parsed = JSON.parse(decompressed);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
      return parsed as Partnership[];
    }
  } catch (err) {
    console.error('Failed to decode partnerships from URL:', err);
  }
  return null;
};

/**
 * Generates the full shareable URL containing the published register snapshot
 */
export const getShareablePublishUrl = (partnerships: Partnership[]): string => {
  const compressed = encodePartnershipsToUrl(partnerships);
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  return `${baseUrl}#published=${compressed}`;
};

export const CLIENT_SESSION_ID = Math.random().toString(36).substring(2, 9);

/**
 * Saves published state to LocalStorage and returns the published link
 */
export const publishPartnerships = (partnerships: Partnership[]): { shareUrl: string; timestamp: string } => {
  const timestamp = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    month: 'short',
    day: 'numeric',
  });

  const payload = {
    timestamp,
    partnerships,
  };

  try {
    localStorage.setItem(PUBLISHED_STORAGE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.error('Error saving published state to localStorage:', e);
  }

  // Update current window URL hash silently without forcing a hard reload
  const shareUrl = getShareablePublishUrl(partnerships);
  window.history.replaceState(null, '', shareUrl);

  // Broadcast to other open tabs in real-time
  try {
    if ('BroadcastChannel' in window) {
      const channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channel.postMessage({ type: 'PUBLISHED_UPDATE', senderId: CLIENT_SESSION_ID, partnerships, timestamp });
      channel.close();
    }
  } catch (e) {
    console.warn('BroadcastChannel not supported or failed:', e);
  }

  return { shareUrl, timestamp };
};

/**
 * Reads published state from URL or LocalStorage
 */
export const loadInitialPublishedState = (): { data: Partnership[] | null; isFromUrl: boolean } => {
  // 1. Check URL hash (#published=...) or search params (?published=...)
  const hash = window.location.hash;
  if (hash.includes('published=')) {
    const compressed = hash.split('published=')[1];
    const decoded = decodePartnershipsFromUrl(compressed);
    if (decoded) {
      return { data: decoded, isFromUrl: true };
    }
  }

  const params = new URLSearchParams(window.location.search);
  const paramVal = params.get('published');
  if (paramVal) {
    const decoded = decodePartnershipsFromUrl(paramVal);
    if (decoded) {
      return { data: decoded, isFromUrl: true };
    }
  }

  // 2. Check local storage published key
  try {
    const saved = localStorage.getItem(PUBLISHED_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.partnerships)) {
        return { data: parsed.partnerships, isFromUrl: false };
      }
    }
  } catch (e) {
    console.error('Failed to load published state:', e);
  }

  return { data: null, isFromUrl: false };
};
