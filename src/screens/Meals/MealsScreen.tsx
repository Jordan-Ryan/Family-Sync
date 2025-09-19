import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

import { useAppStore } from '../../store';
import { Meal, MealPlan, DayOfWeek, Profile, MealAssignment } from '../../types';
import { getResponsiveLayout } from '../../utils/helpers';
import MealBrowser from '../../components/MealBrowser';
import MealDetailModal from '../../components/MealDetailModal';
import { ProcessedMeal } from '../../services/mealApi';

const DAYS_OF_WEEK: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', icon: 'B', color: '#FFA500', enabled: false },
  { key: 'lunch', label: 'Lunch', icon: 'L', color: '#87CEEB', enabled: true },
  { key: 'dinner', label: 'Dinner', icon: 'D', color: '#FFB347', enabled: true },
  { key: 'snacks', label: 'Snack', icon: 'S', color: '#98FB98', enabled: false },
];

interface MealSlotProps {
  meal: Meal | null;
  mealType: string;
  profiles: Profile[];
  onPress: () => void;
  onAddPress?: () => void;
  layout: ReturnType<typeof getResponsiveLayout>;
  showAddButton: boolean;
}

const MealSlot: React.FC<MealSlotProps> = ({ meal, mealType, profiles, onPress, onAddPress, layout, showAddButton }) => {
  const backgroundColor = meal ? '#e3f2fd' : '#f8f9fa'; // Use a neutral background for grouped meals
  
  return (
    <View style={[styles.mealSlot, { backgroundColor }]}>
      {meal ? (
        <TouchableOpacity
          style={styles.mealContent}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={[styles.mealName, { fontSize: layout.fontSize - 2 }]} numberOfLines={2}>
            {meal.name}
          </Text>
          <View style={styles.profileIndicators}>
            {profiles.map((profile, index) => (
              <View 
                key={profile.id} 
                style={[
                  styles.profileIndicator, 
                  { backgroundColor: profile.color },
                  index > 0 && styles.profileIndicatorOverlap
                ]}
              >
                <Text style={styles.profileInitial}>{profile.name.charAt(0)}</Text>
              </View>
            ))}
          </View>
        </TouchableOpacity>
      ) : showAddButton && onAddPress ? (
        <TouchableOpacity
          style={styles.emptyMealSlot}
          onPress={onAddPress}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={16} color="#ccc" />
        </TouchableOpacity>
      ) : (
        <View style={styles.emptyMealSlot} />
      )}
    </View>
  );
};

interface AddMealModalProps {
  visible: boolean;
  onClose: () => void;
  profiles: Profile[];
  onSelectProfiles: (profiles: Profile[]) => void;
  day: DayOfWeek;
  mealType: string;
  getMealsForProfile: (day: DayOfWeek, mealType: string, profile: Profile) => Meal[];
}

