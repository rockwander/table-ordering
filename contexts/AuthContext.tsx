'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session expiration: 14 days in seconds
const SESSION_EXPIRY_DAYS = 14;
const SESSION_EXPIRY_SECONDS = SESSION_EXPIRY_DAYS * 24 * 60 * 60;

// Helper function to deactivate FCM token on logout
async function deactivateFCMToken() {
  const fcmToken = localStorage.getItem('fcm_token');
  if (!fcmToken) return;

  try {
    await supabase
      .from('fcm_tokens')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('token', fcmToken);
    console.log('🔕 FCM token deactivated - notifications stopped');
  } catch (error) {
    console.error('Error deactivating FCM token:', error);
  }
}

// Helper function to reactivate FCM token on login
async function reactivateFCMToken() {
  const fcmToken = localStorage.getItem('fcm_token');
  if (!fcmToken) {
    console.log('No FCM token to reactivate');
    return;
  }

  try {
    // Get current session to associate with user
    const { data: { session } } = await supabase.auth.getSession();

    await supabase
      .from('fcm_tokens')
      .update({
        active: true,
        user_id: session?.user?.id || null,
        last_used_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('token', fcmToken);
    console.log('🔔 FCM token reactivated - notifications enabled');
  } catch (error) {
    console.error('Error reactivating FCM token:', error);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session and check if it's expired
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Check if session is older than 14 days
        const loginTime = localStorage.getItem('last_login_time');
        const now = Date.now();

        if (loginTime) {
          const timeSinceLogin = (now - parseInt(loginTime)) / 1000; // in seconds

          if (timeSinceLogin > SESSION_EXPIRY_SECONDS) {
            console.log(`⏰ Session expired (${SESSION_EXPIRY_DAYS} days). Logging out...`);
            // Session expired, force logout
            await deactivateFCMToken();
            await supabase.auth.signOut();
            localStorage.removeItem('last_login_time');
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          } else {
            const daysRemaining = Math.floor((SESSION_EXPIRY_SECONDS - timeSinceLogin) / (24 * 60 * 60));
            console.log(`✅ Session valid. Expires in ${daysRemaining} days`);
          }
        } else {
          // No login time stored, set it now for existing sessions
          localStorage.setItem('last_login_time', now.toString());
        }
      }

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Store login time for 14-day expiration check
    localStorage.setItem('last_login_time', Date.now().toString());
    console.log(`✅ Login successful. Session will expire in ${SESSION_EXPIRY_DAYS} days`);

    setSession(data.session);
    setUser(data.user);

    // Reactivate FCM token if it exists
    await reactivateFCMToken();
  };

  const signOut = async () => {
    // Deactivate FCM token so user stops receiving notifications
    await deactivateFCMToken();

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    localStorage.removeItem('last_login_time');
    console.log('✅ Logged out. Notifications disabled.');

    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
