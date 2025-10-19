// app/(tabs)/index.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ImageBackground,
  FlatList,
  Dimensions,
  StyleSheet,
} from "react-native";
import tw from "twrnc";
import { Link, useRouter } from "expo-router";
import type { Href } from "expo-router";
import MiniPlayer from "../../components/MiniPlayer";
import PlaylistCard from "../../components/PlaylistCard";

const { width } = Dimensions.get("window");

// 颜色集中管理（照你之前的配色）
const colors = {
  brand: "#5C7AEA",
  background: "#FDDF30",
  accent: "#F7C8E0",
  text: "#2E2E2E",
};

type Playlist = { id: string; title: string; cover: string; tracksCount: number };

const HOT: Playlist[] = [
  { id: "pl_1", title: "Focus Flow", cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop", tracksCount: 24 },
  { id: "pl_2", title: "Lo-Fi Chill", cover: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1200&auto=format&fit=crop", tracksCount: 30 },
  { id: "pl_3", title: "EDM Hits",   cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop", tracksCount: 18 },
];

const RECS: Playlist[] = [
  { id: "pl_4", title: "Morning Run", cover: "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=1200&auto=format&fit=crop", tracksCount: 16 },
  { id: "pl_5", title: "Jazz Lounge", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1200&auto=format&fit=crop", tracksCount: 22 },
  { id: "pl_6", title: "Indie Fresh", cover: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1200&auto=format&fit=crop", tracksCount: 28 },
  { id: "pl_7", title: "Piano Calm",  cover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop", tracksCount: 14 },
];

export default function HomeScreen() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const currentTrack = useMemo(
    () => ({
      id: "t_1",
      title: "Lost in Codes",
      artist: "MiniTune",
      cover: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?q=80&w=1200&auto=format&fit=crop",
    }),
    []
  );

  return (
    <View style={[tw`flex-1`, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={tw`pb-24`}>

        {/* Hero */}
        <View
          style={[
            { height: Math.min(260, width * 0.6) },
            { overflow: "hidden", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 },
          ]}
        >
          <ImageBackground
            source={{ uri: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=1600&auto=format&fit=crop" }}
            resizeMode="cover"
            imageStyle={{ opacity: 0.75 }}
            style={tw`flex-1`}
          >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.3)" }]} />
            <View style={tw`flex-1 justify-end px-4 pb-3`}>
              <Text style={tw`text-white text-2xl font-extrabold`}>MiniTune</Text>
              <Text style={[tw`mt-1 mb-3`, { color: "rgba(255,255,255,0.9)" }]}>Discover. Play. Repeat.</Text>

              <View style={tw`flex-row items-center`}>
                <TextInput
                  placeholder="Search playlists, tracks, artists…"
                  placeholderTextColor="rgba(255,255,255,0.7)"
                  value={q}
                  onChangeText={setQ}
                  returnKeyType="search"
                  onSubmitEditing={() => router.push({ pathname: "/search", params: { q } })}
                  style={[
                    tw`flex-1 h-11 rounded-xl px-3`,
                    { backgroundColor: "rgba(255,255,255,0.15)", color: "#fff" },
                  ]}
                />
                <Pressable
                  onPress={() => router.push({ pathname: "/search", params: { q } })}
                  style={[
                    tw`h-11 px-4 rounded-xl items-center justify-center ml-2`,
                    { backgroundColor: colors.brand },
                  ]}
                >
                  <Text style={tw`text-white font-bold`}>Search</Text>
                </Pressable>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Trending Playlists */}
        <View style={tw`px-4 mt-4 mb-2 flex-row justify-between items-end`}>
          <Text style={tw`text-white text-xl font-bold`}>Trending Playlists</Text>
          <Link href={"/browse" as Href} asChild>
            <Pressable>
              <Text style={tw`text-gray-300 font-semibold`}>See all</Text>
            </Pressable>
          </Link>
        </View>

        <FlatList
          data={HOT}
          keyExtractor={(it) => it.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          renderItem={({ item }) => (
            <PlaylistCard
              size="large"
              playlist={item}
              onPress={() => router.push({ pathname: "/playlist/[id]", params: { id: item.id } })}
            />
          )}
        />

        {/* For You */}
        <View style={tw`px-4 mt-5 mb-2 flex-row justify-between items-end`}>
          <Text style={tw`text-white text-xl font-bold`}>For You</Text>
          <Link href={"/browse" as Href} asChild>
            <Pressable>
              <Text style={tw`text-gray-300 font-semibold`}>See all</Text>
            </Pressable>
          </Link>
        </View>

        <View style={tw`px-2 flex-row flex-wrap`}>
          {RECS.map((pl) => (
            <View key={pl.id} style={{ width: (width - 20) / 2 }} >
              <View style={tw`px-2 mb-3`}>
                <PlaylistCard
                  playlist={pl}
                  onPress={() => router.push({ pathname: "/playlist/[id]", params: { id: pl.id } })}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Shortcuts */}
        <View style={tw`mt-2 px-4 flex-row justify-between`}>
          <QuickLink label="Favorites"   href={"/library/favorites"  as Href} />
          <View style={tw`w-2`} />
          <QuickLink label="My Playlists" href={"/library/playlists" as Href} />
          <View style={tw`w-2`} />
          <QuickLink label="Downloads"   href={"/library/downloads"  as Href} />
        </View>
      </ScrollView>

      {/* Mini Player */}
      <MiniPlayer track={currentTrack} onPress={() => router.push("/now-playing")} />
    </View>
  );
}

function QuickLink({ label, href }: { label: string; href: Href }) {
  return (
    <Link href={href} asChild>
      <Pressable
        style={[
          tw`flex-1 h-11 rounded-xl items-center justify-center`,
          { backgroundColor: "rgba(255,255,255,0.10)" },
        ]}
      >
        <Text style={tw`text-white font-bold`}>{label}</Text>
      </Pressable>
    </Link>
  );
}
