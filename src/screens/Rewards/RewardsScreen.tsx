import React, { useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Dimensions,
  ScrollView,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '../../store';
import { Reward, RewardRedemption, Profile } from '../../types';
import { getResponsiveLayout } from '../../utils/helpers';

const { width, height } = Dimensions.get('window');

// Determine if device is tablet/iPad based on screen width
const isTablet = width >= 768;

// Calculate card dimensions for snapping
const containerPadding = 32; // 16px padding on each side
const cardSpacing = 16; // Space between cards
const availableWidth = width - containerPadding;
const cardWidth = isTablet ? (availableWidth - cardSpacing) * 0.5 : availableWidth;
const cardMarginRight = cardSpacing;
const itemTotalWidth = cardWidth + cardMarginRight;

// Helper function to calculate star balance for a profile
const calculateStarBalance = (profileId: string, chores: any[], redemptions: RewardRedemption[]): number => {
  // Calculate earned stars from completed chores
  const earnedStars = chores.reduce((total, chore) => {
    const isCompleted = chore.completedBy.some(
      (completion: any) => completion.profileId === profileId
    );
    return isCompleted && chore.rewardStars ? total + chore.rewardStars : total;
  }, 0);

  // Calculate spent stars from redemptions
  const spentStars = redemptions
    .filter(redemption => redemption.profileId === profileId && redemption.status !== 'cancelled')
    .reduce((total, redemption) => {
      const reward = chores.find(c => c.id === redemption.rewardId);
      return reward?.rewardStars ? total + reward.rewardStars : total;
    }, 0);

  return earnedStars - spentStars;
};

interface RewardItemProps {
  reward: Reward;
  profile: Profile;
  starBalance: number;
  onRedeem: (rewardId: string, profileId: string) => void;
}

const RewardItem: React.FC<RewardItemProps> = ({ reward, profile, starBalance, onRedeem }) => {
  const canAfford = starBalance >= reward.starCost;

  const categoryConfig = {
    treat: { icon: 'ice-cream-outline', color: '#FF6B6B' },
    privilege: { icon: 'star-outline', color: '#4ECDC4' },
    activity: { icon: 'game-controller-outline', color: '#45B7D1' },
    item: { icon: 'gift-outline', color: '#96CEB4' },
  };

  const config = categoryConfig[reward.category];

  const handleRedeem = () => {
    if (!canAfford) {
      Alert.alert(
        'Not Enough Stars',
        `You need ${reward.starCost} stars to redeem this reward, but you only have ${starBalance} stars.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Redeem Reward',
      `Are you sure you want to redeem "${reward.title}" for ${reward.starCost} stars?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Redeem', 
          style: 'default',
          onPress: () => onRedeem(reward.id, profile.id)
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.rewardItem}
      onPress={handleRedeem}
      activeOpacity={0.7}
      disabled={!canAfford}
    >
      <View style={styles.rewardItemContent}>
        <View style={[styles.rewardIcon, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon as any} size={20} color="#fff" />
        </View>
        <View style={styles.rewardItemInfo}>
          <Text style={[styles.rewardItemTitle, !canAfford && styles.disabledText]}>
            {reward.title}
          </Text>
          <Text style={[styles.rewardItemDescription, !canAfford && styles.disabledText]}>
            {reward.description}
          </Text>
        </View>
        <View style={styles.rewardItemCost}>
          <Ionicons name="star" size={16} color="#FFD700" />
          <Text style={[styles.rewardItemCostText, !canAfford && styles.disabledText]}>
            {reward.starCost}
          </Text>
        </View>
      </View>
      <View style={[styles.redeemButton, canAfford && styles.redeemButtonEnabled]}>
        {canAfford ? (
          <Ionicons name="checkmark-circle" size={20} color="#27AE60" />
        ) : (
          <Ionicons name="close-circle" size={20} color="#E74C3C" />
        )}
      </View>
    </TouchableOpacity>
  );
};

interface ProfileRewardsCardProps {
  profile: Profile;
  rewards: Reward[];
  onRedeemReward: (rewardId: string, profileId: string) => void;
  layout: ReturnType<typeof getResponsiveLayout>;
}

const ProfileRewardsCard: React.FC<ProfileRewardsCardProps> = ({ 
  profile, 
  rewards, 
  onRedeemReward, 
  layout 
}) => {
  const { chores, rewardRedemptions } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const starBalance = useMemo(() => 
    calculateStarBalance(profile.id, chores, rewardRedemptions), 
    [profile.id, chores, rewardRedemptions]
  );

  // Get rewards available for this profile
  const availableRewards = rewards.filter(reward => 
    reward.isActive && reward.profileIds.includes(profile.id)
  );

  // Filter rewards by category
  const filteredRewards = selectedCategory === 'all' 
    ? availableRewards 
    : availableRewards.filter(reward => reward.category === selectedCategory);

  const categories = [
    { key: 'all', label: 'All', icon: 'grid-outline' },
    { key: 'treat', label: 'Treats', icon: 'ice-cream-outline' },
    { key: 'privilege', label: 'Privileges', icon: 'star-outline' },
    { key: 'activity', label: 'Activities', icon: 'game-controller-outline' },
    { key: 'item', label: 'Items', icon: 'gift-outline' },
  ];

  return (
    <View style={[styles.profileCard, { width: cardWidth }]}>
      {/* Profile Header */}
      <View style={[styles.profileHeader, { backgroundColor: profile.color }]}>
        <View style={styles.profileHeaderContent}>
          <View style={[styles.profileAvatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Text style={styles.profileInitial}>{profile.name.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { fontSize: layout.fontSize + 2 }]}>
              {profile.name}
            </Text>
            <View style={styles.starBalance}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={[styles.starBalanceText, { fontSize: layout.fontSize }]}>
                {starBalance} stars
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Category Filters */}
      <View style={styles.categoryFilters}>
        <View style={styles.categoryFiltersRow}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryFilter,
                selectedCategory === category.key && styles.selectedCategoryFilter,
              ]}
              onPress={() => setSelectedCategory(category.key)}
              activeOpacity={0.7}
            >
            <Ionicons
              name={category.icon as any}
              size={14}
              color={selectedCategory === category.key ? '#fff' : '#6c757d'}
            />
              <Text
                style={[
                  styles.categoryFilterText,
                  selectedCategory === category.key && styles.selectedCategoryFilterText,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Rewards List */}
      <ScrollView style={styles.rewardsList} showsVerticalScrollIndicator={false}>
        {filteredRewards.length > 0 ? (
          filteredRewards.map((reward) => (
            <RewardItem
              key={reward.id}
              reward={reward}
              profile={profile}
              starBalance={starBalance}
              onRedeem={onRedeemReward}
            />
          ))
        ) : (
          <View style={styles.emptyRewards}>
            <Ionicons name="gift-outline" size={32} color="#ccc" />
            <Text style={styles.emptyRewardsText}>
              No rewards available
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const RewardsScreen: React.FC = () => {
  const { profiles, rewards, addRewardRedemption, addReward } = useAppStore();
  const [screenData, setScreenData] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReward, setNewReward] = useState({
    title: '',
    description: '',
    starCost: '',
    category: 'treat' as const,
    profileIds: [] as string[],
  });
  
  const layout = getResponsiveLayout(screenData.width, screenData.height);
  const flatListRef = useRef<FlatList>(null);

  // Filter profiles based on selected filter
  const filteredProfiles = useMemo(() => {
    if (selectedFilter === 'all') return profiles;
    return profiles.filter(profile => profile.role === selectedFilter);
  }, [profiles, selectedFilter]);

  const handleRedeemReward = (rewardId: string, profileId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward) return;

    addRewardRedemption({
      rewardId,
      profileId,
      redeemedAt: new Date().toISOString(),
      status: 'pending',
    });

    Alert.alert(
      'Reward Redeemed!',
      `${reward.title} has been redeemed and is pending approval.`,
      [{ text: 'OK' }]
    );
  };

  const handleFilterSelect = (filter: string) => {
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
  };

  const getTitleText = () => {
    switch (selectedFilter) {
      case 'parent':
        return 'Parent Rewards';
      case 'child':
        return 'Child Rewards';
      default:
        return 'Family Rewards';
    }
  };

  const handleAddReward = () => {
    if (!newReward.title.trim() || !newReward.description.trim() || !newReward.starCost) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const starCost = parseInt(newReward.starCost);
    if (isNaN(starCost) || starCost <= 0) {
      Alert.alert('Error', 'Please enter a valid star cost');
      return;
    }

    if (newReward.profileIds.length === 0) {
      Alert.alert('Error', 'Please select at least one family member');
      return;
    }

    addReward({
      title: newReward.title.trim(),
      description: newReward.description.trim(),
      starCost,
      category: newReward.category,
      isActive: true,
      profileIds: newReward.profileIds,
    });

    setNewReward({
      title: '',
      description: '',
      starCost: '',
      category: 'treat',
      profileIds: [],
    });
    setShowAddModal(false);

    Alert.alert('Success', 'Reward added successfully!');
  };

  const toggleProfileSelection = (profileId: string) => {
    setNewReward(prev => ({
      ...prev,
      profileIds: prev.profileIds.includes(profileId)
        ? prev.profileIds.filter(id => id !== profileId)
        : [...prev.profileIds, profileId]
    }));
  };

  const filterOptions = [
    { value: 'all', label: 'All Family', icon: 'people-outline' },
    { value: 'parent', label: 'Parents', icon: 'person-outline' },
    { value: 'child', label: 'Children', icon: 'happy-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.titleContainer}
            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            activeOpacity={0.7}
          >
            <Text style={[styles.title, { fontSize: layout.fontSize + 6 }]}>
              {getTitleText()}
            </Text>
            <Ionicons 
              name={showFilterDropdown ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#007AFF"
              style={styles.titleChevron}
            />
          </TouchableOpacity>
        </View>
        
        {showFilterDropdown && (
          <View style={styles.filterDropdown}>
            {filterOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  selectedFilter === option.value && styles.selectedFilterOption,
                ]}
                onPress={() => handleFilterSelect(option.value)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={option.icon as any}
                  size={14}
                  color={selectedFilter === option.value ? '#fff' : '#6c757d'}
                />
                <Text
                  style={[
                    styles.filterOptionText,
                    selectedFilter === option.value && styles.selectedFilterOptionText,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <Text style={styles.subtitle}>
          {filteredProfiles.length} family member{filteredProfiles.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Profiles Horizontal FlatList */}
      {filteredProfiles.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={filteredProfiles}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.profilesContainer}
          style={styles.profilesScrollView}
          snapToInterval={itemTotalWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          pagingEnabled={false}
          renderItem={({ item: profile }) => (
            <ProfileRewardsCard
              profile={profile}
              rewards={rewards}
              onRedeemReward={handleRedeemReward}
              layout={layout}
            />
          )}
          keyExtractor={(profile) => profile.id}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="gift-outline" size={48} color="#6c757d" />
          <Text style={styles.emptyStateText}>
            {selectedFilter === 'all' ? 'No family members yet' : `No ${selectedFilter}s`}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Add family members to start earning rewards
          </Text>
        </View>
      )}

      {/* Add Reward Button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          {
            bottom: layout.spacing * 2,
            right: layout.spacing,
          },
        ]}
        onPress={() => setShowAddModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Add Reward Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add New Reward</Text>
            <TouchableOpacity onPress={handleAddReward}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Reward Title</Text>
              <TextInput
                style={styles.textInput}
                value={newReward.title}
                onChangeText={(text) => setNewReward(prev => ({ ...prev, title: text }))}
                placeholder="e.g., Extra Screen Time"
                placeholderTextColor="#999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newReward.description}
                onChangeText={(text) => setNewReward(prev => ({ ...prev, description: text }))}
                placeholder="Describe what this reward includes..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Star Cost</Text>
              <TextInput
                style={styles.textInput}
                value={newReward.starCost}
                onChangeText={(text) => setNewReward(prev => ({ ...prev, starCost: text }))}
                placeholder="50"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryButtons}>
                {[
                  { key: 'treat', label: 'Treat', icon: 'ice-cream-outline', color: '#FF6B6B' },
                  { key: 'privilege', label: 'Privilege', icon: 'star-outline', color: '#4ECDC4' },
                  { key: 'activity', label: 'Activity', icon: 'game-controller-outline', color: '#45B7D1' },
                  { key: 'item', label: 'Item', icon: 'gift-outline', color: '#96CEB4' },
                ].map((category) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.categoryButton,
                      newReward.category === category.key && { backgroundColor: category.color },
                    ]}
                    onPress={() => setNewReward(prev => ({ ...prev, category: category.key as any }))}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={20}
                      color={newReward.category === category.key ? '#fff' : category.color}
                    />
                    <Text
                      style={[
                        styles.categoryButtonText,
                        { color: newReward.category === category.key ? '#fff' : category.color },
                      ]}
                    >
                      {category.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Available For</Text>
              <View style={styles.profileSelection}>
                {profiles.map((profile) => (
                  <TouchableOpacity
                    key={profile.id}
                    style={[
                      styles.profileButton,
                      { borderColor: profile.color },
                      newReward.profileIds.includes(profile.id) && { backgroundColor: profile.color },
                    ]}
                    onPress={() => toggleProfileSelection(profile.id)}
                  >
                    <View style={[styles.profileButtonAvatar, { backgroundColor: profile.color }]}>
                      <Text style={styles.profileButtonInitial}>{profile.name.charAt(0)}</Text>
                    </View>
                    <Text
                      style={[
                        styles.profileButtonText,
                        { color: newReward.profileIds.includes(profile.id) ? '#fff' : profile.color },
                      ]}
                    >
                      {profile.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
    color: '#212529',
    marginRight: 8,
  },
  titleChevron: {
    marginLeft: 4,
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
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 6,
  },
  selectedFilterOption: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6c757d',
  },
  selectedFilterOptionText: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
  },
  profilesScrollView: {
    flex: 1,
  },
  profilesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginRight: cardMarginRight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  profileHeader: {
    padding: 16,
  },
  profileHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  starBalance: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  starBalanceText: {
    fontWeight: '600',
    color: '#FFD700',
  },
  categoryFilters: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  categoryFiltersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    gap: 6,
    height: 36,
    flex: 1,
  },
  selectedCategoryFilter: {
    backgroundColor: '#007AFF',
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6c757d',
  },
  selectedCategoryFilterText: {
    color: '#fff',
  },
  rewardsList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 16,
  },
  rewardItem: {
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
  rewardItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rewardIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rewardItemInfo: {
    flex: 1,
  },
  rewardItemTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  rewardItemDescription: {
    fontSize: 12,
    color: '#6c757d',
  },
  disabledText: {
    color: '#ccc',
  },
  rewardItemCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 12,
  },
  rewardItemCostText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  redeemButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  redeemButtonEnabled: {
    // Additional styles for enabled state if needed
  },
  emptyRewards: {
    padding: 40,
    alignItems: 'center',
  },
  emptyRewardsText: {
    color: '#6c757d',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
  addButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6c757d',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  modalSaveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 8,
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  profileSelection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    gap: 8,
  },
  profileButtonAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  profileButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RewardsScreen;