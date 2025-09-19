import React, { useState } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppStore } from '../../store';
import { Meal, MealCategory } from '../../types';

interface MealFormScreenProps {
  navigation: any;
  route?: {
    params?: {
      meal?: Meal;
      mode?: 'edit' | 'add';
    };
  };
}

const MealFormScreen: React.FC<MealFormScreenProps> = ({ navigation, route }) => {
  const { addMeal, updateMeal } = useAppStore();
  const isEditing = route?.params?.mode === 'edit';
  const existingMeal = route?.params?.meal;

  const [formData, setFormData] = useState({
    name: existingMeal?.name || '',
    description: existingMeal?.description || '',
    category: existingMeal?.category || 'dinner' as MealCategory,
    prepTime: existingMeal?.prepTime?.toString() || '',
    cookTime: existingMeal?.cookTime?.toString() || '',
    servings: existingMeal?.servings?.toString() || '',
    ingredients: existingMeal?.ingredients || [''],
    instructions: existingMeal?.instructions || [''],
    tags: existingMeal?.tags || [],
  });

  const [newIngredient, setNewIngredient] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [newTag, setNewTag] = useState('');

  const categories: { key: MealCategory; label: string }[] = [
    { key: 'breakfast', label: 'Breakfast' },
    { key: 'lunch', label: 'Lunch' },
    { key: 'dinner', label: 'Dinner' },
    { key: 'snack', label: 'Snack' },
  ];

  const handleSave = () => {
    // Validate required fields
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a meal name');
      return;
    }

    if (formData.ingredients.length === 0 || !formData.ingredients[0]?.trim()) {
      Alert.alert('Error', 'Please add at least one ingredient');
      return;
    }

    if (formData.instructions.length === 0 || !formData.instructions[0]?.trim()) {
      Alert.alert('Error', 'Please add at least one instruction');
      return;
    }

    // Clean up empty ingredients and instructions
    const cleanIngredients = formData.ingredients.filter(ing => ing.trim());
    const cleanInstructions = formData.instructions.filter(inst => inst.trim());

    const mealData: Omit<Meal, 'id'> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      category: formData.category,
      prepTime: formData.prepTime ? parseInt(formData.prepTime) : undefined,
      cookTime: formData.cookTime ? parseInt(formData.cookTime) : undefined,
      servings: formData.servings ? parseInt(formData.servings) : undefined,
      ingredients: cleanIngredients,
      instructions: cleanInstructions,
      tags: formData.tags,
    };

    try {
      if (isEditing && existingMeal) {
        updateMeal(existingMeal.id, mealData);
        Alert.alert('Success', 'Meal updated successfully');
      } else {
        addMeal(mealData);
        Alert.alert('Success', 'Meal added successfully');
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to save meal. Please try again.');
      console.error('Error saving meal:', error);
    }
  };

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient.trim()]
      }));
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addInstruction = () => {
    if (newInstruction.trim()) {
      setFormData(prev => ({
        ...prev,
        instructions: [...prev.instructions, newInstruction.trim()]
      }));
      setNewInstruction('');
    }
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

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
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Meal' : 'Add Custom Meal'}
        </Text>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Meal Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              placeholder="Enter meal name"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              placeholder="Enter meal description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.key}
                  style={[
                    styles.categoryButton,
                    formData.category === category.key && styles.categoryButtonActive
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, category: category.key }))}
                >
                  <Text style={[
                    styles.categoryButtonText,
                    formData.category === category.key && styles.categoryButtonTextActive
                  ]}>
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={styles.label}>Prep Time (min)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.prepTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, prepTime: text }))}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.label}>Cook Time (min)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.cookTime}
                onChangeText={(text) => setFormData(prev => ({ ...prev, cookTime: text }))}
                placeholder="0"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
            <View style={styles.timeInput}>
              <Text style={styles.label}>Servings</Text>
              <TextInput
                style={styles.textInput}
                value={formData.servings}
                onChangeText={(text) => setFormData(prev => ({ ...prev, servings: text }))}
                placeholder="4"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ingredients *</Text>
          {formData.ingredients.map((ingredient, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.listItemText}>{ingredient}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeIngredient(index)}
              >
                <Ionicons name="close-circle" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.textInput, styles.addItemInput]}
              value={newIngredient}
              onChangeText={setNewIngredient}
              placeholder="Add ingredient"
              placeholderTextColor="#999"
              onSubmitEditing={addIngredient}
            />
            <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructions *</Text>
          {formData.instructions.map((instruction, index) => (
            <View key={index} style={styles.instructionItem}>
              <View style={styles.instructionNumber}>
                <Text style={styles.instructionNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.instructionText}>{instruction}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeInstruction(index)}
              >
                <Ionicons name="close-circle" size={20} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.textInput, styles.addItemInput]}
              value={newInstruction}
              onChangeText={setNewInstruction}
              placeholder="Add instruction step"
              placeholderTextColor="#999"
              multiline
              onSubmitEditing={addInstruction}
            />
            <TouchableOpacity style={styles.addButton} onPress={addInstruction}>
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {formData.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(index)}>
                  <Ionicons name="close" size={16} color="#666" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View style={styles.addItemContainer}>
            <TextInput
              style={[styles.textInput, styles.addItemInput]}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add tag"
              placeholderTextColor="#999"
              onSubmitEditing={addTag}
            />
            <TouchableOpacity style={styles.addButton} onPress={addTag}>
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212529',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#212529',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  listItemText: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  instructionNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
    lineHeight: 22,
  },
  removeButton: {
    marginLeft: 8,
  },
  addItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addItemInput: {
    flex: 1,
  },
  addButton: {
    padding: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default MealFormScreen;

