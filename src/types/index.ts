export interface Profile {
  id: string;
  name: string;
  role: 'parent' | 'child';
  color: string; // hex color
}

export interface Recurrence {
  freq: 'daily' | 'weekly' | 'monthly' | 'none';
  interval: number;
  byWeekday?: number[]; // 0-6 (Sunday-Saturday)
  byMonthDay?: number[]; // 1-31 for specific days of month
  bySetPos?: number; // -1 for last, 1-4 for first through fourth
  count?: number;
  until?: string; // ISO date string
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  start: string; // ISO date string
  end: string; // ISO date string
  allDay: boolean;
  location?: string;
  locationDetails?: string; // Additional location info like room number, address
  notes?: string;
  profileIds: string[];
  recurrence: Recurrence;
  category?: 'personal' | 'work' | 'family' | 'health' | 'education' | 'social' | 'other';
  priority?: 'low' | 'medium' | 'high';
  reminder?: {
    minutes: number; // minutes before event
    enabled: boolean;
  };
  attachments?: string[]; // URLs or file paths
  isPrivate?: boolean;
  createdBy: string; // profile ID of creator
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface Chore {
  id: string;
  title: string;
  description?: string;
  profileIds: string[];
  startDate: string; // ISO date string
  timeOfDay: 'morning' | 'midday' | 'evening' | 'any';
  scheduledTime?: string; // HH:MM format for timed chores
  type: 'timed' | 'allDay' | 'anytime';
  recurrence: Recurrence;
  completedBy: {
    date: string; // ISO date string
    profileId: string;
    completedAt: string; // ISO date string when completed
    approvedBy?: string; // profile ID of parent who approved
    approvedAt?: string; // ISO date string when approved
    status: 'completed' | 'pending_approval' | 'approved' | 'rejected';
  }[];
  rewardStars?: number;
  isShared: boolean; // true if anyone can complete this chore
  requiresApproval: boolean; // true if parent approval is required
  createdBy: string; // profile ID of creator
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface List {
  id: string;
  name: string;
  kind: 'todo' | 'shopping' | 'other';
  color: string; // hex color
  itemCount: number; // derived from listItems
}

export interface ListItem {
  id: string;
  listId: string;
  title: string;
  checked: boolean;
  notes?: string;
  quantity?: string;
  category?: string; // for future grocery grouping
  dueDate?: string; // ISO date string for todo items
  priority?: 'low' | 'medium' | 'high'; // for todo items
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  starCost: number;
  category: 'treat' | 'privilege' | 'activity' | 'item';
  isActive: boolean;
  profileIds: string[]; // which profiles can redeem this reward
}

export interface RewardRedemption {
  id: string;
  rewardId: string;
  profileId: string;
  redeemedAt: string; // ISO date string
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
}

// New interfaces for the recipes_foodcom database
export interface RecipeImage {
  url: string;
  alt?: string;
  width?: number;
  height?: number;
}

export interface RecipeCategory {
  name: string;
  slug?: string;
}

export interface RecipeIngredient {
  name: string;
  amount?: string;
  unit?: string;
  notes?: string;
}

export interface RecipeInstruction {
  step: number;
  instruction: string;
  image?: string;
}

export interface RecipeNutrition {
  calories?: number;
  fat?: number;
  saturatedFat?: number;
  cholesterol?: number;
  sodium?: number;
  carbohydrates?: number;
  fiber?: number;
  sugar?: number;
  protein?: number;
}

export interface FoodComRecipe {
  recipe_id: number;
  name: string;
  author_id?: number;
  author_name?: string;
  cook_time?: string;
  prep_time?: string;
  total_time?: string;
  date_published?: string;
  description?: string;
  images?: RecipeImage[];
  recipe_category?: RecipeCategory[];
  keywords?: string[];
  recipe_ingredient_quantities?: string[];
  recipe_ingredient_parsed?: RecipeIngredient[];
  recipe_instructions?: RecipeInstruction[];
  aggregated_rating?: number;
  review_count?: number;
  nutrition?: RecipeNutrition;
  recipe_servings?: number;
  recipe_yield?: string;
}

// Legacy Meal interface (keeping for backward compatibility)
export interface Meal {
  id: string;
  name: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  prepTime?: number; // in minutes
  cookTime?: number; // in minutes
  servings?: number;
  ingredients: string[];
  instructions?: string[];
  tags: string[]; // e.g., 'vegetarian', 'quick', 'family-favorite'
  imageUrl?: string;
  area?: string;
  source?: string;
  youtubeUrl?: string;
}

export interface MealAssignment {
  mealId: string;
  profileId: string;
}

export interface DayMeals {
  breakfast?: MealAssignment[];
  lunch?: MealAssignment[];
  dinner?: MealAssignment[];
  snacks?: MealAssignment[];
}

export interface MealPlan {
  id: string;
  weekStartDate: string; // ISO date string (Monday)
  meals: {
    [day: string]: DayMeals; // 'monday', 'tuesday', etc.
  };
  profileIds: string[]; // which profiles this meal plan is for
}

// App state interface
export interface AppState {
  profiles: Profile[];
  events: Event[];
  chores: Chore[];
  lists: List[];
  listItems: ListItem[];
  rewards: Reward[];
  rewardRedemptions: RewardRedemption[];
  meals: Meal[];
  mealPlans: MealPlan[];
  selectedProfileIds: string[]; // for filtering
  selectedChoreFilter: string; // for chores screen filtering
  featureFlags: {
    plusFeatures: boolean;
    sidekick: boolean;
    rewards: boolean;
  };
}

// Action types for Zustand store
export interface AppActions {
  // Profile actions
  addProfile: (profile: Omit<Profile, 'id'>) => void;
  updateProfile: (id: string, updates: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  
  // Event actions
  addEvent: (event: Omit<Event, 'id'>) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  deleteEvent: (id: string) => void;
  
  // Chore actions
  addChore: (chore: Omit<Chore, 'id'>) => void;
  updateChore: (id: string, updates: Partial<Chore>) => void;
  deleteChore: (id: string) => void;
  completeChore: (choreId: string, profileId: string, date: string) => void;
  uncompleteChore: (choreId: string, profileId: string, date: string) => void;
  approveChore: (choreId: string, profileId: string, date: string, approvedBy: string) => void;
  rejectChore: (choreId: string, profileId: string, date: string, rejectedBy: string) => void;
  
  // List actions
  addList: (list: Omit<List, 'id' | 'itemCount'>) => void;
  updateList: (id: string, updates: Partial<List>) => void;
  deleteList: (id: string) => void;
  
  // List item actions
  addListItem: (item: Omit<ListItem, 'id'>) => void;
  updateListItem: (id: string, updates: Partial<ListItem>) => void;
  deleteListItem: (id: string) => void;
  toggleListItem: (id: string) => void;
  
  // Reward actions
  addReward: (reward: Omit<Reward, 'id'>) => void;
  updateReward: (id: string, updates: Partial<Reward>) => void;
  deleteReward: (id: string) => void;
  
  // Reward redemption actions
  addRewardRedemption: (redemption: Omit<RewardRedemption, 'id'>) => void;
  updateRewardRedemption: (id: string, updates: Partial<RewardRedemption>) => void;
  deleteRewardRedemption: (id: string) => void;
  
  // Meal actions
  addMeal: (meal: Omit<Meal, 'id'>) => void;
  updateMeal: (id: string, updates: Partial<Meal>) => void;
  deleteMeal: (id: string) => void;
  
  // Meal plan actions
  addMealPlan: (mealPlan: Omit<MealPlan, 'id'>) => void;
  updateMealPlan: (id: string, updates: Partial<MealPlan>) => void;
  deleteMealPlan: (id: string) => void;
  removeMealFromPlan: (weekDate: Date, day: DayOfWeek, mealType: string, profileId: string, mealId: string) => void;
  
  // Filter actions
  setSelectedProfileIds: (profileIds: string[]) => void;
  toggleProfileFilter: (profileId: string) => void;
  setChoreFilter: (profileId: string) => void;
  
  // Feature flag actions
  toggleFeatureFlag: (flag: keyof AppState['featureFlags']) => void;
}

export type AppStore = AppState & AppActions;

// Utility types
export type TimeOfDay = 'morning' | 'midday' | 'evening' | 'any';
export type ChoreType = 'timed' | 'allDay' | 'anytime';
export type ListKind = 'todo' | 'shopping' | 'other';
export type RecurrenceFreq = 'daily' | 'weekly' | 'monthly' | 'none';
export type ProfileRole = 'parent' | 'child';
export type RewardCategory = 'treat' | 'privilege' | 'activity' | 'item';
export type RedemptionStatus = 'pending' | 'approved' | 'completed' | 'cancelled';
export type ChoreCompletionStatus = 'completed' | 'pending_approval' | 'approved' | 'rejected';
export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
