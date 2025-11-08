import { useState, useEffect } from "react";
import { View, TextInput, Alert, Text, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
// TODO: Import useDispatch and useSelector from "react-redux";
// TODO: Import addActivity, updateActivity, selectActivityById,
// TODO: Import type RootState and AppDispatch
// TODO: Import globalStyles
// TODO: Import colors from constants
// TODO: Import PrimaryButton component
import { useDispatch, useSelector } from "react-redux";
import {
  addActivity,
  updateActivity,
  selectActivityById,
} from "../features/tracks/tracksSlice";
import { RootState } from "../store/store";
import { AppDispatch } from "../store/store";
import { globalStyles } from "../styles/globalStyles";
import { colors } from "../constants/colors";
import PrimaryButton from "../components/PrimaryButton";
export default function AddEditScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  // TODO: Use useDispatch<AppDispatch>() to get dispatch function
  const dispatch = useDispatch<AppDispatch>();
  // TODO: Use useSelector to get the activity by ID
  // - Select from RootState, pass id as string
  // - If no id or not found, activity will be undefined
  const activity = useSelector((state: RootState) =>
    selectActivityById(state, id as string)
  );

  // TODO: Create state for type, duration, calories
  // const [type, setType] = useState;
  // const [duration, setDuration] = useState;
  // const [calories, setCalories] = useState;
  const [type, setType] = useState("");
  const [duration, setDuration] = useState("");
  const [calories, setCalories] = useState("");
  useEffect(() => {
    if (activity) {
      // TODO: If editing an existing activity, populate state with activity values
      setType(activity.type);
      setDuration(activity.duration.toString());
      setCalories(activity.calories.toString());
    }
  }, [activity]);
  const toPositiveInt =(s: string)=>{
    const t = s.trim();
    if (!/^0*[1-9]\d*$/.test(t)) return null;
    
    const n = Number(t);
    return Number.isSafeInteger(n) ? n : null;

  }
  const handleSubmit = () => {
    // TODO: Validate inputs (reused from Assignment 3)
    // - type required
    // - duration must be positive integer
    // - calories optional (positive integer or default = duration * 10)
    if (!type?.trim()){
      Alert.alert("Error","Please enter an activity type");
      return; 
    }
    const dur_n=toPositiveInt(duration);
    if (!dur_n){
      Alert.alert("Error","Duration must be a positive integer");
      return; 
    }
    let cal_n: number;
    if (!calories.trim()) {
      cal_n = dur_n * 10;
    }
    else{
      const parsed =toPositiveInt(calories);
      if (!parsed ){
        Alert.alert("Error","Calories must be a positive integer");
        return; 
      }
      cal_n = parsed;
    }
    if (activity) {
      // TODO: Dispatch updateActivity
      dispatch(
        updateActivity({
          id: activity.id,
          updated: {
            type: type.trim(),
            duration: dur_n,
            calories: cal_n,
          },
        })
      );
    } else {
      // TODO: Dispatch addActivity
      dispatch(
        addActivity({
          type: type.trim(),
          duration: dur_n,
          calories: cal_n,
        })
      );
    }

    // TODO: Navigate back to Home ("/")
    router.push("/");
  };

  return (
    <View style={globalStyles.container}>
      {/* TODO: Display header text "Add Activity" or "Edit Activity" */}
      <Text style={globalStyles.headerText}>{activity ? "Edit Activity" : "Add Activity"}</Text>

      {/* TODO: TextInput for activity type */}
      <TextInput
        style={styles.input}
        placeholder="Activity Type (e.g., Running)"
        value={type}
        onChangeText={setType}
        placeholderTextColor={colors.placeholder}
      />

      {/* TODO: TextInput for duration (numeric keyboard) */}
      <TextInput
        style={styles.input}
        placeholder="Duration (minutes)"
        value={duration}
        onChangeText={setDuration}
        placeholderTextColor={colors.placeholder}
        keyboardType="numeric"
      />

      {/* TODO: TextInput for calories (numeric keyboard, optional) */}
      <TextInput
        style={styles.input}
        placeholder="Calories (optional, default: duration * 10)"
        value={calories}
        onChangeText={setCalories}
        placeholderTextColor={colors.placeholder}
        keyboardType="numeric"
      />

      {/* TODO: PrimaryButton to submit */}
      {/* - Label: "Add Activity" or "Update Activity" */}
      {/* - onPress: call handleSubmit */}
      {/* - IMPORTANT: Include testID="add-button" */}
      <PrimaryButton onPress={handleSubmit} testID="add-button">
        {activity ? "Update Activity" : "Add Activity"}
      </PrimaryButton>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
