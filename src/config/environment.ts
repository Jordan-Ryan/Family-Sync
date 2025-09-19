/**
 * Environment configuration
 * 
 * For production, you should use environment variables or a secure configuration system.
 * For now, we'll use a simple configuration object that you can update with your actual values.
 */

export const config = {
  supabase: {
    url: 'https://qunbglfspdhzlmkrdqxc.supabase.co', // Your actual Supabase URL
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF1bmJnbGZzcGRoemxta3JkcXhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwOTYxMjQsImV4cCI6MjA3MzY3MjEyNH0.tB7AmwC3H6d-6ET1-o3L8mnTNO8BFthO86UpzzAjqCg', // Replace with your actual anon key
  },
  // Add other environment variables here as needed
  api: {
    timeout: 10000, // 10 seconds
    retryAttempts: 3,
  },
};

// Helper function to get Supabase URL
export const getSupabaseUrl = (): string => {
  return config.supabase.url;
};

// Helper function to get Supabase anon key
export const getSupabaseAnonKey = (): string => {
  return config.supabase.anonKey;
};

// Validation function to check if configuration is properly set
export const validateConfig = (): boolean => {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  
  if (url === 'https://your-project.supabase.co' || !url) {
    console.warn('⚠️ Supabase URL not configured. Please update src/config/environment.ts');
    return false;
  }
  
  if (anonKey === 'your-anon-key' || !anonKey) {
    console.warn('⚠️ Supabase anon key not configured. Please update src/config/environment.ts');
    return false;
  }
  
  return true;
};
