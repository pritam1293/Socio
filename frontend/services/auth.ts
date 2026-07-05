import { apiPost, apiGet, saveTokens, clearTokens, getAccessToken, tryRefreshToken } from './api';
import { AuthResponse } from '../types';

export async function requestLogin(email: string) {
  return apiPost('/auth/request-login', { email }, false);
}

export async function register(email: string, fullName: string) {
  return apiPost('/auth/register', { email, full_name: fullName }, false);
}

export async function verifyAndLogin(token: string): Promise<AuthResponse> {
  const data = await apiGet(`/auth/verify?token=${token}`, false);
  const res = data as AuthResponse;
  if (res.access_token) {
    await saveTokens(res.access_token, res.refresh_token);
  }
  return res;
}

export async function resendVerification(email: string) {
  return apiPost('/auth/resend-verification', { email }, false);
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
