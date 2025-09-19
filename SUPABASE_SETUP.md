# Supabase Integration Setup Guide

This guide will help you set up your custom Supabase API for the Family Sync meal/recipe system.

## Prerequisites

- A Supabase project with a database
- Your Supabase project URL and anon key

## Database Schema

Your Supabase database should have the following tables:

### `recipes` table
```sql
CREATE TABLE recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('breakfast', 'lunch', 'dinner', 'snack')),
  prep_time INTEGER, -- in minutes
  cook_time INTEGER, -- in minutes
  servings INTEGER,
  ingredients TEXT[] NOT NULL DEFAULT '{}',
  instructions TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  area TEXT, -- cuisine type
  source TEXT,
  youtube_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `categories` table (optional)
```sql
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Configuration Steps

### 1. Update Environment Configuration

Edit `src/config/environment.ts` and replace the placeholder values:

```typescript
export const config = {
  supabase: {
    url: 'https://your-actual-project.supabase.co', // Your actual Supabase URL
    anonKey: 'your-actual-anon-key', // Your actual anon key
  },
  // ... rest of config
};
```

### 2. Get Your Supabase Credentials

1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key
4. Update the configuration file with these values

### 3. Set Up Row Level Security (RLS)

For the `recipes` table, you'll want to set up RLS policies:

```sql
-- Enable RLS
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to recipes
CREATE POLICY "Allow public read access to recipes" ON recipes
  FOR SELECT USING (true);

-- Allow public insert access (if you want users to add recipes)
CREATE POLICY "Allow public insert access to recipes" ON recipes
  FOR INSERT WITH CHECK (true);

-- Allow public update access (if you want users to update recipes)
CREATE POLICY "Allow public update access to recipes" ON recipes
  FOR UPDATE USING (true);

-- Allow public delete access (if you want users to delete recipes)
CREATE POLICY "Allow public delete access to recipes" ON recipes
  FOR DELETE USING (true);
```

### 4. Test the Integration

1. Start your app: `npm start`
2. Navigate to the Meals screen
3. Try browsing recipes - you should see your custom recipes from Supabase
4. Check the console for any error messages

## Features

The integration provides:

- **Hybrid API**: Automatically uses Supabase when configured, falls back to TheMealDB
- **Full CRUD operations**: Create, read, update, delete recipes
- **Search functionality**: Search recipes by name
- **Category filtering**: Filter recipes by category
- **Area/cuisine filtering**: Filter recipes by cuisine type
- **Ingredient search**: Find recipes by ingredient
- **Error handling**: Graceful fallback to TheMealDB if Supabase fails

## API Methods Available

### Read Operations (Available with both APIs)
- `searchMeals(query: string)` - Search recipes by name
- `getRandomMeals(count: number)` - Get random recipes
- `getMealsByCategory(category: string)` - Get recipes by category
- `getMealsByArea(area: string)` - Get recipes by cuisine
- `getMealById(id: string)` - Get specific recipe
- `getCategories()` - Get all categories
- `getAreas()` - Get all cuisine types
- `getMealsByIngredient(ingredient: string)` - Find recipes by ingredient

### Write Operations (Supabase only)
- `addRecipe(recipe)` - Add new recipe
- `updateRecipe(id, updates)` - Update existing recipe
- `deleteRecipe(id)` - Delete recipe

## Troubleshooting

### Common Issues

1. **"Supabase configuration is not properly set up"**
   - Check that you've updated the URL and anon key in `src/config/environment.ts`
   - Verify your Supabase project is active

2. **"Failed to fetch recipes"**
   - Check your database schema matches the expected format
   - Verify RLS policies allow public access
   - Check network connectivity

3. **App falls back to TheMealDB**
   - This is normal behavior when Supabase is not configured
   - Check console logs for specific error messages

### Debug Mode

To see which API is being used, check the console logs. You should see:
```
🍽️ Using Supabase API for meals
```
or
```
🍽️ Using TheMealDB API for meals
```

## Next Steps

1. Add your recipes to the Supabase database
2. Customize the database schema if needed
3. Set up authentication if you want user-specific recipes
4. Add more advanced features like favorites, ratings, etc.

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify your Supabase configuration
3. Test your database connection in the Supabase dashboard
4. Ensure your database schema matches the expected format

