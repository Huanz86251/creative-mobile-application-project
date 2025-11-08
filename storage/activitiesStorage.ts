import AsyncStorage from "@react-native-async-storage/async-storage";
import { Activity } from "../types";

// TODO: Define STORAGE_KEY constant
// - Use "@FitnessTracker_activities" as the AsyncStorage key for activities
const STORAGE_KEY = "@FitnessTracker_activities";
export async function loadActivities(): Promise<Activity[]> {
  // TODO: Implement loading activities from AsyncStorage
  // - Wrap in try/catch: return [] on any error (e.g., invalid JSON)
  // - Use AsyncStorage.getItem() to fetch data
  // - If data is null/undefined, return empty array []
  // - If not, parse JSON
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }
    return JSON.parse(data) as Activity[];
  } catch {
    return [];
  }
}

export async function saveActivities(activities: Activity[]): Promise<void> {
  // TODO: Implement saving activities to AsyncStorage
  try {
    // Hint: Use AsyncStorage.setItem()
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch {
    // Ignore storage errors, no need to implement anything here

  }
}
