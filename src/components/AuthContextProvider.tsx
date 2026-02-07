'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user || null);
        setLoading(false);

        const protectedRoutes = ['/']; // Rotas que exigem autenticação
        const publicRoutes = ['/login']; // Rotas que não exigem autenticação (e para onde logados não devem ir)

        if (!session?.user && protectedRoutes.includes(pathname)) {
          router.push('/login');
        } else if (session?.user && publicRoutes.includes(pathname)) {
          router.push('/');
        }
      }
    );

    // Initial check for session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);

      const protectedRoutes = ['/'];
      const publicRoutes = ['/login'];

      if (!session?.user && protectedRoutes.includes(pathname)) {
        router.push('/login');
      } else if (session?.user && publicRoutes.includes(pathname)) {
        router.push('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [pathname, router]);

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ ERROR: signOut failed:', error);
      } else {
        setUser(null);
        router.push('/login');
      }
    } catch (error) {
      console.error('❌ ERROR: signOut exception:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-950">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-gray-600 dark:text-gray-400">Carregando autenticação...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthContextProvider');
  }
  return context;
}
