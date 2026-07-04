import { apiPost, apiGet, saveTokens, clearTokens, getAccessToken, tryRefreshToken } from './api';
import { AuthResponse } from '../types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await apiPost('/auth/login', { email, password }, false);
  const res = data as AuthResponse;
  await saveTokens(res.access_token, res.refresh_token);
  return res;
}

export async function register(email: string, password: string, fullName: string) {
  return apiPost('/auth/register', { email, password, full_name: fullName }, false);
}

export async function verifyEmail(token: string) {
  return apiGet(`/auth/verify?token=${token}`, false);
}

export async function logout() {
  try {
    await apiPost('/auth/logout');
  } catch {}
  await clearTokens();
}

export async function checkAuth(): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;
  try {
    return await tryRefreshToken();
  } catch {
    return false;
  }
}
