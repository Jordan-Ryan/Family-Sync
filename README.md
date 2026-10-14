# Family Sync

Expo app (`family-sync` in `package.json`, `Family-Sync` in `app.json`) for family calendars, chores, lists, profiles, rewards, and meals. UI code lives under `src/`. Seed data and edits stay in a Zustand store in memory for the process lifetime.

A file-by-file description of screens, routes, and store actions is in [docs/STATE.md](docs/STATE.md). Notes for agents are in [AGENTS.md](AGENTS.md).

## Stack

From `package.json` and `app.json`:

- Expo `~54.0.6`, React `19.1.0`, React Native `0.81.4`, TypeScript `~5.9.2`
- React Navigation `7` (`native`, `bottom-tabs`, `stack`)
- Zustand `^5.0.8`
- `@supabase/supabase-js` `^2.57.4` (meals browser)
- `date-fns` `^4.1.0`
- `expo-dev-client` `~6.0.12`
- ESLint `^9.35.0` and Prettier `^3.6.2`

`package.json` has no `engines` field. `app.json` sets `newArchEnabled` to `true`, portrait orientation, iOS `supportsTablet`, bundle id `com.anonymous.Family-Sync`, and Android `edgeToEdgeEnabled`.

## Layout

```
index.ts                 # registerRootComponent(App)
App.tsx                  # re-exports src/App
src/App.tsx              # providers and AppNavigator
src/navigation/          # tabs and stack
src/screens/             # Calendar, Chores, Lists, Profiles, Rewards, Meals
src/components/          # MealBrowser, MealDetailModal
src/store/index.ts       # Zustand store and seed data
src/types/index.ts
src/services/            # recipe and meal API wrappers
src/config/              # Supabase client and environment.ts
src/utils/helpers.ts
assets/                  # icon, splash, adaptive icon, favicon
```

## Setup

1. Clone and enter the repo:

```bash
git clone https://github.com/Jordan-Ryan/Family-Sync.git
cd Family-Sync
```

2. Install dependencies:

```bash
npm install
```

There is no `.env` file and no `.env.example`. `.gitignore` ignores `.env*.local`, and `src/config/environment.ts` does not read `process.env`. The Supabase URL and anon key are string literals in that file. The meals code uses them as-is.

## Scripts

Defined in `package.json`:

| Script | Command |
| --- | --- |
| `npm start` | `expo start` |
| `npm run android` | `expo run:android` |
| `npm run ios` | `expo run:ios` |
| `npm run web` | `expo start --web` |
| `npm run lint` | `eslint src --ext .ts,.tsx` |
| `npm run lint:fix` | `eslint src --ext .ts,.tsx --fix` |
| `npm run format` | `prettier --write src/**/*.{ts,tsx}` |
| `npm run type-check` | `tsc --noEmit` |

`tsconfig.json` extends `expo/tsconfig.base` and sets `strict` to `true`.

`/ios` and `/android` are listed in `.gitignore` and are not in this tree. `npm run ios` and `npm run android` are the Expo prebuild/run commands above.

`install-expo-go.sh` is a macOS shell script. It looks up a booted simulator named `iPad Pro 13-inch (M4)` with `xcrun simctl`, opens the Expo Go App Store page on that simulator, and prints `exp://192.168.1.101:8081`.

There is no test script and no test files in the tree. There is no `LICENSE` file.

## Meals data

`MealBrowser` calls `mealApiService` (`src/services/mealApi.ts`), which calls `supabaseMealApiService`, which calls `RecipeService` (`src/services/recipeService.ts`). Those reads use the Supabase client in `src/config/supabase.ts` and the table name `recipes_foodcom`.

The `Database` type in `src/config/supabase.ts` also describes `recipes` and `categories`. `recipeService.ts` does not query those two tables. This repo has no SQL migrations. Selected meals are copied into the Zustand `meals` and `mealPlans` arrays, which start empty.

## Seed data

`src/store/index.ts` initializes the store with in-memory arrays. The store is created with `zustand`'s `create` and has no persist middleware. `package.json` does not depend on AsyncStorage.

Seeded profiles are Jordan (`parent`, `#2F80ED`), Gemma (`parent`, `#27AE60`), and Esmé (`child`, `#F2994A`). The same file seeds events, chores, lists, list items, rewards, and one reward redemption. `meals` and `mealPlans` start as empty arrays.

`featureFlags` in that initial state are `plusFeatures: false`, `sidekick: false`, and `rewards: true`. No screen reads `featureFlags`. The Rewards tab is registered in `src/navigation/AppNavigator.tsx` with the other tabs.
