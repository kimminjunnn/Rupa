import { Image, StyleSheet, View } from "react-native";

import {
  getBaseDimensions,
  resolveAbsoluteOffsets,
  resolvePhotoLayerFrame,
} from "../lib/simulationViewport";
import { brand } from "../theme/brand";
import type {
  SimulationPhoto,
  SimulationPhotoTransform,
} from "../types/simulation";

type SimulationPhotoViewportProps = {
  photo: SimulationPhoto;
  transform: SimulationPhotoTransform;
  viewportHeight: number;
  viewportWidth: number;
};

export function SimulationPhotoViewport({
  photo,
  transform,
  viewportHeight,
  viewportWidth,
}: SimulationPhotoViewportProps) {
  const baseDimensions = getBaseDimensions(photo, viewportWidth, viewportHeight);
  const absoluteOffsets = resolveAbsoluteOffsets(
    transform,
    baseDimensions.width,
    baseDimensions.height,
    viewportWidth,
    viewportHeight,
  );
  const frame = resolvePhotoLayerFrame(
    absoluteOffsets.translateX,
    absoluteOffsets.translateY,
    transform.scale,
    baseDimensions.width,
    baseDimensions.height,
    viewportWidth,
    viewportHeight,
  );

  return (
    <View style={styles.viewport}>
      <View
        style={[
          styles.photoLayer,
          {
            left: frame.left,
            top: frame.top,
            width: frame.width,
            height: frame.height,
          },
        ]}
      >
        <Image
          resizeMode="cover"
          source={{ uri: photo.uri }}
          style={styles.photo}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: brand.colors.wall,
  },
  photoLayer: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
});
