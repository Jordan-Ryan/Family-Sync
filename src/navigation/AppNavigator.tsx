import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { useAppStore } from '../store';
import CalendarScreen from '../screens/Calendar/CalendarScreen';
import ChoresScreen from '../screens/Chores/ChoresScreen';
import ListsScreen from '../screens/Lists/ListsScreen';
import ProfilesScreen from '../screens/Profiles/ProfilesScreen';
import RewardsScreen from '../screens/Rewards/RewardsScreen';
import MealsScreen from '../screens/Meals/MealsScreen';
import EventDetailScreen from '../screens/Calendar/EventDetailScreen';
import EventFormScreen from '../screens/Calendar/EventFormScreen';
import ChoreDetailScreen from '../screens/Chores/ChoreDetailScreen';
import ChoreFormScreen from '../screens/Chores/ChoreFormScreen';
import ProfileDetailScreen from '../screens/Profiles/ProfileDetailScreen';

export type RootStackParamList = {
  MainTabs: undefined;
  EventDetail: { eventId: string };
  EventForm: { eventId?: string; selectedDate?: string };
  ChoreDetail: { choreId: string };
  ProfileDetail: { profileId: string };
  CreateEvent: undefined;
  CreateChore: { todoData?: { title: string; description?: string; dueDate?: string; priority?: string } } | undefined;
  EditChore: { choreId: string };
  ViewChore: { choreId: string };
  CreateList: undefined;
  CreateProfile: undefined;
};

export type MainTabParamList = {
  Calendar: undefined;
  Chores: undefined;
  Lists: undefined;
  Profiles: undefined;
  Rewards: undefined;
  Meals: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createStackNavigator<RootStackParamList>();

const MainTabNavigator = () => {
  const { profiles } = useAppStore();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Chores':
              iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
              break;
            case 'Lists':
              iconName = focused ? 'list' : 'list-outline';
              break;
            case 'Profiles':
              iconName = focused ? 'people' : 'people-outline';
              break;
            case 'Rewards':
              iconName = focused ? 'star' : 'star-outline';
              break;
            case 'Meals':
              iconName = focused ? 'restaurant' : 'restaurant-outline';
              break;
            default:
              iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2F80ED',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          paddingBottom: Platform.OS === 'ios' ? 20 : 5,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ title: 'Calendar' }}
      />
      <Tab.Screen 
        name="Chores" 
        component={ChoresScreen}
        options={{ title: 'Chores' }}
      />
      <Tab.Screen 
        name="Lists" 
        component={ListsScreen}
        options={{ title: 'Lists' }}
      />
      <Tab.Screen 
        name="Profiles" 
        component={ProfilesScreen}
        options={{ title: 'Family' }}
      />
      <Tab.Screen 
        name="Rewards" 
        component={RewardsScreen}
        options={{ title: 'Rewards' }}
      />
      <Tab.Screen 
        name="Meals" 
        component={MealsScreen}
        options={{ title: 'Meals' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          },
          headerTitleStyle: {
            fontWeight: '600',
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EventDetail" 
          component={EventDetailScreen}
          options={{ title: 'Event Details' }}
        />
        <Stack.Screen 
          name="EventForm" 
          component={EventFormScreen}
          options={{ title: 'Event Form', headerShown: false }}
        />
        <Stack.Screen 
          name="ChoreDetail" 
          component={ChoreDetailScreen}
          options={{ title: 'Chore Details' }}
        />
        <Stack.Screen 
          name="ProfileDetail" 
          component={ProfileDetailScreen}
          options={{ title: 'Profile Details' }}
        />
        <Stack.Screen 
          name="CreateChore" 
          component={ChoreFormScreen}
          options={{ title: 'Create Chore', headerShown: false }}
        />
        <Stack.Screen 
          name="EditChore" 
          component={ChoreFormScreen}
          options={{ title: 'Edit Chore', headerShown: false }}
        />
        <Stack.Screen 
          name="ViewChore" 
          component={ChoreFormScreen}
          options={{ title: 'View Chore', headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
