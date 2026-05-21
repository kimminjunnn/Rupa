import { BlurView } from "expo-blur";
import { Image, StyleSheet, Text, View } from "react-native";

import { brand } from "../theme/brand";

const rupaLogo = require("../../assets/rupa-logo.png");

export function HomeGlassCard() {
  return (
    <View style={styles.shell}>
      <BlurView intensity={58} style={styles.blurLayer} tint="light">
        <View style={styles.content}>
          <Image
            accessibilityIgnoresInvertColors
            resizeMode="contain"
            source={rupaLogo}
            style={styles.logoImage}
          />
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    alignSelf: "stretch",
    borderRadius: 30,
    overflow: "hidden",
    backgroundColor: "rgba(255, 244, 215, 0.18)",
    shadowColor: brand.colors.text,
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    elevation: 7,
  },
  blurLayer: {
    minHeight: 150,
    paddingHorizontal: 30,
    paddingTop: 34,
    paddingBottom: 36,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  logoImage: {
    width: 190,
    height: 79,
  },
});
