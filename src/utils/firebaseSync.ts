import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { Partnership } from '../types/partnership';
import { CLIENT_SESSION_ID } from './publishUtils';

/**
 * Firebase config values are safe to embed client-side — Firebase security
 * relies on Realtime Database rules, not on keeping this object secret.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyCJm6nHmZ2ZxpQ8pHSwBnzbBwix88NO4P0',
  authDomain: 'isv-partnership.firebaseapp.com',
  databaseURL: 'https://isv-partnership-default-rtdb.firebaseio.com',
  projectId: 'isv-partnership',
  storageBucket: 'isv-partnership.firebasestorage.app',
  messagingSenderId: '595112814867',
  appId: '1:595112814867:web:fb2d8061bce314a4af52e6',
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const partnershipsRef = ref(db, 'partnerships');

interface PartnershipsPayload {
  data: Partnership[];
  senderId: string;
  updatedAt: string;
}

/**
 * Subscribes to live updates. Fires immediately with the current value on
 * subscribe, then again on every change from any client. Calls onEmpty
 * instead if the database has no data yet (brand new deployment), so the
 * caller can decide whether to seed it.
 */
export function subscribeToPartnerships(
  onUpdate: (partnerships: Partnership[], senderId: string) => void,
  onEmpty?: () => void
): () => void {
  const unsubscribe = onValue(partnershipsRef, (snapshot) => {
    const value = snapshot.val() as PartnershipsPayload | null;
    if (value && Array.isArray(value.data)) {
      onUpdate(value.data, value.senderId);
    } else if (onEmpty) {
      onEmpty();
    }
  });
  return unsubscribe;
}

export function writePartnerships(partnerships: Partnership[]): Promise<void> {
  const payload: PartnershipsPayload = {
    data: partnerships,
    senderId: CLIENT_SESSION_ID,
    updatedAt: new Date().toISOString(),
  };
  return set(partnershipsRef, payload);
}
