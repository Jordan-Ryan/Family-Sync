# State of the tree

Inventory of what the source, scripts, and config contain. It does not record runtime results.

Sources checked: `package.json`, `app.json`, `tsconfig.json`, `.gitignore`, `index.ts`, `App.tsx`, `src/**`, `install-expo-go.sh`, `eslint.config.js`, `.eslintrc.js`, `.prettierrc`.

## Entry and navigation

`index.ts` registers the root `App` export. `src/navigation/AppNavigator.tsx` builds a stack around a bottom tab navigator.

Tabs, in order, with the `title` option:

| Route name | Screen file | Tab title |
| --- | --- | --- |
| Calendar | `src/screens/Calendar/CalendarScreen.tsx` | Calendar |
| Chores | `src/screens/Chores/ChoresScreen.tsx` | Chores |
| Lists | `src/screens/Lists/ListsScreen.tsx` | Lists |
| Profiles | `src/screens/Profiles/ProfilesScreen.tsx` | Family |
| Rewards | `src/screens/Rewards/RewardsScreen.tsx` | Rewards |
| Meals | `src/screens/Meals/MealsScreen.tsx` | Meals |

Stack screens registered in `AppNavigator.tsx`:

| Route | Component |
| --- | --- |
| MainTabs | tab navigator |
| EventDetail | `EventDetailScreen` |
| EventForm | `EventFormScreen` (`headerShown: false`) |
| ChoreDetail | `ChoreDetailScreen` |
| ProfileDetail | `ProfileDetailScreen` |
| CreateChore | `ChoreFormScreen` |
| EditChore | `ChoreFormScreen` |
| ViewChore | `ChoreFormScreen` |

`RootStackParamList` also lists `CreateEvent`, `CreateList`, and `CreateProfile`. Those three names have no `Stack.Screen` and no `navigation.navigate` call under `src/`.

Call sites found under `src/screens`:

- Calendar opens `EventDetail` and `EventForm`.
- Event detail opens `EventForm`.
- Chores opens `ViewChore` and `CreateChore`.
- Chore detail and chore form open `EditChore`.
- Lists opens `CreateChore` with optional `todoData`.
- Profiles opens `EventDetail`, `Chores`, and `Calendar`.

No `navigate('ChoreDetail')` or `navigate('ProfileDetail')` call is in `src/`. `ProfileDetailScreen` returns the text "Profile Detail" and "Coming Soon".

`src/screens/Meals/MealDetailScreen.tsx` and `src/screens/Meals/MealFormScreen.tsx` are not imported by the navigator. `MealDetailScreen` declares a local param list with a `MealDetail` route. Meal browsing from the Meals tab is the `MealBrowser` modal in `MealsScreen`, plus `MealDetailModal`.

## Screens and store calls

The store in `src/store/index.ts` defines the actions in `AppActions` (`src/types/index.ts`). Screens call a subset:

| Area | Screen calls into the store |
| --- | --- |
| Calendar | `addEvent`, `updateEvent` (`EventFormScreen`); `deleteEvent` (`EventDetailScreen`) |
| Chores | `completeChore`, `uncompleteChore`, `setChoreFilter` (`ChoresScreen`); `addChore`, `updateChore`, `deleteChore` (`ChoreFormScreen`); `approveChore`, `rejectChore` (`ChoreDetailScreen`) |
| Lists | `addList`, `addListItem`, `toggleListItem`, `deleteListItem` (`ListsScreen`) |
| Profiles | `toggleProfileFilter`, `setChoreFilter`, `completeChore`, `uncompleteChore` (`ProfilesScreen`) |
| Rewards | `addReward`, `addRewardRedemption` (`RewardsScreen`) |
| Meals tab | `addMeal`, `addMealPlan`, `updateMealPlan`, `removeMealFromPlan` (`MealsScreen`) |
| Meal form file | `addMeal`, `updateMeal` (`MealFormScreen`, not registered) |

Store actions with no call site under `src/screens`: `addProfile`, `updateProfile`, `deleteProfile`, `updateList`, `deleteList`, `updateReward`, `deleteReward`, `updateRewardRedemption`, `deleteRewardRedemption`, `deleteMeal`, `deleteMealPlan`, `setSelectedProfileIds`, `toggleFeatureFlag`.

