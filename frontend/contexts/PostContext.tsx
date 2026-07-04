import React, { createContext, useContext, useState, useCallback } from 'react';
import { Post, CreatePostPayload } from '../types';
import * as postService from '../services/posts';

interface PostContextType {
  posts: Post[];
  isLoading: boolean;
  error: string | null;
  loadPosts: (status?: string) => Promise<void>;
  createPost: (payload: CreatePostPayload) => Promise<Post | null>;
  publishNow: (id: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
}

const PostContext = createContext<PostContextType>({
  posts: [],
  isLoading: false,
  error: null,
  loadPosts: async () => {},
  createPost: async () => null,
  publishNow: async () => {},
  deletePost: async () => {},
});

export function PostProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPosts = useCallback(async (status?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await postService.getPosts({ status });
      setPosts(data.posts);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createPost = useCallback(async (payload: CreatePostPayload): Promise<Post | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const post = await postService.createPost(payload);
      setPosts((prev) => [post, ...prev]);
      return post;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const publishNow = useCallback(async (id: string) => {
    try {
      const updated = await postService.publishNow(id);
      setPosts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  const deletePost = useCallback(async (id: string) => {
    try {
      await postService.deletePost(id);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  return (
    <PostContext.Provider value={{ posts, isLoading, error, loadPosts, createPost, publishNow, deletePost }}>
      {children}
    </PostContext.Provider>
  );
}

export function usePosts() {
  return useContext(PostContext);
}
