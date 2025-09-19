import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format, parseISO, isSameDay } from 'date-fns';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAppStore } from '../../store';
import { Event, Profile } from '../../types';
import { getResponsiveLayout } from '../../utils/helpers';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Calendar: undefined;
  EventDetail: { eventId: string };
};

type EventDetailRouteProp = RouteProp<RootStackParamList, 'EventDetail'>;
type EventDetailNavigationProp = StackNavigationProp<RootStackParamList, 'EventDetail'>;

interface EventDetailScreenProps {
  route: EventDetailRouteProp;
  navigation: EventDetailNavigationProp;
}

const EventDetailScreen: React.FC<EventDetailScreenProps> = () => {
  const route = useRoute<EventDetailRouteProp>();
  const navigation = useNavigation<EventDetailNavigationProp>();
  const { events, profiles, deleteEvent } = useAppStore();
  const { eventId } = route.params;
  
  const event = events.find(e => e.id === eventId);
  const layout = getResponsiveLayout(width, 800);

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#dc3545" />
          <Text style={styles.errorTitle}>Event Not Found</Text>
          <Text style={styles.errorMessage}>
            The event you're looking for doesn't exist or has been deleted.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const assignedProfiles = profiles.filter(p => event.profileIds.includes(p.id));
  const creatorProfile = profiles.find(p => p.id === event.createdBy);

  const formatDateTime = (dateString: string, showTime: boolean = true) => {
    const date = parseISO(dateString);
    if (showTime) {
      return format(date, 'EEEE, MMMM d, yyyy \'at\' h:mm a');
    }
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, 'h:mm a');
  };

  const getDuration = () => {
    const start = parseISO(event.start);
    const end = parseISO(event.end);
    const diffInMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes`;
    } else if (diffInMinutes < 1440) { // Less than 24 hours
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''}`;
    }
  };

  const getRecurrenceText = () => {
    if (event.recurrence.freq === 'none') return 'No recurrence';
    
    const { freq, interval, count, until } = event.recurrence;
    let text = `Repeats every ${interval > 1 ? `${interval} ` : ''}`;
    
    switch (freq) {
      case 'daily':
        text += interval === 1 ? 'day' : 'days';
        break;
      case 'weekly':
        text += interval === 1 ? 'week' : 'weeks';
        break;
      case 'monthly':
        text += interval === 1 ? 'month' : 'months';
        break;
    }
    
    if (count) {
      text += ` (${count} times)`;
    } else if (until) {
      text += ` until ${format(parseISO(until), 'MMM d, yyyy')}`;
    }
    
    return text;
  };

  const getCategoryColor = () => {
    const colors = {
      personal: '#28a745',
      work: '#007bff',
      family: '#fd7e14',
      health: '#dc3545',
      education: '#6f42c1',
      social: '#20c997',
      other: '#6c757d',
    };
    return colors[event.category || 'other'];
  };

  const getPriorityColor = () => {
    const colors = {
      low: '#28a745',
      medium: '#ffc107',
      high: '#dc3545',
    };
    return colors[event.priority || 'medium'];
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteEvent(event.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleEdit = () => {
    navigation.navigate('EventForm', { eventId: event.id });
  };

  const handleShare = () => {
    const shareText = `${event.title}\n${formatDateTime(event.start, !event.allDay)}\n${event.location ? `📍 ${event.location}\n` : ''}${event.description || ''}`;
    
    // For now, just show an alert. In a real app, you'd use the Share API
    Alert.alert('Share Event', shareText);
  };

  const handleLocationPress = () => {
    if (event.location) {
      const encodedLocation = encodeURIComponent(event.location);
      const url = `https://maps.google.com/maps?q=${encodedLocation}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open maps app');
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color="#2F80ED" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
          <Ionicons name="create-outline" size={20} color="#2F80ED" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={20} color="#dc3545" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Event Title and Category */}
        <View style={styles.titleSection}>
          <View style={styles.titleRow}>
            <Text style={[styles.eventTitle, { fontSize: layout.fontSize + 6 }]}>
              {event.title}
            </Text>
            {event.category && (
              <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor() }]}>
                <Text style={styles.categoryText}>
                  {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                </Text>
              </View>
            )}
          </View>
          
          {event.priority && event.priority !== 'medium' && (
            <View style={styles.priorityRow}>
              <Ionicons 
                name="flag" 
                size={16} 
                color={getPriorityColor()} 
              />
              <Text style={[styles.priorityText, { color: getPriorityColor() }]}>
                {event.priority.charAt(0).toUpperCase() + event.priority.slice(1)} Priority
              </Text>
            </View>
          )}
          
          {/* Event Status Indicator */}
          <View style={styles.statusIndicator}>
            <View style={[styles.statusDot, { backgroundColor: event.allDay ? '#28a745' : '#2F80ED' }]} />
            <Text style={styles.statusText}>
              {event.allDay ? 'All Day Event' : 'Timed Event'}
            </Text>
          </View>
        </View>

        {/* Date and Time Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="calendar-outline" size={20} color="#2F80ED" />
            </View>
            <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
              Date & Time
            </Text>
          </View>
          
          <View style={styles.dateTimeInfo}>
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeLabelContainer}>
                <Ionicons name="time-outline" size={16} color="#6c757d" />
                <Text style={[styles.dateTimeLabel, { fontSize: layout.fontSize }]}>
                  {event.allDay ? 'Date' : 'Start'}
                </Text>
              </View>
              <Text style={[styles.dateTimeValue, { fontSize: layout.fontSize }]}>
                {formatDateTime(event.start, !event.allDay)}
              </Text>
            </View>
            
            {!event.allDay && (
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeLabelContainer}>
                  <Ionicons name="time-outline" size={16} color="#6c757d" />
                  <Text style={[styles.dateTimeLabel, { fontSize: layout.fontSize }]}>
                    End
                  </Text>
                </View>
                <Text style={[styles.dateTimeValue, { fontSize: layout.fontSize }]}>
                  {formatDateTime(event.end, true)}
                </Text>
              </View>
            )}
            
            <View style={styles.dateTimeRow}>
              <View style={styles.dateTimeLabelContainer}>
                <Ionicons name="hourglass-outline" size={16} color="#6c757d" />
                <Text style={[styles.dateTimeLabel, { fontSize: layout.fontSize }]}>
                  Duration
                </Text>
              </View>
              <Text style={[styles.dateTimeValue, { fontSize: layout.fontSize }]}>
                {getDuration()}
              </Text>
            </View>
            
            {event.recurrence.freq !== 'none' && (
              <View style={styles.dateTimeRow}>
                <View style={styles.dateTimeLabelContainer}>
                  <Ionicons name="repeat-outline" size={16} color="#6c757d" />
                  <Text style={[styles.dateTimeLabel, { fontSize: layout.fontSize }]}>
                    Recurrence
                  </Text>
                </View>
                <Text style={[styles.dateTimeValue, { fontSize: layout.fontSize }]}>
                  {getRecurrenceText()}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Location */}
        {event.location && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="location-outline" size={20} color="#2F80ED" />
              </View>
              <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
                Location
              </Text>
            </View>
            
            <TouchableOpacity style={styles.locationContainer} onPress={handleLocationPress}>
              <Text style={[styles.locationText, { fontSize: layout.fontSize }]}>
                {event.location}
              </Text>
              {event.locationDetails && (
                <Text style={[styles.locationDetails, { fontSize: layout.fontSize - 2 }]}>
                  {event.locationDetails}
                </Text>
              )}
              <Ionicons name="open-outline" size={16} color="#6c757d" />
            </TouchableOpacity>
          </View>
        )}

        {/* Description */}
        {event.description && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="document-text-outline" size={20} color="#2F80ED" />
              </View>
              <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
                Description
              </Text>
            </View>
            <Text style={[styles.descriptionText, { fontSize: layout.fontSize }]}>
              {event.description}
            </Text>
          </View>
        )}

        {/* Attendees */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="people-outline" size={20} color="#2F80ED" />
            </View>
            <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
              Attendees ({assignedProfiles.length})
            </Text>
          </View>
          
          <View style={styles.attendeesContainer}>
            {assignedProfiles.map((profile) => (
              <View key={profile.id} style={styles.attendeeItem}>
                <View style={[styles.profileDot, { backgroundColor: profile.color }]} />
                <Text style={[styles.attendeeName, { fontSize: layout.fontSize }]}>
                  {profile.name}
                </Text>
                <Text style={[styles.attendeeRole, { fontSize: layout.fontSize - 2 }]}>
                  {profile.role}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconContainer}>
              <Ionicons name="information-circle-outline" size={20} color="#2F80ED" />
            </View>
            <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
              Additional Information
            </Text>
          </View>
          
          <View style={styles.additionalInfo}>
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { fontSize: layout.fontSize }]}>
                Created by
              </Text>
              <Text style={[styles.infoValue, { fontSize: layout.fontSize }]}>
                {creatorProfile?.name || 'Unknown'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { fontSize: layout.fontSize }]}>
                Created
              </Text>
              <Text style={[styles.infoValue, { fontSize: layout.fontSize }]}>
                {format(parseISO(event.createdAt), 'MMM d, yyyy \'at\' h:mm a')}
              </Text>
            </View>
            
            {event.updatedAt !== event.createdAt && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { fontSize: layout.fontSize }]}>
                  Last updated
                </Text>
                <Text style={[styles.infoValue, { fontSize: layout.fontSize }]}>
                  {format(parseISO(event.updatedAt), 'MMM d, yyyy \'at\' h:mm a')}
                </Text>
              </View>
            )}
            
            {event.reminder && event.reminder.enabled && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { fontSize: layout.fontSize }]}>
                  Reminder
                </Text>
                <Text style={[styles.infoValue, { fontSize: layout.fontSize }]}>
                  {event.reminder.minutes} minutes before
                </Text>
              </View>
            )}
            
            {event.isPrivate && (
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { fontSize: layout.fontSize }]}>
                  Privacy
                </Text>
                <Text style={[styles.infoValue, { fontSize: layout.fontSize }]}>
                  Private event
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Notes */}
        {event.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconContainer}>
                <Ionicons name="clipboard-outline" size={20} color="#2F80ED" />
              </View>
              <Text style={[styles.sectionTitle, { fontSize: layout.fontSize + 2 }]}>
                Notes
              </Text>
            </View>
            <Text style={[styles.notesText, { fontSize: layout.fontSize }]}>
              {event.notes}
            </Text>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  actionButton: {
    padding: 12,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc3545',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  titleSection: {
    backgroundColor: '#fff',
    padding: 24,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  eventTitle: {
    flex: 1,
    fontWeight: '700',
    color: '#1a1a1a',
    marginRight: 16,
    lineHeight: 32,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f0f8ff',
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2F80ED',
    letterSpacing: 0.3,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '700',
    color: '#1a1a1a',
    fontSize: 16,
    letterSpacing: 0.3,
  },
  dateTimeInfo: {
    gap: 16,
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dateTimeLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateTimeLabel: {
    color: '#6c757d',
    fontWeight: '600',
    fontSize: 14,
  },
  dateTimeValue: {
    color: '#1a1a1a',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
    fontSize: 14,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#667eea',
    borderRadius: 12,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  locationText: {
    flex: 1,
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  locationDetails: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontSize: 13,
  },
  descriptionText: {
    color: '#1a1a1a',
    lineHeight: 24,
    fontSize: 15,
    fontWeight: '500',
  },
  attendeesContainer: {
    gap: 16,
  },
  attendeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  profileDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  attendeeName: {
    flex: 1,
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: 15,
  },
  attendeeRole: {
    color: '#6c757d',
    textTransform: 'capitalize',
    fontSize: 13,
    fontWeight: '500',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  additionalInfo: {
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    color: '#6c757d',
    fontWeight: '600',
    fontSize: 14,
  },
  infoValue: {
    color: '#1a1a1a',
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
    fontSize: 14,
  },
  notesText: {
    color: '#1a1a1a',
    lineHeight: 24,
    fontStyle: 'italic',
    fontSize: 15,
    fontWeight: '500',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2F80ED',
  },
  bottomSpacing: {
    height: 40,
  },
});

export default EventDetailScreen;
