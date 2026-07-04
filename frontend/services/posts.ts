import { apiGet, apiPost, apiPut, apiDelete } from './api';
import { Post, DashboardData, CreatePostPayload } from '../types';

export async function createPost(payload: CreatePostPayload): Promise<Post> {
  return apiPost('/posts', payload) as Promise<Post>;
}

export async function getPosts(params?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ posts: Post[]; total: number }> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.offset) query.set('offset', String(params.offset));
  const qs = query.toString();
  return apiGet(`/posts${qs ? `?${qs}` : ''}`);
}

export async function getPost(id: string): Promise<Post> {
  return apiGet(`/posts/${id}`) as Promise<Post>;
}

export async function updatePost(id: string, payload: Partial<CreatePostPayload>): Promise<Post> {
  return apiPut(`/posts/${id}`, payload) as Promise<Post>;
}

export async function deletePost(id: string): Promise<void> {
  return apiDelete(`/posts/${id}`);
}

export async function publishNow(id: string): Promise<Post> {
  return apiPost(`/posts/${id}/publish`) as Promise<Post>;
}

export async function getDashboard(): Promise<DashboardData> {
  return apiGet('/posts/dashboard') as Promise<DashboardData>;
}
