import 'dotenv/config';

export default {
  scheme: "musicapp",
  name: "Creative Mobile App",
  slug: "creative-mobile-app",
  android: {
    package: "com.creativemobileapp",
  },
  extra: {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    eas: {
      projectId: "9a1872e6-535f-4da9-8849-b6595ad3c8f3",
    },
  },
};
