import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper functions for common operations
export const formatPrice = (priceInCents: number): string => {
  return `$${(priceInCents / 100).toLocaleString()}`;
};

export const parsePrice = (priceString: string): number => {
  return Math.round(parseFloat(priceString.replace(/[^0-9.-]+/g, '')) * 100);
};

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return profile;
};

// Order helpers
export const generateOrderId = async (): Promise<string> => {
  const { data, error } = await supabase.rpc('generate_order_id');
  if (error) throw error;
  return data;
};

// Analytics helpers
export const updateDailyAnalytics = async () => {
  const { error } = await supabase.rpc('update_daily_analytics');
  if (error) throw error;
};

// Break times helpers
export const getBreakTimes = async (cycle: 'ciclo_basico' | 'ciclo_superior') => {
  const { data, error } = await supabase
    .from('break_times_config')
    .select('break_time')
    .eq('cycle', cycle)
    .eq('is_active', true)
    .order('break_time');

  if (error) {
    console.error('Error loading break times:', error);
    // Fallback to hardcoded times
    const { FALLBACK_BREAK_TIMES } = await import('../data/mockData');
    return FALLBACK_BREAK_TIMES[cycle];
  }

  return data?.map(item => item.break_time) || [];
};

// Auto-assign cycle based on course
export const getCycleFromCourse = (course: string): 'ciclo_basico' | 'ciclo_superior' => {
  const courseNumber = parseInt(course.charAt(0));
  
  if (courseNumber >= 1 && courseNumber <= 3) {
    return 'ciclo_basico';
  } else if (courseNumber >= 4 && courseNumber <= 7) {
    return 'ciclo_superior';
  }
  
  // Default fallback
  return 'ciclo_basico';
};