import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';

import { useAppStore } from '../../store';
import { ChoreCompletionStatus } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ChoreDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChoreDetail'>;
type ChoreDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ChoreDetail'>;

const ChoreDetailScreen: React.FC = () => {
  const route = useRoute<ChoreDetailScreenRouteProp>();
  const navigation = useNavigation<ChoreDetailScreenNavigationProp>();
  const { chores, profiles, approveChore, rejectChore } = useAppStore();
  const { choreId } = route.params;

  const chore = chores.find(c => c.id === choreId);
  const today = new Date().toISOString().split('T')[0];

  if (!chore) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Chore Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const pendingCompletions = chore.completedBy.filter(
    completion => completion.date === today && completion.status === 'pending_approval'
  );

  const handleApprove = (profileId: string) => {
    Alert.alert(
      'Approve Chore',
      'Are you sure you want to approve this chore completion?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Approve', 
          onPress: () => approveChore(choreId, profileId, today, 'profile-1') // TODO: Get current user
        }
      ]
    );
  };

  const handleReject = (profileId: string) => {
    Alert.alert(
      'Reject Chore',
      'Are you sure you want to reject this chore completion?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reject', 
          style: 'destructive',
          onPress: () => rejectChore(choreId, profileId, today, 'profile-1') // TODO: Get current user
        }
      ]
    );
  };

  const getStatusIcon = (status: ChoreCompletionStatus) => {
    switch (status) {
      case 'pending_approval':
        return <Ionicons name="time-outline" size={20} color="#FFA500" />;
      case 'approved':
        return <Ionicons name="checkmark-circle" size={20} color="#27AE60" />;
      case 'rejected':
        return <Ionicons name="close-circle" size={20} color="#E74C3C" />;
      default:
        return <Ionicons name="checkmark" size={20} color="#27AE60" />;
    }
  };

  const getStatusText = (status: ChoreCompletionStatus) => {
    switch (status) {
      case 'pending_approval':
        return 'Pending Approval';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Completed';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{chore.title}</Text>
            {chore.description && (
              <Text style={styles.description}>{chore.description}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditChore', { choreId: chore.id })}
          >
            <Ionicons name="create-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        {/* Chore Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chore Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Time of Day:</Text>
            <Text style={styles.infoValue}>{chore.timeOfDay}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{chore.type}</Text>
          </View>
          {chore.scheduledTime && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Scheduled Time:</Text>
              <Text style={styles.infoValue}>{chore.scheduledTime}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reward Stars:</Text>
            <Text style={styles.infoValue}>{chore.rewardStars || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Shared Chore:</Text>
            <Text style={styles.infoValue}>{chore.isShared ? 'Yes' : 'No'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Requires Approval:</Text>
            <Text style={styles.infoValue}>{chore.requiresApproval ? 'Yes' : 'No'}</Text>
          </View>
        </View>

        {/* Assigned People */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Assigned To</Text>
          {chore.profileIds.map(profileId => {
            const profile = profiles.find(p => p.id === profileId);
            if (!profile) return null;
            
            return (
              <View key={profileId} style={styles.profileItem}>
                <View style={[styles.profileAvatar, { backgroundColor: profile.color }]}>
                  <Text style={styles.profileInitial}>{profile.name.charAt(0)}</Text>
                </View>
                <Text style={styles.profileName}>{profile.name}</Text>
              </View>
            );
          })}
        </View>

        {/* Today's Completions */}
        {chore.requiresApproval && pendingCompletions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Approvals</Text>
            {pendingCompletions.map((completion, index) => {
              const profile = profiles.find(p => p.id === completion.profileId);
              if (!profile) return null;
              
              return (
                <View key={index} style={styles.completionItem}>
                  <View style={styles.completionHeader}>
                    <View style={[styles.profileAvatar, { backgroundColor: profile.color }]}>
                      <Text style={styles.profileInitial}>{profile.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.completionInfo}>
                      <Text style={styles.completionName}>{profile.name}</Text>
                      <Text style={styles.completionTime}>
                        Completed at {format(new Date(completion.completedAt), 'h:mm a')}
                      </Text>
                    </View>
                    {getStatusIcon(completion.status)}
                  </View>
                  <View style={styles.completionActions}>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.rejectButton]}
                      onPress={() => handleReject(completion.profileId)}
                    >
                      <Ionicons name="close" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Reject</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.approveButton]}
                      onPress={() => handleApprove(completion.profileId)}
                    >
                      <Ionicons name="checkmark" size={16} color="#fff" />
                      <Text style={styles.actionButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* All Completions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Completions</Text>
          {chore.completedBy
            .filter(completion => completion.date === today)
            .map((completion, index) => {
              const profile = profiles.find(p => p.id === completion.profileId);
              if (!profile) return null;
              
              return (
                <View key={index} style={styles.completionItem}>
                  <View style={styles.completionHeader}>
                    <View style={[styles.profileAvatar, { backgroundColor: profile.color }]}>
                      <Text style={styles.profileInitial}>{profile.name.charAt(0)}</Text>
                    </View>
                    <View style={styles.completionInfo}>
                      <Text style={styles.completionName}>{profile.name}</Text>
                      <Text style={styles.completionTime}>
                        Completed at {format(new Date(completion.completedAt), 'h:mm a')}
                      </Text>
                    </View>
                    {getStatusIcon(completion.status)}
                  </View>
                  <Text style={styles.statusText}>{getStatusText(completion.status)}</Text>
                </View>
              );
            })}
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
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#6c757d',
  },
  editButton: {
    padding: 8,
    marginLeft: 16,
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 8,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  infoLabel: {
    fontSize: 16,
    color: '#6c757d',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
    fontSize: 16,
    color: '#212529',
  },
  completionItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  completionName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
  },
  completionTime: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 2,
  },
  completionActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButton: {
    backgroundColor: '#27AE60',
  },
  rejectButton: {
    backgroundColor: '#E74C3C',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusText: {
    fontSize: 14,
    color: '#6c757d',
    fontStyle: 'italic',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChoreDetailScreen;
