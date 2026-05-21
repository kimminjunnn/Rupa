import { Image, StyleSheet, View } from "react-native";

const gymWallBackground = require("../../assets/rupa_theme/backgrounds/gym-wall-bg-bright.png");

export function HomeHeroHolds() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Image
        fadeDuration={0}
        resizeMode="cover"
        source={gymWallBackground}
        style={styles.background}
      />
      <View style={styles.readabilityOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  readabilityOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(37, 29, 21, 0.02)",
  },
});
