import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format, parseISO } from 'date-fns';

import { useAppStore } from '../../store';
import { Event, Profile, Recurrence } from '../../types';
import { getResponsiveLayout } from '../../utils/helpers';

const { width, height } = Dimensions.get('window');

type RootStackParamList = {
  Calendar: undefined;
  EventDetail: { eventId: string };
  EventForm: { eventId?: string; selectedDate?: string };
};

type EventFormRouteProp = RouteProp<RootStackParamList, 'EventForm'>;
type EventFormNavigationProp = StackNavigationProp<RootStackParamList, 'EventForm'>;

interface EventFormScreenProps {
  route: EventFormRouteProp;
  navigation: EventFormNavigationProp;
}

const EventFormScreen: React.FC<EventFormScreenProps> = () => {
  const route = useRoute<EventFormRouteProp>();
  const navigation = useNavigation<EventFormNavigationProp>();
  const { events, profiles, addEvent, updateEvent } = useAppStore();
  const { eventId, selectedDate } = route.params;
  
  const isEditing = !!eventId;
  const existingEvent = eventId ? events.find(e => e.id === eventId) : null;
  
  const layout = getResponsiveLayout(width, height);

  // Form state
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [location, setLocation] = useState(existingEvent?.location || '');
  const [locationDetails, setLocationDetails] = useState(existingEvent?.locationDetails || '');
  const [notes, setNotes] = useState(existingEvent?.notes || '');
  const [allDay, setAllDay] = useState(existingEvent?.allDay || false);
  const [category, setCategory] = useState<Event['category']>(existingEvent?.category || 'other');
  const [priority, setPriority] = useState<Event['priority']>(existingEvent?.priority || 'medium');
  const [isPrivate, setIsPrivate] = useState(existingEvent?.isPrivate || false);
  const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>(
    existingEvent?.profileIds || []
  );
  
  // Date/time state
  const [startDate, setStartDate] = useState<Date>(
    existingEvent ? parseISO(existingEvent.start) : 
    selectedDate ? parseISO(selectedDate) : 
    new Date()
  );
  const [endDate, setEndDate] = useState<Date>(
    existingEvent ? parseISO(existingEvent.end) : 
    selectedDate ? parseISO(selectedDate) : 
    new Date()
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  
  // Recurrence state
  const [recurrence, setRecurrence] = useState<Recurrence>(
    existingEvent?.recurrence || { freq: 'none', interval: 1 }
  );
  const [showRecurrencePicker, setShowRecurrencePicker] = useState(false);
  const [showWeeklyOptions, setShowWeeklyOptions] = useState(false);
  const [showMonthlyOptions, setShowMonthlyOptions] = useState(false);
  const [monthlyPattern, setMonthlyPattern] = useState<'day' | 'weekday' | 'last' | 'lastWeekday'>('day');
  const [monthlyWeekPosition, setMonthlyWeekPosition] = useState<number>(1);
  
  // Reminder state
  const [reminderEnabled, setReminderEnabled] = useState(
    existingEvent?.reminder?.enabled || false
  );
  const [reminderMinutes, setReminderMinutes] = useState(
    existingEvent?.reminder?.minutes || 15
  );

  // Update end date when start date changes
  useEffect(() => {
    if (!existingEvent && !allDay) {
      const newEndDate = new Date(startDate);
      newEndDate.setHours(startDate.getHours() + 1);
      setEndDate(newEndDate);
    }
  }, [startDate, allDay, existingEvent]);

  // Initialize monthly pattern based on existing recurrence
  useEffect(() => {
    if (existingEvent?.recurrence) {
      const rec = existingEvent.recurrence;
      if (rec.freq === 'monthly') {
        if (rec.byMonthDay && rec.byMonthDay.includes(-1)) {
          setMonthlyPattern('last');
        } else if (rec.bySetPos === -1 && rec.byWeekday) {
          setMonthlyPattern('lastWeekday');
        } else if (rec.bySetPos && rec.byWeekday) {
          setMonthlyPattern('weekday');
          setMonthlyWeekPosition(rec.bySetPos);
        } else {
          setMonthlyPattern('day');
        }
      }
    }
  }, [existingEvent]);

  const categories: { value: Event['category']; label: string; color: string }[] = [
    { value: 'personal', label: 'Personal', color: '#28a745' },
    { value: 'work', label: 'Work', color: '#007bff' },
    { value: 'family', label: 'Family', color: '#fd7e14' },
    { value: 'health', label: 'Health', color: '#dc3545' },
    { value: 'education', label: 'Education', color: '#6f42c1' },
    { value: 'social', label: 'Social', color: '#20c997' },
    { value: 'other', label: 'Other', color: '#6c757d' },
  ];

  const priorities: { value: Event['priority']; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: '#28a745' },
    { value: 'medium', label: 'Medium', color: '#ffc107' },
    { value: 'high', label: 'High', color: '#dc3545' },
  ];

  const recurrenceOptions: { value: Recurrence['freq']; label: string }[] = [
    { value: 'none', label: 'No recurrence' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
  ];

  const reminderOptions = [5, 10, 15, 30, 60, 120, 1440]; // minutes

  const weekDays = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' },
  ];

  const monthlyOptions = [
    { value: 'day', label: 'On day of month' },
    { value: 'weekday', label: 'On weekday of month' },
  ];

  const monthlyPatterns = [
    { value: 'day', label: 'Same day of month' },
    { value: 'weekday', label: 'Same weekday of month' },
    { value: 'last', label: 'Last day of month' },
    { value: 'lastWeekday', label: 'Last weekday of month' },
  ];

  const weekPositions = [
    { value: 1, label: 'First' },
    { value: 2, label: 'Second' },
    { value: 3, label: 'Third' },
    { value: 4, label: 'Fourth' },
    { value: -1, label: 'Last' },
  ];

  const toggleProfile = (profileId: string) => {
    setSelectedProfileIds(prev => 
      prev.includes(profileId) 
        ? prev.filter(id => id !== profileId)
        : [...prev, profileId]
    );
  };

  const toggleWeekDay = (dayValue: number) => {
    const currentDays = recurrence.byWeekday || [];
    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter(day => day !== dayValue)
      : [...currentDays, dayValue];
    
    setRecurrence({ ...recurrence, byWeekday: newDays });
  };

  const getRecurrenceDescription = () => {
    if (recurrence.freq === 'none') return 'No recurrence';
    
    let description = `Every ${recurrence.interval > 1 ? `${recurrence.interval} ` : ''}`;
    
    switch (recurrence.freq) {
      case 'daily':
        description += recurrence.interval === 1 ? 'day' : 'days';
        break;
      case 'weekly':
        description += recurrence.interval === 1 ? 'week' : 'weeks';
        if (recurrence.byWeekday && recurrence.byWeekday.length > 0) {
          const dayNames = recurrence.byWeekday
            .map(day => weekDays.find(wd => wd.value === day)?.short)
            .filter(Boolean);
          description += ` on ${dayNames.join(', ')}`;
        }
        break;
      case 'monthly':
        description += recurrence.interval === 1 ? 'month' : 'months';
        if (recurrence.byMonthDay && recurrence.byMonthDay.length > 0) {
          const dayNumbers = recurrence.byMonthDay.map(day => {
            if (day === -1) return 'last day';
            return day.toString();
          });
          description += ` on day ${dayNumbers.join(', ')}`;
        } else if (recurrence.bySetPos && recurrence.byWeekday && recurrence.byWeekday.length > 0) {
          const position = recurrence.bySetPos === -1 ? 'last' : 
                          recurrence.bySetPos === 1 ? 'first' :
                          recurrence.bySetPos === 2 ? 'second' :
                          recurrence.bySetPos === 3 ? 'third' : 'fourth';
          const dayNames = recurrence.byWeekday
            .map(day => weekDays.find(wd => wd.value === day)?.label)
            .filter(Boolean);
          description += ` on the ${position} ${dayNames.join(' or ')}`;
        }
        break;
    }
    
    return description;
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    if (selectedProfileIds.length === 0) {
      Alert.alert('Error', 'Please select at least one person for this event');
      return;
    }

    if (!allDay && endDate <= startDate) {
      Alert.alert('Error', 'End time must be after start time');
      return;
    }

    const eventData: Omit<Event, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      allDay,
      location: location.trim(),
      locationDetails: locationDetails.trim(),
      notes: notes.trim(),
      profileIds: selectedProfileIds,
      recurrence,
      category,
      priority,
      reminder: {
        enabled: reminderEnabled,
        minutes: reminderMinutes,
      },
      attachments: [],
      isPrivate,
      createdBy: profiles[0]?.id || 'profile-1', // Default to first profile
      createdAt: existingEvent?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (isEditing && existingEvent) {
        updateEvent(existingEvent.id, eventData);
      } else {
        addEvent(eventData);
      }
      
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save event. Please try again.');
    }
  };

  const handleCancel = () => {
    if (title.trim() || description.trim() || location.trim()) {
      Alert.alert(
        'Discard Changes',
        'Are you sure you want to discard your changes?',
        [
          { text: 'Keep Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const formatDateTime = (date: Date, showTime: boolean = true) => {
    if (showTime) {
      return format(date, 'MMM d, yyyy \'at\' h:mm a');
    }
    return format(date, 'MMM d, yyyy');
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
          <Text style={styles.headerButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { fontSize: layout.fontSize + 2 }]}>
          {isEditing ? 'Edit Event' : 'New Event'}
        </Text>
        
        <TouchableOpacity style={styles.headerButton} onPress={handleSave}>
          <Text style={[styles.headerButtonText, styles.saveButton]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
            Basic Information
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { fontSize: layout.fontSize }]}>
              Title *
            </Text>
            <TextInput
              style={[styles.textInput, { fontSize: layout.fontSize }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Event title"
              placeholderTextColor="#adb5bd"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { fontSize: layout.fontSize }]}>
              Description
            </Text>
            <TextInput
              style={[styles.textArea, { fontSize: layout.fontSize }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Event description"
              placeholderTextColor="#adb5bd"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { fontSize: layout.fontSize }]}>
              Location
            </Text>
            <TextInput
              style={[styles.textInput, { fontSize: layout.fontSize }]}
              value={location}
              onChangeText={setLocation}
              placeholder="Event location"
              placeholderTextColor="#adb5bd"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { fontSize: layout.fontSize }]}>
              Location Details
            </Text>
            <TextInput
              style={[styles.textInput, { fontSize: layout.fontSize }]}
              value={locationDetails}
              onChangeText={setLocationDetails}
              placeholder="Room, address, etc."
              placeholderTextColor="#adb5bd"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { fontSize: layout.fontSize }]}>
              Notes
            </Text>
            <TextInput
              style={[styles.textArea, { fontSize: layout.fontSize }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes"
              placeholderTextColor="#adb5bd"
              multiline
              numberOfLines={2}
            />
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
            Date & Time
          </Text>

          <View style={styles.switchGroup}>
            <Text style={[styles.switchLabel, { fontSize: layout.fontSize }]}>
              All Day Event
            </Text>
            <Switch
              value={allDay}
              onValueChange={setAllDay}
              trackColor={{ false: '#e9ecef', true: '#2F80ED' }}
              thumbColor={allDay ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { fontSize: layout.fontSize }]}>
              Start {allDay ? 'Date' : 'Date & Time'}
            </Text>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={[styles.dateTimeText, { fontSize: layout.fontSize }]}>
                {formatDateTime(startDate, !allDay)}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#6c757d" />
            </TouchableOpacity>
          </View>

          {!allDay && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { fontSize: layout.fontSize }]}>
                End Date & Time
              </Text>
              <TouchableOpacity
                style={styles.dateTimeButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={[styles.dateTimeText, { fontSize: layout.fontSize }]}>
                  {formatDateTime(endDate, true)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#6c757d" />
              </TouchableOpacity>
            </View>
          )}

          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode={allDay ? 'date' : 'datetime'}
              display="default"
              onChange={(event, selectedDate) => {
                setShowStartDatePicker(false);
                if (selectedDate) {
                  setStartDate(selectedDate);
                }
              }}
            />
          )}

          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="datetime"
              display="default"
              onChange={(event, selectedDate) => {
                setShowEndDatePicker(false);
                if (selectedDate) {
                  setEndDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        {/* Recurrence */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
            Recurrence
          </Text>
          
          <TouchableOpacity
            style={styles.pickerButton}
            onPress={() => setShowRecurrencePicker(!showRecurrencePicker)}
          >
            <Text style={[styles.pickerButtonText, { fontSize: layout.fontSize }]}>
              {getRecurrenceDescription()}
            </Text>
            <Ionicons 
              name={showRecurrencePicker ? "chevron-up" : "chevron-down"} 
              size={20} 
              color="#6c757d" 
            />
          </TouchableOpacity>

          {showRecurrencePicker && (
            <View style={styles.pickerOptions}>
              {recurrenceOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.pickerOption,
                    recurrence.freq === option.value && styles.pickerOptionSelected
                  ]}
                  onPress={() => {
                    const newRecurrence = { ...recurrence, freq: option.value };
                    if (option.value === 'none') {
                      newRecurrence.byWeekday = undefined;
                    }
                    setRecurrence(newRecurrence);
                    setShowRecurrencePicker(false);
                    setShowWeeklyOptions(false);
                    setShowMonthlyOptions(false);
                  }}
                >
                  <Text style={[
                    styles.pickerOptionText,
                    { fontSize: layout.fontSize },
                    recurrence.freq === option.value && styles.pickerOptionTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Weekly Options */}
          {recurrence.freq === 'weekly' && (
            <View style={styles.recurrenceOptions}>
              <TouchableOpacity
                style={styles.recurrenceToggle}
                onPress={() => setShowWeeklyOptions(!showWeeklyOptions)}
              >
                <Text style={[styles.recurrenceToggleText, { fontSize: layout.fontSize }]}>
                  Select days of week
                </Text>
                <Ionicons 
                  name={showWeeklyOptions ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6c757d" 
                />
              </TouchableOpacity>

              {showWeeklyOptions && (
                <View style={styles.weekDaysGrid}>
                  {weekDays.map((day) => (
                    <TouchableOpacity
                      key={day.value}
                      style={[
                        styles.weekDayButton,
                        recurrence.byWeekday?.includes(day.value) && styles.weekDayButtonSelected
                      ]}
                      onPress={() => toggleWeekDay(day.value)}
                    >
                      <Text style={[
                        styles.weekDayButtonText,
                        { fontSize: layout.fontSize - 2 },
                        recurrence.byWeekday?.includes(day.value) && styles.weekDayButtonTextSelected
                      ]}>
                        {day.short}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Monthly Options */}
          {recurrence.freq === 'monthly' && (
            <View style={styles.recurrenceOptions}>
              <TouchableOpacity
                style={styles.recurrenceToggle}
                onPress={() => setShowMonthlyOptions(!showMonthlyOptions)}
              >
                <Text style={[styles.recurrenceToggleText, { fontSize: layout.fontSize }]}>
                  Monthly options
                </Text>
                <Ionicons 
                  name={showMonthlyOptions ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6c757d" 
                />
              </TouchableOpacity>

              {showMonthlyOptions && (
                <View style={styles.monthlyOptionsContainer}>
                  <Text style={[styles.monthlyOptionsLabel, { fontSize: layout.fontSize - 2, marginBottom: 12 }]}>
                    Choose how the event should recur monthly:
                  </Text>
                  
                  <View style={styles.monthlyPatternsGrid}>
                    {monthlyPatterns.map((pattern) => (
                      <TouchableOpacity
                        key={pattern.value}
                        style={[
                          styles.monthlyPatternButton,
                          monthlyPattern === pattern.value && styles.monthlyPatternButtonSelected
                        ]}
                        onPress={() => {
                          setMonthlyPattern(pattern.value as any);
                          // Update recurrence based on pattern
                          let newRecurrence = { ...recurrence };
                          if (pattern.value === 'day') {
                            newRecurrence.byMonthDay = [startDate.getDate()];
                            newRecurrence.bySetPos = undefined;
                            newRecurrence.byWeekday = undefined;
                          } else if (pattern.value === 'weekday') {
                            newRecurrence.bySetPos = monthlyWeekPosition;
                            newRecurrence.byWeekday = [startDate.getDay()];
                            newRecurrence.byMonthDay = undefined;
                          } else if (pattern.value === 'last') {
                            newRecurrence.byMonthDay = [-1];
                            newRecurrence.bySetPos = undefined;
                            newRecurrence.byWeekday = undefined;
                          } else if (pattern.value === 'lastWeekday') {
                            newRecurrence.bySetPos = -1;
                            newRecurrence.byWeekday = [startDate.getDay()];
                            newRecurrence.byMonthDay = undefined;
                          }
                          setRecurrence(newRecurrence);
                        }}
                      >
                        <Text style={[
                          styles.monthlyPatternButtonText,
                          { fontSize: layout.fontSize - 2 },
                          monthlyPattern === pattern.value && styles.monthlyPatternButtonTextSelected
                        ]}>
                          {pattern.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {monthlyPattern === 'weekday' && (
                    <View style={styles.weekPositionContainer}>
                      <Text style={[styles.weekPositionLabel, { fontSize: layout.fontSize - 2, marginBottom: 8 }]}>
                        Which occurrence of {weekDays[startDate.getDay()].label}:
                      </Text>
                      <View style={styles.weekPositionGrid}>
                        {weekPositions.map((position) => (
                          <TouchableOpacity
                            key={position.value}
                            style={[
                              styles.weekPositionButton,
                              monthlyWeekPosition === position.value && styles.weekPositionButtonSelected
                            ]}
                            onPress={() => {
                              setMonthlyWeekPosition(position.value);
                              setRecurrence({
                                ...recurrence,
                                bySetPos: position.value,
                                byWeekday: [startDate.getDay()],
                                byMonthDay: undefined
                              });
                            }}
                          >
                            <Text style={[
                              styles.weekPositionButtonText,
                              { fontSize: layout.fontSize - 2 },
                              monthlyWeekPosition === position.value && styles.weekPositionButtonTextSelected
                            ]}>
                              {position.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        {/* Category & Priority */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
            Category & Priority
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { fontSize: layout.fontSize }]}>
              Category
            </Text>
            <View style={styles.categoryGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.categoryButton,
                    { backgroundColor: cat.color },
                    category === cat.value && styles.categoryButtonSelected
                  ]}
                  onPress={() => setCategory(cat.value)}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    { fontSize: layout.fontSize - 2 },
                    category === cat.value && styles.categoryButtonTextSelected
                  ]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { fontSize: layout.fontSize }]}>
              Priority
            </Text>
            <View style={styles.priorityGrid}>
              {priorities.map((pri) => (
                <TouchableOpacity
                  key={pri.value}
                  style={[
                    styles.priorityButton,
                    { borderColor: pri.color },
                    priority === pri.value && { backgroundColor: pri.color }
                  ]}
                  onPress={() => setPriority(pri.value)}
                >
                  <Text style={[
                    styles.priorityButtonText,
                    { fontSize: layout.fontSize - 2, color: pri.color },
                    priority === pri.value && styles.priorityButtonTextSelected
                  ]}>
                    {pri.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Attendees */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
            Attendees *
          </Text>
          
          <View style={styles.profilesGrid}>
            {profiles.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.profileButton,
                  selectedProfileIds.includes(profile.id) && styles.profileButtonSelected
                ]}
                onPress={() => toggleProfile(profile.id)}
              >
                <View style={[
                  styles.profileDot,
                  { backgroundColor: profile.color }
                ]} />
                <Text style={[
                  styles.profileButtonText,
                  { fontSize: layout.fontSize - 2 },
                  selectedProfileIds.includes(profile.id) && styles.profileButtonTextSelected
                ]}>
                  {profile.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Reminder */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
            Reminder
          </Text>

          <View style={styles.switchGroup}>
            <Text style={[styles.switchLabel, { fontSize: layout.fontSize }]}>
              Enable Reminder
            </Text>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: '#e9ecef', true: '#2F80ED' }}
              thumbColor={reminderEnabled ? '#fff' : '#f4f3f4'}
            />
          </View>

          {reminderEnabled && (
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { fontSize: layout.fontSize }]}>
                Remind me
              </Text>
              <View style={styles.reminderGrid}>
                {reminderOptions.map((minutes) => {
                  const hours = Math.floor(minutes / 60);
                  const mins = minutes % 60;
                  const label = hours > 0 
                    ? `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim()
                    : `${minutes}m`;
                  
                  return (
                    <TouchableOpacity
                      key={minutes}
                      style={[
                        styles.reminderButton,
                        reminderMinutes === minutes && styles.reminderButtonSelected
                      ]}
                      onPress={() => setReminderMinutes(minutes)}
                    >
                      <Text style={[
                        styles.reminderButtonText,
                        { fontSize: layout.fontSize - 2 },
                        reminderMinutes === minutes && styles.reminderButtonTextSelected
                      ]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <View style={styles.switchGroup}>
            <Text style={[styles.switchLabel, { fontSize: layout.fontSize }]}>
              Private Event
            </Text>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#e9ecef', true: '#2F80ED' }}
              thumbColor={isPrivate ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  saveButton: {
    color: '#2F80ED',
    fontWeight: '600',
  },
  headerTitle: {
    fontWeight: '600',
    color: '#212529',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontWeight: '500',
    color: '#495057',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    color: '#212529',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
    color: '#212529',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontWeight: '500',
    color: '#495057',
    flex: 1,
  },
  dateTimeButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateTimeText: {
    color: '#212529',
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerButtonText: {
    color: '#212529',
    fontWeight: '500',
  },
  pickerOptions: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  pickerOptionSelected: {
    backgroundColor: '#e3f2fd',
  },
  pickerOptionText: {
    color: '#212529',
    fontWeight: '500',
  },
  pickerOptionTextSelected: {
    color: '#2F80ED',
    fontWeight: '600',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryButtonSelected: {
    shadowOpacity: 0.3,
    elevation: 6,
  },
  categoryButtonText: {
    color: '#fff',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  categoryButtonTextSelected: {
    fontWeight: '700',
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontWeight: '600',
  },
  priorityButtonTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  profilesGrid: {
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
    borderColor: '#e9ecef',
    backgroundColor: '#fff',
    gap: 8,
  },
  profileButtonSelected: {
    borderColor: '#2F80ED',
    backgroundColor: '#e3f2fd',
  },
  profileDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  profileButtonText: {
    color: '#495057',
    fontWeight: '500',
  },
  profileButtonTextSelected: {
    color: '#2F80ED',
    fontWeight: '600',
  },
  reminderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reminderButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  reminderButtonSelected: {
    borderColor: '#2F80ED',
    backgroundColor: '#e3f2fd',
  },
  reminderButtonText: {
    color: '#495057',
    fontWeight: '500',
  },
  reminderButtonTextSelected: {
    color: '#2F80ED',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 40,
  },
  recurrenceOptions: {
    marginTop: 12,
  },
  recurrenceToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  recurrenceToggleText: {
    color: '#495057',
    fontWeight: '500',
  },
  weekDaysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  weekDayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#fff',
    minWidth: 50,
    alignItems: 'center',
  },
  weekDayButtonSelected: {
    borderColor: '#2F80ED',
    backgroundColor: '#e3f2fd',
  },
  weekDayButtonText: {
    color: '#495057',
    fontWeight: '500',
  },
  weekDayButtonTextSelected: {
    color: '#2F80ED',
    fontWeight: '600',
  },
  monthlyOptionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  monthlyOptionsLabel: {
    color: '#6c757d',
    lineHeight: 20,
  },
  monthlyPatternsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  monthlyPatternButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#fff',
    minWidth: 80,
    alignItems: 'center',
  },
  monthlyPatternButtonSelected: {
    borderColor: '#2F80ED',
    backgroundColor: '#e3f2fd',
  },
  monthlyPatternButtonText: {
    color: '#495057',
    fontWeight: '500',
    textAlign: 'center',
  },
  monthlyPatternButtonTextSelected: {
    color: '#2F80ED',
    fontWeight: '600',
  },
  weekPositionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  weekPositionLabel: {
    color: '#495057',
    fontWeight: '500',
  },
  weekPositionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekPositionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
    backgroundColor: '#fff',
    minWidth: 60,
    alignItems: 'center',
  },
  weekPositionButtonSelected: {
    borderColor: '#2F80ED',
    backgroundColor: '#e3f2fd',
  },
  weekPositionButtonText: {
    color: '#495057',
    fontWeight: '500',
    fontSize: 12,
  },
  weekPositionButtonTextSelected: {
    color: '#2F80ED',
    fontWeight: '600',
  },
});

export default EventFormScreen;
