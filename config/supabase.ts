// config/supabase.ts
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://ksyerdwedufkiuykqmli.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_790A5UyQxgzxUSGL4Pyg1A_JRCdB7J_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // Enabled for Web
  },
});