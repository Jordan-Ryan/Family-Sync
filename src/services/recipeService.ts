/**
 * Recipe Service for interacting with the recipes_foodcom database
 * Provides functions to fetch, search, and manage recipes from Supabase
 */

import { supabase, typedSupabase } from '../config/supabase';
import { FoodComRecipe, RecipeNutrition, RecipeIngredient, RecipeInstruction } from '../types';

export interface RecipeSearchParams {
  query?: string;
  category?: string;
  maxPrepTime?: number;
  maxCookTime?: number;
  minRating?: number;
  limit?: number;
  offset?: number;
}

export interface RecipeFilters {
  dietary?: string[]; // e.g., ['vegetarian', 'gluten-free']
  cuisine?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  maxCalories?: number;
  maxSodium?: number;
}

export class RecipeService {
  /**
   * Search recipes with optional filters
   */
  static async searchRecipes(params: RecipeSearchParams = {}): Promise<FoodComRecipe[]> {
    try {
      let query = typedSupabase
        .from('recipes_foodcom')
        .select('*');

      // Apply text search if query provided
      if (params.query) {
        query = query.or(`name.ilike.%${params.query}%,description.ilike.%${params.query}%`);
      }

      // Apply category filter
      if (params.category) {
        query = query.contains('recipe_category', [{ name: params.category }]);
      }

      // Apply rating filter
      if (params.minRating) {
        query = query.gte('aggregated_rating', params.minRating);
      }

      // Apply pagination
      const limit = params.limit || 20;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        console.error('Error searching recipes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('RecipeService.searchRecipes error:', error);
      throw error;
    }
  }

  /**
   * Get a specific recipe by ID
   */
  static async getRecipeById(recipeId: number): Promise<FoodComRecipe | null> {
    try {
      const { data, error } = await typedSupabase
        .from('recipes_foodcom')
        .select('*')
        .eq('recipe_id', recipeId)
        .single();

      if (error) {
        console.error('Error fetching recipe:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('RecipeService.getRecipeById error:', error);
      return null;
    }
  }

  /**
   * Get random recipes
   */
  static async getRandomRecipes(count: number = 10): Promise<FoodComRecipe[]> {
    try {
      const { data, error } = await typedSupabase
        .from('recipes_foodcom')
        .select('*')
        .not('aggregated_rating', 'is', null)
        .gte('aggregated_rating', 4.0) // Only get highly rated recipes
        .limit(count);

      if (error) {
        console.error('Error fetching random recipes:', error);
        throw error;
      }

      // Shuffle the results to get random selection
      const shuffled = (data || []).sort(() => 0.5 - Math.random());
      const results = shuffled.slice(0, count);
      
      
      return results;
    } catch (error) {
      console.error('RecipeService.getRandomRecipes error:', error);
      throw error;
    }
  }

  /**
   * Get recipes by category
   */
  static async getRecipesByCategory(category: string, limit: number = 20): Promise<FoodComRecipe[]> {
    try {
      const { data, error } = await typedSupabase
        .from('recipes_foodcom')
        .select('*')
        .contains('recipe_category', [{ name: category }])
        .order('aggregated_rating', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recipes by category:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('RecipeService.getRecipesByCategory error:', error);
      throw error;
    }
  }

  /**
   * Get popular recipes (highly rated with many reviews)
   */
  static async getPopularRecipes(limit: number = 20): Promise<FoodComRecipe[]> {
    try {
      const { data, error } = await typedSupabase
        .from('recipes_foodcom')
        .select('*')
        .gte('aggregated_rating', 4.0)
        .gte('review_count', 10)
        .order('review_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching popular recipes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('RecipeService.getPopularRecipes error:', error);
      throw error;
    }
  }

  /**
   * Get quick recipes (low prep and cook time)
   */
  static async getQuickRecipes(limit: number = 20): Promise<FoodComRecipe[]> {
    try {
      const { data, error } = await typedSupabase
        .from('recipes_foodcom')
        .select('*')
        .not('total_time', 'is', null)
        .order('total_time', { ascending: true })
        .limit(limit);

      if (error) {
        console.error('Error fetching quick recipes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('RecipeService.getQuickRecipes error:', error);
      throw error;
    }
  }

  /**
   * Get healthy recipes (low calories, high protein)
   */
  static async getHealthyRecipes(limit: number = 20): Promise<FoodComRecipe[]> {
    try {
      const { data, error } = await typedSupabase
        .from('recipes_foodcom')
        .select('*')
        .not('calories', 'is', null)
        .not('protein_content', 'is', null)
        .lte('calories', 500)
        .gte('protein_content', 15)
        .order('protein_content', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching healthy recipes:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('RecipeService.getHealthyRecipes error:', error);
      throw error;
    }
  }

  /**
   * Get all available categories
   */
  static async getCategories(): Promise<string[]> {
    try {
      const { data, error } = await typedSupabase
        .from('recipes_foodcom')
        .select('recipe_category')
        .not('recipe_category', 'is', null);

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      // Extract unique categories from the JSONB data
      const categories = new Set<string>();
      data?.forEach(recipe => {
        if (recipe.recipe_category && Array.isArray(recipe.recipe_category)) {
          recipe.recipe_category.forEach((cat: any) => {
            if (cat.name) {
              categories.add(cat.name);
            }
          });
        }
      });

      return Array.from(categories).sort();
    } catch (error) {
      console.error('RecipeService.getCategories error:', error);
      throw error;
    }
  }

  /**
   * Convert FoodComRecipe to legacy Meal format for backward compatibility
   */
  static convertToMeal(recipe: FoodComRecipe): any {
    return {
      id: recipe.recipe_id.toString(),
      name: recipe.name,
      description: recipe.description || '',
      category: this.determineMealCategory(recipe),
      prepTime: this.parseTimeToMinutes(recipe.prep_time),
      cookTime: this.parseTimeToMinutes(recipe.cook_time),
      servings: recipe.recipe_servings || 1,
      ingredients: this.extractIngredients(recipe),
      instructions: this.extractInstructions(recipe),
      tags: recipe.keywords || [],
      imageUrl: this.extractImageUrl(recipe),
      area: recipe.recipe_category?.[0]?.name || '',
      source: 'Food.com',
      youtubeUrl: null,
    };
  }

  /**
   * Helper method to determine meal category from recipe data
   */
  private static determineMealCategory(recipe: FoodComRecipe): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    const category = recipe.recipe_category?.[0]?.name?.toLowerCase() || '';
    const keywords = recipe.keywords?.join(' ').toLowerCase() || '';
    
    if (category.includes('breakfast') || keywords.includes('breakfast')) {
      return 'breakfast';
    } else if (category.includes('lunch') || keywords.includes('lunch')) {
      return 'lunch';
    } else if (category.includes('snack') || keywords.includes('snack')) {
      return 'snack';
    } else {
      return 'dinner'; // Default to dinner
    }
  }

  /**
   * Helper method to parse time string to minutes
   */
  private static parseTimeToMinutes(timeString?: string): number | null {
    if (!timeString) return null;
    
    // Handle various time formats like "30 min", "1 hour", "1h 30m", etc.
    const timeRegex = /(\d+)\s*(hour|hr|h|minute|min|m)/gi;
    let totalMinutes = 0;
    let match;
    
    while ((match = timeRegex.exec(timeString)) !== null) {
      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      
      if (unit.startsWith('h')) {
        totalMinutes += value * 60;
      } else if (unit.startsWith('m')) {
        totalMinutes += value;
      }
    }
    
    return totalMinutes > 0 ? totalMinutes : null;
  }

  /**
   * Helper method to extract ingredients from recipe
   */
  private static extractIngredients(recipe: FoodComRecipe): string[] {
    if (recipe.recipe_ingredient_parsed && Array.isArray(recipe.recipe_ingredient_parsed)) {
      return recipe.recipe_ingredient_parsed.map((ingredient: any) => {
        const amount = ingredient.amount || '';
        const unit = ingredient.unit || '';
        const name = ingredient.name || '';
        return `${amount} ${unit} ${name}`.trim();
      });
    }
    
    return recipe.recipe_ingredient_quantities || [];
  }

  /**
   * Helper method to extract instructions from recipe
   */
  private static extractInstructions(recipe: FoodComRecipe): string[] {
    if (recipe.recipe_instructions && Array.isArray(recipe.recipe_instructions)) {
      return recipe.recipe_instructions
        .sort((a: any, b: any) => (a.step || 0) - (b.step || 0))
        .map((instruction: any) => instruction.instruction || '');
    }
    
    return [];
  }

  /**
   * Helper method to extract image URL from recipe
   */
  private static extractImageUrl(recipe: FoodComRecipe): string | null {
    // Handle case where images is a string (direct URL)
    if (typeof recipe.images === 'string') {
      return recipe.images;
    }
    
    // Handle case where images is an array
    if (recipe.images && Array.isArray(recipe.images) && recipe.images.length > 0) {
      const firstImage = recipe.images[0];
      
      // Handle different possible image structures
      if (typeof firstImage === 'string') {
        return firstImage;
      } else if (typeof firstImage === 'object' && firstImage.url) {
        return firstImage.url;
      }
    }
    
    // Return a placeholder image URL as fallback
    return 'https://via.placeholder.com/150x150/cccccc/666666?text=No+Image';
  }
}

// Export a default instance for convenience
export const recipeService = RecipeService;
