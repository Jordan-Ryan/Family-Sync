/**
 * Supabase-only Meal API Service
 * Simplified service that only uses Supabase recipes_foodcom database
 */

import { recipeService } from './recipeService';
import { FoodComRecipe } from '../types';

export interface MealSearchResult {
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
  source: string;
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

class SupabaseMealApiService {
  /**
   * Search for meals with optional filters
   */
  async searchMeals(
    query: string,
    options: {
      category?: string;
      maxPrepTime?: number;
      maxCookTime?: number;
      minRating?: number;
      limit?: number;
    } = {}
  ): Promise<MealSearchResult[]> {
    try {
      const recipes = await recipeService.searchRecipes({
        query,
        category: options.category,
        minRating: options.minRating,
        limit: options.limit || 20,
      });

      return recipes.map(recipe => this.convertFoodComRecipeToMeal(recipe));
    } catch (error) {
      console.error('SupabaseMealApiService.searchMeals error:', error);
      return [];
    }
  }

  /**
   * Get random meals
   */
  async getRandomMeals(count: number = 10): Promise<MealSearchResult[]> {
    try {
      const recipes = await recipeService.getRandomRecipes(count);
      return recipes.map(recipe => this.convertFoodComRecipeToMeal(recipe));
    } catch (error) {
      console.error('SupabaseMealApiService.getRandomMeals error:', error);
      return [];
    }
  }

  /**
   * Get meals by category
   */
  async getMealsByCategory(category: string, limit: number = 20): Promise<MealSearchResult[]> {
    try {
      const recipes = await recipeService.getRecipesByCategory(category, limit);
      return recipes.map(recipe => this.convertFoodComRecipeToMeal(recipe));
    } catch (error) {
      console.error('SupabaseMealApiService.getMealsByCategory error:', error);
      return [];
    }
  }

  /**
   * Get popular meals
   */
  async getPopularMeals(limit: number = 20): Promise<MealSearchResult[]> {
    try {
      const recipes = await recipeService.getPopularRecipes(limit);
      return recipes.map(recipe => this.convertFoodComRecipeToMeal(recipe));
    } catch (error) {
      console.error('SupabaseMealApiService.getPopularMeals error:', error);
      return [];
    }
  }

  /**
   * Get quick meals (low prep/cook time)
   */
  async getQuickMeals(limit: number = 20): Promise<MealSearchResult[]> {
    try {
      const recipes = await recipeService.getQuickRecipes(limit);
      return recipes.map(recipe => this.convertFoodComRecipeToMeal(recipe));
    } catch (error) {
      console.error('SupabaseMealApiService.getQuickMeals error:', error);
      return [];
    }
  }

  /**
   * Get healthy meals
   */
  async getHealthyMeals(limit: number = 20): Promise<MealSearchResult[]> {
    try {
      const recipes = await recipeService.getHealthyRecipes(limit);
      return recipes.map(recipe => this.convertFoodComRecipeToMeal(recipe));
    } catch (error) {
      console.error('SupabaseMealApiService.getHealthyMeals error:', error);
      return [];
    }
  }

  /**
   * Get meal categories
   */
  async getCategories(): Promise<string[]> {
    try {
      return await recipeService.getCategories();
    } catch (error) {
      console.error('SupabaseMealApiService.getCategories error:', error);
      return [];
    }
  }

  /**
   * Convert FoodComRecipe to MealSearchResult
   */
  private convertFoodComRecipeToMeal(recipe: FoodComRecipe): MealSearchResult {
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
      tags: this.extractTags(recipe),
      imageUrl: this.extractImageUrl(recipe),
      area: recipe.recipe_category?.[0]?.name || '',
      source: 'Food.com',
      rating: recipe.aggregated_rating || undefined,
      reviewCount: recipe.review_count || undefined,
      nutrition: {
        calories: recipe.calories || undefined,
        protein: recipe.protein_content || undefined,
        carbs: recipe.carbohydrate_content || undefined,
        fat: recipe.fat_content || undefined,
        saturatedFat: recipe.saturated_fat_content || undefined,
        cholesterol: recipe.cholesterol_content || undefined,
        sodium: recipe.sodium_content || undefined,
        fiber: recipe.fiber_content || undefined,
        sugar: recipe.sugar_content || undefined,
      },
    };
  }

  /**
   * Helper method to determine meal category from recipe data
   */
  private determineMealCategory(recipe: FoodComRecipe): 'breakfast' | 'lunch' | 'dinner' | 'snack' {
    const category = recipe.recipe_category?.[0]?.name?.toLowerCase() || '';
    const keywords = this.extractTags(recipe).join(' ').toLowerCase();
    
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
  private parseTimeToMinutes(timeString?: string): number | undefined {
    if (!timeString) return undefined;
    
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
    
    return totalMinutes > 0 ? totalMinutes : undefined;
  }

  /**
   * Helper method to extract ingredients from recipe
   */
  private extractIngredients(recipe: FoodComRecipe): string[] {
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
  private extractInstructions(recipe: FoodComRecipe): string[] {
    if (recipe.recipe_instructions && Array.isArray(recipe.recipe_instructions)) {
      return recipe.recipe_instructions
        .sort((a: any, b: any) => (a.step || 0) - (b.step || 0))
        .map((instruction: any) => instruction.instruction || '');
    }
    
    return [];
  }

  /**
   * Helper method to extract tags from recipe
   */
  private extractTags(recipe: FoodComRecipe): string[] {
    if (Array.isArray(recipe.keywords)) {
      return recipe.keywords;
    }
    return [];
  }

  /**
   * Helper method to extract image URL from recipe
   */
  private extractImageUrl(recipe: FoodComRecipe): string | undefined {
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

// Export singleton instance
export const supabaseMealApiService = new SupabaseMealApiService();
