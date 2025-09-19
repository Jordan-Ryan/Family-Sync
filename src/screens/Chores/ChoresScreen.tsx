import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, isToday } from 'date-fns';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAppStore } from '../../store';
import { Chore, TimeOfDay, Profile } from '../../types';
import { getResponsiveLayout, isChoreCompleted, isTimeSegmentCompleted } from '../../utils/helpers';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ChoresScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

// Helper function to calculate card dimensions based on current screen size
const calculateCardDimensions = (screenWidth: number, screenHeight: number) => {
  const isTablet = screenWidth >= 768;
  const containerPadding = 32; // 16px padding on each side
  const cardSpacing = 16; // Space between cards
  const availableWidth = screenWidth - containerPadding;
  
  // For landscape mode on tablets, show more cards side by side
  const isLandscape = screenWidth > screenHeight;
  const cardsPerRow = isTablet ? (isLandscape ? 3 : 2) : 1;
  
  const cardWidth = isTablet ? (availableWidth - (cardSpacing * (cardsPerRow - 1))) / cardsPerRow : availableWidth;
  const cardMarginRight = cardSpacing;
  const itemTotalWidth = cardWidth + cardMarginRight;
  
  return {
    cardWidth,
    cardMarginRight,
    itemTotalWidth,
    isTablet,
    isLandscape,
    cardsPerRow,
  };
};

// Helper function to get emoji for chore
const getChoreEmoji = (title: string): string => {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('brush') || titleLower.includes('teeth')) return '🦷';
  if (titleLower.includes('dress') || titleLower.includes('clothes')) return '👕';
  if (titleLower.includes('bed') || titleLower.includes('make bed')) return '🛏️';
  if (titleLower.includes('shower') || titleLower.includes('bath')) return '🚿';
  if (titleLower.includes('homework') || titleLower.includes('study')) return '📚';
  if (titleLower.includes('dishes') || titleLower.includes('wash')) return '🍽️';
  if (titleLower.includes('clean') || titleLower.includes('tidy')) return '🧹';
  if (titleLower.includes('lawn') || titleLower.includes('mow')) return '🌱';
  if (titleLower.includes('car') || titleLower.includes('wash car')) return '🚗';
  if (titleLower.includes('garden') || titleLower.includes('rake')) return '🌿';
  if (titleLower.includes('bathroom')) return '🚽';
  if (titleLower.includes('library')) return '📖';
  return '✅';
};

interface TaskItemProps {
  chore: Chore;
  profile: Profile;
  onToggle: (choreId: string, profileId: string) => void;
  onPress: (choreId: string) => void;
  layout: ReturnType<typeof getResponsiveLayout>;
}

const TaskItem: React.FC<TaskItemProps> = ({ chore, profile, onToggle, onPress, layout }) => {
  const today = new Date().toISOString().split('T')[0];
  const completion = chore.completedBy.find(
    (c) => c.profileId === profile.id && c.date === today
  );
  const isCompleted = !!completion;
  const emoji = getChoreEmoji(chore.title);

  const getStatusIcon = () => {
    if (!isCompleted) return null;
    
    switch (completion?.status) {
      case 'pending_approval':
        return <Ionicons name="time-outline" size={16} color="#FFA500" />;
      case 'approved':
        return <Ionicons name="checkmark-circle" size={16} color="#27AE60" />;
      case 'rejected':
        return <Ionicons name="close-circle" size={16} color="#E74C3C" />;
      default:
        return <Ionicons name="checkmark" size={16} color="#fff" />;
    }
  };

  const getStatusColor = () => {
    if (!isCompleted) return '#ddd';
    
    switch (completion?.status) {
      case 'pending_approval':
        return '#FFA500';
      case 'approved':
        return '#27AE60';
      case 'rejected':
        return '#E74C3C';
      default:
        return '#27AE60';
    }
  };

  return (
    <View style={styles.taskItem}>
      <TouchableOpacity
        style={styles.taskContent}
        onPress={() => onPress(chore.id)}
        activeOpacity={0.7}
      >
        <Text style={styles.taskEmoji}>{emoji}</Text>
        <View style={styles.taskTextContainer}>
          <Text style={[styles.taskTitle, isCompleted && styles.completedTaskText]}>
            {chore.title}
          </Text>
          {chore.isShared && (
            <Text style={styles.sharedIndicator}>Shared</Text>
          )}
        </View>
        {chore.rewardStars && (
          <View style={styles.rewardContainer}>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={styles.rewardText}>{chore.rewardStars}</Text>
          </View>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.checkbox, { backgroundColor: getStatusColor() }]}
        onPress={() => onToggle(chore.id, profile.id)}
        activeOpacity={0.7}
      >
        {getStatusIcon()}
      </TouchableOpacity>
    </View>
  );
};

