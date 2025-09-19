import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../../navigation/AppNavigator';
import { format, isSameDay } from 'date-fns';
// import { LinearGradient } from 'expo-linear-gradient';

import { useAppStore } from '../../store';
import { Profile, Event, Chore } from '../../types';
import { getResponsiveLayout, isChoreCompleted } from '../../utils/helpers';

const { width, height } = Dimensions.get('window');

interface ProfileCardProps {
  profile: Profile;
  onPress: () => void;
  layout: ReturnType<typeof getResponsiveLayout>;
  stats: {
    totalChores: number;
    completedChores: number;
    upcomingEvents: number;
    starPoints: number;
  };
  todaysEvents: Event[];
  todaysChores: Chore[];
  onEventPress: (event: Event) => void;
  onChorePress: (chore: Chore) => void;
  onChoreToggle: (choreId: string, profileId: string) => void;
  onViewAllEvents: () => void;
  onViewAllChores: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
  profile, 
  onPress, 
  layout, 
  stats, 
  todaysEvents, 
  todaysChores, 
  onEventPress, 
  onChorePress, 
  onChoreToggle,
  onViewAllEvents, 
  onViewAllChores 
}) => (
  <View style={styles.profileCardWrapper}>
    <TouchableOpacity
      style={[
        styles.profileCard,
        {
          minHeight: layout.itemSize * 2.5,
          padding: layout.spacing,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[styles.cardGradient, { backgroundColor: profile.color + '10' }]}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View
              style={[styles.avatar, { backgroundColor: profile.color }]}
            >
              <Text style={styles.avatarText}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={[styles.statusIndicator, { backgroundColor: profile.color }]} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text
              style={[
                styles.profileName,
                { fontSize: layout.fontSize + 4, color: profile.color },
              ]}
            >
              {profile.name}
            </Text>
            <View style={styles.roleContainer}>
              <Ionicons
                name={profile.role === 'parent' ? 'shield-checkmark' : 'sparkles'}
                size={14}
                color={profile.color}
              />
              <Text style={[styles.roleText, { color: profile.color }]}>
                {profile.role === 'parent' ? 'Parent' : 'Child'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={profile.color} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: profile.color + '20' }]}>
              <Ionicons name="checkmark-circle" size={16} color={profile.color} />
            </View>
            <Text style={styles.statNumber}>{stats.completedChores}</Text>
            <Text style={styles.statLabel}>Done</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: profile.color + '20' }]}>
              <Ionicons name="time" size={16} color={profile.color} />
            </View>
            <Text style={styles.statNumber}>{stats.upcomingEvents}</Text>
            <Text style={styles.statLabel}>Events</Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { backgroundColor: profile.color + '20' }]}>
              <Ionicons name="star" size={16} color={profile.color} />
            </View>
            <Text style={styles.statNumber}>{stats.starPoints}</Text>
            <Text style={styles.statLabel}>Stars</Text>
          </View>
        </View>
        
        {stats.totalChores > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(stats.completedChores / stats.totalChores) * 100}%`,
                    backgroundColor: profile.color 
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {Math.round((stats.completedChores / stats.totalChores) * 100)}% Complete
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>

    {/* Today's Events for this profile */}
    {todaysEvents.length > 0 && (
      <View style={styles.profileQuickViewSection}>
        <View style={styles.profileQuickViewHeader}>
          <View style={styles.profileQuickViewTitleContainer}>
            <Ionicons name="calendar-outline" size={16} color={profile.color} />
            <Text style={[styles.profileQuickViewTitle, { color: profile.color }]}>
              Today's Events
            </Text>
          </View>
          <TouchableOpacity onPress={onViewAllEvents} style={styles.profileQuickViewViewAll}>
            <Text style={[styles.profileQuickViewViewAllText, { color: profile.color }]}>
              View All
            </Text>
            <Ionicons name="chevron-forward" size={12} color={profile.color} />
          </TouchableOpacity>
        </View>
        <View style={styles.profileQuickViewItems}>
          {todaysEvents.slice(0, 2).map((event) => (
            <QuickViewEvent
              key={event.id}
              event={event}
              profile={profile}
              onPress={() => onEventPress(event)}
              layout={layout}
            />
          ))}
        </View>
      </View>
    )}

    {/* Today's Chores for this profile */}
    {todaysChores.length > 0 && (
      <View style={styles.profileQuickViewSection}>
        <View style={styles.profileQuickViewHeader}>
          <View style={styles.profileQuickViewTitleContainer}>
            <Ionicons name="checkmark-circle-outline" size={16} color={profile.color} />
            <Text style={[styles.profileQuickViewTitle, { color: profile.color }]}>
              Today's Chores
            </Text>
          </View>
          <TouchableOpacity onPress={onViewAllChores} style={styles.profileQuickViewViewAll}>
            <Text style={[styles.profileQuickViewViewAllText, { color: profile.color }]}>
              View All
            </Text>
            <Ionicons name="chevron-forward" size={12} color={profile.color} />
          </TouchableOpacity>
        </View>
        <View style={styles.profileQuickViewItems}>
          {todaysChores.slice(0, 3).map((chore) => (
            <QuickViewChore
              key={chore.id}
              chore={chore}
              profile={profile}
              onPress={() => onChorePress(chore)}
              onToggle={onChoreToggle}
              layout={layout}
            />
          ))}
        </View>
      </View>
    )}
  </View>
);

interface QuickViewEventProps {
  event: Event;
  profile: Profile;
  onPress: () => void;
  layout: ReturnType<typeof getResponsiveLayout>;
}

const QuickViewEvent: React.FC<QuickViewEventProps> = ({ event, profile, onPress, layout }) => {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  return (
    <TouchableOpacity
      style={[styles.quickViewItem, { borderLeftColor: profile.color }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.quickViewItemContent}>
        <View style={styles.quickViewItemHeader}>
          <Text style={[styles.quickViewItemTitle, { fontSize: layout.fontSize }]} numberOfLines={1}>
            {event.title}
          </Text>
          {!event.allDay && (
            <Text style={[styles.quickViewItemTime, { fontSize: layout.fontSize - 2 }]}>
              {formatTime(event.start)}
            </Text>
          )}
        </View>
        
        {event.location && (
          <Text style={[styles.quickViewItemLocation, { fontSize: layout.fontSize - 2 }]} numberOfLines={1}>
            📍 {event.location}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

interface QuickViewChoreProps {
  chore: Chore;
  profile: Profile;
  onPress: () => void;
  onToggle: (choreId: string, profileId: string) => void;
  layout: ReturnType<typeof getResponsiveLayout>;
}

const QuickViewChore: React.FC<QuickViewChoreProps> = ({ chore, profile, onPress, onToggle, layout }) => {
  const today = new Date().toISOString().split('T')[0];
  const isCompleted = isChoreCompleted(chore, profile.id, today);

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

  return (
    <View style={[styles.quickViewItem, { borderLeftColor: profile.color }]}>
      <TouchableOpacity
        style={styles.quickViewItemContent}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.quickViewItemHeader}>
          <Text style={[styles.quickViewItemTitle, { fontSize: layout.fontSize }]} numberOfLines={1}>
            {chore.title}
          </Text>
          <View style={styles.quickViewItemMeta}>
            <Text style={[styles.quickViewItemTime, { fontSize: layout.fontSize - 2 }]}>
              {chore.timeOfDay}
            </Text>
            {chore.rewardStars && (
              <View style={styles.quickViewRewardContainer}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.quickViewRewardText}>{chore.rewardStars}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.quickViewItemBottom}>
          <Text style={styles.quickViewItemEmoji}>{getChoreEmoji(chore.title)}</Text>
        </View>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.quickViewCheckbox, isCompleted && styles.quickViewCheckedBox]}
        onPress={() => onToggle(chore.id, profile.id)}
        activeOpacity={0.7}
      >
        {isCompleted && (
          <Ionicons name="checkmark" size={12} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
};

interface QuickViewSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  onViewAll: () => void;
  children: React.ReactNode;
  layout: ReturnType<typeof getResponsiveLayout>;
}

const QuickViewSection: React.FC<QuickViewSectionProps> = ({ 
  title, 
  icon, 
  onViewAll, 
  children, 
  layout 
}) => (
  <View style={styles.quickViewSection}>
    <View style={styles.quickViewSectionHeader}>
      <View style={styles.quickViewSectionTitleContainer}>
        <Ionicons name={icon} size={20} color="#667eea" />
        <Text style={[styles.quickViewSectionTitle, { fontSize: layout.fontSize + 2 }]}>
          {title}
        </Text>
      </View>
      <TouchableOpacity onPress={onViewAll} style={styles.quickViewViewAllButton}>
        <Text style={styles.quickViewViewAllText}>View All</Text>
        <Ionicons name="chevron-forward" size={16} color="#667eea" />
      </TouchableOpacity>
    </View>
    <View style={styles.quickViewItemsContainer}>
      {children}
    </View>
  </View>
);

type ProfilesNavigationProp = StackNavigationProp<RootStackParamList> & BottomTabNavigationProp<MainTabParamList>;

const ProfilesScreen: React.FC = () => {
  const { profiles, selectedProfileIds, toggleProfileFilter, chores, events, setChoreFilter, completeChore, uncompleteChore } = useAppStore();
  const navigation = useNavigation<ProfilesNavigationProp>();
  const layout = getResponsiveLayout(width, height);

  // Calculate profile statistics
  const profileStats = useMemo(() => {
    return profiles.map(profile => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const profileChores = chores.filter(chore => 
        chore.profileIds.includes(profile.id)
      );
      
      const completedToday = profileChores.filter(chore =>
        chore.completedBy.some(completion => 
          completion.profileId === profile.id && completion.date === today
        )
      ).length;
      
      const upcomingEvents = events.filter(event =>
        event.profileIds.includes(profile.id) &&
        new Date(event.start) >= new Date() &&
        new Date(event.start) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ).length;
      
      const starPoints = profileChores.reduce((total, chore) => {
        const completedToday = chore.completedBy.some(completion => 
          completion.profileId === profile.id && completion.date === today
        );
        return total + (completedToday ? (chore.rewardStars || 0) : 0);
      }, 0);

      return {
        id: profile.id,
        totalChores: profileChores.length,
        completedChores: completedToday,
        upcomingEvents,
        starPoints,
      };
    });
  }, [profiles, chores, events]);

  // Family overview statistics
  const familyStats = useMemo(() => {
    const totalMembers = profiles.length;
    const parents = profiles.filter(p => p.role === 'parent').length;
    const children = profiles.filter(p => p.role === 'child').length;
    const totalChores = chores.length;
    const completedToday = chores.filter(chore =>
      chore.completedBy.some(completion => completion.date === new Date().toISOString().split('T')[0])
    ).length;
    
    return {
      totalMembers,
      parents,
      children,
      totalChores,
      completedToday,
      completionRate: totalChores > 0 ? Math.round((completedToday / totalChores) * 100) : 0,
    };
  }, [profiles, chores]);

  // Get today's events and chores for each profile
  const profileTodaysData = useMemo(() => {
    const today = new Date();
    
    return profiles.map(profile => {
      // Get today's events for this profile
      const profileEvents = events.filter(event => {
        const eventStart = new Date(event.start);
        return isSameDay(eventStart, today) && event.profileIds.includes(profile.id);
      });
      
      // Get today's chores for this profile
      const profileChores = chores.filter(chore => 
        chore.profileIds.includes(profile.id)
      );
      
      return {
        profile,
        events: profileEvents,
        chores: profileChores,
      };
    });
  }, [events, chores, profiles]);

  const handleProfilePress = (profile: Profile) => {
    // Navigate to profile detail screen
    console.log('Navigate to profile:', profile.id);
  };

  const handleFilterToggle = (profileId: string) => {
    toggleProfileFilter(profileId);
  };

  const handleEventPress = (event: Event) => {
    // Navigate directly to event detail screen
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  const handleChorePress = (chore: Chore, profile: Profile) => {
    // Set the filter to show this profile's chores and navigate to chores screen
    setChoreFilter(profile.id);
    navigation.navigate('Chores');
  };

  const handleChoreToggle = (choreId: string, profileId: string) => {
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    const today = new Date().toISOString().split('T')[0];
    const isCompleted = isChoreCompleted(chore, profileId, today);
    
    if (isCompleted) {
      uncompleteChore(choreId, profileId, today);
    } else {
      completeChore(choreId, profileId, today);
    }
  };


  const handleViewAllEvents = () => {
    navigation.navigate('Calendar');
  };

  const handleViewAllChores = () => {
    navigation.navigate('Chores');
  };


  const getProfileStats = (profileId: string) => {
    return profileStats.find(stats => stats.id === profileId) || {
      totalChores: 0,
      completedChores: 0,
      upcomingEvents: 0,
      starPoints: 0,
    };
  };

  const renderProfile = ({ item }: { item: Profile }) => {
    const profileData = profileTodaysData.find(p => p.profile.id === item.id);
    if (!profileData) return null;
    
    return (
      <ProfileCard
        profile={item}
        onPress={() => handleProfilePress(item)}
        layout={layout}
        stats={getProfileStats(item.id)}
        todaysEvents={profileData.events}
        todaysChores={profileData.chores}
        onEventPress={handleEventPress}
        onChorePress={(chore) => handleChorePress(chore, item)}
        onChoreToggle={handleChoreToggle}
        onViewAllEvents={handleViewAllEvents}
        onViewAllChores={handleViewAllChores}
      />
    );
  };

  const renderFilterChip = (profile: Profile) => {
    const isSelected = selectedProfileIds.includes(profile.id);
    
    return (
      <TouchableOpacity
        key={profile.id}
        style={[
          styles.filterChip,
          {
            backgroundColor: isSelected ? profile.color : 'transparent',
            borderColor: profile.color,
          },
        ]}
        onPress={() => handleFilterToggle(profile.id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterChipText,
            {
              color: isSelected ? '#fff' : profile.color,
            },
          ]}
        >
          {profile.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Modern Header */}
        <View
          style={[styles.modernHeader, { backgroundColor: '#667eea' }]}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerText}>
              <Text style={styles.headerTitle}>Family Hub</Text>
              <Text style={styles.headerSubtitle}>
                {familyStats.totalMembers} members • {familyStats.completionRate}% chores done today
              </Text>
            </View>
            <TouchableOpacity style={styles.headerAction}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Family Overview Stats */}
        <View style={styles.overviewContainer}>
          <Text style={styles.sectionTitle}>Family Overview</Text>
          <View style={styles.overviewStats}>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewNumber}>{familyStats.totalMembers}</Text>
              <Text style={styles.overviewLabel}>Members</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewNumber}>{familyStats.completedToday}</Text>
              <Text style={styles.overviewLabel}>Chores Done</Text>
            </View>
            <View style={styles.overviewStat}>
              <Text style={styles.overviewNumber}>{familyStats.completionRate}%</Text>
              <Text style={styles.overviewLabel}>Complete</Text>
            </View>
          </View>
        </View>



        {/* Filter Section */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by member:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <View style={styles.filterChips}>
              {profiles.map(renderFilterChip)}
            </View>
          </ScrollView>
        </View>

        {/* Family Members */}
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Family Members</Text>
          <View style={styles.profilesGrid}>
            {profileTodaysData.map(({ profile, events, chores }, index) => (
              <View
                key={profile.id}
                style={[
                  styles.profileCardContainer,
                  layout.isTablet && index % 2 === 0 && styles.profileCardLeft,
                  layout.isTablet && index % 2 === 1 && styles.profileCardRight,
                ]}
              >
                <ProfileCard
                  profile={profile}
                  onPress={() => handleProfilePress(profile)}
                  layout={layout}
                  stats={getProfileStats(profile.id)}
                  todaysEvents={events}
                  todaysChores={chores}
                  onEventPress={handleEventPress}
                  onChorePress={(chore) => handleChorePress(chore, profile)}
                  onChoreToggle={handleChoreToggle}
                  onViewAllEvents={handleViewAllEvents}
                  onViewAllChores={handleViewAllChores}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Add Button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          {
            bottom: layout.spacing * 2,
            right: layout.spacing,
          },
        ]}
        onPress={() => console.log('Add new profile')}
        activeOpacity={0.8}
      >
        <View
          style={[styles.addButtonGradient, { backgroundColor: '#667eea' }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Modern Header
  modernHeader: {
    paddingTop: 20,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  headerAction: {
    padding: 8,
  },

  // Overview Section
  overviewContainer: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 16,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  overviewStat: {
    alignItems: 'center',
  },
  overviewNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },


  // Filter Section
  filterContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  filterScroll: {
    marginHorizontal: -20,
  },
  filterChips: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    minWidth: 80,
    alignItems: 'center',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Members Section
  membersSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  profileCardContainer: {
    width: '100%',
  },
  profileCardLeft: {
    width: '48%',
  },
  profileCardRight: {
    width: '48%',
  },

  // Profile Cards
  profileCardWrapper: {
    marginBottom: 16,
  },
  profileCard: {
    borderRadius: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    minHeight: 180,
  },
  cardGradient: {
    padding: 20,
    flex: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: '700',
    marginBottom: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreButton: {
    padding: 8,
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 60,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Progress Bar
  progressContainer: {
    marginTop: 12,
    paddingHorizontal: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Add Button
  addButton: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  addButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Quick View Styles
  quickViewContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  quickViewSection: {
    marginBottom: 20,
  },
  quickViewSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickViewSectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickViewSectionTitle: {
    fontWeight: '600',
    color: '#1e293b',
  },
  quickViewViewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  quickViewViewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#667eea',
  },
  quickViewItemsContainer: {
    gap: 8,
  },
  quickViewItem: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderLeftWidth: 4,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickViewItemContent: {
    flex: 1,
  },
  quickViewItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  quickViewItemTitle: {
    fontWeight: '600',
    color: '#1e293b',
    flex: 1,
    marginRight: 8,
  },
  quickViewItemTime: {
    color: '#64748b',
    fontWeight: '500',
  },
  quickViewItemLocation: {
    color: '#64748b',
    marginBottom: 8,
  },
  quickViewItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickViewRewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  quickViewRewardText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFD700',
  },
  quickViewItemBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quickViewItemEmoji: {
    fontSize: 16,
  },
  quickViewItemProfiles: {
    flexDirection: 'row',
    gap: 4,
  },
  quickViewProfileDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  quickViewCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickViewCheckedBox: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  quickViewEmpty: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  quickViewEmptyText: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Profile Quick View Styles
  profileQuickViewSection: {
    backgroundColor: '#fff',
    marginTop: 8,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  profileQuickViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileQuickViewTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  profileQuickViewTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileQuickViewViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  profileQuickViewViewAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  profileQuickViewItems: {
    gap: 6,
  },
});

export default ProfilesScreen;
