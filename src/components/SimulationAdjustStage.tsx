import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { brand } from "../theme/brand";
import {
  clampAdjustmentTranslations,
  clampValue,
  getBaseDimensions,
  resolvePhotoLayerFrame,
  resolveTransformRatios,
} from "../lib/simulationViewport";
import type {
  SimulationPhoto,
  SimulationPhotoTransform,
} from "../types/simulation";

const MIN_ADJUST_SCALE = 1.08;
const MAX_ADJUST_SCALE = 4;

type SimulationAdjustStageProps = {
  photo: SimulationPhoto;
  onApply: (transform: SimulationPhotoTransform) => void;
  onCancel: () => void;
};

export function SimulationAdjustStage({
  photo,
  onApply,
  onCancel,
}: SimulationAdjustStageProps) {
  const insets = useSafeAreaInsets();
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const scale = useSharedValue(MIN_ADJUST_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const startScale = useSharedValue(MIN_ADJUST_SCALE);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  useEffect(() => {
    scale.value = MIN_ADJUST_SCALE;
    startScale.value = MIN_ADJUST_SCALE;
    translateX.value = 0;
    translateY.value = 0;
  }, [photo.updatedAt, scale, startScale, translateX, translateY]);

  const baseDimensions =
    viewport.width > 0 && viewport.height > 0
      ? getBaseDimensions(photo, viewport.width, viewport.height)
      : null;

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (!baseDimensions) {
        return;
      }

      const clamped = clampAdjustmentTranslations(
        startX.value + event.translationX,
        startY.value + event.translationY,
        scale.value,
        baseDimensions.width,
        baseDimensions.height,
        viewport.width,
        viewport.height,
      );

      translateX.value = clamped.x;
      translateY.value = clamped.y;
    });

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      startScale.value = scale.value;
    })
    .onUpdate((event) => {
      if (!baseDimensions) {
        return;
      }

      const nextScale = clampValue(
        startScale.value * event.scale,
        MIN_ADJUST_SCALE,
        MAX_ADJUST_SCALE,
      );
      const clamped = clampAdjustmentTranslations(
        translateX.value,
        translateY.value,
        nextScale,
        baseDimensions.width,
        baseDimensions.height,
        viewport.width,
        viewport.height,
      );

      scale.value = nextScale;
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    });

  const imageLayerStyle = useAnimatedStyle(() => {
    if (!baseDimensions) {
      return {};
    }

    const clamped = clampAdjustmentTranslations(
      translateX.value,
      translateY.value,
      scale.value,
      baseDimensions.width,
      baseDimensions.height,
      viewport.width,
      viewport.height,
    );
    const frame = resolvePhotoLayerFrame(
      clamped.x,
      clamped.y,
      scale.value,
      baseDimensions.width,
      baseDimensions.height,
      viewport.width,
      viewport.height,
    );

    return frame;
  });

  function handleViewportLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  }

  function handleApply() {
    if (!baseDimensions) {
      return;
    }

    const clamped = clampAdjustmentTranslations(
      translateX.value,
      translateY.value,
      scale.value,
      baseDimensions.width,
      baseDimensions.height,
      viewport.width,
      viewport.height,
    );
    const transform = resolveTransformRatios(
      clamped.x,
      clamped.y,
      scale.value,
      baseDimensions.width,
      baseDimensions.height,
      viewport.width,
      viewport.height,
    );

    onApply({
      ...transform,
      offsetYRatio: scale.value > 1 ? transform.offsetYRatio : 0,
    });
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.topChrome}>
          <Pressable onPress={onCancel} style={styles.closeButton}>
            <Ionicons color="#ffffff" name="close" size={22} />
          </Pressable>

          <View style={styles.adjustTitleWrap}>
            <Text style={styles.adjustTitle}>사진 위치 조정</Text>
          </View>
        </View>

        <View onLayout={handleViewportLayout} style={styles.viewportWrap}>
          <GestureDetector
            gesture={Gesture.Simultaneous(panGesture, pinchGesture)}
          >
            <View style={styles.viewport}>
              {baseDimensions ? (
                <Animated.View style={[styles.photoLayer, imageLayerStyle]}>
                  <Image
                    resizeMode="cover"
                    source={{ uri: photo.uri }}
                    style={styles.photo}
                  />
                </Animated.View>
              ) : null}
            </View>
          </GestureDetector>
        </View>

        <View
          style={[
            styles.adjustBottomOverlay,
            { paddingBottom: Math.max(insets.bottom, 18) },
          ]}
        >
          <Pressable onPress={handleApply} style={styles.confirmButton}>
            <Text style={styles.confirmButtonLabel}>적용</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: brand.colors.wall,
  },
  screen: {
    flex: 1,
    backgroundColor: brand.colors.wall,
  },
  topChrome: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(37, 29, 21, 0.12)",
    backgroundColor: brand.colors.wall,
  },
  closeButton: {
    alignItems: "center",
    justifyContent: "center",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
  adjustTitleWrap: {
    flex: 1,
  },
  adjustTitle: {
    color: brand.colors.text,
    fontSize: 17,
    fontWeight: "800",
    lineHeight: 22,
  },
  viewportWrap: {
    flex: 1,
    backgroundColor: "#0f0f0f",
  },
  viewport: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#0f0f0f",
  },
  photoLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  adjustBottomOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    paddingHorizontal: 20,
    paddingTop: 18,
    backgroundColor: "rgba(15, 15, 15, 0.38)",
  },
  confirmButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 58,
    borderRadius: 20,
    backgroundColor: brand.colors.primary,
    shadowColor: "#000000",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 8,
  },
  confirmButtonLabel: {
    color: brand.colors.primaryText,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
});
