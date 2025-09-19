import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mealApiService, ProcessedMeal } from '../services/mealApi';

interface MealBrowserProps {
  visible: boolean;
  onClose: () => void;
  onSelectMeal?: (meal: ProcessedMeal) => void;
  mealType?: string;
}

interface MealItemProps {
  meal: ProcessedMeal;
  onSelect: () => void;
}

const MealItem: React.FC<MealItemProps> = ({ meal, onSelect }) => {
  return (
    <TouchableOpacity style={styles.mealItem} onPress={onSelect} activeOpacity={0.7}>
      <Image 
        source={{ uri: meal.imageUrl }} 
        style={styles.mealImage}
        defaultSource={require('../../assets/icon.png')}
      />
      <View style={styles.mealInfo}>
        <Text style={styles.mealName} numberOfLines={2}>
          {meal.name}
        </Text>
        <Text style={styles.mealDescription} numberOfLines={1}>
          {meal.description || meal.area}
        </Text>
        <View style={styles.mealTags}>
          {meal.tags.slice(0, 2).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );
};

const MealBrowser: React.FC<MealBrowserProps> = ({ 
  visible, 
  onClose, 
  onSelectMeal,
  mealType
}) => {
  const [meals, setMeals] = useState<ProcessedMeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<ProcessedMeal[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<ProcessedMeal | null>(null);
  const [showMealDetail, setShowMealDetail] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxPrepTime: '',
    maxCookTime: '',
    minRating: '',
    maxCalories: '',
    dietary: [] as string[],
  });

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible]);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Load random meals and categories
      const [randomMeals, categoriesData] = await Promise.all([
        mealApiService.getRandomMeals(20),
        mealApiService.getCategories()
      ]);
      
      setMeals(randomMeals);
      setCategories(categoriesData);
    } catch (error) {
      Alert.alert('Error', 'Failed to load meals. Please try again.');
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await mealApiService.searchMeals(searchQuery);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search meals. Please try again.');
      console.error('Error searching meals:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchWithFilters = async () => {
    setIsSearching(true);
    try {
      const searchOptions = {
        category: selectedCategory || undefined,
        maxPrepTime: filters.maxPrepTime ? parseInt(filters.maxPrepTime) : undefined,
        maxCookTime: filters.maxCookTime ? parseInt(filters.maxCookTime) : undefined,
        minRating: filters.minRating ? parseFloat(filters.minRating) : undefined,
        limit: 50,
      };

      let results: ProcessedMeal[] = [];
      
      if (searchQuery.trim()) {
        results = await mealApiService.searchMeals(searchQuery);
      } else if (selectedCategory) {
        results = await mealApiService.getMealsByCategory(selectedCategory);
      } else {
        results = await mealApiService.getRandomMeals(50);
      }

      // Apply client-side filters
      let filteredResults = results;

      if (filters.maxPrepTime) {
        const maxPrep = parseInt(filters.maxPrepTime);
        filteredResults = filteredResults.filter(meal => 
          !meal.prepTime || meal.prepTime <= maxPrep
        );
      }

      if (filters.maxCookTime) {
        const maxCook = parseInt(filters.maxCookTime);
        filteredResults = filteredResults.filter(meal => 
          !meal.cookTime || meal.cookTime <= maxCook
        );
      }

      if (filters.minRating) {
        const minRating = parseFloat(filters.minRating);
        filteredResults = filteredResults.filter(meal => 
          !meal.rating || meal.rating >= minRating
        );
      }

      if (filters.maxCalories) {
        const maxCalories = parseInt(filters.maxCalories);
        filteredResults = filteredResults.filter(meal => 
          !meal.nutrition?.calories || meal.nutrition.calories <= maxCalories
        );
      }

      setSearchResults(filteredResults);
      setMeals(filteredResults);
    } catch (error) {
      Alert.alert('Error', 'Failed to apply filters. Please try again.');
      console.error('Error applying filters:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCategorySelect = async (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    try {
      const categoryMeals = await mealApiService.getMealsByCategory(category);
      setMeals(categoryMeals);
    } catch (error) {
      Alert.alert('Error', 'Failed to load meals from category. Please try again.');
      console.error('Error loading category meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMealSelect = (meal: ProcessedMeal) => {
    setSelectedMeal(meal);
    setShowMealDetail(true);
  };

  const handleBackToList = () => {
    setShowMealDetail(false);
    setSelectedMeal(null);
  };

  const handleAddMeal = (meal: ProcessedMeal) => {
    if (onSelectMeal) {
      onSelectMeal(meal);
      onClose();
    }
  };


  const resetToRandom = () => {
    setSelectedCategory('');
    setSearchQuery('');
    setSearchResults([]);
    loadInitialData();
  };

  const handleQuickMealsFilter = async (type: 'quick' | 'super-quick') => {
    setSelectedCategory(type);
    setSearchQuery('');
    setSearchResults([]);
    setLoading(true);
    try {
      const allMeals = await mealApiService.getRandomMeals(100);
      const maxTime = type === 'quick' ? 30 : 15;
      
      const quickMeals = allMeals.filter(meal => {
        const totalTime = (meal.prepTime || 0) + (meal.cookTime || 0);
        return totalTime <= maxTime;
      }).sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)); // Sort by review count
      
      setMeals(quickMeals.slice(0, 20));
    } catch (error) {
      Alert.alert('Error', 'Failed to load quick meals. Please try again.');
      console.error('Error loading quick meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProteinFilter = async (protein: string) => {
    setSelectedCategory(protein);
    setSearchQuery('');
    setSearchResults([]);
    setLoading(true);
    try {
      const allMeals = await mealApiService.getRandomMeals(100);
      
      const proteinMeals = allMeals.filter(meal => {
        const searchText = `${meal.name} ${meal.description} ${meal.tags.join(' ')}`.toLowerCase();
        return searchText.includes(protein.toLowerCase());
      }).sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)); // Sort by review count
      
      setMeals(proteinMeals.slice(0, 20));
    } catch (error) {
      Alert.alert('Error', 'Failed to load protein meals. Please try again.');
      console.error('Error loading protein meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePopularFilter = async () => {
    setSelectedCategory('popular');
    setSearchQuery('');
    setSearchResults([]);
    setLoading(true);
    try {
      const allMeals = await mealApiService.getRandomMeals(100);
      
      const popularMeals = allMeals
        .filter(meal => meal.reviewCount && meal.reviewCount > 0)
        .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0)); // Sort by review count
      
      setMeals(popularMeals.slice(0, 20));
    } catch (error) {
      Alert.alert('Error', 'Failed to load popular meals. Please try again.');
      console.error('Error loading popular meals:', error);
    } finally {
      setLoading(false);
    }
  };

  const displayedMeals = searchQuery.trim() ? searchResults : meals;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
          <Text style={styles.title}>
            Choose {mealType || 'Recipe'}
          </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search recipes..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilters(!showFilters)}
            >
              <Ionicons name="options-outline" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Filters */}
        {!searchQuery.trim() && (
          <View style={styles.categoriesContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              <TouchableOpacity
                style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]}
                onPress={resetToRandom}
              >
                <Text style={[styles.categoryChipText, !selectedCategory && styles.categoryChipTextActive]}>
                  All Recipes
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'quick' && styles.categoryChipActive]}
                onPress={() => handleQuickMealsFilter('quick')}
              >
                <Text style={[styles.categoryChipText, selectedCategory === 'quick' && styles.categoryChipTextActive]}>
                  ⚡ Under 30min
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'super-quick' && styles.categoryChipActive]}
                onPress={() => handleQuickMealsFilter('super-quick')}
              >
                <Text style={[styles.categoryChipText, selectedCategory === 'super-quick' && styles.categoryChipTextActive]}>
                  🚀 Under 15min
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'beef' && styles.categoryChipActive]}
                onPress={() => handleProteinFilter('beef')}
              >
                <Text style={[styles.categoryChipText, selectedCategory === 'beef' && styles.categoryChipTextActive]}>
                  🥩 Beef
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'chicken' && styles.categoryChipActive]}
                onPress={() => handleProteinFilter('chicken')}
              >
                <Text style={[styles.categoryChipText, selectedCategory === 'chicken' && styles.categoryChipTextActive]}>
                  🐔 Chicken
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'fish' && styles.categoryChipActive]}
                onPress={() => handleProteinFilter('fish')}
              >
                <Text style={[styles.categoryChipText, selectedCategory === 'fish' && styles.categoryChipTextActive]}>
                  🐟 Fish
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'vegetarian' && styles.categoryChipActive]}
                onPress={() => handleProteinFilter('vegetarian')}
              >
                <Text style={[styles.categoryChipText, selectedCategory === 'vegetarian' && styles.categoryChipTextActive]}>
                  🥬 Vegetarian
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.categoryChip, selectedCategory === 'popular' && styles.categoryChipActive]}
                onPress={() => handlePopularFilter()}
              >
                <Text style={[styles.categoryChipText, selectedCategory === 'popular' && styles.categoryChipTextActive]}>
                  ⭐ Most Popular
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Advanced Filters */}
        {showFilters && (
          <View style={styles.filtersContainer}>
            <Text style={styles.filtersTitle}>Filters</Text>
            <View style={styles.filtersGrid}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Max Prep Time (min)</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="30"
                  value={filters.maxPrepTime}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, maxPrepTime: text }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Max Cook Time (min)</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="60"
                  value={filters.maxCookTime}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, maxCookTime: text }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Min Rating</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="4.0"
                  value={filters.minRating}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, minRating: text }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Max Calories</Text>
                <TextInput
                  style={styles.filterInput}
                  placeholder="500"
                  value={filters.maxCalories}
                  onChangeText={(text) => setFilters(prev => ({ ...prev, maxCalories: text }))}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View style={styles.filterActions}>
              <TouchableOpacity 
                style={styles.clearFiltersButton}
                onPress={() => setFilters({
                  maxPrepTime: '',
                  maxCookTime: '',
                  minRating: '',
                  maxCalories: '',
                  dietary: [],
                })}
              >
                <Text style={styles.clearFiltersText}>Clear Filters</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.applyFiltersButton}
                onPress={() => {
                  handleSearchWithFilters();
                  setShowFilters(false);
                }}
              >
                <Text style={styles.applyFiltersText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {showMealDetail && selectedMeal ? (
            <MealDetailView 
              meal={selectedMeal}
              onBack={handleBackToList}
              onSelect={() => handleAddMeal(selectedMeal)}
            />
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Loading recipes...</Text>
            </View>
          ) : isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : displayedMeals.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color="#ccc" />
              <Text style={styles.emptyTitle}>No recipes found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery.trim() 
                  ? 'Try a different search term' 
                  : 'No recipes available in this category'
                }
              </Text>
            </View>
          ) : (
            <FlatList
              data={displayedMeals}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <MealItem
                  meal={item}
                  onSelect={() => handleMealSelect(item)}
                />
              )}
              contentContainerStyle={styles.mealList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

interface MealDetailViewProps {
  meal: ProcessedMeal;
  onBack: () => void;
  onSelect: () => void;
}

const MealDetailView: React.FC<MealDetailViewProps> = ({ meal, onBack, onSelect }) => {
  const formatTime = (minutes: number | undefined) => {
    if (!minutes || minutes <= 0) return 'Not specified';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const handleOpenYouTube = () => {
    if (meal.youtubeUrl) {
      Linking.openURL(meal.youtubeUrl);
    }
  };

  const handleOpenSource = () => {
    if (meal.sourceUrl) {
      Linking.openURL(meal.sourceUrl);
    }
  };

  return (
    <ScrollView style={styles.mealDetailContainer} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.mealDetailHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.mealDetailTitle}>{String(meal.name || '')}</Text>
      </View>

      {/* Meal Image */}
      <Image 
        source={{ uri: meal.imageUrl }} 
        style={styles.mealDetailImage}
        defaultSource={require('../../assets/icon.png')}
      />

        {/* Basic Info */}
        <View style={styles.mealDetailInfo}>
          {meal.description && (
            <Text style={styles.mealDetailDescription}>{String(meal.description)}</Text>
          )}
          
          <View style={styles.mealDetailMeta}>
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

            {meal.rating && (
              <View style={styles.metaItem}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.metaText}>{meal.rating.toFixed(1)}</Text>
                {meal.reviewCount && (
                  <Text style={styles.metaText}>({meal.reviewCount} reviews)</Text>
                )}
              </View>
            )}
          </View>

        {/* Tags */}
        {meal.tags && meal.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <View style={styles.tagsList}>
              {meal.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{String(tag)}</Text>
                </View>
              ))}
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
          
          {meal.sourceUrl && (
            <TouchableOpacity style={styles.linkButton} onPress={handleOpenSource}>
              <Ionicons name="link-outline" size={20} color="#007AFF" />
              <Text style={styles.linkButtonText}>View Source</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Select Button */}
        <TouchableOpacity style={styles.selectMealButton} onPress={onSelect}>
          <Text style={styles.selectMealButtonText}>Add This Meal</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#212529',
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
  },
  categoriesContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  mealList: {
    padding: 16,
  },
  mealItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  selectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-end',
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  mealDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  mealTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  // Meal Detail Styles
  mealDetailContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mealDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  mealDetailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  mealDetailImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  mealDetailInfo: {
    padding: 16,
  },
  mealDetailDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  mealDetailMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
    marginBottom: 12,
  },
  instructionNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 24,
    flex: 1,
  },
  linksContainer: {
    marginBottom: 20,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  linkButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  selectMealButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  selectMealButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  // Filter styles
  filtersContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  filtersGrid: {
    gap: 12,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    flex: 1,
  },
  filterInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 80,
    textAlign: 'center',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  clearFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  applyFiltersButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  applyFiltersText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Nutrition styles
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  nutritionItem: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
  },
  nutritionLabel: {
    fontSize: 10,
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

export default MealBrowser;
