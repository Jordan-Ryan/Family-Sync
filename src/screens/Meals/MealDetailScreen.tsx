import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { Meal } from '../../types';

type RootStackParamList = {
  MealDetail: { meal: Meal };
};

type MealDetailScreenRouteProp = RouteProp<RootStackParamList, 'MealDetail'>;
type MealDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MealDetail'>;

interface MealDetailScreenProps {
  navigation: MealDetailScreenNavigationProp;
}

const MealDetailScreen: React.FC<MealDetailScreenProps> = ({ navigation }) => {
  const route = useRoute<MealDetailScreenRouteProp>();
  const { meal } = route.params;

  const handleOpenYouTube = () => {
    // Extract YouTube video ID from URL
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

  const formatTime = (minutes?: number) => {
    if (!minutes) return 'Not specified';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const renderIngredient = (ingredient: string, index: number) => (
    <View key={index} style={styles.ingredientItem}>
      <Text style={styles.ingredientBullet}>•</Text>
      <Text style={styles.ingredientText}>{ingredient}</Text>
    </View>
  );

  const renderInstruction = (instruction: string, index: number) => (
    <View key={index} style={styles.instructionItem}>
      <View style={styles.instructionNumber}>
        <Text style={styles.instructionNumberText}>{index + 1}</Text>
      </View>
      <Text style={styles.instructionText}>{instruction}</Text>
    </View>
  );

  const renderTag = (tag: string, index: number) => (
    <View key={index} style={styles.tag}>
      <Text style={styles.tagText}>{tag}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recipe Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Meal Image */}
        {meal.imageUrl && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
            <View style={styles.imageOverlay}>
              <Text style={styles.categoryBadge}>{meal.category}</Text>
            </View>
          </View>
        )}

        {/* Meal Info */}
        <View style={styles.mealInfo}>
          <Text style={styles.mealName}>{meal.name}</Text>
          
          {meal.description && (
            <Text style={styles.mealDescription}>{meal.description}</Text>
          )}

          {/* Time and Servings Info */}
          <View style={styles.infoRow}>
            {meal.prepTime && (
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.infoText}>Prep: {formatTime(meal.prepTime)}</Text>
              </View>
            )}
            {meal.cookTime && (
              <View style={styles.infoItem}>
                <Ionicons name="flame-outline" size={16} color="#666" />
                <Text style={styles.infoText}>Cook: {formatTime(meal.cookTime)}</Text>
              </View>
            )}
            {meal.servings && (
              <View style={styles.infoItem}>
                <Ionicons name="people-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{meal.servings} servings</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {meal.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              <Text style={styles.sectionTitle}>Tags</Text>
              <View style={styles.tagsList}>
                {meal.tags.map(renderTag)}
              </View>
            </View>
          )}
        </View>

        {/* YouTube Link */}
        {meal.youtubeUrl && (
          <TouchableOpacity style={styles.youtubeButton} onPress={handleOpenYouTube}>
            <Ionicons name="logo-youtube" size={24} color="#FF0000" />
            <Text style={styles.youtubeText}>Watch on YouTube</Text>
            <Ionicons name="open-outline" size={16} color="#FF0000" />
          </TouchableOpacity>
        )}

        {/* Ingredients */}
        {meal.ingredients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            <View style={styles.ingredientsList}>
              {meal.ingredients.map(renderIngredient)}
            </View>
          </View>
        )}

        {/* Instructions */}
        {meal.instructions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            <View style={styles.instructionsList}>
              {meal.instructions.map(renderInstruction)}
            </View>
          </View>
        )}

        {/* Source Link */}
        {meal.source && (
          <TouchableOpacity
            style={styles.sourceButton}
            onPress={() => Linking.openURL(meal.source!).catch(() => {
              Alert.alert('Error', 'Could not open source link');
            })}
          >
            <Ionicons name="link-outline" size={20} color="#007AFF" />
            <Text style={styles.sourceText}>View Original Recipe</Text>
            <Ionicons name="open-outline" size={16} color="#007AFF" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  mealImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#f0f0f0',
  },
  imageOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  categoryBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.9)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  mealInfo: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  mealName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
    lineHeight: 32,
  },
  mealDescription: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  tagsContainer: {
    marginBottom: 20,
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
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ingredientBullet: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
    marginTop: 2,
  },
  ingredientText: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  },
  instructionNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
  },
  youtubeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 20,
  },
  youtubeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000',
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 32,
  },
  sourceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
});

export default MealDetailScreen;

