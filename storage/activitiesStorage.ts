import AsyncStorage from "@react-native-async-storage/async-storage";
import { Activity } from "../types";

const STORAGE_KEY = "@FitnessTracker_activities";
export async function loadActivities(): Promise<Activity[]> {

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

  try {
  
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
  } catch {


  }
}
