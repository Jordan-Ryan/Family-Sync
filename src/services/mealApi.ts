/**
 * Meal API Service
 * Provides a unified interface for meal data using only Supabase
 */

import { supabaseMealApiService, MealSearchResult } from './supabaseMealApi';

export interface ProcessedMeal {
  id: string;
  name: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  ingredients: string[];
  instructions: string[];
  tags: string[];
  imageUrl?: string;
  area?: string;
  source?: string;
  youtubeUrl?: string;
  sourceUrl?: string;
  rating?: number;
  reviewCount?: number;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    saturatedFat?: number;
    cholesterol?: number;
    sodium?: number;
    fiber?: number;
    sugar?: number;
  };
}

class MealApiService {
  /**
   * Search for meals
   */
  async searchMeals(query: string): Promise<ProcessedMeal[]> {
    try {
      const results = await supabaseMealApiService.searchMeals(query);
      return results.map(this.convertToProcessedMeal);
    } catch (error) {
      console.error('MealApiService.searchMeals error:', error);
      return [];
    }
  }

  /**
   * Get random meals
   */
  async getRandomMeals(count: number = 20): Promise<ProcessedMeal[]> {
    try {
      const results = await supabaseMealApiService.getRandomMeals(count);
      return results.map(this.convertToProcessedMeal);
    } catch (error) {
      console.error('MealApiService.getRandomMeals error:', error);
      return [];
    }
  }

  /**
   * Get meals by category
   */
  async getMealsByCategory(category: string): Promise<ProcessedMeal[]> {
    try {
      const results = await supabaseMealApiService.getMealsByCategory(category);
      return results.map(this.convertToProcessedMeal);
    } catch (error) {
      console.error('MealApiService.getMealsByCategory error:', error);
      return [];
    }
  }

  /**
   * Get popular meals
   */
  async getPopularMeals(limit: number = 20): Promise<ProcessedMeal[]> {
    try {
      const results = await supabaseMealApiService.getPopularMeals(limit);
      return results.map(this.convertToProcessedMeal);
    } catch (error) {
      console.error('MealApiService.getPopularMeals error:', error);
      return [];
    }
  }

  /**
   * Get quick meals
   */
  async getQuickMeals(limit: number = 20): Promise<ProcessedMeal[]> {
    try {
      const results = await supabaseMealApiService.getQuickMeals(limit);
      return results.map(this.convertToProcessedMeal);
    } catch (error) {
      console.error('MealApiService.getQuickMeals error:', error);
      return [];
    }
  }

  /**
   * Get healthy meals
   */
  async getHealthyMeals(limit: number = 20): Promise<ProcessedMeal[]> {
    try {
      const results = await supabaseMealApiService.getHealthyMeals(limit);
      return results.map(this.convertToProcessedMeal);
    } catch (error) {
      console.error('MealApiService.getHealthyMeals error:', error);
      return [];
    }
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<any[]> {
    try {
      const categories = await supabaseMealApiService.getCategories();
      // Convert to the format expected by MealBrowser
      return categories.map((category, index) => ({
        idCategory: `cat_${index}`,
        strCategory: category,
      }));
    } catch (error) {
      console.error('MealApiService.getCategories error:', error);
      return [];
    }
  }

  /**
   * Convert MealSearchResult to ProcessedMeal
   */
  private convertToProcessedMeal(result: MealSearchResult): ProcessedMeal {
    return {
      id: result.id,
      name: result.name,
      description: result.description,
      category: result.category,
      prepTime: result.prepTime,
      cookTime: result.cookTime,
      servings: result.servings,
      ingredients: result.ingredients,
      instructions: result.instructions,
      tags: result.tags,
      imageUrl: result.imageUrl,
      area: result.area,
      source: result.source,
      youtubeUrl: undefined, // Not available in current data
      sourceUrl: undefined, // Not available in current data
      rating: result.rating,
      reviewCount: result.reviewCount,
      nutrition: result.nutrition,
    };
  }
}

// Export singleton instance
export const mealApiService = new MealApiService();
