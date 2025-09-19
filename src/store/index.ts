import { create } from 'zustand';
import { format, startOfWeek } from 'date-fns';
import { AppStore, Profile, Event, Chore, List, ListItem, Reward, RewardRedemption, Meal, MealPlan } from '../types';
import { generateId } from '../utils/helpers';

const initialProfiles: Profile[] = [
  { id: 'profile-1', name: 'Jordan', role: 'parent', color: '#2F80ED' },
  { id: 'profile-2', name: 'Gemma', role: 'parent', color: '#27AE60' },
  { id: 'profile-3', name: 'Esmé', role: 'child', color: '#F2994A' },
];

// Helper function to add default fields to events
const addEventDefaults = (event: Partial<Event> & { id: string; title: string; start: string; end: string; allDay: boolean; profileIds: string[]; recurrence: any }): Event => ({
  ...event,
  description: event.description || '',
  location: event.location || '',
  locationDetails: event.locationDetails || '',
  notes: event.notes || '',
  category: event.category || 'other',
  priority: event.priority || 'medium',
  reminder: event.reminder || { minutes: 15, enabled: false },
  attachments: event.attachments || [],
  isPrivate: event.isPrivate || false,
  createdBy: event.createdBy || 'profile-1',
  createdAt: event.createdAt || new Date().toISOString(),
  updatedAt: event.updatedAt || new Date().toISOString(),
});

