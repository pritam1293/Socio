export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface PostPlatform {
  id: string;
  post_id: string;
  platform: 'twitter' | 'reddit' | 'threads';
  status: 'pending' | 'published' | 'failed';
  platform_post_id: string | null;
  published_at: string | null;
  error_message: string | null;
}

export interface MediaFile {
  id: string;
  post_id: string;
  file_url: string;
  file_type: 'image' | 'video';
  file_name: string | null;
  file_size: number | null;
}

export interface Post {
  id: string;
  user_id: string;
  caption: string | null;
  hashtags: string[];
  status: 'draft' | 'scheduled' | 'published' | 'failed' | 'partial';
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  platforms: PostPlatform[];
  media_files: MediaFile[];
}

export interface SocialAccount {
  id: string;
  platform: string;
  platform_username: string | null;
  is_active: boolean;
  created_at: string;
}

export interface DashboardOverview {
  drafts: number;
  scheduled: number;
  published: number;
  failed: number;
}

export interface DashboardData {
  overview: DashboardOverview;
  upcoming: Post[];
  published: Post[];
  failed: Post[];
  drafts: Post[];
}

export interface CreatePostPayload {
  caption?: string;
  hashtags?: string[];
  platforms: string[];
  scheduled_at?: string;
  media_ids?: string[];
}
