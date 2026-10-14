# AGENTS.md

Notes for changing this repository. Behavior of the app is described in [docs/STATE.md](docs/STATE.md). Setup and npm scripts are in [README.md](README.md).

## What this tree is

An Expo SDK 54 React Native app. `package.json` `"main"` is `index.ts`, which calls `registerRootComponent` with `./App`. Root `App.tsx` re-exports `src/App`. `src/App.tsx` mounts `SafeAreaProvider`, `GestureHandlerRootView`, and `AppNavigator`.

Family data for calendar, chores, lists, profiles, rewards, and meal plans is the Zustand store in `src/store/index.ts`. That store is memory-only. Meal search reads Supabase table `recipes_foodcom` through `src/services/recipeService.ts`.

## Commands

Use the scripts in `package.json` and nothing else:

- `npm install`
- `npm start` (`expo start`)
- `npm run android` (`expo run:android`)
- `npm run ios` (`expo run:ios`)
- `npm run web` (`expo start --web`)
- `npm run lint` / `npm run lint:fix`
- `npm run format`
- `npm run type-check` (`tsc --noEmit`)

`/ios` and `/android` are gitignored and are not checked in. There is no test script.

## Where to edit

- Screens: `src/screens/<Area>/`
- Tabs and stack: `src/navigation/AppNavigator.tsx`
- Types: `src/types/index.ts`
- State and seed data: `src/store/index.ts`
- Recipe queries: `src/services/recipeService.ts`, `src/services/supabaseMealApi.ts`, `src/services/mealApi.ts`
- Supabase URL and anon key: `src/config/environment.ts` (literals, not environment variables)
- Responsive helpers: `src/utils/helpers.ts` (`isTablet`, `getResponsiveLayout`)

`MealDetailScreen.tsx` and `MealFormScreen.tsx` are not imported by `AppNavigator`. `ProfileDetailScreen.tsx` is registered and renders a short placeholder. See `docs/STATE.md` before wiring or deleting a screen.

## Constraints that match the repo

- TypeScript, with `strict` enabled via `tsconfig.json`.
- Two ESLint files exist: `eslint.config.js` and `.eslintrc.js`. The lint script is `eslint src --ext .ts,.tsx` and the ESLint dependency is `^9.35.0`.
- Prettier settings are in `.prettierrc`.
- `src/config/environment.ts` holds a Supabase URL and anon key in source. Do not copy those values into markdown, logs, or new files.
- This repo has no SQL migrations. Schema comments in docs should follow `src/config/supabase.ts` and the queries in `recipeService.ts`.
- `react-native-reanimated` is listed in `package.json` and is not imported under `src/`. There is no `babel.config.js` and no `metro.config.js` in the tree.
- Do not add readiness, launch, or quality claims to docs or UI copy.

## Docs

When code and docs disagree, update `README.md`, this file, and `docs/STATE.md` from the source. `SUPABASE_SETUP.md` was removed because it described a `recipes` table, TheMealDB fallback, and write APIs that are not in the services.
