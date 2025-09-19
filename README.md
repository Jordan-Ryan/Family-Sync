# Family Sync - Skylight-like Family Organizer

A React Native app built with Expo and TypeScript that provides family organization features similar to Skylight. The app includes Calendar, Chores, and Lists modules with profile-based color coding and responsive layouts for phones and tablets.

## Features

### ✅ Fully Implemented
- **Profiles Management**: Color-coded family member profiles with role-based organization and filtering
- **Lists Module**: Complete CRUD operations for shopping, to-do, and custom lists with item management
- **Chores Module**: Time-segmented chores (morning/midday/evening/any) with completion tracking and celebrations
- **Calendar Module**: Day/Week/Month views with profile color coding and navigation
- **Responsive Design**: Adaptive layouts for phones and tablets with proper touch targets
- **State Management**: Zustand store with comprehensive TypeScript interfaces
- **Navigation**: React Navigation with tab and stack navigation
- **Mock Data**: Pre-populated with sample profiles, events, chores, and lists

### 🚧 Future Enhancements
- **Schedule View**: List-style calendar view for comprehensive event overview
- **Event Detail Screens**: Full CRUD operations for events with recurrence editing
- **Chore Detail Screens**: Advanced chore management and creation
- **Profile Detail Screens**: Individual profile management and statistics

## Tech Stack

- **React Native** with Expo
- **TypeScript** for type safety
- **Zustand** for state management
- **React Navigation** for navigation
- **date-fns** for date handling
- **React Native Reanimated** for animations
- **ESLint & Prettier** for code quality

## Project Structure

```
src/
├── types/           # TypeScript interfaces and types
├── store/           # Zustand store configuration
├── screens/         # Screen components
│   ├── Calendar/    # Calendar module screens
│   ├── Chores/      # Chores module screens
│   ├── Lists/       # Lists module screens
│   └── Profiles/    # Profiles module screens
├── navigation/      # Navigation configuration
└── utils/           # Utility functions and helpers
```

## Data Models

### Profile
- `id`: Unique identifier
- `name`: Display name (Jordan, Gemma, Esmé)
- `role`: 'parent' or 'child'
- `color`: Hex color code for visual identification

### Event
- `id`: Unique identifier
- `title`: Event name
- `start/end`: ISO date strings
- `allDay`: Boolean flag
- `location`: Optional location
- `notes`: Optional notes
- `profileIds`: Array of assigned profile IDs
- `recurrence`: Recurrence pattern configuration

### Chore
- `id`: Unique identifier
- `title`: Chore description
- `profileIds`: Array of assigned profile IDs
- `startDate`: Start date for recurrence
- `timeOfDay`: 'morning' | 'midday' | 'evening' | 'any'
- `scheduledTime`: Optional time for timed chores
- `type`: 'timed' | 'allDay' | 'anytime'
- `recurrence`: Recurrence pattern
- `completedBy`: Array of completion records
- `rewardStars`: Optional reward system (future feature)

### List & ListItem
- `List`: Container with name, kind, color, and item count
- `ListItem`: Individual items with title, checked status, and optional metadata

## Getting Started

### Prerequisites
- Node.js (v16 or later)
- Expo CLI
- iOS Simulator or Android Emulator (or physical device)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Family-Sync
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
npm run ios     # iOS Simulator
npm run android # Android Emulator
npm run web     # Web browser
```

## Development

### Code Quality
The project uses ESLint and Prettier for consistent code formatting:

```bash
npm run lint     # Check for linting errors
npm run lint:fix # Fix auto-fixable linting errors
```

### State Management
The app uses Zustand for state management with TypeScript interfaces. The store is located in `src/store/index.ts` and includes:

- Profile management (CRUD operations)
- Event management with recurrence support
- Chore management with completion tracking
- List and item management
- Filter and feature flag management

### Responsive Design
The app includes responsive utilities in `src/utils/helpers.ts`:

- `isTablet()`: Detects tablet devices
- `getResponsiveLayout()`: Returns layout configuration based on screen size
- Adaptive spacing, font sizes, and touch targets

## Mock Data

The app includes pre-populated mock data:

- **3 Profiles**: Jordan (parent, blue), Gemma (parent, green), Esmé (child, orange)
- **Sample Events**: School runs, soccer practice, family movie night, weekend trip
- **Sample Chores**: Morning/evening routines, lawn mowing, dishes
- **Sample Lists**: Shopping, To-Dos, Holiday packing

## Future Features

### Plus Features (Feature Flagged)
- Sidekick AI imports (emails, PDFs, photos, voice)
- Star rewards system
- External calendar sync
- Meal planning integration

### Planned Enhancements
- Offline-first architecture
- Real-time synchronization
- Advanced recurrence patterns
- Weather integration
- Export/import functionality

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

Inspired by Skylight's family organization approach with profile-based color coding and comprehensive family management features.
