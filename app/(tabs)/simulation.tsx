import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { Alert, Image } from "react-native";

import { SimulationAdjustStage } from "../../src/components/SimulationAdjustStage";
import { SimulationCanvasStage } from "../../src/components/SimulationCanvasStage";
import { SimulationInputStage } from "../../src/components/SimulationInputStage";
import { SimulationMenuDrawer } from "../../src/components/SimulationMenuDrawer";
import {
  resolveReliablePhotoDimensions,
  type PhotoDimensions,
} from "../../src/lib/photoDimensions";
import { useSimulationStore } from "../../src/store/useSimulationStore";
import type {
  SimulationPhoto,
  SimulationPhotoSource,
} from "../../src/types/simulation";

function getDecodedImageDimensions(uri: string): Promise<PhotoDimensions | null> {
  return new Promise((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve(null),
    );
  });
}

async function createPhotoPayload(
  asset: ImagePicker.ImagePickerAsset,
  source: SimulationPhotoSource,
): Promise<SimulationPhoto> {
  const dimensions = resolveReliablePhotoDimensions(
    {
      width: asset.width,
      height: asset.height,
    },
    await getDecodedImageDimensions(asset.uri),
  );

  return {
    uri: asset.uri,
    width: dimensions.width,
    height: dimensions.height,
    source,
    updatedAt: Date.now(),
  };
}

export default function SimulationScreen() {
  const mode = useSimulationStore((state) => state.mode);
  const photo = useSimulationStore((state) => state.photo);
  const draftPhoto = useSimulationStore((state) => state.draftPhoto);
  const transform = useSimulationStore((state) => state.transform);
  const setDraftPhoto = useSimulationStore((state) => state.setDraftPhoto);
  const applyTransform = useSimulationStore((state) => state.applyTransform);
  const cancelDraft = useSimulationStore((state) => state.cancelDraft);
  const clearPhoto = useSimulationStore((state) => state.clearPhoto);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  async function pickPhoto(source: SimulationPhotoSource) {
    try {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "권한 필요",
          source === "camera"
            ? "카메라를 사용하려면 접근 권한이 필요합니다."
            : "갤러리 사진을 불러오려면 접근 권한이 필요합니다.",
        );
        return;
      }

      const result =
        source === "camera"
          ? await ImagePicker.launchCameraAsync({
              mediaTypes: ["images"],
              allowsEditing: false,
              quality: 1,
            })
          : await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ["images"],
              allowsEditing: false,
              quality: 1,
            });

      if (result.canceled) {
        return;
      }

      const asset = result.assets[0];

      if (!asset?.uri) {
        Alert.alert(
          "사진 불러오기 실패",
          "선택한 사진을 확인할 수 없습니다. 다시 시도해 주세요.",
        );
        return;
      }

      setDraftPhoto(await createPhotoPayload(asset, source));
    } catch {
      Alert.alert(
        source === "camera" ? "카메라 사용 불가" : "불러오기 실패",
        source === "camera"
          ? "현재 환경에서는 카메라를 열 수 없습니다. 실제 기기에서 다시 시도해 주세요."
          : "사진 보관함을 여는 중 문제가 발생했습니다. 다시 시도해 주세요.",
      );
    }
  }

  if (mode === "adjust" && draftPhoto) {
    return (
      <SimulationAdjustStage
        onApply={applyTransform}
        onCancel={cancelDraft}
        photo={draftPhoto}
      />
    );
  }

  if (mode === "canvas" && photo && transform) {
    return (
      <SimulationCanvasStage
        onClearPhoto={clearPhoto}
        photo={photo}
        transform={transform}
      />
    );
  }

  return (
    <>
      <SimulationInputStage
        onOpenCamera={() => void pickPhoto("camera")}
        onOpenLibrary={() => void pickPhoto("library")}
        onOpenMenu={() => setIsMenuVisible(true)}
      />
      <SimulationMenuDrawer
        onClose={() => setIsMenuVisible(false)}
        visible={isMenuVisible}
      />
    </>
  );
}