const initialEvents: Event[] = [
  // Past week events (last 7 days)
  addEventDefaults({
    id: 'event-1',
    title: 'Morning School Run',
    start: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T08:00:00.000Z'),
    end: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T08:30:00.000Z'),
    allDay: false,
    location: 'Elementary School',
    profileIds: ['profile-1', 'profile-3'],
    recurrence: { freq: 'daily', interval: 1, byWeekday: [1, 2, 3, 4, 5] },
    category: 'family',
  }),
  addEventDefaults({
    id: 'event-2',
    title: 'Soccer Practice',
    start: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T16:00:00.000Z'),
    end: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T17:30:00.000Z'),
    allDay: false,
    location: 'Community Sports Center',
    profileIds: ['profile-3'],
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [2] },
    category: 'education',
  }),
  addEventDefaults({
    id: 'event-3',
    title: 'Grocery Shopping',
    start: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T10:00:00.000Z'),
    end: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T11:30:00.000Z'),
    allDay: false,
    location: 'Supermarket',
    profileIds: ['profile-1', 'profile-2'],
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [3] },
    category: 'personal',
  }),
  addEventDefaults({
    id: 'event-4',
    title: 'Dentist Appointment',
    description: 'Regular checkup and cleaning for Esmé. Please bring insurance card and arrive 10 minutes early.',
    start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T14:00:00.000Z'),
    end: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T15:00:00.000Z'),
    allDay: false,
    location: 'Family Dental Clinic',
    locationDetails: '123 Main Street, Suite 200',
    notes: 'Remember to bring insurance card',
    profileIds: ['profile-3'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'health',
    priority: 'high',
    reminder: { minutes: 30, enabled: true },
    isPrivate: false,
    createdBy: 'profile-1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  }),
  addEventDefaults({
    id: 'event-5',
    title: 'Family Movie Night',
    description: 'Weekly family tradition - we watch a movie together and have popcorn! This week we\'re watching a Disney classic.',
    start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T19:00:00.000Z'),
    end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T21:00:00.000Z'),
    allDay: false,
    location: 'Living Room',
    locationDetails: 'Home - Main living area',
    notes: 'Don\'t forget the popcorn!',
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [6] },
    category: 'family',
    priority: 'medium',
    reminder: { minutes: 15, enabled: true },
    isPrivate: false,
    createdBy: 'profile-1',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
  }),
  addEventDefaults({
    id: 'event-6',
    title: 'Weekend Brunch',
    start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T10:00:00.000Z'),
    end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T12:00:00.000Z'),
    allDay: false,
    location: 'Local Café',
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'social',
  }),

  // Today's events
  addEventDefaults({
    id: 'event-7',
    title: 'Early Morning Workout',
    start: new Date().toISOString().replace(/T.*/, 'T05:30:00.000Z'),
    end: new Date().toISOString().replace(/T.*/, 'T06:30:00.000Z'),
    allDay: false,
    location: 'Home Gym',
    profileIds: ['profile-1'],
    recurrence: { freq: 'daily', interval: 1, byWeekday: [1, 2, 3, 4, 5] },
    category: 'health',
  }),
  addEventDefaults({
    id: 'event-8',
    title: 'Morning School Run',
    start: new Date().toISOString().replace(/T.*/, 'T08:00:00.000Z'),
    end: new Date().toISOString().replace(/T.*/, 'T08:30:00.000Z'),
    allDay: false,
    location: 'Elementary School',
    profileIds: ['profile-1', 'profile-3'],
    recurrence: { freq: 'daily', interval: 1, byWeekday: [1, 2, 3, 4, 5] },
    category: 'family',
  }),
  addEventDefaults({
    id: 'event-8b',
    title: 'Work Meeting',
    description: 'Weekly team standup meeting to discuss project progress and upcoming deadlines.',
    start: new Date().toISOString().replace(/T.*/, 'T14:00:00.000Z'),
    end: new Date().toISOString().replace(/T.*/, 'T15:00:00.000Z'),
    allDay: false,
    location: 'Office',
    locationDetails: 'Conference Room A, 2nd Floor',
    notes: 'Prepare quarterly report updates',
    profileIds: ['profile-1'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'work',
    priority: 'high',
    reminder: { minutes: 10, enabled: true },
    isPrivate: true,
    createdBy: 'profile-1',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  }),
  addEventDefaults({
    id: 'event-9',
    title: 'Homework Time',
    start: new Date().toISOString().replace(/T.*/, 'T16:00:00.000Z'),
    end: new Date().toISOString().replace(/T.*/, 'T17:00:00.000Z'),
    allDay: false,
    location: 'Study Room',
    profileIds: ['profile-3'],
    recurrence: { freq: 'daily', interval: 1, byWeekday: [1, 2, 3, 4, 5] },
    category: 'education',
  }),
  addEventDefaults({
    id: 'event-9b',
    title: 'Late Night Reading',
    start: new Date().toISOString().replace(/T.*/, 'T22:30:00.000Z'),
    end: new Date().toISOString().replace(/T.*/, 'T23:30:00.000Z'),
    allDay: false,
    location: 'Bedroom',
    profileIds: ['profile-1'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'personal',
  }),

  // Tomorrow's events
  addEventDefaults({
    id: 'event-10',
    title: 'Morning School Run',
    start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T08:00:00.000Z'),
    end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T08:30:00.000Z'),
    allDay: false,
    location: 'Elementary School',
    profileIds: ['profile-1', 'profile-3'],
    recurrence: { freq: 'daily', interval: 1, byWeekday: [1, 2, 3, 4, 5] },
    category: 'family',
  }),
  addEventDefaults({
    id: 'event-11',
    title: 'Soccer Practice',
    start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T16:00:00.000Z'),
    end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T17:30:00.000Z'),
    allDay: false,
    location: 'Community Sports Center',
    profileIds: ['profile-3'],
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [2] },
    category: 'education',
  }),
  addEventDefaults({
    id: 'event-12',
    title: 'Parent-Teacher Conference',
    start: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T18:00:00.000Z'),
    end: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T19:00:00.000Z'),
    allDay: false,
    location: 'School',
    profileIds: ['profile-1', 'profile-2'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'education',
    priority: 'high',
  }),

  // This week's events
  addEventDefaults({
    id: 'event-13',
    title: 'Art Class',
    start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T15:30:00.000Z'),
    end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T16:30:00.000Z'),
    allDay: false,
    location: 'Community Center',
    profileIds: ['profile-3'],
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [4] },
    category: 'education',
  }),
  addEventDefaults({
    id: 'event-14',
    title: 'Date Night',
    start: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T19:30:00.000Z'),
    end: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T22:00:00.000Z'),
    allDay: false,
    location: 'Restaurant',
    profileIds: ['profile-1', 'profile-2'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'social',
    priority: 'high',
  }),
  addEventDefaults({
    id: 'event-15',
    title: 'Swimming Lessons',
    start: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T16:00:00.000Z'),
    end: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T17:00:00.000Z'),
    allDay: false,
    location: 'Aquatic Center',
    profileIds: ['profile-3'],
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [5] },
    category: 'education',
  }),
  addEventDefaults({
    id: 'event-16',
    title: 'Family Game Night',
    start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T19:00:00.000Z'),
    end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T21:30:00.000Z'),
    allDay: false,
    location: 'Living Room',
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [6] },
    category: 'family',
  }),
  addEventDefaults({
    id: 'event-17',
    title: 'Sunday Brunch',
    start: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T10:30:00.000Z'),
    end: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T12:30:00.000Z'),
    allDay: false,
    location: 'Grandma\'s House',
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'family',
  }),

  // Next week's events
  addEventDefaults({
    id: 'event-18',
    title: 'School Field Trip',
    start: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T09:00:00.000Z'),
    end: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T15:00:00.000Z'),
    allDay: false,
    location: 'Science Museum',
    profileIds: ['profile-3'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'education',
    priority: 'high',
  }),
  addEventDefaults({
    id: 'event-19',
    title: 'Birthday Party',
    start: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T14:00:00.000Z'),
    end: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T17:00:00.000Z'),
    allDay: false,
    location: 'Friend\'s House',
    profileIds: ['profile-3'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'social',
  }),
  addEventDefaults({
    id: 'event-20',
    title: 'Weekend Getaway',
    start: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T00:00:00.000Z'),
    end: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T23:59:59.000Z'),
    allDay: true,
    location: 'Mountain Resort',
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'family',
    priority: 'high',
  }),

  // Future events (2-3 weeks ahead)
  addEventDefaults({
    id: 'event-21',
    title: 'School Concert',
    start: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T18:30:00.000Z'),
    end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T20:00:00.000Z'),
    allDay: false,
    location: 'School Auditorium',
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'education',
    priority: 'high',
  }),
  addEventDefaults({
    id: 'event-22',
    title: 'Holiday Preparations',
    start: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T10:00:00.000Z'),
    end: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T16:00:00.000Z'),
    allDay: false,
    location: 'Home',
    profileIds: ['profile-1', 'profile-2'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'personal',
  }),
  addEventDefaults({
    id: 'event-23',
    title: 'Holiday Celebration',
    start: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T00:00:00.000Z'),
    end: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().replace(/T.*/, 'T23:59:59.000Z'),
    allDay: true,
    location: 'Home',
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
    recurrence: { freq: 'none', interval: 1 },
    category: 'family',
    priority: 'high',
  }),
];

// Helper function to add default fields to chores
const addChoreDefaults = (chore: Partial<Chore> & { id: string; title: string; profileIds: string[]; startDate: string; timeOfDay: any; type: any; recurrence: any }): Chore => ({
  ...chore,
  description: chore.description || '',
  completedBy: chore.completedBy || [],
  rewardStars: chore.rewardStars || 0,
  isShared: chore.isShared || false,
  requiresApproval: chore.requiresApproval || false,
  createdBy: chore.createdBy || 'profile-1',
  createdAt: chore.createdAt || new Date().toISOString(),
  updatedAt: chore.updatedAt || new Date().toISOString(),
});

const initialChores: Chore[] = [
  // Esmé's chores
  addChoreDefaults({
    id: 'chore-1',
    title: 'Brush Teeth',
    profileIds: ['profile-3'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'morning',
    type: 'timed',
    scheduledTime: '07:30',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [{ 
      profileId: 'profile-3', 
      date: new Date().toISOString().split('T')[0],
      completedAt: new Date().toISOString(),
      status: 'approved' as const,
      approvedBy: 'profile-1',
      approvedAt: new Date().toISOString()
    }],
    rewardStars: 10,
    requiresApproval: true,
  }),
  addChoreDefaults({
    id: 'chore-2',
    title: 'Get Dressed',
    profileIds: ['profile-3'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'morning',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 5,
    requiresApproval: false,
  }),
  addChoreDefaults({
    id: 'chore-3',
    title: 'Make Bed',
    profileIds: ['profile-3'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'morning',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 5,
    requiresApproval: false,
  }),
  addChoreDefaults({
    id: 'chore-4',
    title: 'Shower',
    profileIds: ['profile-3'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'morning',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 10,
    requiresApproval: true,
  }),
  addChoreDefaults({
    id: 'chore-4b',
    title: 'Lunch Prep',
    profileIds: ['profile-3'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'midday',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 8,
    requiresApproval: false,
  }),
  addChoreDefaults({
    id: 'chore-5',
    title: 'Homework',
    profileIds: ['profile-3'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'evening',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 15,
    requiresApproval: true,
  }),
  addChoreDefaults({
    id: 'chore-6',
    title: 'Tidy Room',
    profileIds: ['profile-3'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'evening',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 10,
    requiresApproval: true,
  }),
  
  // Shared chore example - anyone can complete
  addChoreDefaults({
    id: 'chore-shared-1',
    title: 'Unload Dishwasher',
    description: 'Empty the dishwasher and put dishes away',
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'any',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 15,
    isShared: true,
    requiresApproval: false,
  }),
  
  // Jordan's chores
  addChoreDefaults({
    id: 'chore-7',
    title: 'Brush Teeth',
    profileIds: ['profile-1'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'morning',
    type: 'timed',
    scheduledTime: '07:00',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 5,
    requiresApproval: false,
  }),
  addChoreDefaults({
    id: 'chore-8',
    title: 'Get Dressed',
    profileIds: ['profile-1'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'morning',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 5,
    requiresApproval: false,
  }),
  addChoreDefaults({
    id: 'chore-9',
    title: 'Make Bed',
    profileIds: ['profile-1'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'morning',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 5,
    requiresApproval: false,
  }),
  addChoreDefaults({
    id: 'chore-9b',
    title: 'Work Break',
    profileIds: ['profile-1'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'midday',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 5,
    requiresApproval: false,
  }),
  addChoreDefaults({
    id: 'chore-10',
    title: 'Mow Lawn',
    profileIds: ['profile-1'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'any',
    type: 'allDay',
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [0] },
    completedBy: [],
    rewardStars: 25,
    requiresApproval: true,
  }),
  addChoreDefaults({
    id: 'chore-11',
    title: 'Wash Car',
    profileIds: ['profile-1'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'any',
    type: 'allDay',
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [6] },
    completedBy: [],
    rewardStars: 20,
    requiresApproval: true,
  }),
  addChoreDefaults({
    id: 'chore-12',
    title: 'Clean Library',
    profileIds: ['profile-1'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'any',
    type: 'anytime',
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [3] },
    completedBy: [],
    rewardStars: 15,
    requiresApproval: true,
  }),
  addChoreDefaults({
    id: 'chore-13',
    title: 'Rake Garden',
    profileIds: ['profile-1'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'any',
    type: 'anytime',
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [4] },
    completedBy: [],
    rewardStars: 15,
    requiresApproval: true,
  }),
  addChoreDefaults({
    id: 'chore-14',
    title: 'Clean Bathroom',
    profileIds: ['profile-1'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'any',
    type: 'anytime',
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [5] },
    completedBy: [],
    rewardStars: 20,
    requiresApproval: true,
  }),
  
  // Gemma's chores
  addChoreDefaults({
    id: 'chore-15',
    title: 'Brush Teeth',
    profileIds: ['profile-2'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'morning',
    type: 'timed',
    scheduledTime: '07:15',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 5,
    requiresApproval: false,
  }),
  addChoreDefaults({
    id: 'chore-16',
    title: 'Get Dressed',
    profileIds: ['profile-2'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'morning',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 5,
    requiresApproval: false,
  }),
  addChoreDefaults({
    id: 'chore-17',
    title: 'Make Bed',
    profileIds: ['profile-2'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'morning',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 5,
    requiresApproval: false,
  }),
  addChoreDefaults({
    id: 'chore-17b',
    title: 'Grocery Shopping',
    profileIds: ['profile-2'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'midday',
    type: 'anytime',
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [3] },
    completedBy: [],
    rewardStars: 15,
    requiresApproval: true,
  }),
  addChoreDefaults({
    id: 'chore-18',
    title: 'Dishes',
    profileIds: ['profile-2'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'evening',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 10,
    requiresApproval: false,
  }),
  addChoreDefaults({
    id: 'chore-19',
    title: 'Cook Dinner',
    profileIds: ['profile-2'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'evening',
    type: 'anytime',
    recurrence: { freq: 'daily', interval: 1 },
    completedBy: [],
    rewardStars: 15,
    requiresApproval: true,
  }),
  addChoreDefaults({
    id: 'chore-20',
    title: 'Laundry',
    profileIds: ['profile-2'],
    startDate: '2024-01-15T00:00:00.000Z',
    timeOfDay: 'any',
    type: 'anytime',
    recurrence: { freq: 'weekly', interval: 1, byWeekday: [1] },
    completedBy: [],
    rewardStars: 20,
    requiresApproval: true,
  }),
];

const initialLists: List[] = [
  {
    id: 'list-1',
    name: 'Shopping',
    kind: 'shopping',
    color: '#E74C3C',
    itemCount: 3,
  },
  {
    id: 'list-2',
    name: 'To-Dos',
    kind: 'todo',
    color: '#3498DB',
    itemCount: 2,
  },
  {
    id: 'list-3',
    name: 'Holiday Packing',
    kind: 'other',
    color: '#9B59B6',
    itemCount: 3,
  },
];

const initialListItems: ListItem[] = [
  { id: 'item-1', listId: 'list-1', title: 'Milk', checked: false, quantity: '1 gallon' },
  { id: 'item-2', listId: 'list-1', title: 'Eggs', checked: false, quantity: '1 dozen' },
  { id: 'item-3', listId: 'list-1', title: 'Bread', checked: false, quantity: '1 loaf' },
  { id: 'item-4', listId: 'list-2', title: 'Book dentist appointment', checked: false, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'high' },
  { id: 'item-5', listId: 'list-2', title: 'Car MOT', checked: false, dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'medium' },
  { id: 'item-6', listId: 'list-3', title: 'Pack swimsuit', checked: false, quantity: '2 pieces' },
  { id: 'item-9', listId: 'list-3', title: 'Pack sunscreen', checked: false, quantity: '1 bottle' },
  { id: 'item-10', listId: 'list-3', title: 'Pack towels', checked: false, quantity: '4 towels' },
  { id: 'item-7', listId: 'list-2', title: 'Submit tax return', checked: false, dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'high', notes: 'Due last week - urgent!' },
  { id: 'item-8', listId: 'list-2', title: 'Plan birthday party', checked: false, dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], priority: 'low' },
];

const initialRewards: Reward[] = [
  // TREATS - Small, frequent rewards
  {
    id: 'reward-1',
    title: 'Ice Cream Treat',
    description: 'Get your favorite ice cream from the store',
    starCost: 25,
    category: 'treat',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-2',
    title: 'Candy Bar',
    description: 'Pick any candy bar you want',
    starCost: 15,
    category: 'treat',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-3',
    title: 'Bubble Gum',
    description: 'A pack of your favorite bubble gum',
    starCost: 10,
    category: 'treat',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-4',
    title: 'Special Dessert',
    description: 'Mom or Dad makes your favorite dessert',
    starCost: 30,
    category: 'treat',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-5',
    title: 'Hot Chocolate',
    description: 'Warm hot chocolate with marshmallows',
    starCost: 20,
    category: 'treat',
    isActive: true,
    profileIds: ['profile-3'],
  },

  // PRIVILEGES - Special permissions and choices
  {
    id: 'reward-6',
    title: 'Extra Screen Time',
    description: '30 minutes of additional screen time',
    starCost: 50,
    category: 'privilege',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-7',
    title: 'Choose Dinner',
    description: 'Pick what the family has for dinner',
    starCost: 75,
    category: 'privilege',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-8',
    title: 'Stay Up Late',
    description: 'Stay up 1 hour past bedtime',
    starCost: 100,
    category: 'privilege',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-9',
    title: 'Skip a Chore',
    description: 'Skip one chore of your choice this week',
    starCost: 60,
    category: 'privilege',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-10',
    title: 'Choose Family Activity',
    description: 'Pick what the family does together this weekend',
    starCost: 80,
    category: 'privilege',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-11',
    title: 'Extra Bedtime Story',
    description: 'Get an extra bedtime story tonight',
    starCost: 40,
    category: 'privilege',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-12',
    title: 'Choose Your Outfit',
    description: 'Wear whatever you want to school (within reason)',
    starCost: 35,
    category: 'privilege',
    isActive: true,
    profileIds: ['profile-3'],
  },

  // ACTIVITIES - Fun experiences and outings
  {
    id: 'reward-13',
    title: 'Family Movie Night',
    description: 'Choose the movie for family movie night',
    starCost: 60,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-14',
    title: 'Park Play Date',
    description: 'Extra time at the playground with friends',
    starCost: 45,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-15',
    title: 'Baking Together',
    description: 'Bake cookies or cake with Mom or Dad',
    starCost: 70,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-16',
    title: 'Art & Craft Time',
    description: 'Special art project with all the supplies you need',
    starCost: 55,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-17',
    title: 'Game Night Choice',
    description: 'Pick the games for family game night',
    starCost: 50,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-18',
    title: 'Library Visit',
    description: 'Extra trip to the library to pick new books',
    starCost: 40,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-19',
    title: 'Nature Walk',
    description: 'Family walk in the park or nature trail',
    starCost: 35,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-20',
    title: 'Pizza Night',
    description: 'Order pizza for dinner (your choice of toppings)',
    starCost: 65,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-3'],
  },

  // ITEMS - Physical rewards and purchases
  {
    id: 'reward-21',
    title: 'New Book',
    description: 'Pick out a new book to buy',
    starCost: 80,
    category: 'item',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-22',
    title: 'Art Supplies',
    description: 'New markers, crayons, or craft supplies',
    starCost: 60,
    category: 'item',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-23',
    title: 'Small Toy',
    description: 'Pick out a small toy (under $15)',
    starCost: 120,
    category: 'item',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-24',
    title: 'Stickers Pack',
    description: 'A pack of your favorite stickers',
    starCost: 30,
    category: 'item',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-25',
    title: 'Coloring Book',
    description: 'New coloring book of your choice',
    starCost: 40,
    category: 'item',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-26',
    title: 'Puzzle',
    description: 'A new puzzle to work on together',
    starCost: 70,
    category: 'item',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-27',
    title: 'Special Pencil Set',
    description: 'Fancy pencils, erasers, and pencil case',
    starCost: 50,
    category: 'item',
    isActive: true,
    profileIds: ['profile-3'],
  },
  {
    id: 'reward-28',
    title: 'Magazine Subscription',
    description: 'Kids magazine subscription for 3 months',
    starCost: 90,
    category: 'item',
    isActive: true,
    profileIds: ['profile-3'],
  },

  // FAMILY REWARDS - Rewards that benefit the whole family
  {
    id: 'reward-29',
    title: 'Family Picnic',
    description: 'Plan and enjoy a family picnic in the park',
    starCost: 100,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
  },
  {
    id: 'reward-30',
    title: 'Family Breakfast',
    description: 'Special family breakfast with pancakes and bacon',
    starCost: 80,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
  },
  {
    id: 'reward-31',
    title: 'Family Board Game',
    description: 'New family board game to play together',
    starCost: 150,
    category: 'item',
    isActive: true,
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
  },
  {
    id: 'reward-32',
    title: 'Family Movie Theater',
    description: 'Go to the movie theater as a family',
    starCost: 200,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
  },
  {
    id: 'reward-33',
    title: 'Family Zoo Trip',
    description: 'Visit the zoo together as a family',
    starCost: 300,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
  },
  {
    id: 'reward-34',
    title: 'Family Museum Visit',
    description: 'Explore a children\'s museum together',
    starCost: 250,
    category: 'activity',
    isActive: true,
    profileIds: ['profile-1', 'profile-2', 'profile-3'],
  },
];

const initialRewardRedemptions: RewardRedemption[] = [
  {
    id: 'redemption-1',
    rewardId: 'reward-4',
    profileId: 'profile-3',
    redeemedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    notes: 'Chocolate chip ice cream',
  },
];

const initialMeals: Meal[] = [];

const initialMealPlans: MealPlan[] = [];

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  profiles: initialProfiles,
  events: initialEvents,
  chores: initialChores,
  lists: initialLists,
  listItems: initialListItems,
  rewards: initialRewards,
  rewardRedemptions: initialRewardRedemptions,
  meals: initialMeals,
  mealPlans: initialMealPlans,
  selectedProfileIds: [],
  selectedChoreFilter: 'all', // Filter for chores screen
  featureFlags: {
    plusFeatures: false,
    sidekick: false,
    rewards: true, // Enable rewards feature
  },

  // Profile actions
  addProfile: (profile) => {
    const newProfile: Profile = {
      ...profile,
      id: generateId('profile'),
    };
    set((state) => ({
      profiles: [...state.profiles, newProfile],
    }));
  },

  updateProfile: (id, updates) => {
    set((state) => ({
      profiles: state.profiles.map((profile) =>
        profile.id === id ? { ...profile, ...updates } : profile
      ),
    }));
  },

  deleteProfile: (id) => {
    set((state) => ({
      profiles: state.profiles.filter((profile) => profile.id !== id),
      selectedProfileIds: state.selectedProfileIds.filter((pid) => pid !== id),
    }));
  },

  // Event actions
  addEvent: (event) => {
    const newEvent: Event = addEventDefaults({
      ...event,
      id: generateId('event'),
    });
    set((state) => ({
      events: [...state.events, newEvent],
    }));
  },

  updateEvent: (id, updates) => {
    set((state) => ({
      events: state.events.map((event) =>
        event.id === id ? { ...event, ...updates, updatedAt: new Date().toISOString() } : event
      ),
    }));
  },

  deleteEvent: (id) => {
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    }));
  },

  // Chore actions
  addChore: (chore) => {
    const newChore: Chore = {
      ...chore,
      id: generateId('chore'),
      description: chore.description || '',
      completedBy: chore.completedBy || [],
      rewardStars: chore.rewardStars || 0,
      isShared: chore.isShared || false,
      requiresApproval: chore.requiresApproval || false,
      createdBy: chore.createdBy || 'profile-1',
      createdAt: chore.createdAt || new Date().toISOString(),
      updatedAt: chore.updatedAt || new Date().toISOString(),
    };
    set((state) => ({
      chores: [...state.chores, newChore],
    }));
  },

  updateChore: (id, updates) => {
    set((state) => ({
      chores: state.chores.map((chore) =>
        chore.id === id ? { ...chore, ...updates } : chore
      ),
    }));
  },

  deleteChore: (id) => {
    set((state) => ({
      chores: state.chores.filter((chore) => chore.id !== id),
    }));
  },

  completeChore: (choreId, profileId, date) => {
    set((state) => ({
      chores: state.chores.map((chore) => {
        if (chore.id !== choreId) return chore;
        
        const existingCompletion = chore.completedBy.find(
          (c) => c.profileId === profileId && c.date === date
        );
        
        if (existingCompletion) return chore;
        
        // For shared chores, remove completion from other profiles for the same date
        let updatedCompletedBy = chore.completedBy;
        if (chore.isShared) {
          updatedCompletedBy = chore.completedBy.filter(
            (c) => !(c.date === date)
          );
        }
        
        const newCompletion = {
          profileId,
          date,
          completedAt: new Date().toISOString(),
          status: chore.requiresApproval ? 'pending_approval' as const : 'approved' as const,
        };
        
        return {
          ...chore,
          completedBy: [...updatedCompletedBy, newCompletion],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  uncompleteChore: (choreId, profileId, date) => {
    set((state) => ({
      chores: state.chores.map((chore) => {
        if (chore.id !== choreId) return chore;
        
        return {
          ...chore,
          completedBy: chore.completedBy.filter(
            (c) => !(c.profileId === profileId && c.date === date)
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  approveChore: (choreId, profileId, date, approvedBy) => {
    set((state) => ({
      chores: state.chores.map((chore) => {
        if (chore.id !== choreId) return chore;
        
        return {
          ...chore,
          completedBy: chore.completedBy.map((completion) => {
            if (completion.profileId === profileId && completion.date === date) {
              return {
                ...completion,
                status: 'approved' as const,
                approvedBy,
                approvedAt: new Date().toISOString(),
              };
            }
            return completion;
          }),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  rejectChore: (choreId, profileId, date, rejectedBy) => {
    set((state) => ({
      chores: state.chores.map((chore) => {
        if (chore.id !== choreId) return chore;
        
        return {
          ...chore,
          completedBy: chore.completedBy.map((completion) => {
            if (completion.profileId === profileId && completion.date === date) {
              return {
                ...completion,
                status: 'rejected' as const,
                approvedBy: rejectedBy,
                approvedAt: new Date().toISOString(),
              };
            }
            return completion;
          }),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  },

  // List actions
  addList: (list) => {
    const newList: List = {
      ...list,
      id: generateId('list'),
      itemCount: 0,
    };
    set((state) => ({
      lists: [...state.lists, newList],
    }));
  },

  updateList: (id, updates) => {
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === id ? { ...list, ...updates } : list
      ),
    }));
  },

  deleteList: (id) => {
    set((state) => ({
      lists: state.lists.filter((list) => list.id !== id),
      listItems: state.listItems.filter((item) => item.listId !== id),
    }));
  },

  // List item actions
  addListItem: (item) => {
    const newItem: ListItem = {
      ...item,
      id: generateId('item'),
    };
    set((state) => ({
      listItems: [...state.listItems, newItem],
      lists: state.lists.map((list) =>
        list.id === item.listId
          ? { ...list, itemCount: list.itemCount + 1 }
          : list
      ),
    }));
  },

  updateListItem: (id, updates) => {
    set((state) => ({
      listItems: state.listItems.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  },

  deleteListItem: (id) => {
    set((state) => {
      const item = state.listItems.find((i) => i.id === id);
      if (!item) return state;
      
      return {
        listItems: state.listItems.filter((item) => item.id !== id),
        lists: state.lists.map((list) =>
          list.id === item.listId
            ? { ...list, itemCount: Math.max(0, list.itemCount - 1) }
            : list
        ),
      };
    });
  },

  toggleListItem: (id) => {
    set((state) => ({
      listItems: state.listItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      ),
    }));
  },

  // Filter actions
  setSelectedProfileIds: (profileIds) => {
    set({ selectedProfileIds: profileIds });
  },

  toggleProfileFilter: (profileId) => {
    set((state) => {
      const isSelected = state.selectedProfileIds.includes(profileId);
      return {
        selectedProfileIds: isSelected
          ? state.selectedProfileIds.filter((id) => id !== profileId)
          : [...state.selectedProfileIds, profileId],
      };
    });
  },

  setChoreFilter: (profileId) => {
    set({ selectedChoreFilter: profileId });
  },

  // Feature flag actions
  toggleFeatureFlag: (flag) => {
    set((state) => ({
      featureFlags: {
        ...state.featureFlags,
        [flag]: !state.featureFlags[flag],
      },
    }));
  },

  // Reward actions
  addReward: (reward) => {
    const newReward: Reward = {
      ...reward,
      id: generateId('reward'),
    };
    set((state) => ({
      rewards: [...state.rewards, newReward],
    }));
  },

  updateReward: (id, updates) => {
    set((state) => ({
      rewards: state.rewards.map((reward) =>
        reward.id === id ? { ...reward, ...updates } : reward
      ),
    }));
  },

  deleteReward: (id) => {
    set((state) => ({
      rewards: state.rewards.filter((reward) => reward.id !== id),
      rewardRedemptions: state.rewardRedemptions.filter((redemption) => redemption.rewardId !== id),
    }));
  },

  // Reward redemption actions
  addRewardRedemption: (redemption) => {
    const newRedemption: RewardRedemption = {
      ...redemption,
      id: generateId('redemption'),
    };
    set((state) => ({
      rewardRedemptions: [...state.rewardRedemptions, newRedemption],
    }));
  },

  updateRewardRedemption: (id, updates) => {
    set((state) => ({
      rewardRedemptions: state.rewardRedemptions.map((redemption) =>
        redemption.id === id ? { ...redemption, ...updates } : redemption
      ),
    }));
  },

  deleteRewardRedemption: (id) => {
    set((state) => ({
      rewardRedemptions: state.rewardRedemptions.filter((redemption) => redemption.id !== id),
    }));
  },

  // Meal actions
  addMeal: (meal) => {
    console.log('🏪 Store: Adding meal to store:', { name: meal.name, ingredients: meal.ingredients?.length });
    const newMeal: Meal = {
      ...meal,
      id: generateId('meal'),
    };
    console.log('🏪 Store: Generated meal with ID:', newMeal.id);
    set((state) => {
      const updatedMeals = [...state.meals, newMeal];
      console.log('🏪 Store: Updated meals array length:', updatedMeals.length);
      return {
        meals: updatedMeals,
      };
    });
  },

  updateMeal: (id, updates) => {
    set((state) => ({
      meals: state.meals.map((meal) =>
        meal.id === id ? { ...meal, ...updates } : meal
      ),
    }));
  },

  deleteMeal: (id) => {
    set((state) => ({
      meals: state.meals.filter((meal) => meal.id !== id),
      mealPlans: state.mealPlans.map((mealPlan) => {
        const updatedMeals = { ...mealPlan.meals };
        Object.keys(updatedMeals).forEach((day) => {
          const dayMeals = updatedMeals[day];
          if (dayMeals.breakfast === id) dayMeals.breakfast = undefined;
          if (dayMeals.lunch === id) dayMeals.lunch = undefined;
          if (dayMeals.dinner === id) dayMeals.dinner = undefined;
          if (dayMeals.snacks) {
            dayMeals.snacks = dayMeals.snacks.filter((snackId) => snackId !== id);
          }
        });
        return { ...mealPlan, meals: updatedMeals };
      }),
    }));
  },

  // Meal plan actions
  addMealPlan: (mealPlan) => {
    console.log('🏪 Store: Adding meal plan to store:', { weekStartDate: mealPlan.weekStartDate });
    const newMealPlan: MealPlan = {
      ...mealPlan,
      id: generateId('mealplan'),
    };
    console.log('🏪 Store: Generated meal plan with ID:', newMealPlan.id);
    set((state) => {
      const updatedMealPlans = [...state.mealPlans, newMealPlan];
      console.log('🏪 Store: Updated meal plans array length:', updatedMealPlans.length);
      return {
        mealPlans: updatedMealPlans,
      };
    });
  },

  updateMealPlan: (id, updates) => {
    set((state) => ({
      mealPlans: state.mealPlans.map((mealPlan) =>
        mealPlan.id === id ? { ...mealPlan, ...updates } : mealPlan
      ),
    }));
  },

  deleteMealPlan: (id) => {
    set((state) => ({
      mealPlans: state.mealPlans.filter((mealPlan) => mealPlan.id !== id),
    }));
  },

  removeMealFromPlan: (weekDate, day, mealType, profileId, mealId) => {
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
    const weekStartString = format(weekStart, 'yyyy-MM-dd');
    
    set((state) => ({
      mealPlans: state.mealPlans.map((mealPlan) => {
        if (mealPlan.weekStartDate === weekStartString) {
          const updatedMeals = { ...mealPlan.meals };
          if (!updatedMeals[day]) {
            updatedMeals[day] = {};
          }

          const mealData = updatedMeals[day][mealType as keyof typeof updatedMeals[typeof day]];
          
          if (Array.isArray(mealData)) {
            // New structure: array of MealAssignment
            const mealAssignments = mealData as any[];
            // Remove ALL assignments for this meal ID (not just for the specific profile)
            const filteredAssignments = mealAssignments.filter(
              assignment => assignment.mealId !== mealId
            );
            
            if (mealType === 'snacks') {
              updatedMeals[day].snacks = filteredAssignments;
            } else {
              (updatedMeals[day] as any)[mealType] = filteredAssignments;
            }
          } else {
            // Old structure: single meal ID or array of meal IDs for snacks
            if (mealType === 'snacks') {
              const snackArray = Array.isArray(mealData) ? mealData : [];
              updatedMeals[day].snacks = snackArray.filter(id => id !== mealId);
            } else {
              (updatedMeals[day] as any)[mealType] = undefined;
            }
          }

          return {
            ...mealPlan,
            meals: updatedMeals,
          };
        }
        return mealPlan;
      }),
    }));
  },
}));
