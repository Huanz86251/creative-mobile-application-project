import React from "react";
import { View, Text } from "react-native";
import tw from "twrnc";

export default function SearchScreen() {
  return (
    <View style={[tw`flex-1 items-center justify-center`, { backgroundColor: "#FDDF30" }]}>
      <Text style={[tw`text-xl font-bold` , { color: "#2E2E2E" }]}>Search Page</Text>
    </View>
  );
}
