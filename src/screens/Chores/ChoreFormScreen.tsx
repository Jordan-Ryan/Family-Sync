import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAppStore } from '../../store';
import { Chore, TimeOfDay, ChoreType, RecurrenceFreq } from '../../types';
import { generateId } from '../../utils/helpers';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ChoreFormScreenRouteProp = RouteProp<RootStackParamList, 'CreateChore' | 'EditChore' | 'ViewChore'>;
type ChoreFormScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CreateChore' | 'EditChore' | 'ViewChore'>;

const ChoreFormScreen: React.FC = () => {
  const navigation = useNavigation<ChoreFormScreenNavigationProp>();
  const route = useRoute<ChoreFormScreenRouteProp>();
  const { profiles, addChore, updateChore, chores, deleteChore } = useAppStore();

  const isEditing = route.name === 'EditChore';
  const isViewing = route.name === 'ViewChore';
  const choreId = (isEditing || isViewing) ? (route.params as any).choreId : null;
  const existingChore = (isEditing || isViewing) ? chores.find(c => c.id === choreId) : null;
  const todoData = route.name === 'CreateChore' ? (route.params as any)?.todoData : null;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    profileIds: [] as string[],
    timeOfDay: 'morning' as TimeOfDay,
    type: 'anytime' as ChoreType,
    scheduledTime: '',
    recurrence: {
      freq: 'daily' as RecurrenceFreq,
      interval: 1,
      byWeekday: [] as number[],
    },
    rewardStars: 0,
    isShared: false,
    requiresApproval: true, // All children's items require approval
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form when editing, viewing, or creating from todo
  useEffect(() => {
    if ((isEditing || isViewing) && existingChore) {
      setFormData({
        title: existingChore.title,
        description: existingChore.description || '',
        profileIds: existingChore.profileIds,
        timeOfDay: existingChore.timeOfDay,
        type: existingChore.type,
        scheduledTime: existingChore.scheduledTime || '',
        recurrence: existingChore.recurrence,
        rewardStars: existingChore.rewardStars || 0,
        isShared: existingChore.isShared,
        requiresApproval: existingChore.requiresApproval,
      });
    } else if (todoData) {
      // Pre-fill form with todo data
      setFormData({
        title: todoData.title,
        description: todoData.description || '',
        profileIds: [], // Start with empty assignment
        timeOfDay: 'any',
        type: 'anytime',
        scheduledTime: '',
        recurrence: { freq: 'none', interval: 1 }, // One-off chore
        rewardStars: 10,
        isShared: false,
        requiresApproval: true,
      });
    }
  }, [isEditing, isViewing, existingChore, todoData, profiles]);

  const timeOfDayOptions: { key: TimeOfDay; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'morning', label: 'Morning', icon: 'sunny-outline' },
    { key: 'midday', label: 'Afternoon', icon: 'sunny' },
    { key: 'evening', label: 'Evening', icon: 'moon-outline' },
    { key: 'any', label: 'Any Time', icon: 'time-outline' },
  ];

  const typeOptions: { key: ChoreType; label: string; description: string }[] = [
    { key: 'anytime', label: 'Anytime', description: 'Can be done at any time' },
    { key: 'timed', label: 'Scheduled', description: 'Has a specific time' },
    { key: 'allDay', label: 'All Day', description: 'Takes the whole day' },
  ];

  const recurrenceOptions: { key: RecurrenceFreq; label: string }[] = [
    { key: 'none', label: 'One Time' },
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ];

  const weekdays = [
    { key: 0, label: 'Sun' },
    { key: 1, label: 'Mon' },
    { key: 2, label: 'Tue' },
    { key: 3, label: 'Wed' },
    { key: 4, label: 'Thu' },
    { key: 5, label: 'Fri' },
    { key: 6, label: 'Sat' },
  ];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.profileIds.length === 0) {
      newErrors.profileIds = 'At least one person must be assigned';
    }

    if (formData.type === 'timed' && !formData.scheduledTime) {
      newErrors.scheduledTime = 'Scheduled time is required for timed chores';
    }

    if (formData.recurrence.freq === 'weekly' && formData.recurrence.byWeekday.length === 0) {
      newErrors.byWeekday = 'At least one day of the week must be selected';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (isEditing && existingChore) {
        // Update existing chore
        updateChore(existingChore.id, {
          title: formData.title.trim(),
          description: formData.description.trim(),
          profileIds: formData.profileIds,
          timeOfDay: formData.timeOfDay,
          type: formData.type,
          scheduledTime: formData.type === 'timed' ? formData.scheduledTime : undefined,
          recurrence: formData.recurrence,
          rewardStars: formData.rewardStars,
          isShared: formData.isShared,
          requiresApproval: formData.requiresApproval,
          updatedAt: new Date().toISOString(),
        });
        Alert.alert('Success', 'Chore updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        // Create new chore
        const choreData: Omit<Chore, 'id'> = {
          title: formData.title.trim(),
          description: formData.description.trim(),
          profileIds: formData.profileIds,
          startDate: new Date().toISOString(),
          timeOfDay: formData.timeOfDay,
          type: formData.type,
          scheduledTime: formData.type === 'timed' ? formData.scheduledTime : undefined,
          recurrence: formData.recurrence,
          completedBy: [],
          rewardStars: formData.rewardStars,
          isShared: formData.isShared,
          requiresApproval: formData.requiresApproval,
          createdBy: 'profile-1', // TODO: Get current user
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        addChore(choreData);
        Alert.alert('Success', 'Chore created successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} chore. Please try again.`);
    }
  };

  const toggleProfile = (profileId: string) => {
    setFormData(prev => ({
      ...prev,
      profileIds: prev.profileIds.includes(profileId)
        ? prev.profileIds.filter(id => id !== profileId)
        : [...prev.profileIds, profileId]
    }));
  };

  const toggleWeekday = (weekday: number) => {
    setFormData(prev => ({
      ...prev,
      recurrence: {
        ...prev.recurrence,
        byWeekday: prev.recurrence.byWeekday.includes(weekday)
          ? prev.recurrence.byWeekday.filter(day => day !== weekday)
          : [...prev.recurrence.byWeekday, weekday]
      }
    }));
  };

  const handleDelete = () => {
    if ((!isEditing && !isViewing) || !existingChore) return;

    Alert.alert(
      'Delete Chore',
      'Are you sure you want to delete this chore? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteChore(existingChore.id);
            Alert.alert('Success', 'Chore deleted successfully!', [
              { text: 'OK', onPress: () => navigation.goBack() }
            ]);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isViewing ? 'View Chore' : isEditing ? 'Edit Chore' : todoData ? 'Create Chore from Todo' : 'Create Chore'}
          </Text>
          <View style={styles.headerActions}>
            {isViewing && (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate('EditChore', { choreId: choreId! })}
              >
                <Ionicons name="create-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            )}
            {(isEditing || isViewing) && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={24} color="#E74C3C" />
              </TouchableOpacity>
            )}
            {!isViewing && (
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.field}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError, isViewing && styles.inputDisabled]}
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              placeholder="Enter chore title"
              placeholderTextColor="#999"
              editable={!isViewing}
            />
            {errors.title && <Text style={styles.errorText}>{errors.title}</Text>}
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, isViewing && styles.inputDisabled]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter chore description (optional)"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              editable={!isViewing}
            />
          </View>

          {/* Assigned People */}
          <View style={styles.field}>
            <Text style={styles.label}>Assigned To *</Text>
            <View style={styles.profileList}>
              {profiles.map((profile) => (
                <TouchableOpacity
                  key={profile.id}
                  style={[
                    styles.profileItem,
                    formData.profileIds.includes(profile.id) && styles.profileItemSelected,
                    isViewing && styles.profileItemDisabled
                  ]}
                  onPress={() => !isViewing && toggleProfile(profile.id)}
                  disabled={isViewing}
                >
                  <View style={[styles.profileAvatar, { backgroundColor: profile.color }]}>
                    <Text style={styles.profileInitial}>{profile.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  {formData.profileIds.includes(profile.id) && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            {errors.profileIds && <Text style={styles.errorText}>{errors.profileIds}</Text>}
          </View>

          {/* Time of Day */}
          <View style={styles.field}>
            <Text style={styles.label}>Time of Day</Text>
            <View style={styles.optionGrid}>
              {timeOfDayOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionItem,
                    formData.timeOfDay === option.key && styles.optionItemSelected,
                    isViewing && styles.optionItemDisabled
                  ]}
                  onPress={() => !isViewing && setFormData(prev => ({ ...prev, timeOfDay: option.key }))}
                  disabled={isViewing}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={formData.timeOfDay === option.key ? '#007AFF' : '#666'}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      formData.timeOfDay === option.key && styles.optionTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Type */}
          <View style={styles.field}>
            <Text style={styles.label}>Type</Text>
            <View style={styles.optionList}>
              {typeOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionItemLarge,
                    formData.type === option.key && styles.optionItemSelected,
                    isViewing && styles.optionItemDisabled
                  ]}
                  onPress={() => !isViewing && setFormData(prev => ({ ...prev, type: option.key }))}
                  disabled={isViewing}
                >
                  <View>
                    <Text
                      style={[
                        styles.optionTextLarge,
                        formData.type === option.key && styles.optionTextSelected
                      ]}
                    >
                      {option.label}
                    </Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  {formData.type === option.key && (
                    <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Scheduled Time (only for timed type) */}
          {formData.type === 'timed' && (
            <View style={styles.field}>
              <Text style={styles.label}>Scheduled Time *</Text>
              <TextInput
                style={[styles.input, errors.scheduledTime && styles.inputError, isViewing && styles.inputDisabled]}
                value={formData.scheduledTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, scheduledTime: text }))}
                placeholder="HH:MM (e.g., 07:30)"
                placeholderTextColor="#999"
                editable={!isViewing}
              />
              {errors.scheduledTime && <Text style={styles.errorText}>{errors.scheduledTime}</Text>}
            </View>
          )}

          {/* Recurrence */}
          <View style={styles.field}>
            <Text style={styles.label}>Recurrence</Text>
            <View style={styles.optionGrid}>
              {recurrenceOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.optionItem,
                    formData.recurrence.freq === option.key && styles.optionItemSelected,
                    isViewing && styles.optionItemDisabled
                  ]}
                  onPress={() => !isViewing && setFormData(prev => ({ 
                    ...prev, 
                    recurrence: { ...prev.recurrence, freq: option.key }
                  }))}
                  disabled={isViewing}
                >
                  <Text
                    style={[
                      styles.optionText,
                      formData.recurrence.freq === option.key && styles.optionTextSelected
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Weekly Recurrence - Days of Week */}
          {formData.recurrence.freq === 'weekly' && (
            <View style={styles.field}>
              <Text style={styles.label}>Days of Week *</Text>
              <View style={styles.weekdayGrid}>
                {weekdays.map((day) => (
                  <TouchableOpacity
                    key={day.key}
                    style={[
                      styles.weekdayItem,
                      formData.recurrence.byWeekday.includes(day.key) && styles.weekdayItemSelected,
                      isViewing && styles.weekdayItemDisabled
                    ]}
                    onPress={() => !isViewing && toggleWeekday(day.key)}
                    disabled={isViewing}
                  >
                    <Text
                      style={[
                        styles.weekdayText,
                        formData.recurrence.byWeekday.includes(day.key) && styles.weekdayTextSelected
                      ]}
                    >
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.byWeekday && <Text style={styles.errorText}>{errors.byWeekday}</Text>}
            </View>
          )}

          {/* Reward Stars */}
          <View style={styles.field}>
            <Text style={styles.label}>Reward Stars</Text>
            <TextInput
              style={[styles.input, isViewing && styles.inputDisabled]}
              value={formData.rewardStars.toString()}
              onChangeText={(text) => {
                const value = parseInt(text) || 0;
                setFormData(prev => ({ ...prev, rewardStars: value }));
              }}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="numeric"
              editable={!isViewing}
            />
          </View>

          {/* Shared Chore Toggle */}
          <View style={styles.field}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleInfo}>
                <Text style={styles.label}>Shared Chore</Text>
                <Text style={styles.toggleDescription}>
                  Anyone can complete this chore, but only the person who completes it gets the reward
                </Text>
              </View>
              <Switch
                value={formData.isShared}
                onValueChange={(value) => setFormData(prev => ({ ...prev, isShared: value }))}
                trackColor={{ false: '#E5E5E5', true: '#007AFF' }}
                thumbColor={formData.isShared ? '#fff' : '#fff'}
                disabled={isViewing}
              />
            </View>
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  saveButton: {
    padding: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteButton: {
    padding: 8,
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#212529',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  inputDisabled: {
    backgroundColor: '#f8f9fa',
    color: '#6c757d',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
    marginTop: 4,
  },
  profileList: {
    gap: 12,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  profileItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  profileItemDisabled: {
    opacity: 0.6,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  profileName: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  optionItemDisabled: {
    opacity: 0.6,
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  optionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  optionList: {
    gap: 12,
  },
  optionItemLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  optionTextLarge: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  weekdayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekdayItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayItemSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  weekdayItemDisabled: {
    opacity: 0.6,
  },
  weekdayText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  weekdayTextSelected: {
    color: '#fff',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  toggleInfo: {
    flex: 1,
    marginRight: 16,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
});

export default ChoreFormScreen;
