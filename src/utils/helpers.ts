import { Recurrence } from '../types';

/**
 * Generate a unique ID with optional prefix
 */
export const generateId = (prefix: string = ''): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return prefix ? `${prefix}-${timestamp}-${randomStr}` : `${timestamp}-${randomStr}`;
};

/**
 * Format date for display
 */
export const formatDate = (date: string | Date, format: 'short' | 'long' | 'time' = 'short'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  
  switch (format) {
    case 'long':
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    case 'time':
      return d.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    default:
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
  }
};

/**
 * Check if a date matches the recurrence pattern
 */
export const matchesRecurrence = (
  startDate: string,
  checkDate: string,
  recurrence: Recurrence
): boolean => {
  const start = new Date(startDate);
  const check = new Date(checkDate);
  
  if (recurrence.freq === 'none') {
    return start.toDateString() === check.toDateString();
  }
  
  if (recurrence.freq === 'daily') {
    const daysDiff = Math.floor((check.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff >= 0 && daysDiff % recurrence.interval === 0;
  }
  
  if (recurrence.freq === 'weekly') {
    const weeksDiff = Math.floor((check.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const startWeekday = start.getDay();
    const checkWeekday = check.getDay();
    
    return (
      weeksDiff >= 0 &&
      weeksDiff % recurrence.interval === 0 &&
      (!recurrence.byWeekday || recurrence.byWeekday.includes(checkWeekday))
    );
  }
  
  if (recurrence.freq === 'monthly') {
    const startMonth = start.getMonth();
    const startYear = start.getFullYear();
    const checkMonth = check.getMonth();
    const checkYear = check.getFullYear();
    
    const monthsDiff = (checkYear - startYear) * 12 + (checkMonth - startMonth);
    if (monthsDiff < 0 || monthsDiff % recurrence.interval !== 0) {
      return false;
    }

    // Check specific day patterns
    if (recurrence.byMonthDay && recurrence.byMonthDay.length > 0) {
      const checkDay = check.getDate();
      const lastDayOfMonth = new Date(checkYear, checkMonth + 1, 0).getDate();
      
      return recurrence.byMonthDay.some(day => {
        if (day === -1) {
          return checkDay === lastDayOfMonth;
        }
        return checkDay === day;
      });
    }

    // Check weekday patterns (e.g., "first Friday of month")
    if (recurrence.bySetPos && recurrence.byWeekday && recurrence.byWeekday.length > 0) {
      const checkWeekday = check.getDay();
      if (!recurrence.byWeekday.includes(checkWeekday)) {
        return false;
      }

      const lastDayOfMonth = new Date(checkYear, checkMonth + 1, 0).getDate();
      const weekOfMonth = Math.ceil(check.getDate() / 7);
      const lastWeekOfMonth = Math.ceil(lastDayOfMonth / 7);
      
      if (recurrence.bySetPos === -1) {
        // Last occurrence of the weekday in the month
        return weekOfMonth === lastWeekOfMonth;
      } else {
        // Specific occurrence (1st, 2nd, 3rd, 4th)
        return weekOfMonth === recurrence.bySetPos;
      }
    }

    // Default: same day of month
    return check.getDate() === start.getDate();
  }
  
  return false;
};

/**
 * Get all dates that match a recurrence pattern within a date range
 */
export const getRecurringDates = (
  startDate: string,
  endDate: string,
  recurrence: Recurrence
): string[] => {
  const dates: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // If no recurrence, just return the start date if it's in range
  if (recurrence.freq === 'none') {
    if (start >= new Date(startDate) && start <= end) {
      dates.push(startDate);
    }
    return dates;
  }
  
  // Generate dates based on recurrence pattern
  const current = new Date(start);
  const maxIterations = 1000; // Prevent infinite loops
  let iterations = 0;
  
  while (current <= end && iterations < maxIterations) {
    if (matchesRecurrence(startDate, current.toISOString(), recurrence)) {
      dates.push(current.toISOString());
    }
    
    // Move to next potential date based on frequency
    switch (recurrence.freq) {
      case 'daily':
        current.setDate(current.getDate() + 1);
        break;
      case 'weekly':
        current.setDate(current.getDate() + 7);
        break;
      case 'monthly':
        current.setMonth(current.getMonth() + 1);
        break;
    }
    
    iterations++;
  }
  
  return dates;
};

/**
 * Check if a chore is completed by a profile on a specific date
 */
export const isChoreCompleted = (
  chore: { completedBy: { date: string; profileId: string; status: string }[] },
  profileId: string,
  date: string
): boolean => {
  return chore.completedBy.some(
    (completion) => 
      completion.profileId === profileId && 
      completion.date === date &&
      (completion.status === 'approved' || completion.status === 'completed')
  );
};

/**
 * Get the completion percentage for a chore on a specific date
 */
export const getChoreCompletionPercentage = (
  chore: { profileIds: string[]; completedBy: { date: string; profileId: string; status: string }[] },
  date: string
): number => {
  if (chore.profileIds.length === 0) return 0;
  
  const completedCount = chore.profileIds.filter((profileId) =>
    isChoreCompleted(chore, profileId, date)
  ).length;
  
  return Math.round((completedCount / chore.profileIds.length) * 100);
};

/**
 * Check if all chores in a time segment are completed for a profile
 */
export const isTimeSegmentCompleted = (
  chores: { id: string; profileIds: string[]; timeOfDay: string; completedBy: { date: string; profileId: string; status: string }[] }[],
  profileId: string,
  timeOfDay: string,
  date: string
): boolean => {
  const segmentChores = chores.filter(
    (chore) => chore.profileIds.includes(profileId) && chore.timeOfDay === timeOfDay
  );
  
  if (segmentChores.length === 0) return false;
  
  return segmentChores.every((chore) => isChoreCompleted(chore, profileId, date));
};

/**
 * Debounce function for search inputs
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Get color with opacity
 */
export const getColorWithOpacity = (color: string, opacity: number): string => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Check if device is tablet based on screen dimensions
 */
export const isTablet = (width: number, height: number): boolean => {
  const minDimension = Math.min(width, height);
  const maxDimension = Math.max(width, height);
  
  // Consider tablet if smallest dimension is >= 768px or aspect ratio suggests tablet
  return minDimension >= 768 || (maxDimension / minDimension) < 1.6;
};

/**
 * Get responsive layout configuration
 */
export const getResponsiveLayout = (width: number, height: number) => {
  const tablet = isTablet(width, height);
  const landscape = width > height;
  
  return {
    isTablet: tablet,
    isLandscape: landscape,
    isTwoPane: tablet && landscape,
    isSinglePane: !tablet || !landscape,
    itemSize: tablet ? 60 : 48,
    fontSize: tablet ? 16 : 14,
    spacing: tablet ? 16 : 12,
  };
};
