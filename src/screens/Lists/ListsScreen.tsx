import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';

import { useAppStore } from '../../store';
import { List, ListKind, ListItem } from '../../types';
import { getResponsiveLayout } from '../../utils/helpers';
import { RootStackParamList } from '../../navigation/AppNavigator';

type ListsScreenNavigationProp = StackNavigationProp<RootStackParamList>;

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

// Helper function to get emoji for list item
const getListItemEmoji = (title: string): string => {
  const titleLower = title.toLowerCase();
  if (titleLower.includes('milk') || titleLower.includes('dairy')) return '🥛';
  if (titleLower.includes('bread')) return '🍞';
  if (titleLower.includes('eggs')) return '🥚';
  if (titleLower.includes('fruit') || titleLower.includes('apple') || titleLower.includes('banana')) return '🍎';
  if (titleLower.includes('vegetable') || titleLower.includes('carrot') || titleLower.includes('lettuce')) return '🥕';
  if (titleLower.includes('meat') || titleLower.includes('chicken') || titleLower.includes('beef')) return '🥩';
  if (titleLower.includes('fish')) return '🐟';
  if (titleLower.includes('clean') || titleLower.includes('soap') || titleLower.includes('detergent')) return '🧽';
  if (titleLower.includes('paper') || titleLower.includes('tissue')) return '🧻';
  if (titleLower.includes('medicine') || titleLower.includes('bandage')) return '💊';
  if (titleLower.includes('call') || titleLower.includes('phone')) return '📞';
  if (titleLower.includes('email') || titleLower.includes('message')) return '📧';
  if (titleLower.includes('meeting') || titleLower.includes('appointment')) return '📅';
  if (titleLower.includes('pay') || titleLower.includes('bill')) return '💳';
  if (titleLower.includes('exercise') || titleLower.includes('gym') || titleLower.includes('run')) return '🏃';
  if (titleLower.includes('read') || titleLower.includes('book')) return '📚';
  if (titleLower.includes('study') || titleLower.includes('homework')) return '✏️';
  if (titleLower.includes('garden') || titleLower.includes('plant')) return '🌱';
  if (titleLower.includes('car') || titleLower.includes('vehicle')) return '🚗';
  if (titleLower.includes('gift') || titleLower.includes('present')) return '🎁';
  return '📝';
};

interface ListItemComponentProps {
  item: ListItem;
  onToggle: (itemId: string) => void;
  onDelete: (itemId: string) => void;
  onPress: (item: ListItem) => void;
  listColor: string;
  listType: ListKind;
}

