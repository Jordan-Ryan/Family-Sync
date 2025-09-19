import { createClient } from '@supabase/supabase-js';
import { getSupabaseUrl, getSupabaseAnonKey, validateConfig } from './environment';

// Validate configuration on import
if (!validateConfig()) {
  console.warn('⚠️ Supabase configuration is not properly set up. Please check your environment configuration.');
}

// Supabase configuration
const supabaseUrl = getSupabaseUrl();
const supabaseAnonKey = getSupabaseAnonKey();

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for the recipes_foodcom table
export interface Database {
  public: {
    Tables: {
      recipes_foodcom: {
        Row: {
          recipe_id: number;
          name: string;
          author_id: number | null;
          author_name: string | null;
          cook_time: string | null;
          prep_time: string | null;
          total_time: string | null;
          date_published: string | null;
          description: string | null;
          images: any | null; // JSONB
          recipe_category: any | null; // JSONB
          keywords: any | null; // JSONB
          recipe_ingredient_quantities: any | null; // JSONB
          recipe_ingredient_parsed: any | null; // JSONB
          recipe_instructions: any | null; // JSONB
          aggregated_rating: number | null;
          review_count: number | null;
          calories: number | null;
          fat_content: number | null;
          saturated_fat_content: number | null;
          cholesterol_content: number | null;
          sodium_content: number | null;
          carbohydrate_content: number | null;
          fiber_content: number | null;
          sugar_content: number | null;
          protein_content: number | null;
          recipe_servings: number | null;
          recipe_yield: string | null;
        };
        Insert: {
          recipe_id?: number;
          name: string;
          author_id?: number | null;
          author_name?: string | null;
          cook_time?: string | null;
          prep_time?: string | null;
          total_time?: string | null;
          date_published?: string | null;
          description?: string | null;
          images?: any | null;
          recipe_category?: any | null;
          keywords?: any | null;
          recipe_ingredient_quantities?: any | null;
          recipe_ingredient_parsed?: any | null;
          recipe_instructions?: any | null;
          aggregated_rating?: number | null;
          review_count?: number | null;
          calories?: number | null;
          fat_content?: number | null;
          saturated_fat_content?: number | null;
          cholesterol_content?: number | null;
          sodium_content?: number | null;
          carbohydrate_content?: number | null;
          fiber_content?: number | null;
          sugar_content?: number | null;
          protein_content?: number | null;
          recipe_servings?: number | null;
          recipe_yield?: string | null;
        };
        Update: {
          recipe_id?: number;
          name?: string;
          author_id?: number | null;
          author_name?: string | null;
          cook_time?: string | null;
          prep_time?: string | null;
          total_time?: string | null;
          date_published?: string | null;
          description?: string | null;
          images?: any | null;
          recipe_category?: any | null;
          keywords?: any | null;
          recipe_ingredient_quantities?: any | null;
          recipe_ingredient_parsed?: any | null;
          recipe_instructions?: any | null;
          aggregated_rating?: number | null;
          review_count?: number | null;
          calories?: number | null;
          fat_content?: number | null;
          saturated_fat_content?: number | null;
          cholesterol_content?: number | null;
          sodium_content?: number | null;
          carbohydrate_content?: number | null;
          fiber_content?: number | null;
          sugar_content?: number | null;
          protein_content?: number | null;
          recipe_servings?: number | null;
          recipe_yield?: string | null;
        };
      };
      // Keep existing tables for backward compatibility
      recipes: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          prep_time: number | null;
          cook_time: number | null;
          servings: number | null;
          ingredients: string[];
          instructions: string[];
          tags: string[];
          image_url: string | null;
          area: string | null;
          source: string | null;
          youtube_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          prep_time?: number | null;
          cook_time?: number | null;
          servings?: number | null;
          ingredients: string[];
          instructions: string[];
          tags: string[];
          image_url?: string | null;
          area?: string | null;
          source?: string | null;
          youtube_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          category?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
          prep_time?: number | null;
          cook_time?: number | null;
          servings?: number | null;
          ingredients?: string[];
          instructions?: string[];
          tags?: string[];
          image_url?: string | null;
          area?: string | null;
          source?: string | null;
          youtube_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          image_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Typed Supabase client
export const typedSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
