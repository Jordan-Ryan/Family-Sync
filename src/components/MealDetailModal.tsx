import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Meal } from '../types';

interface MealDetailModalProps {
  visible: boolean;
  onClose: () => void;
  meal: Meal | null;
  onRemove?: () => void;
  showRemoveButton?: boolean;
  // People management
  assignedProfiles?: Array<{ id: string; name: string; color: string }>;
  allProfiles?: Array<{ id: string; name: string; color: string }>;
  onAddPerson?: (profileId: string) => void;
  onRemovePerson?: (profileId: string) => void;
  showPeopleManagement?: boolean;
}

const MealDetailModal: React.FC<MealDetailModalProps> = ({ 
  visible, 
  onClose, 
  meal,
  onRemove,
  showRemoveButton = false,
  assignedProfiles = [],
  allProfiles = [],
  onAddPerson,
  onRemovePerson,
  showPeopleManagement = false
}) => {
  if (!meal) return null;

  const formatTime = (minutes?: number | string) => {
    if (!minutes || minutes === 0) return 'Not specified';
    const numMinutes = typeof minutes === 'string' ? parseInt(minutes, 10) : minutes;
    if (isNaN(numMinutes) || numMinutes <= 0) return 'Not specified';
    if (numMinutes < 60) return `${numMinutes} min`;
    const hours = Math.floor(numMinutes / 60);
    const mins = numMinutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const handleOpenYouTube = () => {
    // Extract YouTube video ID from URL if it exists
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
    const match = meal.youtubeUrl?.match(youtubeRegex);
    
    if (match && match[1]) {
      const videoId = match[1];
      const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
      Linking.openURL(youtubeUrl).catch(() => {
        Alert.alert('Error', 'Could not open YouTube video');
      });
    }
  };

  const renderTag = (tag: string, index: number) => (
    <View key={index} style={styles.tag}>
      <Text style={styles.tagText}>{String(tag || '')}</Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{String(meal.name || '')}</Text>
          </View>

          {/* Meal Image */}
          <Image 
            source={{ uri: meal.imageUrl }} 
            style={styles.mealImage}
            defaultSource={require('../../assets/icon.png')}
          />

          {/* Basic Info */}
          <View style={styles.mealInfo}>
            {meal.description && (
              <Text style={styles.mealDescription}>{String(meal.description)}</Text>
            )}
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="restaurant-outline" size={16} color="#666" />
                <Text style={styles.metaText}>{String(meal.category || '')}</Text>
              </View>
              
              {meal.prepTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.metaText}>Prep: {formatTime(meal.prepTime)}</Text>
                </View>
              )}
              
              {meal.cookTime && (
                <View style={styles.metaItem}>
                  <Ionicons name="flame-outline" size={16} color="#666" />
                  <Text style={styles.metaText}>Cook: {formatTime(meal.cookTime)}</Text>
                </View>
              )}
              
              {meal.servings && (
                <View style={styles.metaItem}>
                  <Ionicons name="people-outline" size={16} color="#666" />
                  <Text style={styles.metaText}>{String(meal.servings)} servings</Text>
                </View>
              )}
            </View>

            {/* Tags */}
            {meal.tags && meal.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                <Text style={styles.sectionTitle}>Tags</Text>
                <View style={styles.tagsList}>
                  {meal.tags.map(renderTag)}
                </View>
              </View>
            )}

            {/* Ingredients */}
            {meal.ingredients && meal.ingredients.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                {meal.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.ingredientItem}>
                    <Text style={styles.ingredientText}>• {String(ingredient)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Instructions */}
            {meal.instructions && meal.instructions.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {meal.instructions.map((instruction, index) => (
                  <View key={index} style={styles.instructionItem}>
                    <Text style={styles.instructionNumber}>{index + 1}</Text>
                    <Text style={styles.instructionText}>{String(instruction)}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                <Text style={styles.noInstructionsText}>
                  No cooking instructions available for this recipe.
                </Text>
              </View>
            )}

            {/* Nutrition Information */}
            {meal.nutrition && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Nutrition (per serving)</Text>
                <View style={styles.nutritionGrid}>
                  {meal.nutrition.calories && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{Math.round(meal.nutrition.calories)}</Text>
                      <Text style={styles.nutritionLabel}>Calories</Text>
                    </View>
                  )}
                  {meal.nutrition.protein && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{Math.round(meal.nutrition.protein)}g</Text>
                      <Text style={styles.nutritionLabel}>Protein</Text>
                    </View>
                  )}
                  {meal.nutrition.carbs && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{Math.round(meal.nutrition.carbs)}g</Text>
                      <Text style={styles.nutritionLabel}>Carbs</Text>
                    </View>
                  )}
                  {meal.nutrition.fat && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{Math.round(meal.nutrition.fat)}g</Text>
                      <Text style={styles.nutritionLabel}>Fat</Text>
                    </View>
                  )}
                  {meal.nutrition.fiber && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{Math.round(meal.nutrition.fiber)}g</Text>
                      <Text style={styles.nutritionLabel}>Fiber</Text>
                    </View>
                  )}
                  {meal.nutrition.sugar && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{Math.round(meal.nutrition.sugar)}g</Text>
                      <Text style={styles.nutritionLabel}>Sugar</Text>
                    </View>
                  )}
                  {meal.nutrition.sodium && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{Math.round(meal.nutrition.sodium)}mg</Text>
                      <Text style={styles.nutritionLabel}>Sodium</Text>
                    </View>
                  )}
                  {meal.nutrition.cholesterol && (
                    <View style={styles.nutritionItem}>
                      <Text style={styles.nutritionValue}>{Math.round(meal.nutrition.cholesterol)}mg</Text>
                      <Text style={styles.nutritionLabel}>Cholesterol</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Links */}
            <View style={styles.linksContainer}>
              {meal.youtubeUrl && (
                <TouchableOpacity style={styles.linkButton} onPress={handleOpenYouTube}>
                  <Ionicons name="logo-youtube" size={20} color="#FF0000" />
                  <Text style={styles.linkButtonText}>Watch on YouTube</Text>
                </TouchableOpacity>
              )}
              
              {meal.source && (
                <TouchableOpacity 
                  style={styles.linkButton} 
                  onPress={() => Linking.openURL(meal.source!).catch(() => {
                    Alert.alert('Error', 'Could not open source link');
                  })}
                >
                  <Ionicons name="link-outline" size={20} color="#007AFF" />
                  <Text style={styles.linkButtonText}>View Source</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* People Management */}
            {showPeopleManagement && (
              <View style={styles.peopleSection}>
                <Text style={styles.sectionTitle}>Who's having this meal?</Text>
                
                {/* Assigned People */}
                <View style={styles.assignedPeople}>
                  {assignedProfiles.map((profile) => (
                    <View key={profile.id} style={styles.personChip}>
                      <View style={[styles.personAvatar, { backgroundColor: profile.color }]}>
                        <Text style={styles.personInitial}>{profile.name.charAt(0)}</Text>
                      </View>
                      <Text style={styles.personName}>{profile.name}</Text>
                      {onRemovePerson && (
                        <TouchableOpacity 
                          style={styles.removePersonButton}
                          onPress={() => onRemovePerson(profile.id)}
                        >
                          <Ionicons name="close" size={16} color="#666" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>

                {/* Available People to Add */}
                {allProfiles.filter(p => !assignedProfiles.find(ap => ap.id === p.id)).length > 0 && (
                  <View style={styles.availablePeople}>
                    <Text style={styles.subsectionTitle}>Add someone:</Text>
                    <View style={styles.availablePeopleList}>
                      {allProfiles
                        .filter(profile => !assignedProfiles.find(ap => ap.id === profile.id))
                        .map((profile) => (
                          <TouchableOpacity 
                            key={profile.id} 
                            style={styles.addPersonButton}
                            onPress={() => onAddPerson?.(profile.id)}
                          >
                            <View style={[styles.personAvatar, { backgroundColor: profile.color }]}>
                              <Text style={styles.personInitial}>{profile.name.charAt(0)}</Text>
                            </View>
                            <Text style={styles.addPersonText}>+ {profile.name}</Text>
                          </TouchableOpacity>
                        ))}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Remove Button */}
            {showRemoveButton && onRemove && (
              <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.removeButtonText}>Remove Meal</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  mealImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  mealInfo: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  mealDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tagsContainer: {
    marginBottom: 24,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  ingredientItem: {
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
  },
  linksContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  linkButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  removeButton: {
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  removeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  peopleSection: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  assignedPeople: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  personChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  personAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  personInitial: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  personName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginRight: 4,
  },
  removePersonButton: {
    padding: 2,
  },
  availablePeople: {
    marginTop: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  availablePeopleList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  addPersonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#bbdefb',
  },
  addPersonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1976d2',
    marginLeft: 4,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 8,
  },
  nutritionItem: {
    flex: 1,
    minWidth: 80,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noInstructionsText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default MealDetailModal;
