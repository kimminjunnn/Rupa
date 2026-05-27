import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { brand } from "../theme/brand";

type SimulationMenuDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

type DrawerAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
};

export function SimulationMenuDrawer({
  visible,
  onClose,
}: SimulationMenuDrawerProps) {
  const router = useRouter();
  const actions: DrawerAction[] = [
    {
      icon: "home-outline",
      label: "홈",
      onPress: () => {
        onClose();
        router.replace("/");
      },
    },
    {
      icon: "school-outline",
      label: "조작 연습",
      onPress: () => {
        onClose();
        router.push({ pathname: "/onboarding", params: { mode: "tutorial" } });
      },
    },
  ];

  return (
    <Modal
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
      visible={visible}
    >
      <View style={styles.overlay}>
        <Pressable
          accessibilityLabel="메뉴 닫기"
          onPress={onClose}
          style={styles.backdrop}
        />

        <SafeAreaView edges={["top", "bottom"]} style={styles.drawerSafeArea}>
          <View style={styles.drawer}>
            <View style={styles.header}>
              <Image
                accessibilityLabel="Rupa"
                resizeMode="contain"
                source={require("../../assets/rupa-logo.png")}
                style={styles.drawerLogo}
              />

              <Pressable
                accessibilityLabel="메뉴 닫기"
                onPress={onClose}
                style={styles.closeButton}
              >
                <Ionicons color={brand.colors.text} name="close" size={22} />
              </Pressable>
            </View>

            <View style={styles.actionList}>
              {actions.map((action) => (
                <Pressable
                  key={action.label}
                  onPress={action.onPress}
                  style={({ pressed }) => [
                    styles.actionRow,
                    pressed ? styles.actionRowPressed : null,
                  ]}
                >
                  <View style={styles.actionIconBox}>
                    <Ionicons
                      color={brand.colors.primaryText}
                      name={action.icon}
                      size={22}
                    />
                  </View>
                  <Text style={styles.actionLabel}>{action.label}</Text>
                  <Ionicons
                    color={brand.colors.mutedText}
                    name="chevron-forward"
                    size={20}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: "rgba(10,10,10,0.36)",
  },
  backdrop: {
    flex: 1,
  },
  drawerSafeArea: {
    width: "84%",
    maxWidth: 390,
    backgroundColor: brand.colors.wall,
  },
  drawer: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderLeftWidth: 1,
    borderLeftColor: "rgba(37,29,21,0.14)",
    backgroundColor: brand.colors.wall,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingBottom: 18,
  },
  drawerLogo: {
    width: 94,
    height: 44,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(37,29,21,0.14)",
    borderRadius: 22,
    backgroundColor: "rgba(255,244,223,0.54)",
  },
  actionList: {
    gap: 10,
  },
  actionRow: {
    minHeight: 66,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: brand.colors.border,
    borderRadius: 18,
    backgroundColor: "rgba(255,248,231,0.88)",
  },
  actionRowPressed: {
    opacity: 0.72,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: brand.colors.primary,
  },
  actionLabel: {
    flex: 1,
    color: brand.colors.text,
    fontSize: 16,
    fontWeight: "900",
  },
});
