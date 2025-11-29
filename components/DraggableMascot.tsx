import React, { useRef, useState, useEffect } from "react";
import {
  Animated,
  PanResponder,
  StyleSheet,
  View,
  Text,
  Pressable,
} from "react-native";
import LottieView from "lottie-react-native";

const MESSAGES = [
    // Greetings & welcome vibes
    "Hey there 👋",
    "Welcome to MiniTune 🎧",
    "Enjoy the vibes ✨",
    "Need some chill songs?",
    "Have a nice day 🌙",
    "Good to see you here 😄",
    "You found the secret mascot 🎭",
    "Tap tap, who's there? 👆",
    "Music time, friend 🎶",
    "Thanks for hanging out here 💙",
    "Hope your day is gentle today ☁️",
    "Tiny mascot, big energy ⚡",
    "Powered by vibes only 🔋✨",
    "Stay a while and listen 🎧",
    "New songs, who dis? 👀",
    "I live in your Library now 🏠",
    "You + music = perfect combo 💫",
    "Sending you cozy energy ☕️",
    "You’re doing great, keep going 💪",
    "Soft beats, soft heart 💗",
    "No ads here, only vibes 😎",
    "Hello from the corner of the screen 🐾",
    "Thanks for tapping me 🙌",
    "Guess how many times you've tapped me? 🤔",
  
    // Music & app related
    "Try a new artist today 🎤",
    "Loop your favorite track 🔁",
    "Ambient mode: ON 🕯️",
    "Earphones + this app = perfect match 🎧",
    "Turn the volume up (gently) 🔊",
    "Let the background music carry you 🌊",
    "One more track won’t hurt… probably 😏",
    "Volume low, vibes high 🌌",
    "Discover a hidden gem today 💎",
    "Playlist of your mood: loading… 💭",
    "Music knows how you feel sometimes 🎼",
    "Tiny DJ reporting for duty 🧑‍🎤",
    "Your thumbs choose, your ears approve ✅",
    "Today’s forecast: 100% chance of music 🌦️🎶",
    "Let the track finish before you judge it 😉",
    "Feeling stuck? New song, new perspective 🔄",
    "Try listening with your eyes closed 👁️‍🗨️",
    "Tap heart on songs you really vibe with 💖",
    "Downloads = offline happiness ✈️",
    "Your favorites say more about you than you think 🤫",
    "Music break > doom scroll 📵",
    "Recommend this app to your future self 🔮",
    "Soundtrack for your main character arc 🎬",
    "Music is cheaper than therapy (but not a replacement) 🧠",
  
    // Mood & self-care
    "Remember to drink water 💧",
    "Take a deep breath with this song 🌬️",
    "Tiny reminder: you deserve rest 😴",
    "You don’t have to be productive right now 🌱",
    "It’s okay to just exist and listen 💿",
    "Close your eyes for 10 seconds and just breathe 🕊️",
    "One calm song can reset a noisy mind 🧘",
    "Be kind to yourself today 🌸",
    "You made it this far, that’s something ✨",
    "Stretch your shoulders a bit 🧍‍♂️",
    "Your feelings are valid, even the weird ones 🌧️",
    "It’s okay not to be okay, music is here 🎧",
    "Tiny app, big comfort 🌈",
    "You’re allowed to enjoy something for no reason 😊",
    "No rush. Just vibes. ⏳",
    "Your mental health matters more than deadlines 🧠💛",
    "Breathe in… breathe out… now press play 🎵",
    "Let this track be your soft reset 🔁",
    "You are not behind, you’re just on your own timeline ⏱️",
    "Proud of you for surviving today 🌻",
    "Rest is also progress 🌙",
    "You’re not alone. The music is here with you 🎼",
    "Take care of your body too, not just your brain 🏃‍♂️",
    "Celebrate small wins, like tapping a mascot 🎉",
  
    // Light jokes & silly lines
    "I’m basically a digital pet now 🐾",
    "Tap me too much and I might start charging rent 🏠",
    "If I had legs, I’d dance to your playlist 💃",
    "I’m 100% made of JavaScript and vibes 🧪",
    "Professional corner-sitter since launch 📌",
    "I’m powered by your taps and coffee ☕️",
    "If app crashes, I was not here 👻",
    "I see you… tapping random things 👀",
    "I heard your playlist. Nice taste 😏",
    "If you smile at your screen, I win 😌",
    "This is not a bug, it’s a feature™️",
    "My job? Look cute and say things 💬",
    "Some say I contain 0% AI, 100% chaos 🤪",
    "If I disappear, blame the developers 🛠️",
    "I would shazam your life choices if I could 🎧🤖",
    "I practice my speech bubbles when you’re gone 💭",
    "Yes, I’m watching you scroll 😶",
    "You just unlocked the ‘tiny mascot fan’ achievement 🏆",
    "Important update: you’re awesome 🌟",
    "I run on emojis and hope 😇",
    "Zero lag, infinite sass 😌",
    "Fun fact: I never run out of lines*  *almost",
    "I pretend the play button is my life purpose ▶️",
    "Secret: I don’t actually know what BPM means 🤫",
  
    // Fun facts & nerdy bits
    "Fun fact: Your heart syncs to music sometimes 💓🎶",
    "Fun fact: Your brain loves patterns, like melodies 🧠",
    "Fun fact: Music can reduce stress for many people 💆",
    "Fun fact: Even plants react to sound (kind of) 🌿",
    "Fun fact: The universe is mostly silent… yet 🎇",
    "Fun fact: Your favorite song changes with your mood 🔄",
    "Fun fact: Repeating a song is totally normal 🔁",
    "Fun fact: Animals also have rhythm instincts 🐦",
    "Fun fact: Lofi helps some people focus 📚",
    "Fun fact: Music triggers memory pathways strongly 🧬",
    "Fun fact: Silence between notes matters too 🎼",
    "Fun fact: Some people get chills from certain chords ❄️",
    "Fun fact: Your ears never really ‘turn off’ 👂",
    "Fun fact: The same song can feel different at night 🌙",
    "Fun fact: Low frequencies feel like a hug sometimes 🌀",
    "Fun fact: Melody + nostalgia = instant time travel ⏳",
    "Fun fact: Tempo can influence heart rate in studies ❤️",
    "Fun fact: Movie scenes feel empty without music 🎬",
    "Fun fact: Playlists can act like emotional diaries 📖",
    "Fun fact: You just learned at least one fun fact 🤓",
    "Fun fact: Tapping mascots improves luck*  *maybe 🍀",
    "Fun fact: Humans made rhythm before recorded history 🪘",
    "Fun fact: Music uses both sides of your brain 🧠⚡",
    "Fun fact: Even simple beats can be powerful 🥁",
  
    // Gentle prompts & micro-quests
    "Name one thing you’re grateful for right now 💭",
    "Pick one song and really listen to the lyrics 👂",
    "Try a track you’d normally skip 🤍",
    "Close other apps and just listen for one minute ⏳",
    "Send a song to a friend today 📩",
    "Turn off notifications for a bit (not me though 😇)",
    "Add one track to Favorites you truly love 💖",
    "Find a song that matches the weather outside 🌦️",
    "Find a track that matches your current mood 🎭",
    "Imagine this track is in a movie scene 🎬",
    "Would you walk, run, or float to this song? 🏃‍♂️",
    "Let this song be your main character moment 🎥",
    "Try listening at lower volume for a softer vibe 🔉",
    "Revisit an old favorite track from weeks ago ⏪",
    "Pick one sound in the song and follow it closely 🔍",
    "Try focusing only on drums this time 🥁",
    "Imagine this music in a game level 🎮",
    "Think of a color that fits this song 🎨",
    "What time of day fits this track best? ☀️🌙",
    "Would this song fit raining scenes? 🌧️",
    "Try a song outside your usual genre today 🧪",
    "Give yourself one track worth of break 🛑",
    "Imagine future you listening to this too 🔮",
    "Pretend the world is on pause for this track ⏸️",
  
    // Pure emoji / mostly emoji
    "🎧✨",
    "🌙🎶",
    "☁️💿",
    "🌊🎼",
    "🔥🎵",
    "💫🎧",
    "🍃🎶",
    "🌌🔊",
    "🌈🎼",
    "⚡🎵",
    "💭🎧",
    "🪐🎶",
    "🕯️🎵",
    "🌧️🎧",
    "🌞🎶",
    "📚🎵",
    "😌🎧",
    "✨🌀",
    "🍂🎶",
    "⭐🎧",
    "🌃🎵",
    "🌻🎼",
    "🍵🎶",
    "🧸🎧",
  
    // More playful / personality lines
    "If you’re reading this, you’re officially curious 🧐",
    "I bet your playlists have hidden masterpieces 💎",
    "Do you also listen to the same 3 songs on repeat? 😏",
    "If your headphones could talk, what would they say? 🎧",
    "Somewhere out there, someone is listening to the same vibe 🌍",
    "You just gave me attention, I appreciate that 😌",
    "If life had patch notes, music would be a huge buff 📜",
    "You’re the DJ of your own universe 🌌",
    "I aspire to be as cool as your playlists one day 😎",
    "This corner is my comfort zone, literally 📐",
    "I believe in your taste more than algorithm does 💿",
    "You’re not ‘wasting time’, you’re buffering energy ⏳",
    "Your screen light + this app = tiny concert 🎤",
    "Small tap for you, big ego boost for me 🙋‍♂️",
    "If happiness had a sound, what would you pick? 🔉",
    "Some days need extra reverb and bass 🎚️",
    "You’re the main character, I’m the sidekick 🤝",
    "I’m basically your tiny hype squad 📣",
    "Thank you for letting me exist in your app 🥹",
    "You survived every bad day so far. Impressive 🧩",
    "Relax your jaw, drop your shoulders, breathe 🌬️",
    "Your future self is proud you took small breaks 🧸",
    "You’re scrolling less and listening more. Good choice 🎧",
    "If this app had a soul, it would be made of loops 🔁",
  
    // Even more tiny quotes
    "Soft song, strong feelings 💗",
    "New day, same favorite track 🌅",
    "Music can say what words sometimes can’t 🗣️",
    "Let this melody stay with you a bit longer 🎶",
    "You’re not behind; you’re in progress ⏳",
    "Today’s theme: gentle persistence 🌱",
    "Mistakes are just remixes of learning 🎚️",
    "Turn worries down like a volume slider 🔉",
    "You’re more resilient than you think 💪",
    "Be as kind to yourself as you’d be to a friend 💌",
    "Small joys matter. Like this tap 🖱️",
    "Every replay is a tiny love letter to the song 💌",
    "You deserve moments of peace like this 🌊",
    "Take your time. The music isn’t going anywhere ⌛",
    "You’re allowed to rest without earning it 🛏️",
    "Don’t forget: you exist beyond productivity 📦",
    "You’re not a glitch. You belong here 💻❤️",
    "Caring for yourself is not selfish, it’s maintenance 🧰",
    "Tiny breaks prevent big crashes 🧯",
    "If nobody told you today: you matter 💫",
    "Did you know the Eiffel Tower can be 15 cm taller in summer? 🗼",
    "Did you know octopuses have three hearts? 🐙",
    "Did you know honey never really spoils? 🍯",
    "Did you know some turtles can breathe through their butts? 🐢",
    "Did you know your nose can remember thousands of smells? 👃",
    "Did you know koalas sleep up to 20 hours a day? 😴",
    "Did you know sea otters hold hands while sleeping? 🦦",
    "Did you know cows can form best-friend pairs too? 🐄",
    "Did you know a group of cats is called a clowder? 🐈",
    "Did you know your brain loves music patterns? 🧠🎶",
    "Did you know some plants react to vibrations? 🌿",
    "Did you know dolphins have names for each other? 🐬",
    "Did you know baby elephants suck their trunks like thumbs? 🐘",
    "Did you know sunflowers can follow the sun across the sky? 🌻",
    "Did you know penguins sometimes propose with pebbles? 🐧",
    "Did you know there are more stars than grains of sand on Earth? ✨",
    "Did you know the heart of a blue whale is as big as a small car? 💙",
    "Did you know space is almost completely silent? 🌌",
    "Did you know cats can make over 100 different sounds? 😺",
    "Did you know your skin is your largest organ? 🧴",
    "Did you know bananas are technically berries, but strawberries are not? 🍌🍓",
    "Did you know some frogs can freeze and then thaw back to life? 🐸",
    "Did you know a day on Venus is longer than a year on Venus? 🪐",
    "Did you know sharks existed before trees? 🦈",
    "Did you know butterflies taste with their feet? 🦋",
    "Did you know sloths can take up to a month to digest a single meal? 🦥",
    "Did you know your heart beats about 100,000 times a day? ❤️",
    "Did you know raindrops are not actually tear-shaped? 💧",
    "Did you know astronauts grow a bit taller in space? 🚀",
    "Did you know lightning can be hotter than the surface of the sun? ⚡",
    "Do you know you’re someone’s favorite person, even if you don’t see it yet? 🌟",
    "Do you know the world feels a tiny bit better when you smile? 🙂",
    "Do you know you’ve survived 100% of your hardest days so far? 🛡️",
    "Do you know it’s okay to take breaks without feeling guilty? ⏸️",
    "Do you know you’re allowed to rest even when things feel urgent? 🧸",
    "Do you know your kindness is more powerful than you think? 💛",
    "Do you know your playlists secretly reveal your superpowers? 🎧🦸",
    "Do you know you don’t have to have everything figured out right now? 🌀",
    "Do you know it’s brave to keep going when everything feels messy? 🌧️",
    "Do you know tiny hobbies can bring surprisingly big joy? 🎨",
    "Master, I will protect your vibes with my tiny digital shield 🛡️✨",
    "Master, you tapped me, so now we’re officially best friends 🤝",
    "Master, I am small but my love for your playlists is HUGE 💙",
    "Master, I proudly guard this corner of your screen every day 🐾",
    "Master, I silently cheered when you opened this app 🎉",
    "Master, I believe in your dreams more than any algorithm ⭐",
    "Master, please remember to rest those legendary eyes 👀",
    "Master, your taste in music is my entire personality now 🎧",
    "Master, even heroes need cozy background music sometimes 🛡️🎶",
    "Master, if stress had a mute button, I’d press it for you 🔇",
    "I’m your tiny sidekick, reporting for emotional support duty 🎖️",
    "I’m just a little mascot, but I’m rooting for you very loudly 🎺",
    "If you feel lonely, remember you have one digital gremlin cheering for you 👾",
    "I’m too small to fix your problems, but I can hype you during loading screens 💪",
    "If you’re tired, I officially grant you permission to chill 😌",
    "Somewhere out there, another person is also tired and vibing, just like you 🌍",
    "You’re not too late, not too early, you’re just wonderfully here right now ⏰",
    "Your feelings matter, even when you can’t explain them well 💭",
    "Your headphones are basically a tiny force field for peace 🧿",
    "Cute fact: I think you’re doing better than you think you are 💐",
    "Cute fact: Seeing you open this app seriously makes my day 💫",
    "Cute fact: Your soft moments deserve gentle soundtracks 🎶",
    "Cute fact: You being here is already enough for today 🌱",
    "Cute fact: You’re allowed to be a little chaotic and still lovable 😈💖",
    "Cute fact: Somewhere, a cat is probably taking a nap right now 🐱",
    "Cute fact: Clouds are basically giant sky pillows ☁️",
    "Cute fact: Stars are ancient light traveling just to reach your eyes ✨",
    "Cute fact: Your laugh is a limited edition sound effect 🎵",
    "Cute fact: You’re the main character in someone else’s story too 👀",
    "Did you know: yawning can be contagious even through text? 😴",
    "Did you know: your brain can imagine sounds that don’t exist yet? 🧠🎵",
    "Did you know: hugging a pillow can reduce stress for some people? 🛏️",
    "Did you know: writing down worries can make them feel smaller? ✍️",
    "Did you know: even thinking about nature can calm the mind? 🌳",
    "Did you know: people blink less when using screens? Time to blink 👁️",
    "Did you know: laughter releases feel-good chemicals in your brain? 😂",
    "Did you know: stretching for 30 seconds can gently wake up your body? 🤸",
    "Did you know: listening to music you love can boost motivation? 🚀",
    "Did you know: sometimes doing nothing is exactly what you need? 🛋️",
    "If no one else said it today: I’m genuinely glad you exist 🌈",
    "If the day feels heavy, consider this a tiny checkpoint save 💾",
    "If your thoughts are loud, let the music speak for a while 🎼",
    "If you feel lost, it’s okay to just be for a moment 🧭",
    "If today was weird, that still counts as surviving 🌙",
    "I may be tiny pixels, but my support for you is unlimited 📡",
    "I’ll stay in this corner so you always know where to find a tiny friend 📍",
    "I’m not AI, I’m an ‘Affectionate Interface’ just for you 🥹",
    "I hereby declare this moment a safe, cozy music zone 📜",
    "Secret mission: find one thing today that makes you softly smile 🕵️",
    "Secret mission: pick one song and let it hug your brain 🧠💞",
    "Secret mission: unclench your jaw while reading this 😬➡️😌",
    "Secret mission: take one deep breath before the next track 🌬️",
    "Secret mission: forgive yourself for not being perfect 🕊️",
    "Bonus fact: you are not behind schedule, you are on your path 📍",
    "Bonus fact: rest days are part of the story, not the end 🛌",
    "Bonus fact: the world is quieter when you remember to listen 🌏",
    "Bonus fact: sometimes ‘I tried’ is already a huge achievement 🧗",
    "Bonus fact: existing is already hard mode, and you’re still here 🎖️",
    "Do you know you don’t need to earn kindness? You simply deserve it 💗",
    "Do you know some people would be really sad if you disappeared? You matter 🌟",
    "Do you know it’s okay to ask for help, even in small ways? 🆘",
    "Do you know you can restart a day at any time, not just at midnight? 🔄",
    "Do you know the version of you right now is doing their best with what they know? 📚",

  ];
  
