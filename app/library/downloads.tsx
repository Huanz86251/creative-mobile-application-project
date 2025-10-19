import React from "react";
import { View, Text } from "react-native";
import tw from "twrnc";

export default function Downloads() {
  return (
    <View style={[tw`flex-1 items-center justify-center`, { backgroundColor: "#FDDF30" }]}>
      <Text style={tw`text-white`}>Downloads</Text>
    </View>
  );
}
