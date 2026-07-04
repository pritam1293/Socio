import { apiGet, apiDelete } from './api';
import { SocialAccount } from '../types';

export async function getConnectUrl(platform: string): Promise<string> {
  const data = await apiGet(`/social/connect?platform=${platform}`);
  return (data as { auth_url: string }).auth_url;
}

export async function getConnectedAccounts(): Promise<SocialAccount[]> {
  const data = await apiGet('/social/accounts');
  return (data as { accounts: SocialAccount[] }).accounts;
}

export async function disconnectAccount(id: string): Promise<void> {
  return apiDelete(`/social/accounts/${id}`);
}
