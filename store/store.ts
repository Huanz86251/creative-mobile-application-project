// TODO: Import configureStore from "@reduxjs/toolkit"
// TODO: Import activitiesReducer from "../features/activities/activitiesSlice"
import { configureStore } from "@reduxjs/toolkit";
import activitiesReducer from "../features/tracks/tracksSlice";
// TODO: Configure and export the Redux store using configureStore
export const store = configureStore({
  // - Include the activitiesReducer under the key "activities" in the reducer object
  reducer: {
    activities: activitiesReducer,
  },
});

// TODO: Export RootState type for use with useSelector
export type RootState = ReturnType<typeof store.getState>;// TODO: Infer the type

// TODO: Export AppDispatch type for use with useDispatch
export type AppDispatch = typeof store.dispatch;// TODO: Infer the type