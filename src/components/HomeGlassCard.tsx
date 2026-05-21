import { Image, StyleSheet, View } from "react-native";

const rupaLogo = require("../../assets/rupa-logo.png");

export function HomeGlassCard() {
  return (
    <View style={styles.content}>
      <Image
        accessibilityIgnoresInvertColors
        resizeMode="contain"
        source={rupaLogo}
        style={styles.logoImage}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