interface ProfileChoreCardProps {
  profile: Profile;
  chores: Chore[];
  onToggleChore: (choreId: string, profileId: string) => void;
  onPressChore: (choreId: string) => void;
  layout: ReturnType<typeof getResponsiveLayout>;
  cardDimensions: ReturnType<typeof calculateCardDimensions>;
}

const ProfileChoreCard: React.FC<ProfileChoreCardProps> = ({ 
  profile, 
  chores, 
  onToggleChore, 
  onPressChore,
  layout,
  cardDimensions
}) => {
  const [selectedTimeSegments, setSelectedTimeSegments] = useState<TimeOfDay[]>(['morning']);
  const today = new Date().toISOString().split('T')[0];
  
  // Get chores assigned to this profile
  const profileChores = chores.filter(chore => chore.profileIds.includes(profile.id));
  
  // Get chores for selected time segments
  const segmentChores = profileChores.filter(chore => selectedTimeSegments.includes(chore.timeOfDay));
  
  // Calculate completed tasks count
  const completedCount = profileChores.filter(chore => 
    isChoreCompleted(chore, profile.id, today)
  ).length;
  
  // Calculate total reward points
  const totalRewards = profileChores.reduce((sum, chore) => {
    if (isChoreCompleted(chore, profile.id, today) && chore.rewardStars) {
      return sum + chore.rewardStars;
    }
    return sum;
  }, 0);

  const timeSegments: { key: TimeOfDay; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'morning', label: 'Morning', icon: 'sunny-outline' },
    { key: 'midday', label: 'Afternoon', icon: 'sunny' },
    { key: 'evening', label: 'Evening', icon: 'moon-outline' },
    { key: 'any', label: 'Chores', icon: 'list-outline' },
  ];

  const toggleTimeSegment = (segment: TimeOfDay) => {
    setSelectedTimeSegments(prev => {
      if (prev.includes(segment)) {
        // If it's the only selected segment, don't allow deselecting
        if (prev.length === 1) return prev;
        return prev.filter(s => s !== segment);
      } else {
        return [...prev, segment];
      }
    });
  };

  return (
    <View style={[
      styles.profileCard, 
      { 
        backgroundColor: profile.color + '15',
        width: cardDimensions.cardWidth,
        marginRight: cardDimensions.cardMarginRight,
      }
    ]}>
      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <View style={[styles.profileAvatar, { backgroundColor: profile.color }]}>
          <Text style={styles.profileInitial}>{profile.name.charAt(0)}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <View style={styles.profileStats}>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#27AE60" />
              <Text style={styles.statText}>{completedCount}/{profileChores.length}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.statText}>{totalRewards}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Time Segment Filters */}
      <View style={styles.timeFilters}>
        {timeSegments.map((segment) => {
          const isSelected = selectedTimeSegments.includes(segment.key);
          return (
            <TouchableOpacity
              key={segment.key}
              style={[
                styles.timeFilter,
                isSelected && styles.selectedTimeFilter,
              ]}
              onPress={() => toggleTimeSegment(segment.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={segment.icon}
                size={14}
                color={isSelected ? '#fff' : '#666'}
              />
              <Text
                style={[
                  styles.timeFilterText,
                  isSelected && styles.selectedTimeFilterText,
                ]}
              >
                {segment.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tasks List */}
      <View style={styles.tasksContainer}>
        {timeSegments.map((segmentInfo) => {
          // Only show sections that are selected AND have tasks
          if (!selectedTimeSegments.includes(segmentInfo.key)) return null;
          
          const segmentChores = profileChores.filter(chore => chore.timeOfDay === segmentInfo.key);
          if (segmentChores.length === 0) return null;
          
          return (
            <View key={segmentInfo.key} style={styles.timeSection}>
              <Text style={styles.sectionTitle}>{segmentInfo.label}</Text>
              {segmentChores.map((chore) => (
                <TaskItem
                  key={chore.id}
                  chore={chore}
                  profile={profile}
                  onToggle={onToggleChore}
                  onPress={onPressChore}
                  layout={layout}
                />
              ))}
            </View>
          );
        })}
        {segmentChores.length === 0 && (
          <View style={styles.emptyTasks}>
            <Text style={styles.emptyTasksText}>No tasks scheduled</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const ChoresScreen: React.FC = () => {
  const navigation = useNavigation<ChoresScreenNavigationProp>();
  const { chores, profiles, completeChore, uncompleteChore, selectedChoreFilter, setChoreFilter } = useAppStore();
  const [selectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [screenData, setScreenData] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  
  const layout = getResponsiveLayout(screenData.width, screenData.height);
  const cardDimensions = calculateCardDimensions(screenData.width, screenData.height);

  // Filter profiles based on selected filter
  const filteredProfiles = selectedChoreFilter === 'all' 
    ? profiles 
    : profiles.filter(profile => profile.id === selectedChoreFilter);

  // Listen for orientation changes
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenData({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  const handleToggleChore = (choreId: string, profileId: string) => {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    const isCompleted = isChoreCompleted(chore, profileId, selectedDate);
    
    if (isCompleted) {
      uncompleteChore(choreId, profileId, selectedDate);
    } else {
      completeChore(choreId, profileId, selectedDate);
    }
  };

  const handlePressChore = (choreId: string) => {
    navigation.navigate('ViewChore', { choreId });
  };

  const handleFilterSelect = (filter: string) => {
    setChoreFilter(filter);
    setShowFilterDropdown(false);
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={[styles.title, { fontSize: layout.fontSize + 6 }]}>
            Today's Chores
          </Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            activeOpacity={0.7}
          >
            <Ionicons name="filter-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
        
        {showFilterDropdown && (
          <View style={styles.filterDropdown}>
            <TouchableOpacity
              style={[
                styles.filterOption,
                selectedChoreFilter === 'all' && styles.selectedFilterOption,
              ]}
              onPress={() => handleFilterSelect('all')}
              activeOpacity={0.7}
            >
              <Ionicons name="people-outline" size={16} color="#6c757d" />
              <Text
                style={[
                  styles.filterOptionText,
                  selectedChoreFilter === 'all' && styles.selectedFilterOptionText,
                ]}
              >
                All Family
              </Text>
            </TouchableOpacity>
            {profiles.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.filterOption,
                  selectedChoreFilter === profile.id && styles.selectedFilterOption,
                ]}
                onPress={() => handleFilterSelect(profile.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.filterProfileAvatar, { backgroundColor: profile.color }]}>
                  <Text style={styles.filterProfileInitial}>{profile.name.charAt(0)}</Text>
                </View>
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedChoreFilter === profile.id && styles.selectedFilterOptionText,
                  ]}
                >
                  {profile.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <Text style={styles.subtitle}>
          {format(new Date(), 'EEEE, MMMM d')} • {filteredProfiles.length} member{filteredProfiles.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={filteredProfiles}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.profilesContainer}
        style={styles.profilesScrollView}
        snapToInterval={cardDimensions.itemTotalWidth}
        snapToAlignment="start"
        decelerationRate="fast"
        pagingEnabled={false}
        renderItem={({ item: profile }) => (
          <ProfileChoreCard
            profile={profile}
            chores={chores}
            onToggleChore={handleToggleChore}
            onPressChore={handlePressChore}
            layout={layout}
            cardDimensions={cardDimensions}
          />
        )}
        keyExtractor={(profile) => profile.id}
      />

      {/* Add Button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          {
            bottom: layout.spacing * 2,
            right: layout.spacing,
          },
        ]}
        onPress={() => navigation.navigate('CreateChore')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>
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
  filterButton: {
    padding: 8,
  },
  title: {
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  profilesScrollView: {
    flex: 1,
  },
  profilesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  profileStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  timeFilters: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 6,
  },
  timeFilter: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    minHeight: 32,
  },
  selectedTimeFilter: {
    backgroundColor: '#007AFF',
  },
  timeFilterText: {
    fontSize: 8,
    fontWeight: '500',
    color: '#666',
    marginTop: 1,
  },
  selectedTimeFilterText: {
    color: '#fff',
  },
  tasksContainer: {
    flex: 1,
  },
  timeSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  taskEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  taskTextContainer: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
  sharedIndicator: {
    fontSize: 10,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 2,
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFD700',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkedBox: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  emptyTasks: {
    padding: 20,
    alignItems: 'center',
  },
  emptyTasksText: {
    color: '#6c757d',
    fontSize: 14,
    fontStyle: 'italic',
  },
  addButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  filterDropdown: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedFilterOption: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
    marginLeft: 8,
  },
  selectedFilterOptionText: {
    color: '#fff',
  },
  filterProfileAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterProfileInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
});

export default ChoresScreen;