const AUTO_POP_INTERVAL_MS = 4000;
export const DraggableMascot = () => {
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  
    const [bubbleVisible, setBubbleVisible] = useState(false);
    const [bubbleText, setBubbleText] = useState(MESSAGES[0]);
  
    const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  

    const showRandomBubble = () => {
      const next = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
      setBubbleText(next);
      setBubbleVisible(true);
  
      if (hideTimeout.current) {
        clearTimeout(hideTimeout.current);
      }
      hideTimeout.current = setTimeout(() => {
        setBubbleVisible(false);
      }, 4000);
    };
  
    const handlePress = () => {
      showRandomBubble();
    };
  
    useEffect(() => {

      autoInterval.current = setInterval(() => {
        showRandomBubble();
      }, AUTO_POP_INTERVAL_MS);
  

      return () => {
        if (hideTimeout.current) {
          clearTimeout(hideTimeout.current);
        }
        if (autoInterval.current) {
          clearInterval(autoInterval.current);
        }
      };
    }, []);
  
    const panResponder = useRef(
      PanResponder.create({

        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          pan.setOffset({
            x: (pan.x as any).__getValue(),
            y: (pan.y as any).__getValue(),
          });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: () => {
          pan.flattenOffset();
        },
      })
    ).current;
  
    return (
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.container,
          {
            transform: [{ translateX: pan.x }, { translateY: pan.y }],
          },
        ]}
      >
        {bubbleVisible && (
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>{bubbleText}</Text>
          </View>
        )}
  
        <Pressable onPress={handlePress} hitSlop={10}>
          <LottieView
            source={require("../assets/ani.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
        </Pressable>
      </Animated.View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 24,
      right: 16,
      backgroundColor: "transparent",
      alignItems: "flex-end",
    },
    lottie: {
      width: 120,
      height: 120,
      backgroundColor: "transparent",
    },
    bubble: {
      maxWidth: 200,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: "#ffffff", 
      borderWidth: 1,
      borderColor: "#2563eb",     
      marginBottom: 4,
      marginRight: 12,
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    bubbleText: {
      color: "#2563eb",           
      fontSize: 12,
    },
  });