const ListItemComponent: React.FC<ListItemComponentProps> = ({ item, onToggle, onDelete, onPress, listColor, listType }) => {
  const emoji = getListItemEmoji(item.title);

  const handleLongPress = () => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
      ]
    );
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return '#E74C3C';
      case 'medium': return '#F39C12';
      case 'low': return '#27AE60';
      default: return '#6c757d';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  const isOverdue = (dateString?: string) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date() && !item.checked;
  };

  return (
    <View style={styles.listItem}>
      <TouchableOpacity
        style={styles.listItemContent}
        onPress={() => onPress(item)}
        onLongPress={handleLongPress}
        activeOpacity={0.7}
      >
        <Text style={styles.listItemEmoji}>{emoji}</Text>
        <View style={styles.listItemTextContainer}>
          <Text style={[styles.listItemTitle, item.checked && styles.completedItemText]} numberOfLines={1}>
            {item.title}
          </Text>
          <View style={styles.listItemMeta}>
            {(listType === 'shopping' || listType === 'other') && item.quantity && (
              <Text style={[styles.listItemQuantity, { color: listColor }]}>
                {item.quantity}
              </Text>
            )}
            {listType === 'todo' && item.dueDate && (
              <Text style={[
                styles.listItemDate,
                { color: isOverdue(item.dueDate) ? '#E74C3C' : '#6c757d' }
              ]}>
                {formatDate(item.dueDate)}
              </Text>
            )}
            {listType === 'todo' && item.priority && (
              <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(item.priority) }]} />
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#6c757d" style={styles.chevronIcon} />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.checkbox, item.checked && styles.checkedBox]}
        onPress={() => onToggle(item.id)}
        activeOpacity={0.7}
      >
        {item.checked && (
          <Ionicons name="checkmark" size={16} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
};

interface ListCardProps {
  list: List;
  listItems: ListItem[];
  onToggleItem: (itemId: string) => void;
  onDeleteItem: (itemId: string) => void;
  onPressItem: (item: ListItem) => void;
  onAddItem: (listId: string) => void;
  layout: ReturnType<typeof getResponsiveLayout>;
}

const ListCard: React.FC<ListCardProps> = ({ 
  list, 
  listItems, 
  onToggleItem,
  onDeleteItem,
  onPressItem,
  onAddItem,
  layout 
}) => {

  return (
    <View style={[styles.listCard, { backgroundColor: list.color + '15' }]}>
      {/* List Header */}
      <View style={styles.listHeader}>
        <Text style={[styles.listTitle, { color: list.color }]}>{list.name}</Text>
        <Text style={styles.listItemCount}>
          {listItems.length} item{listItems.length !== 1 ? 's' : ''}
        </Text>
      </View>
      
      {/* List Items */}
      <View style={styles.listItemsContainer}>
        {listItems.length > 0 ? (
          listItems.map((item) => (
            <ListItemComponent
              key={item.id}
              item={item}
              onToggle={onToggleItem}
              onDelete={onDeleteItem}
              onPress={onPressItem}
              listColor={list.color}
              listType={list.kind}
            />
          ))
        ) : (
          <View style={styles.emptyList}>
            <Ionicons name="list-outline" size={48} color="#6c757d" />
            <Text style={styles.emptyListText}>No items yet</Text>
            <Text style={styles.emptyListSubtext}>Tap the + button to add items</Text>
          </View>
        )}
      </View>
      
      {/* Add Item Button */}
      <TouchableOpacity
        style={[styles.addItemButton, { backgroundColor: list.color }]}
        onPress={() => onAddItem(list.id)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addItemButtonText}>Add Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const ListsScreen: React.FC = () => {
  const navigation = useNavigation<ListsScreenNavigationProp>();
  const { lists, listItems, addList, toggleListItem, deleteListItem, addListItem, addChore, profiles } = useAppStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showItemDetailModal, setShowItemDetailModal] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<ListKind | 'all'>('all');
  const [newListName, setNewListName] = useState('');
  const [newListKind, setNewListKind] = useState<ListKind>('todo');
  const [newListColor, setNewListColor] = useState('#3498DB');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [newItemDueDate, setNewItemDueDate] = useState('');
  const [newItemPriority, setNewItemPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const layout = getResponsiveLayout(width, height);

  // Filter lists based on selected filter
  const filteredLists = selectedFilter === 'all' 
    ? lists 
    : lists.filter(list => list.kind === selectedFilter);

  const handleToggleItem = (itemId: string) => {
    toggleListItem(itemId);
  };

  const handleDeleteItem = (itemId: string) => {
    deleteListItem(itemId);
  };

  const handlePressItem = (item: ListItem) => {
    setSelectedItem(item);
    setShowItemDetailModal(true);
  };

  const handleAddItem = (listId: string) => {
    setSelectedListId(listId);
    setNewItemTitle('');
    setNewItemQuantity('');
    setNewItemNotes('');
    setNewItemDueDate('');
    setNewItemPriority('medium');
    setShowAddItemModal(true);
  };

  const handleCreateItem = () => {
    if (!newItemTitle.trim()) {
      Alert.alert('Error', 'Please enter an item title');
      return;
    }

    const listType = getListType(selectedListId);
    const itemData: Omit<ListItem, 'id'> = {
      listId: selectedListId,
      title: newItemTitle.trim(),
      checked: false,
      notes: newItemNotes.trim() || undefined,
    };

    // Add fields based on list type
    if (listType === 'shopping' || listType === 'other') {
      itemData.quantity = newItemQuantity.trim() || undefined;
    } else if (listType === 'todo') {
      itemData.dueDate = newItemDueDate || undefined;
      itemData.priority = newItemPriority;
    }

    addListItem(itemData);

    setNewItemTitle('');
    setNewItemQuantity('');
    setNewItemNotes('');
    setNewItemDueDate('');
    setNewItemPriority('medium');
    setShowAddItemModal(false);
  };

  const handleConvertToChore = () => {
    if (!selectedItem) return;

    // Close the modal and navigate to create chore with pre-filled data
    setShowItemDetailModal(false);
    
    // Prepare todo data for the chore form
    const todoData = {
      title: selectedItem.title,
      description: selectedItem.notes || undefined,
      dueDate: selectedItem.dueDate || undefined,
      priority: selectedItem.priority || undefined,
    };

    // Navigate to create chore screen with pre-filled data
    navigation.navigate('CreateChore', { todoData });
  };

  const handleCreateList = () => {
    if (!newListName.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    addList({
      name: newListName.trim(),
      kind: newListKind,
      color: newListColor,
    });

    setNewListName('');
    setNewListKind('todo');
    setNewListColor('#3498DB');
    setShowCreateModal(false);
  };

  const getListItems = (listId: string): ListItem[] => {
    return listItems.filter(item => item.listId === listId);
  };

  const getListType = (listId: string): ListKind => {
    const list = lists.find(l => l.id === listId);
    return list?.kind || 'other';
  };

  const handleFilterSelect = (filter: ListKind | 'all') => {
    setSelectedFilter(filter);
    setShowFilterDropdown(false);
    
    // Jump to the first list of the selected type
    if (filteredLists.length > 0) {
      flatListRef.current?.scrollToIndex({ index: 0, animated: true });
    }
  };

  const getTitleText = (): string => {
    switch (selectedFilter) {
      case 'all':
        return 'All Lists';
      case 'todo':
        return 'To-Do Lists';
      case 'shopping':
        return 'Shopping Lists';
      case 'other':
        return 'Other Lists';
      default:
        return 'All Lists';
    }
  };

  const filterOptions: { value: ListKind | 'all'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'all', label: 'All Lists', icon: 'list-outline' },
    { value: 'todo', label: 'To-Do', icon: 'checkmark-circle-outline' },
    { value: 'shopping', label: 'Shopping', icon: 'bag-outline' },
    { value: 'other', label: 'Other', icon: 'list-outline' },
  ];

  const colorOptions = [
    '#E74C3C', '#3498DB', '#9B59B6', '#F39C12',
    '#27AE60', '#E67E22', '#8E44AD', '#34495E',
  ];

  const kindOptions: { value: ListKind; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { value: 'todo', label: 'To-Do', icon: 'checkmark-circle-outline' },
    { value: 'shopping', label: 'Shopping', icon: 'bag-outline' },
    { value: 'other', label: 'Other', icon: 'list-outline' },
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
                  name={option.icon}
                  size={16}
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
          {filteredLists.length} list{filteredLists.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Lists Horizontal FlatList */}
      {filteredLists.length > 0 ? (
        <FlatList
          ref={flatListRef}
          data={filteredLists}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listsContainer}
          style={styles.listsScrollView}
          snapToInterval={itemTotalWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          pagingEnabled={false}
          renderItem={({ item: list }) => (
            <ListCard
              list={list}
              listItems={getListItems(list.id)}
              onToggleItem={handleToggleItem}
              onDeleteItem={handleDeleteItem}
              onPressItem={handlePressItem}
              onAddItem={handleAddItem}
              layout={layout}
            />
          )}
          keyExtractor={(list) => list.id}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="list-outline" size={48} color="#6c757d" />
          <Text style={styles.emptyStateText}>
            {selectedFilter === 'all' ? 'No lists yet' : `No ${selectedFilter} lists`}
          </Text>
          <Text style={styles.emptyStateSubtext}>
            Create your first list to get started
          </Text>
        </View>
      )}

      {/* Add Button */}
      <TouchableOpacity
        style={[
          styles.addButton,
          {
            bottom: layout.spacing * 2,
            right: layout.spacing,
          },
        ]}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create List Modal */}
      <Modal
        visible={showCreateModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New List</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="List name"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
            />

            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.kindOptions}>
              {kindOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.kindOption,
                    newListKind === option.value && styles.kindOptionSelected,
                  ]}
                  onPress={() => setNewListKind(option.value)}
                >
                  <Ionicons
                    name={option.icon}
                    size={20}
                    color={newListKind === option.value ? '#fff' : '#6c757d'}
                  />
                  <Text
                    style={[
                      styles.kindOptionText,
                      newListKind === option.value && styles.kindOptionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Color</Text>
            <View style={styles.colorOptions}>
              {colorOptions.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newListColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setNewListColor(color)}
                />
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateList}
              >
                <Text style={styles.createButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        visible={showAddItemModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Item</Text>
            
            <TextInput
              style={styles.textInput}
              placeholder="Item title"
              value={newItemTitle}
              onChangeText={setNewItemTitle}
              autoFocus
            />

            {(getListType(selectedListId) === 'shopping' || getListType(selectedListId) === 'other') && (
              <TextInput
                style={styles.textInput}
                placeholder="Quantity (optional)"
                value={newItemQuantity}
                onChangeText={setNewItemQuantity}
              />
            )}

            {getListType(selectedListId) === 'todo' && (
              <>
                <TextInput
                  style={styles.textInput}
                  placeholder="Due date (YYYY-MM-DD)"
                  value={newItemDueDate}
                  onChangeText={setNewItemDueDate}
                />
                
                <Text style={styles.sectionTitle}>Priority</Text>
                <View style={styles.priorityOptions}>
                  {[
                    { value: 'low', label: 'Low', color: '#27AE60' },
                    { value: 'medium', label: 'Medium', color: '#F39C12' },
                    { value: 'high', label: 'High', color: '#E74C3C' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.priorityOption,
                        { backgroundColor: option.color + '20', borderColor: option.color },
                        newItemPriority === option.value && { backgroundColor: option.color }
                      ]}
                      onPress={() => setNewItemPriority(option.value as 'low' | 'medium' | 'high')}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        newItemPriority === option.value && styles.priorityOptionTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Notes (optional)"
              value={newItemNotes}
              onChangeText={setNewItemNotes}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAddItemModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateItem}
              >
                <Text style={styles.createButtonText}>Add Item</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Item Detail Modal */}
      <Modal
        visible={showItemDetailModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowItemDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Item Details</Text>
            
            {selectedItem && (
              <View style={styles.itemDetailContent}>
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemDetailLabel}>Title:</Text>
                  <Text style={styles.itemDetailValue}>{selectedItem.title}</Text>
                </View>
                
                {selectedItem.quantity && (
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Quantity:</Text>
                    <Text style={styles.itemDetailValue}>{selectedItem.quantity}</Text>
                  </View>
                )}
                
                {selectedItem.dueDate && (
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Due Date:</Text>
                    <Text style={[
                      styles.itemDetailValue,
                      { color: new Date(selectedItem.dueDate) < new Date() && !selectedItem.checked ? '#E74C3C' : '#212529' }
                    ]}>
                      {new Date(selectedItem.dueDate).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>
                )}
                
                {selectedItem.priority && (
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Priority:</Text>
                    <View style={styles.priorityDisplay}>
                      <View style={[
                        styles.priorityIndicator,
                        { backgroundColor: selectedItem.priority === 'high' ? '#E74C3C' : selectedItem.priority === 'medium' ? '#F39C12' : '#27AE60' }
                      ]} />
                      <Text style={[styles.itemDetailValue, { textTransform: 'capitalize' }]}>
                        {selectedItem.priority}
                      </Text>
                    </View>
                  </View>
                )}
                
                {selectedItem.notes && (
                  <View style={styles.itemDetailRow}>
                    <Text style={styles.itemDetailLabel}>Notes:</Text>
                    <Text style={styles.itemDetailValue}>{selectedItem.notes}</Text>
                  </View>
                )}
                
                <View style={styles.itemDetailRow}>
                  <Text style={styles.itemDetailLabel}>Status:</Text>
                  <Text style={[styles.itemDetailValue, { color: selectedItem.checked ? '#27AE60' : '#E74C3C' }]}>
                    {selectedItem.checked ? 'Completed' : 'Pending'}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowItemDetailModal(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.deleteButton]}
                onPress={() => {
                  if (selectedItem) {
                    Alert.alert(
                      'Delete Item',
                      `Are you sure you want to delete "${selectedItem.title}"?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive', 
                          onPress: () => {
                            deleteListItem(selectedItem.id);
                            setShowItemDetailModal(false);
                          }
                        },
                      ]
                    );
                  }
                }}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
              
              {selectedItem && getListType(selectedItem.listId) === 'todo' && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.convertButton]}
                  onPress={handleConvertToChore}
                >
                  <Text style={styles.convertButtonText}>Chore</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '600',
    color: '#212529',
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
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#007AFF',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  selectedFilterOptionText: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  listsScrollView: {
    flex: 1,
  },
  listsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  listCard: {
    width: cardWidth,
    borderRadius: 16,
    padding: 16,
    marginRight: cardSpacing,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listHeader: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  listItemCount: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  listItemsContainer: {
    flex: 1,
    gap: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  listItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
    paddingVertical: 4,
  },
  listItemTextContainer: {
    flex: 1,
    minHeight: 40,
    justifyContent: 'center',
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  listItemEmoji: {
    fontSize: 18,
    marginRight: 12,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  completedItemText: {
    textDecorationLine: 'line-through',
    color: '#6c757d',
  },
  listItemQuantity: {
    fontSize: 11,
    fontWeight: '400',
    color: '#6c757d',
  },
  listItemDate: {
    fontSize: 11,
    fontWeight: '400',
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#27AE60',
    borderColor: '#27AE60',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyListText: {
    color: '#6c757d',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    marginBottom: 4,
  },
  emptyListSubtext: {
    color: '#6c757d',
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#495057',
  },
  kindOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  kindOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 8,
  },
  kindOptionSelected: {
    backgroundColor: '#E74C3C',
    borderColor: '#E74C3C',
  },
  kindOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  kindOptionTextSelected: {
    color: '#fff',
  },
  colorOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#000',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  createButton: {
    backgroundColor: '#E74C3C',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6c757d',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  addItemButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  itemDetailContent: {
    marginBottom: 20,
  },
  itemDetailRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  itemDetailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    width: 80,
    marginRight: 12,
  },
  itemDetailValue: {
    fontSize: 14,
    color: '#212529',
    flex: 1,
  },
  convertButton: {
    backgroundColor: '#9B59B6',
  },
  convertButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  priorityOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
  },
  priorityOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  priorityOptionTextSelected: {
    color: '#fff',
  },
  priorityDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chevronIcon: {
    marginLeft: 8,
  },
});

export default ListsScreen;
