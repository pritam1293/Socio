import React, { createContext, useContext, useState, useCallback } from 'react';
import { DashboardData } from '../types';
import * as postService from '../services/posts';

interface DashboardContextType {
  data: DashboardData | null;
  isLoading: boolean;
  error: string | null;
  loadDashboard: () => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType>({
  data: null,
  isLoading: false,
  error: null,
  loadDashboard: async () => {},
});

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await postService.getDashboard();
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <DashboardContext.Provider value={{ data, isLoading, error, loadDashboard }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}