const AddMealModal: React.FC<AddMealModalProps> = ({ 
  visible, 
  onClose, 
  profiles, 
  onSelectProfiles,
  day,
  mealType,
  getMealsForProfile
}) => {
  const [selectedProfiles, setSelectedProfiles] = useState<Profile[]>([]);
  const dayInfo = DAYS_OF_WEEK.find(d => d.key === day);
  const mealTypeInfo = MEAL_TYPES.find(mt => mt.key === mealType);

  // Filter profiles to only show those who don't already have a meal for this day/meal type
  const availableProfiles = profiles.filter(profile => {
    const profileMeals = getMealsForProfile(day, mealType, profile);
    return profileMeals.length === 0;
  });

  const toggleProfile = (profile: Profile) => {
    setSelectedProfiles(prev => {
      const isSelected = prev.some(p => p.id === profile.id);
      if (isSelected) {
        return prev.filter(p => p.id !== profile.id);
      } else {
        return [...prev, profile];
      }
    });
  };

  const handleConfirm = () => {
    if (selectedProfiles.length === 0) {
      Alert.alert('No Selection', 'Please select at least one person for this meal.');
      return;
    }
    onSelectProfiles(selectedProfiles);
    setSelectedProfiles([]);
  };

  const handleClose = () => {
    setSelectedProfiles([]);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={handleClose}>
        <View style={styles.addMealModal}>
          <Text style={styles.modalTitle}>
            Add {mealTypeInfo?.label} for {dayInfo?.label}
          </Text>
          <Text style={styles.modalSubtitle}>Select who this meal is for:</Text>
          
          {availableProfiles.length === 0 ? (
            <Text style={styles.noProfilesText}>All family members already have a meal for this time slot.</Text>
          ) : (
            availableProfiles.map((profile) => {
              const isSelected = selectedProfiles.some(p => p.id === profile.id);
              return (
                <TouchableOpacity
                  key={profile.id}
                  style={[styles.profileOption, isSelected && styles.profileOptionSelected]}
                  onPress={() => toggleProfile(profile)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.profileAvatar, { backgroundColor: profile.color }]}>
                    <Text style={styles.profileInitial}>{profile.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              );
            })
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, selectedProfiles.length === 0 && styles.confirmButtonDisabled]}
              onPress={handleConfirm}
              activeOpacity={0.7}
              disabled={selectedProfiles.length === 0}
            >
              <Text style={[styles.confirmButtonText, selectedProfiles.length === 0 && styles.confirmButtonTextDisabled]}>
                Continue ({selectedProfiles.length})
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

interface CategoriesModalProps {
  visible: boolean;
  onClose: () => void;
  mealTypes: typeof MEAL_TYPES;
  onToggleMealType: (mealType: string) => void;
}

const CategoriesModal: React.FC<CategoriesModalProps> = ({ 
  visible, 
  onClose, 
  mealTypes, 
  onToggleMealType 
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.categoriesModal}>
          <Text style={styles.modalTitle}>Categories</Text>
          {mealTypes.map((mealType) => (
            <View key={mealType.key} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <View style={[styles.categoryIcon, { backgroundColor: mealType.color }]}>
                  <Text style={styles.categoryIconText}>{mealType.icon}</Text>
                </View>
                <Text style={styles.categoryLabel}>{mealType.label}</Text>
              </View>
              <View style={styles.categoryActions}>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    mealType.enabled && styles.toggleActive
                  ]}
                  onPress={() => onToggleMealType(mealType.key)}
                >
                  <View style={[
                    styles.toggleThumb,
                    mealType.enabled && styles.toggleThumbActive
                  ]} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.editButton}>
                  <Ionicons name="pencil" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const MealsScreen: React.FC = () => {
  const { meals, mealPlans, profiles, updateMealPlan, addMeal, addMealPlan, removeMealFromPlan } = useAppStore();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [showCategories, setShowCategories] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [showMealBrowser, setShowMealBrowser] = useState(false);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('monday');
  const [selectedMealType, setSelectedMealType] = useState<string>('lunch');
  const [selectedProfiles, setSelectedProfiles] = useState<Profile[]>([]);
  const [enabledMealTypes, setEnabledMealTypes] = useState(
    MEAL_TYPES.reduce((acc, type) => ({ ...acc, [type.key]: type.enabled }), {} as Record<string, boolean>)
  );
  const [screenData, setScreenData] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  
  const layout = getResponsiveLayout(screenData.width, screenData.height);

  // Get current week's meal plan
  const currentMealPlan = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
    const weekStartString = format(weekStart, 'yyyy-MM-dd');
    
    return mealPlans.find(plan => plan.weekStartDate === weekStartString) || null;
  }, [currentWeek, mealPlans]);

  // Generate week dates
  const weekDates = useMemo(() => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // Monday
    return DAYS_OF_WEEK.map((_, index) => addDays(weekStart, index));
  }, [currentWeek]);

  const handleMealPress = (day: DayOfWeek, mealType: string, profile: Profile) => {
    // Check if anyone has meals for this day/meal type
    const hasAnyMeals = profiles.some(p => {
      const profileMeals = getMealsForProfile(day, mealType, p);
      return profileMeals.length > 0;
    });

    if (hasAnyMeals) {
      // Someone has meals - get the meal from the first profile that has one
      const firstProfileWithMeal = profiles.find(p => {
        const profileMeals = getMealsForProfile(day, mealType, p);
        return profileMeals.length > 0;
      });
      
      if (firstProfileWithMeal) {
        const profileMeals = getMealsForProfile(day, mealType, firstProfileWithMeal);
        const meal = profileMeals[0];
        
        if (meal) {
          // Always show meal details directly when clicking on a meal
          setSelectedMeal(meal);
          setSelectedDay(day);
          setSelectedMealType(mealType);
          setShowMealDetail(true);
        }
      }
    } else {
      // No one has meals - show add modal
      setSelectedDay(day);
      setSelectedMealType(mealType);
      setShowAddMeal(true);
    }
  };

  const handleAddMealPress = (day: DayOfWeek, mealType: string) => {
    // Check if there are any profiles who don't have a meal for this day/meal type
    const availableProfiles = profiles.filter(profile => {
      const profileMeals = getMealsForProfile(day, mealType, profile);
      return profileMeals.length === 0;
    });

    if (availableProfiles.length === 0) {
      Alert.alert(
        'No Available Profiles',
        'All family members already have a meal for this time slot.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Show add meal modal when clicking the + button
    setSelectedDay(day);
    setSelectedMealType(mealType);
    setShowAddMeal(true);
  };

  const handleRemoveMeal = (day: DayOfWeek, mealType: string, profile: Profile, mealId: string) => {
    Alert.alert(
      'Remove Meal',
      'Are you sure you want to remove this meal from the plan?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            if (!currentMealPlan) return;
            
            const updatedMeals = { ...currentMealPlan.meals };
            if (!updatedMeals[day]) {
              updatedMeals[day] = {};
            }

            const mealData = updatedMeals[day][mealType as keyof typeof updatedMeals[typeof day]];
            
            if (Array.isArray(mealData)) {
              // New structure: array of MealAssignment
              const mealAssignments = mealData as MealAssignment[];
              const filteredAssignments = mealAssignments.filter(
                assignment => !(assignment.mealId === mealId && assignment.profileId === profile.id)
              );
              
              if (mealType === 'snacks') {
                updatedMeals[day].snacks = filteredAssignments;
              } else {
                (updatedMeals[day] as any)[mealType] = filteredAssignments;
              }
            } else if (typeof mealData === 'string' && mealData === mealId) {
              // Old structure: single meal ID string - remove it
              if (mealType === 'snacks') {
                updatedMeals[day].snacks = [];
              } else {
                delete (updatedMeals[day] as any)[mealType];
              }
            }

            updateMealPlan(currentMealPlan.id, {
              meals: updatedMeals,
            });
          }
        },
      ]
    );
  };

  const getAssignedProfiles = (mealId: string) => {
    if (!selectedDay || !selectedMealType) return [];
    
    const assignedProfiles: Array<{ id: string; name: string; color: string }> = [];
    
    profiles.forEach(profile => {
      const profileMeals = getMealsForProfile(selectedDay, selectedMealType, profile);
      if (profileMeals.some(meal => meal.id === mealId)) {
        assignedProfiles.push({
          id: profile.id,
          name: profile.name,
          color: profile.color
        });
      }
    });
    
    return assignedProfiles;
  };

  const handleAddPersonToMeal = (profileId: string) => {
    if (!selectedMeal || !selectedDay || !selectedMealType) return;
    
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    // Check if person already has a meal for this slot
    const existingMeals = getMealsForProfile(selectedDay, selectedMealType, profile);
    if (existingMeals.length > 0) {
      Alert.alert(
        'Already Has Meal',
        `${profile.name} already has a meal for ${selectedMealType} on ${DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label}. Remove their current meal first.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Add the meal assignment
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekStartString = format(weekStart, 'yyyy-MM-dd');
    
    const mealPlan = mealPlans.find(plan => plan.weekStartDate === weekStartString);
    if (!mealPlan) return;
    
    const updatedMeals = { ...mealPlan.meals };
    if (!updatedMeals[selectedDay]) {
      updatedMeals[selectedDay] = {};
    }
    
    const mealData = updatedMeals[selectedDay][selectedMealType as keyof typeof updatedMeals[typeof selectedDay]];
    const mealAssignments = Array.isArray(mealData) ? [...mealData] : [];
    
    mealAssignments.push({
      mealId: selectedMeal.id,
      profileId: profileId
    });
    
    if (selectedMealType === 'snacks') {
      updatedMeals[selectedDay].snacks = mealAssignments;
    } else {
      (updatedMeals[selectedDay] as any)[selectedMealType] = mealAssignments;
    }
    
    updateMealPlan(mealPlan.id, {
      meals: updatedMeals,
    });
    
    Alert.alert('Success', `${profile.name} has been added to this meal.`);
  };

  const handleRemovePersonFromMeal = (profileId: string) => {
    if (!selectedMeal || !selectedDay || !selectedMealType) return;
    
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    
    Alert.alert(
      'Remove Person',
      `Remove ${profile.name} from this meal?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            removeMealFromPlan(currentWeek, selectedDay, selectedMealType, profileId, selectedMeal.id);
            Alert.alert('Success', `${profile.name} has been removed from this meal.`);
          }
        },
      ]
    );
  };

  const handleRemoveMealFromDetail = () => {
    if (!selectedMeal || !selectedDay || !selectedMealType) return;
    
    // Find the first profile who has this meal
    const firstProfileWithMeal = profiles.find(p => {
      const profileMeals = getMealsForProfile(selectedDay, selectedMealType, p);
      return profileMeals.length > 0 && profileMeals[0].id === selectedMeal.id;
    });

    if (firstProfileWithMeal) {
      Alert.alert(
        'Remove Meal',
        'Are you sure you want to remove this meal from the plan for everyone?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Remove for Everyone', 
            style: 'destructive',
            onPress: () => {
              removeMealFromPlan(currentWeek, selectedDay, selectedMealType, firstProfileWithMeal.id, selectedMeal.id);
              setShowMealDetail(false);
              setSelectedMeal(null);
            }
          },
        ]
      );
    }
  };

  const handleSelectProfiles = (profiles: Profile[]) => {
    setSelectedProfiles(profiles);
    setShowAddMeal(false);
    setShowMealBrowser(true);
  };

  const handleSelectMeal = (mealData: ProcessedMeal) => {
    console.log('🍽️ handleSelectMeal called with:', {
      mealName: mealData.name,
      selectedProfiles: selectedProfiles.length,
      selectedDay,
      selectedMealType,
      currentWeek: currentWeek.toISOString()
    });

    if (selectedProfiles.length === 0) {
      console.log('❌ No profiles selected');
      Alert.alert('No Selection', 'Please select at least one person for this meal.');
      return;
    }

    if (!selectedDay || !selectedMealType) {
      console.log('❌ Missing day or meal type:', { selectedDay, selectedMealType });
      Alert.alert('Error', 'Missing day or meal type information. Please try again.');
      return;
    }

    try {
      console.log('✅ Starting meal creation process...');

      // Convert ProcessedMeal to our Meal interface
      const newMeal: Omit<Meal, 'id'> = {
        name: mealData.name || 'Untitled Meal',
        description: mealData.description || '',
        category: mealData.category || 'dinner',
        prepTime: mealData.prepTime,
        cookTime: mealData.cookTime,
        servings: mealData.servings,
        ingredients: mealData.ingredients || [],
        instructions: mealData.instructions || [],
        tags: mealData.tags || [],
        imageUrl: mealData.imageUrl,
        area: mealData.area,
        source: mealData.source,
        youtubeUrl: mealData.youtubeUrl,
      };

      console.log('📝 Created meal object:', { name: newMeal.name, ingredients: newMeal.ingredients.length });

      // Add meal to store (it will generate its own ID)
      console.log('💾 Adding meal to store...');
      addMeal(newMeal);

      // Small delay to ensure state update
      setTimeout(() => {
        console.log('🔍 Searching for created meal in store...');
        
        // Update meal plan
        const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
        const weekStartString = format(weekStart, 'yyyy-MM-dd');
        
        console.log('📅 Week info:', { weekStart: weekStartString });
        
        let updatedMealPlan = currentMealPlan;
        if (!updatedMealPlan) {
          console.log('📋 Creating new meal plan...');
          // Create new meal plan for this week
          updatedMealPlan = {
            id: `plan_${Date.now()}`,
            weekStartDate: weekStartString,
            meals: {},
            profileIds: profiles.map(p => p.id),
          };
          // Add the new meal plan to the store
          addMealPlan(updatedMealPlan);
        }

        // Get the newly created meal from the store with a more robust search
        // First try exact match, then fallback to name match
        let createdMeal = meals.find(meal => 
          meal.name === newMeal.name && 
          meal.ingredients.length === newMeal.ingredients.length &&
          meal.category === newMeal.category &&
          meal.imageUrl === newMeal.imageUrl
        );
        
        // If exact match fails, try just name and ingredient count
        if (!createdMeal) {
          createdMeal = meals.find(meal => 
            meal.name === newMeal.name && 
            meal.ingredients.length === newMeal.ingredients.length
          );
        }
        
        // If still not found, try just name match
        if (!createdMeal) {
          createdMeal = meals.find(meal => meal.name === newMeal.name);
        }
        
        console.log('🔍 Meal search result:', { 
          found: !!createdMeal, 
          mealId: createdMeal?.id,
          totalMeals: meals.length,
          searchCriteria: {
            name: newMeal.name,
            ingredientsLength: newMeal.ingredients.length,
            category: newMeal.category,
            imageUrl: newMeal.imageUrl
          },
          allMeals: meals.map(m => ({ id: m.id, name: m.name, category: m.category }))
        });
        
        if (!createdMeal) {
          console.log('❌ Failed to find created meal in store');
          Alert.alert('Error', 'Failed to add meal to the store. Please try again.');
          return;
        }

          console.log('📝 Updating meal plan with assignments...');
          
          // Update the specific meal slot with assignments for selected profiles
          const updatedMeals = { ...updatedMealPlan.meals };
          if (!updatedMeals[selectedDay]) {
            updatedMeals[selectedDay] = {};
          }

          // Create meal assignments for each selected profile
          const mealAssignments = selectedProfiles.map(profile => ({
            mealId: createdMeal.id,
            profileId: profile.id,
          }));

          console.log('👥 Created meal assignments:', {
            mealId: createdMeal.id,
            assignments: mealAssignments.length,
            profiles: selectedProfiles.map(p => p.name)
          });

          if (selectedMealType === 'snacks') {
            updatedMeals[selectedDay].snacks = mealAssignments;
          } else {
            (updatedMeals[selectedDay] as any)[selectedMealType] = mealAssignments;
          }

          console.log('💾 Updating meal plan in store...');
          updateMealPlan(updatedMealPlan.id, {
            meals: updatedMeals,
          });

          console.log('✅ Meal successfully added!');

          // Reset state
          setSelectedProfiles([]);
          setShowMealBrowser(false);

          const profileNames = selectedProfiles.map(p => p.name).join(', ');
          Alert.alert(
            'Success',
            `${mealData.name} has been added as ${selectedMealType} for ${profileNames} on ${DAYS_OF_WEEK.find(d => d.key === selectedDay)?.label}`,
            [{ text: 'OK' }]
          );

        }, 200); // Longer delay to ensure state update

      } catch (error) {
        console.error('❌ Error adding meal:', error);
        Alert.alert(
          'Error', 
          'Something went wrong while adding the meal. Please try again.',
          [{ text: 'OK' }]
        );
      }
    };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = addDays(currentWeek, direction === 'next' ? 7 : -7);
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const toggleMealType = (mealType: string) => {
    setEnabledMealTypes(prev => ({
      ...prev,
      [mealType]: !prev[mealType]
    }));
  };

  const getMealById = (mealId: string | undefined) => {
    return mealId ? meals.find(meal => meal.id === mealId) : null;
  };

  const getMealsForProfile = (day: DayOfWeek, mealType: string, profile: Profile) => {
    const dayMeals = currentMealPlan?.meals[day];
    if (!dayMeals) return [];

    const mealData = dayMeals[mealType as keyof typeof dayMeals];
    
    // Handle both old and new data structures
    if (!mealData) return [];
    
    // Check if it's the new structure (array of MealAssignment)
    if (Array.isArray(mealData)) {
      // Check if it's MealAssignment objects or just strings
      if (mealData.length > 0 && typeof mealData[0] === 'object' && 'mealId' in mealData[0]) {
        const mealAssignments = mealData as MealAssignment[];
        return mealAssignments
          .filter(assignment => assignment.profileId === profile.id)
          .map(assignment => getMealById(assignment.mealId))
          .filter(meal => meal !== null) as Meal[];
      } else {
        // Old structure: array of meal ID strings
        const mealIds = mealData as string[];
        return mealIds
          .map(mealId => getMealById(mealId))
          .filter(meal => meal !== null) as Meal[];
      }
    }
    
    // Handle old structure (single meal ID string)
    if (typeof mealData === 'string') {
      const meal = getMealById(mealData);
      return meal ? [meal] : [];
    }
    
    return [];
  };

  const enabledMealTypesList = MEAL_TYPES.filter(type => enabledMealTypes[type.key]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { fontSize: layout.fontSize + 6 }]}>
            {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), 'MMM d')} - {format(addDays(startOfWeek(currentWeek, { weekStartsOn: 1 }), 6), 'MMM d, yyyy')}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.categoriesButton}
              onPress={() => setShowCategories(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.categoriesButtonText}>Categories</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateWeek('prev')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => navigateWeek('next')}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={24} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.todayButton}
              onPress={goToCurrentWeek}
              activeOpacity={0.7}
            >
              <Text style={styles.todayButtonText}>Today</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.mealGrid}>
        {/* Days Header */}
        <View style={styles.daysHeader}>
          <View style={styles.mealTypeColumn} />
          {DAYS_OF_WEEK.map((day, index) => {
            const date = weekDates[index];
            const isToday = isSameDay(date, new Date());
            return (
              <View key={day.key} style={[styles.dayHeader, isToday && styles.todayDayHeader]}>
                <Text style={[styles.dayLabel, isToday && styles.todayText]}>
                  {day.short}
                </Text>
                <Text style={[styles.dayNumber, isToday && styles.todayText]}>
                  {format(date, 'd')}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Meal Rows */}
        {enabledMealTypesList.map((mealType) => (
          <View key={mealType.key} style={styles.mealRow}>
            <View style={styles.mealTypeLabel}>
              <Text style={[styles.mealTypeText, { fontSize: layout.fontSize - 2 }]}>
                {mealType.label}
              </Text>
            </View>
            {DAYS_OF_WEEK.map((day) => {
              // Get all meals for this day and meal type
              const allMealsForDay = profiles.flatMap(profile => {
                const profileMeals = getMealsForProfile(day.key, mealType.key, profile);
                return profileMeals.map(meal => ({ meal, profile }));
              });

              // Group meals by meal ID to avoid duplicates
              const uniqueMeals = new Map();
              allMealsForDay.forEach(({ meal, profile }) => {
                if (!uniqueMeals.has(meal.id)) {
                  uniqueMeals.set(meal.id, {
                    meal,
                    profiles: [profile]
                  });
                } else {
                  uniqueMeals.get(meal.id).profiles.push(profile);
                }
              });

              const hasAnyMeal = uniqueMeals.size > 0;
              const mealsArray = Array.from(uniqueMeals.values());

              // Check if everyone has meals for this day/meal type
              const everyoneHasMeals = profiles.every(profile => {
                const profileMeals = getMealsForProfile(day.key, mealType.key, profile);
                return profileMeals.length > 0;
              });

              return (
                <View key={day.key} style={styles.dayColumn}>
                  {mealsArray.map((mealGroup, index) => (
                    <MealSlot
                      key={`${day.key}-${mealType.key}-${mealGroup.meal.id}`}
                      meal={mealGroup.meal}
                      mealType={mealType.key}
                      profiles={mealGroup.profiles}
                      onPress={() => handleMealPress(day.key, mealType.key, mealGroup.profiles[0])}
                      layout={layout}
                      showAddButton={false} // Never show add button on existing meals
                    />
                  ))}
                  {!everyoneHasMeals && (
                    <MealSlot
                      key={`${day.key}-${mealType.key}-empty`}
                      meal={null}
                      mealType={mealType.key}
                      profiles={[]}
                      onPress={() => handleMealPress(day.key, mealType.key, profiles[0])}
                      onAddPress={() => handleAddMealPress(day.key, mealType.key)}
                      layout={layout}
                      showAddButton={true}
                    />
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      <AddMealModal
        visible={showAddMeal}
        onClose={() => setShowAddMeal(false)}
        profiles={profiles}
        onSelectProfiles={handleSelectProfiles}
        day={selectedDay}
        mealType={selectedMealType}
        getMealsForProfile={getMealsForProfile}
      />

      <CategoriesModal
        visible={showCategories}
        onClose={() => setShowCategories(false)}
        mealTypes={MEAL_TYPES.map(type => ({ ...type, enabled: enabledMealTypes[type.key] }))}
        onToggleMealType={toggleMealType}
      />

      <MealBrowser
        visible={showMealBrowser}
        onClose={() => {
          setShowMealBrowser(false);
          setSelectedProfiles([]);
        }}
        onSelectMeal={handleSelectMeal}
        mealType={selectedMealType}
      />

      <MealDetailModal
        visible={showMealDetail}
        onClose={() => {
          setShowMealDetail(false);
          setSelectedMeal(null);
        }}
        meal={selectedMeal}
        onRemove={handleRemoveMealFromDetail}
        showRemoveButton={true}
        showPeopleManagement={true}
        assignedProfiles={selectedMeal ? getAssignedProfiles(selectedMeal.id) : []}
        allProfiles={profiles.map(p => ({ id: p.id, name: p.name, color: p.color }))}
        onAddPerson={handleAddPersonToMeal}
        onRemovePerson={handleRemovePersonFromMeal}
      />


      {/* Action Buttons */}
      <View style={[styles.actionButtons, { bottom: layout.spacing * 2 }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.customMealButton]}
          onPress={() => {
            // Navigate to custom meal form
            // Note: You'll need to add navigation prop to this component
            console.log('Navigate to custom meal form');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>Custom</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.addMealButton]}
          onPress={() => {
            setShowMealBrowser(true);
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="restaurant-outline" size={20} color="#fff" />
          <Text style={[styles.actionButtonText, styles.addMealButtonText]}>Browse</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    color: '#212529',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoriesButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  categoriesButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  todayButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  mealGrid: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  daysHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mealTypeColumn: {
    width: 80,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  todayDayHeader: {
    backgroundColor: '#ff4444',
    borderRadius: 20,
    marginHorizontal: 2,
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6c757d',
    marginBottom: 2,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  todayText: {
    color: '#fff',
  },
  mealRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  mealTypeLabel: {
    width: 80,
    justifyContent: 'center',
    paddingVertical: 8,
    paddingRight: 8,
  },
  mealTypeText: {
    fontWeight: '600',
    color: '#212529',
    transform: [{ rotate: '-90deg' }],
    textAlign: 'center',
  },
  dayColumn: {
    flex: 1,
    gap: 4,
  },
  mealSlot: {
    borderRadius: 8,
    padding: 8,
    minHeight: 60,
    justifyContent: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  mealContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  mealName: {
    fontWeight: '500',
    color: '#212529',
    marginBottom: 4,
  },
  profileIndicators: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  profileIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileIndicatorOverlap: {
    marginLeft: -8,
  },
  profileInitial: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  emptyMealSlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMealModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
    textAlign: 'center',
  },
  noProfilesText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 20,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  profileName: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  profileOptionSelected: {
    backgroundColor: '#f0f8ff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  confirmButtonDisabled: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  confirmButtonTextDisabled: {
    color: '#999',
  },
  categoriesModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryIconText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  categoryLabel: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  categoryActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  editButton: {
    padding: 4,
  },
  actionButtons: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 6,
  },
  customMealButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addMealButton: {
    backgroundColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  addMealButtonText: {
    color: '#fff',
  },
});

export default MealsScreen;
