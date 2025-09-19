import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval,
  isSameDay,
  isToday,
  addDays,
  subDays,
  addMonths,
  subMonths,
} from 'date-fns';

import { useAppStore } from '../../store';
import { Event, Profile } from '../../types';
import { getResponsiveLayout, getRecurringDates } from '../../utils/helpers';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { width, height } = Dimensions.get('window');

type CalendarView = 'day' | 'week' | 'month';

interface EventItemProps {
  event: Event;
  profiles: Profile[];
  onPress: () => void;
  layout: ReturnType<typeof getResponsiveLayout>;
}

const EventItem: React.FC<EventItemProps> = ({ event, profiles, onPress, layout }) => {
  const assignedProfiles = profiles.filter(p => event.profileIds.includes(p.id));
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'h:mm a');
  };

  const getEventColor = () => {
    if (event.profileIds.length === 1) {
      const profile = profiles.find(p => p.id === event.profileIds[0]);
      return profile?.color || '#2F80ED';
    }
    return '#6c757d'; // Multi-person events get neutral color
  };

  return (
    <TouchableOpacity
      style={[
        styles.eventItem, 
        { 
          padding: layout.spacing / 2,
          borderLeftColor: getEventColor(),
        }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.eventContent}>
        <View style={styles.eventHeader}>
          <Text style={[styles.eventTitle, { fontSize: layout.fontSize }]}>
            {event.title}
          </Text>
          {!event.allDay && (
            <Text style={[styles.eventTime, { fontSize: layout.fontSize - 2 }]}>
              {formatTime(event.start)}
            </Text>
          )}
        </View>
        
        {event.location && (
          <Text style={[styles.eventLocation, { fontSize: layout.fontSize - 2 }]}>
            📍 {event.location}
          </Text>
        )}
        
        <View style={styles.eventProfiles}>
          {assignedProfiles.map((profile) => (
            <View
              key={profile.id}
              style={[
                styles.profileDot,
                { backgroundColor: profile.color },
              ]}
            />
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
};

interface DayViewProps {
  selectedDate: Date;
  events: Event[];
  profiles: Profile[];
  onEventPress: (event: Event) => void;
  layout: ReturnType<typeof getResponsiveLayout>;
}

const DayView: React.FC<DayViewProps> = ({ selectedDate, events, profiles, onEventPress, layout }) => {
  const todayEvents = events.filter(event => {
    const eventStart = new Date(event.start);
    return isSameDay(eventStart, selectedDate);
  });

  return (
    <View style={styles.dayView}>
      <View style={[styles.dayHeader, { padding: layout.spacing }]}>
        <Text style={[styles.dayTitle, { fontSize: layout.fontSize + 4 }]}>
          {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </Text>
        <Text style={[styles.daySubtitle, { fontSize: layout.fontSize }]}>
          {todayEvents.length} event{todayEvents.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      <FlatList
        data={todayEvents}
        renderItem={({ item: event }) => (
          <EventItem
            event={event}
            profiles={profiles}
            onPress={() => onEventPress(event)}
            layout={layout}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.dayEvents}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyDay}>
            <Ionicons name="calendar-outline" size={48} color="#dee2e6" />
            <Text style={styles.emptyDayText}>No events today</Text>
          </View>
        }
      />
    </View>
  );
};

interface WeekViewProps {
  selectedDate: Date;
  events: Event[];
  profiles: Profile[];
  onEventPress: (event: Event) => void;
  layout: ReturnType<typeof getResponsiveLayout>;
}

const WeekView: React.FC<WeekViewProps> = ({ selectedDate, events, profiles, onEventPress, layout }) => {
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start on Monday
  const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Generate time slots for all 24 hours
  const timeSlots = [];
  for (let hour = 0; hour < 24; hour++) {
    timeSlots.push(hour);
  }

  // Calculate available height for time slots (subtract header height)
  const availableHeight = height - 200; // Approximate header height
  // Set minimum height for each hour slot to make 30-minute activities readable
  const minTimeSlotHeight = 60; // Minimum 60px per hour for better readability
  const timeSlotHeight = Math.max(minTimeSlotHeight, availableHeight / timeSlots.length);

  const getEventColor = (event: Event) => {
    if (event.profileIds.length === 1) {
      const profile = profiles.find(p => p.id === event.profileIds[0]);
      return profile?.color || '#2F80ED';
    }
    // For multi-person events, use a neutral color
    return '#6c757d';
  };

  const getEventPosition = (event: Event) => {
    if (event.allDay) return { top: 0, height: timeSlotHeight };
    
    const startTime = new Date(event.start);
    const endTime = new Date(event.end);
    const startHour = startTime.getHours() + startTime.getMinutes() / 60;
    const endHour = endTime.getHours() + endTime.getMinutes() / 60;
    
    // Calculate position in pixels based on time slot height for all events
    const top = startHour * timeSlotHeight;
    const height = Math.max(timeSlotHeight * 0.3, (endHour - startHour) * timeSlotHeight);
    
    return { 
      top, 
      height
    };
  };

  return (
    <View style={styles.weekView}>
      <View style={[styles.weekHeader, { padding: layout.spacing }]}>
        <Text style={[styles.weekTitle, { fontSize: layout.fontSize + 4 }]}>
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
        </Text>
      </View>
      
      <View style={styles.weekContent}>
        {/* Day headers */}
        <View style={styles.weekDayHeaders}>
          <View style={[styles.timeColumnHeader, { width: 60 }]} />
          {weekDays.map((day) => (
            <View key={day.toISOString()} style={[styles.weekDayHeader, { width: (width - 60) / 7 }]}>
              <Text style={[
                styles.weekDayName,
                { fontSize: layout.fontSize - 2 }
              ]}>
                {format(day, 'EEE')}
              </Text>
              <Text style={[
                styles.weekDayNumber,
                { fontSize: layout.fontSize },
                isToday(day) && styles.todayNumber
              ]}>
                {format(day, 'd')}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView style={styles.weekTimeContent} showsVerticalScrollIndicator={false}>
          <View style={styles.weekTimeContentInner}>
            {/* Time column */}
            <View style={styles.timeColumn}>
              {timeSlots.map((hour) => (
                <View key={hour} style={[styles.timeSlot, { height: timeSlotHeight }]}>
                  <Text style={[styles.timeLabel, { fontSize: layout.fontSize - 4 }]}>
                    {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                  </Text>
                </View>
              ))}
            </View>

            {/* Days grid */}
            <View style={styles.weekGridContainer}>
              <View style={styles.timeGrid}>
                {weekDays.map((day) => {
                  const dayEvents = events.filter(event => {
                    const eventStart = new Date(event.start);
                    return isSameDay(eventStart, day);
                  });

                  return (
                    <View key={day.toISOString()} style={[styles.weekDayColumn, { width: (width - 60) / 7 }]}>
                      {/* Time slots background */}
                      {timeSlots.map((hour) => (
                        <View key={hour} style={[styles.timeSlotBackground, { height: timeSlotHeight }]} />
                      ))}
                      
                      {/* Events */}
                      {dayEvents.map((event) => {
                        const position = getEventPosition(event);
                        const eventColor = getEventColor(event);
                        
                        return (
                          <TouchableOpacity
                            key={event.id}
                            style={[
                              styles.weekEvent,
                              {
                                backgroundColor: eventColor,
                                top: position.top,
                                height: position.height,
                                padding: layout.spacing / 4,
                              }
                            ]}
                            onPress={() => onEventPress(event)}
                          >
                            <Text style={[styles.weekEventTitle, { fontSize: layout.fontSize - 3 }]} numberOfLines={2}>
                              {event.title}
                            </Text>
                            {!event.allDay && (
                              <Text style={[styles.weekEventTime, { fontSize: layout.fontSize - 5 }]}>
                                {format(new Date(event.start), 'h:mm a')}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

interface MonthViewProps {
  selectedDate: Date;
  events: Event[];
  profiles: Profile[];
  onEventPress: (event: Event) => void;
  onDateSelect: (date: Date) => void;
  layout: ReturnType<typeof getResponsiveLayout>;
  currentView: CalendarView;
}

const MonthView: React.FC<MonthViewProps> = ({ 
  selectedDate, 
  events, 
  profiles, 
  onEventPress, 
  onDateSelect,
  layout,
  currentView
}) => {
  const monthStart = startOfMonth(selectedDate);
  const monthEnd = endOfMonth(selectedDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Calculate available height for calendar days
  // Subtract header height (~120px), week day headers (~50px), and bottom navigation (~80px)
  const availableHeight = height - 250;
  const dayHeight = availableHeight / 6; // 6 weeks maximum

  // Calculate how many events can fit in each day cell
  const calculateMaxEventsPerDay = () => {
    // Reserve space for day number (approximately 20px) and padding (8px)
    const reservedSpace = 28;
    const availableEventSpace = dayHeight - reservedSpace;
    
    // More accurate event block height calculation
    const isPhone = width < 768;
    // Base height for event block: padding (4px) + text height + margin (2px)
    const baseEventHeight = 18; // More conservative estimate
    const timeTextHeight = isPhone ? 0 : 12; // Time text only on larger screens
    const eventBlockHeight = baseEventHeight + timeTextHeight;
    const gapBetweenEvents = 2;
    
    // Calculate how many events can fit
    let maxEvents = 0;
    let usedHeight = 0;
    
    while (usedHeight + eventBlockHeight <= availableEventSpace) {
      maxEvents++;
      usedHeight += eventBlockHeight + gapBetweenEvents;
    }
    
    // Ensure we show at least 1 event, but cap at 5 for better readability
    return Math.max(1, Math.min(maxEvents, 5));
  };

  const maxEventsPerDay = calculateMaxEventsPerDay();
  
  // Debug logging
  console.log('Calendar Debug:', {
    width,
    height,
    dayHeight,
    maxEventsPerDay,
    isPhone: width < 768
  });

  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.start);
      return isSameDay(eventStart, day);
    });
  };

  return (
    <View style={styles.monthView}>
      <View style={[styles.monthHeader, { padding: layout.spacing }]}>
        <Text style={[styles.monthTitle, { fontSize: layout.fontSize + 4 }]}>
          {format(selectedDate, 'MMMM yyyy')}
        </Text>
      </View>
      
      <View style={styles.calendarGrid}>
        {/* Week day headers */}
        <View style={styles.weekDayHeaders}>
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <Text key={day} style={[styles.weekDayHeaderText, { fontSize: layout.fontSize - 2 }]}>
              {day}
            </Text>
          ))}
        </View>
        
        {/* Calendar days */}
        <View style={styles.calendarDays}>
          {calendarDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === selectedDate.getMonth();
            const isSelected = isSameDay(day, selectedDate);
            const isTodayAndCurrentMonth = isToday(day) && isCurrentMonth;
            
            // In month view, only highlight today as selected if we're viewing the current month
            const shouldHighlightAsSelected = currentView === 'month' 
              ? isTodayAndCurrentMonth 
              : isSelected;
            
            return (
              <View
                key={day.toISOString()}
                style={[
                  styles.calendarDay,
                  { width: width / 7, height: dayHeight },
                  !isCurrentMonth && styles.otherMonthDay,
                  shouldHighlightAsSelected && styles.selectedDay,
                  isTodayAndCurrentMonth && styles.todayDay,
                ]}
              >
                <TouchableOpacity
                  style={styles.calendarDayNumberContainer}
                  onPress={() => onDateSelect(day)}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.calendarDayNumber,
                    { fontSize: layout.fontSize - 2 },
                    !isCurrentMonth && styles.otherMonthText,
                    shouldHighlightAsSelected && styles.selectedDayText,
                    isTodayAndCurrentMonth && styles.todayText,
                  ]}>
                    {format(day, 'd')}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.calendarDayEvents}>
                  {dayEvents.slice(0, maxEventsPerDay).map((event) => {
                    const eventColor = event.profileIds.length === 1 
                      ? profiles.find(p => p.id === event.profileIds[0])?.color || '#2F80ED'
                      : '#6c757d'; // Multi-person events get neutral color
                    
                    const formatTime = (dateString: string) => {
                      const date = new Date(dateString);
                      return format(date, 'ha').toLowerCase();
                    };
                    
                    const isPhone = width < 768;
                    
                    return (
                      <TouchableOpacity
                        key={event.id}
                        style={[
                          styles.calendarEventBlock,
                          { 
                            backgroundColor: eventColor,
                            // Ensure consistent height for better layout
                            minHeight: isPhone ? 16 : 20,
                            maxHeight: isPhone ? 18 : 22,
                          }
                        ]}
                        onPress={() => onEventPress(event)}
                        activeOpacity={0.7}
                      >
                        {!isPhone && (
                          <Text style={[styles.eventTimeText, { fontSize: layout.fontSize - 6 }]} numberOfLines={1}>
                            {formatTime(event.start)}
                          </Text>
                        )}
                        <Text style={[styles.eventTitleText, { fontSize: layout.fontSize - 6 }]} numberOfLines={1}>
                          {event.title}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                  {dayEvents.length > maxEventsPerDay && (
                    <TouchableOpacity 
                      style={styles.moreEventsContainer}
                      onPress={() => onDateSelect(day)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.moreEventsText, { fontSize: layout.fontSize - 6 }]} numberOfLines={1}>
                        +{dayEvents.length - maxEventsPerDay} more
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};


type CalendarNavigationProp = StackNavigationProp<RootStackParamList>;

const CalendarScreen: React.FC = () => {
  const navigation = useNavigation<CalendarNavigationProp>();
  const { events, profiles } = useAppStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('month');
  
  const layout = getResponsiveLayout(width, height);

  const handleEventPress = (event: Event) => {
    navigation.navigate('EventDetail', { eventId: event.id });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (currentView === 'month') {
      setCurrentView('day');
    }
  };

  const handlePrevious = () => {
    switch (currentView) {
      case 'day':
        setSelectedDate(prev => subDays(prev, 1));
        break;
      case 'week':
        setSelectedDate(prev => subDays(prev, 7));
        break;
      case 'month':
        setSelectedDate(prev => subMonths(prev, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (currentView) {
      case 'day':
        setSelectedDate(prev => addDays(prev, 1));
        break;
      case 'week':
        setSelectedDate(prev => addDays(prev, 7));
        break;
      case 'month':
        setSelectedDate(prev => addMonths(prev, 1));
        break;
    }
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'day':
        return (
          <DayView
            selectedDate={selectedDate}
            events={events}
            profiles={profiles}
            onEventPress={handleEventPress}
            layout={layout}
          />
        );
      case 'week':
        return (
          <WeekView
            selectedDate={selectedDate}
            events={events}
            profiles={profiles}
            onEventPress={handleEventPress}
            layout={layout}
          />
        );
      case 'month':
        return (
          <MonthView
            selectedDate={selectedDate}
            events={events}
            profiles={profiles}
            onEventPress={handleEventPress}
            onDateSelect={handleDateSelect}
            layout={layout}
            currentView={currentView}
          />
        );
      default:
        return null;
    }
  };

  const viewOptions: { value: CalendarView; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'day', label: 'Day', icon: 'calendar-outline' },
    { value: 'week', label: 'Week', icon: 'calendar' },
    { value: 'month', label: 'Month', icon: 'grid-outline' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.navButton} onPress={handlePrevious}>
            <Ionicons name="chevron-back" size={24} color="#2F80ED" />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { fontSize: layout.fontSize + 4 }]}>
            Calendar
          </Text>
          
          <TouchableOpacity style={styles.navButton} onPress={handleNext}>
            <Ionicons name="chevron-forward" size={24} color="#2F80ED" />
          </TouchableOpacity>
        </View>
        
        {/* View Selector */}
        <View style={styles.viewSelector}>
        {viewOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.viewOption,
              currentView === option.value && styles.viewOptionSelected,
            ]}
            onPress={() => setCurrentView(option.value)}
          >
            <Ionicons
              name={option.icon}
              size={16}
              color={currentView === option.value ? '#fff' : '#2F80ED'}
            />
            <Text
              style={[
                styles.viewOptionText,
                currentView === option.value && styles.viewOptionTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
        </View>
      </View>

      {/* Calendar Content */}
      <View style={styles.content}>
        {renderCurrentView()}
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          {
            bottom: layout.spacing * 2,
            right: layout.spacing,
          },
        ]}
        onPress={() => navigation.navigate('EventForm', { selectedDate: selectedDate.toISOString() })}
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navButton: {
    padding: 8,
  },
  headerTitle: {
    fontWeight: '600',
    color: '#212529',
  },
  viewSelector: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 4,
  },
  viewOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  viewOptionSelected: {
    backgroundColor: '#2F80ED',
  },
  viewOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2F80ED',
  },
  viewOptionTextSelected: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  dayView: {
    flex: 1,
  },
  dayHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  dayTitle: {
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  daySubtitle: {
    color: '#6c757d',
  },
  dayEvents: {
    padding: 16,
    gap: 8,
  },
  emptyDay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyDayText: {
    fontSize: 16,
    color: '#6c757d',
    marginTop: 16,
  },
  eventItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2F80ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  eventContent: {
    flex: 1,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventTitle: {
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  eventTime: {
    color: '#6c757d',
    fontWeight: '500',
  },
  eventLocation: {
    color: '#6c757d',
    marginBottom: 8,
  },
  eventProfiles: {
    flexDirection: 'row',
    gap: 4,
  },
  profileDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  weekView: {
    flex: 1,
  },
  weekHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  weekTitle: {
    fontWeight: '600',
    color: '#212529',
  },
  weekContent: {
    flex: 1,
  },
  weekTimeContent: {
    flex: 1,
  },
  weekTimeContentInner: {
    flexDirection: 'row',
    minHeight: 24 * 60, // 24 hours * 60px minimum per hour
  },
  timeColumn: {
    width: 60,
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  timeSlot: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  timeLabel: {
    color: '#6c757d',
    fontWeight: '500',
  },
  weekGridContainer: {
    flex: 1,
  },
  weekGrid: {
    flex: 1,
  },
  weekDayHeaders: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  timeColumnHeader: {
    backgroundColor: '#f8f9fa',
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  weekDayHeader: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  weekDayName: {
    color: '#6c757d',
    fontWeight: '500',
  },
  weekDayNumber: {
    fontWeight: '600',
    color: '#212529',
    marginTop: 2,
  },
  todayNumber: {
    color: '#2F80ED',
  },
  timeGrid: {
    flex: 1,
    flexDirection: 'row',
  },
  weekDayColumn: {
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: '#e9ecef',
  },
  timeSlotBackground: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  weekEvent: {
    position: 'absolute',
    left: 2,
    right: 2,
    borderRadius: 4,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  weekEventTitle: {
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  weekEventTime: {
    color: '#fff',
    opacity: 0.9,
  },
  earlyMorningIndicator: {
    color: '#fff',
    fontWeight: 'bold',
    opacity: 0.8,
    marginTop: 2,
  },
  monthView: {
    flex: 1,
    minHeight: 0, // Allow flex to shrink if needed
  },
  monthHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  monthTitle: {
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  calendarGrid: {
    flex: 1,
    backgroundColor: '#fff',
    minHeight: 0, // Allow flex to shrink if needed
  },
  weekDayHeaders: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  weekDayHeaderText: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    fontWeight: '600',
    color: '#6c757d',
  },
  calendarDays: {
    flex: 1,
    flexWrap: 'wrap',
    flexDirection: 'row',
  },
  calendarDay: {
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    padding: 4,
    overflow: 'hidden', // Prevent content from overflowing
  },
  otherMonthDay: {
    backgroundColor: '#f8f9fa',
  },
  selectedDay: {
    backgroundColor: '#e3f2fd',
  },
  todayDay: {
    backgroundColor: '#fff3e0',
  },
  calendarDayNumberContainer: {
    alignSelf: 'flex-start',
    padding: 2,
  },
  calendarDayNumber: {
    fontWeight: '500',
    color: '#212529',
  },
  otherMonthText: {
    color: '#adb5bd',
  },
  selectedDayText: {
    color: '#1976d2',
    fontWeight: '600',
  },
  todayText: {
    color: '#f57c00',
    fontWeight: '600',
  },
  calendarDayEvents: {
    flexDirection: 'column',
    gap: 1,
    marginTop: 2,
    width: '100%',
    alignSelf: 'stretch',
    flex: 1,
    overflow: 'hidden', // Prevent events from overflowing
  },
  calendarEventBlock: {
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginBottom: 1,
    width: '100%',
    alignSelf: 'stretch',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  eventTimeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 10,
    lineHeight: 12,
  },
  eventTitleText: {
    color: '#fff',
    fontWeight: '500',
    fontSize: 10,
    lineHeight: 12,
    marginTop: 1,
  },
  moreEventsContainer: {
    marginTop: 1,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  moreEventsText: {
    color: '#6c757d',
    fontWeight: '500',
    fontStyle: 'italic',
    fontSize: 10,
    lineHeight: 12,
  },
  addButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2F80ED',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default CalendarScreen;