## Module notes from the screen files

- Calendar view state is `'day' | 'week' | 'month'`, default `'month'`. Selecting a day in month view sets the view to `'day'`.
- Chore `timeOfDay` on the type is `'morning' | 'midday' | 'evening' | 'any'`. `ChoresScreen` labels those segments Morning, Afternoon, Evening, and Chores.
- Lists kinds on the type are `'todo' | 'shopping' | 'other'`. Seeded lists are Shopping, To-Dos, and Holiday Packing. `ListsScreen` loads items with `listItems.filter` on `listId`.
- Seeded `itemCount` values in `initialLists` are 3, 2, and 3. Four `initialListItems` rows use `listId: 'list-2'` (To-Dos). `addListItem` / `deleteListItem` increment and decrement `itemCount` on the list record.
- Rewards categories on the type are `'treat' | 'privilege' | 'activity' | 'item'`. `RewardsScreen` creates redemptions with `status: 'pending'`.
- Meals week plans use Monday as the week start (`startOfWeek(..., { weekStartsOn: 1 })`). Meal slots on the type are `breakfast`, `lunch`, `dinner`, and `snacks`.

`getResponsiveLayout` in `src/utils/helpers.ts` treats a device as a tablet when the smaller side is at least 768 or the aspect ratio is under 1.6. Calendar, Chores, Lists, Profiles, Rewards, and Meals screens call it. Lists, Rewards, and Chores also compare width to `768` locally.

## Data lifetimes

Seed arrays are constants in `src/store/index.ts`. `useAppStore` is `create` from Zustand with no persist wrapper. Nothing in the store writes those arrays to disk or to Supabase.

`featureFlags` initial values: `plusFeatures: false`, `sidekick: false`, `rewards: true`. The only writer found is `toggleFeatureFlag`. No screen reads `featureFlags`.

## Supabase meals path

1. `src/components/MealBrowser.tsx` imports `mealApiService` from `src/services/mealApi.ts`.
2. `MealApiService` calls `supabaseMealApiService` in `src/services/supabaseMealApi.ts`.
3. That service calls `recipeService` methods, which run `typedSupabase.from('recipes_foodcom')`.

`RecipeService` methods that issue that query: `searchRecipes`, `getRecipeById`, `getRandomRecipes`, `getRecipesByCategory`, `getPopularRecipes`, `getQuickRecipes`, `getHealthyRecipes`, `getCategories`.

`mealApi.ts` exposes `searchMeals`, `getRandomMeals`, `getMealsByCategory`, `getPopularMeals`, `getQuickMeals`, `getHealthyMeals`, and `getCategories`. Its file comment says the service uses Supabase. There is no TheMealDB client in `src/`.

`recipeService.ts` has no insert, update, or delete calls. `validateConfig` in `src/config/environment.ts` checks that the URL and anon key are non-empty and are not the placeholder strings `https://your-project.supabase.co` and `your-anon-key`.

## Dependencies present and unused in `src/`

`package.json` includes `react-native-reanimated`, `expo-linear-gradient`, `react-native-vector-icons`, and `expo-dev-client`. Under `src/`, reanimated and `react-native-vector-icons` have no imports. `expo-linear-gradient` appears only in a commented import in `ProfilesScreen.tsx`. Icons in the navigator come from `@expo/vector-icons`. `@react-native-community/datetimepicker` is imported by `EventFormScreen.tsx`.

## Tooling files

- `eslint.config.js` and `.eslintrc.js` are both in the repo root.
- `.prettierrc` sets semicolons, ES5 trailing commas, single quotes, print width 80, and 2-space indent.
- `app.json` points at `./assets/icon.png`, `./assets/splash-icon.png`, `./assets/adaptive-icon.png`, and `./assets/favicon.png`. Those four files are in `assets/`.
- No `babel.config.js`, `metro.config.js`, CI workflow, or test directory is in the tree.

## Other root files

- `install-expo-go.sh` uses `xcrun simctl` and a hardcoded Expo URL. See the README.
- `test-app.html` is a static page. It is not referenced by `package.json` or the Expo entry.
- `expo-go.tar.gz` and `expo-go-ios.tar.gz` are in the root. Their contents are not tar archives (see the pull request notes).
