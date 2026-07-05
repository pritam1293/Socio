import { Platform } from 'react-native';

let SecureStore: any;
try {
  SecureStore = require('expo-secure-store');
} catch {}

const isWeb = Platform.OS === 'web';

export async function getItem(key: string): Promise<string | null> {
  if (isWeb || !SecureStore?.getItemAsync) {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb || !SecureStore?.setItemAsync) {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

export async function deleteItem(key: string): Promise<void> {
  if (isWeb || !SecureStore?.deleteItemAsync) {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

const USER_KEY = 'user_data';

export async function saveUser(user: object): Promise<void> {
  return setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser(): Promise<object | null> {
  const raw = await getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export async function clearUser(): Promise<void> {
  return deleteItem(USER_KEY);
}
