import LZString from 'lz-string';
import { Partnership } from '../types/partnership';

const PUBLISHED_STORAGE_KEY = 'strategic_partnerships_published_v1';

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
 * The plain, permanent link to this app. Since the register syncs live via
 * Firebase, this bare URL always reflects the current data — no payload
 * needs to be encoded into it.
 */
export const getLiveShareUrl = (): string => {
  return `${window.location.origin}${window.location.pathname}`;
};

export const CLIENT_SESSION_ID = Math.random().toString(36).substring(2, 9);

/**
 * Reads a one-time snapshot from a legacy #published=... link, if present.
 * Used only to seed the live Firebase register when someone opens an old
 * style share link; ongoing sync happens via Firebase, not this URL payload.
 */
export const loadInitialPublishedState = (): { data: Partnership[] | null; isFromUrl: boolean } => {
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
