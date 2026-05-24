import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  createWallAnalysis,
  selectDetectedRoute,
} from "../lib/routeDetectionApi";
import { shouldLockRouteDetectionNavigation } from "../lib/routeDetectionUi";
import { isSimulationClearComplete } from "../lib/simulationClearState";
import {
  analysisPointToViewportPoint,
  viewportPointToAnalysisPoint,
} from "../lib/simulationViewport";
import { toggleRouteIncludedObjectIds } from "../lib/routeSelectionState";
import {
  shouldShowWallAnalysisFallbackStart,
  shouldShowWallAnalysisRetry,
} from "../lib/wallAnalysisRetry";
import type { Point2D } from "../types/geometry";
import type {
  RouteSelectionResult,
  SimulationDetectedObject,
  SimulationPhoto,
  SimulationPhotoTransform,
  WallAnalysisResult,
} from "../types/simulation";
import type { SkeletonPose } from "../types/skeletonPose";
import { ConfirmModal } from "./ConfirmModal";
import { brand } from "../theme/brand";
import { RouteHighlightOverlay } from "./RouteHighlightOverlay";
import {
  SkeletonPoseOverlay,
  type SkeletonPoseOverlayHandle,
  type SkeletonPoseOverlayHistoryState,
} from "./SkeletonPoseOverlay";
import { SimulationPhotoViewport } from "./SimulationPhotoViewport";

const rupaLogo = require("../../assets/rupa-logo.png");

type SimulationCanvasStageProps = {
  photo: SimulationPhoto;
  transform: SimulationPhotoTransform;
  onClearPhoto: () => void;
};

type CanvasFlowStep =
  | "analyzingHolds"
  | "selectingStartHold"
  | "selectingRoute"
  | "selectingTopHold"
  | "routeEditing"
  | "sizingSkeleton"
  | "simulating";

export function SimulationCanvasStage({
  photo,
  transform,
  onClearPhoto,
}: SimulationCanvasStageProps) {
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [analysisResult, setAnalysisResult] =
    useState<WallAnalysisResult | null>(null);
  const [routeResult, setRouteResult] = useState<RouteSelectionResult | null>(
    null,
  );
  const [selectedStartHoldObjectId, setSelectedStartHoldObjectId] = useState<
    string | null
  >(null);
  const [selectedTopHoldObjectId, setSelectedTopHoldObjectId] = useState<
    string | null
  >(null);
  const [isClearComplete, setIsClearComplete] = useState(false);
  const [highlightError, setHighlightError] = useState<string | null>(null);
  const [flowStep, setFlowStep] = useState<CanvasFlowStep>("analyzingHolds");
  const [analysisAttempt, setAnalysisAttempt] = useState(0);
  const [simulationAttempt, setSimulationAttempt] = useState(0);
  const simulationCueOpacity = useRef(new Animated.Value(0)).current;
  const simulationCueTranslateY = useRef(new Animated.Value(18)).current;
  const simulationCueScale = useRef(new Animated.Value(0.92)).current;
  const skeletonOverlayRef = useRef<SkeletonPoseOverlayHandle>(null);
  const [skeletonHistoryState, setSkeletonHistoryState] =
    useState<SkeletonPoseOverlayHistoryState>({
      canRedo: false,
      canUndo: false,
    });

  function handleViewportLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  }

  useEffect(() => {
    let isMounted = true;

    setAnalysisResult(null);
    setRouteResult(null);
    setSelectedStartHoldObjectId(null);
    setSelectedTopHoldObjectId(null);
    setIsClearComplete(false);
    setHighlightError(null);
    setFlowStep("analyzingHolds");

    void createWallAnalysis(photo)
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setAnalysisResult(result);

        if (result.objects.length === 0) {
          setHighlightError(
            "홀드와 볼륨을 찾지 못했어요. 다른 사진으로 다시 시도해보세요.",
          );
          setFlowStep("selectingStartHold");
          return;
        }

        setFlowStep("selectingStartHold");
      })
      .catch((error: unknown) => {
        if (!isMounted) {
          return;
        }

        setHighlightError(
          error instanceof Error
            ? error.message
            : "벽 분석에 실패했어요. 서버 연결을 확인해보세요.",
        );
        setFlowStep("selectingStartHold");
      });

    return () => {
      isMounted = false;
    };
  }, [analysisAttempt, photo]);

  useEffect(() => {
    simulationCueOpacity.stopAnimation();
    simulationCueTranslateY.stopAnimation();
    simulationCueScale.stopAnimation();

    if (flowStep !== "simulating") {
      simulationCueOpacity.setValue(0);
      simulationCueTranslateY.setValue(18);
      simulationCueScale.setValue(0.92);
      return;
    }

    simulationCueOpacity.setValue(0);
    simulationCueTranslateY.setValue(18);
    simulationCueScale.setValue(0.92);

    const cueAnimation = Animated.sequence([
      Animated.parallel([
        Animated.timing(simulationCueOpacity, {
          duration: 160,
          toValue: 1,
          useNativeDriver: true,
        }),
        Animated.timing(simulationCueTranslateY, {
          duration: 160,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(simulationCueScale, {
          duration: 160,
          toValue: 1,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(isClearComplete ? 880 : 760),
      Animated.parallel([
        Animated.timing(simulationCueOpacity, {
          duration: isClearComplete ? 360 : 520,
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(simulationCueTranslateY, {
          duration: isClearComplete ? 360 : 520,
          toValue: -18,
          useNativeDriver: true,
        }),
        Animated.timing(simulationCueScale, {
          duration: isClearComplete ? 360 : 520,
          toValue: isClearComplete ? 1.38 : 1.28,
          useNativeDriver: true,
        }),
      ]),
    ]);
    cueAnimation.start();

    return () => {
      cueAnimation.stop();
    };
  }, [
    flowStep,
    isClearComplete,
    simulationCueOpacity,
    simulationCueScale,
    simulationCueTranslateY,
  ]);

  function getDistanceSquared(a: Point2D, b: Point2D) {
    const x = a.x - b.x;
    const y = a.y - b.y;
    return x * x + y * y;
  }

  function isPointInPolygon(
    point: Point2D,
    polygon: SimulationDetectedObject["contour"],
  ) {
    let isInside = false;

    for (
      let currentIndex = 0, previousIndex = polygon.length - 1;
      currentIndex < polygon.length;
      previousIndex = currentIndex, currentIndex += 1
    ) {
      const currentPoint = polygon[currentIndex];
      const previousPoint = polygon[previousIndex];
      const intersects =
        currentPoint.y > point.y !== previousPoint.y > point.y &&
        point.x <
          ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
            (previousPoint.y - currentPoint.y) +
            currentPoint.x;

      if (intersects) {
        isInside = !isInside;
      }
    }

    return isInside;
  }

  function selectNearestHold(
    sourcePoint: Point2D,
    objects: SimulationDetectedObject[],
  ) {
    const holds = objects.filter((object) => object.kind === "hold");

    if (holds.length === 0) {
      return null;
    }

    const containingHold = holds.find((object) =>
      isPointInPolygon(sourcePoint, object.contour),
    );

    if (containingHold) {
      return containingHold;
    }

    return holds.reduce((closest, current) =>
      getDistanceSquared(sourcePoint, current.center) <
      getDistanceSquared(sourcePoint, closest.center)
        ? current
        : closest,
    );
  }

  function findContainingHold(
    sourcePoint: Point2D,
    objects: SimulationDetectedObject[],
  ) {
    return (
      objects.find(
        (object) =>
          object.kind === "hold" &&
          isPointInPolygon(sourcePoint, object.contour),
      ) ?? null
    );
  }

  function selectNearestRouteHold(
    sourcePoint: Point2D,
    objects: SimulationDetectedObject[],
    route: RouteSelectionResult,
  ) {
    const routeHolds = objects.filter(
      (object) =>
        object.kind === "hold" && route.includedObjectIds.includes(object.id),
    );

    if (routeHolds.length === 0) {
      return null;
    }

    const containingHold = routeHolds.find((object) =>
      isPointInPolygon(sourcePoint, object.contour),
    );

    if (containingHold) {
      return containingHold;
    }

    return routeHolds.reduce((closest, current) =>
      getDistanceSquared(sourcePoint, current.center) <
      getDistanceSquared(sourcePoint, closest.center)
        ? current
        : closest,
    );
  }

  async function handleStartHoldPress(point: Point2D) {
    if (
      viewport.width <= 0 ||
      viewport.height <= 0 ||
      flowStep !== "selectingStartHold" ||
      !analysisResult
    ) {
      return;
    }

    const analysisStartHoldPoint = viewportPointToAnalysisPoint(
      point,
      photo,
      analysisResult.image,
      transform,
      viewport.width,
      viewport.height,
    );
    const startHoldObject = selectNearestHold(
      analysisStartHoldPoint,
      analysisResult.objects,
    );

    if (!startHoldObject) {
      setHighlightError("선택할 수 있는 홀드를 찾지 못했어요.");
      return;
    }

    setSelectedStartHoldObjectId(startHoldObject.id);
    setSelectedTopHoldObjectId(null);
    setIsClearComplete(false);
    setHighlightError(null);
    setRouteResult(null);
    setFlowStep("selectingRoute");

    try {
      const result = await selectDetectedRoute({
        analysisId: analysisResult.id,
        startHoldObjectId: startHoldObject.id,
      });

      if (result.includedObjectIds.length === 0) {
        setRouteResult(null);
        setHighlightError(
          "같은 색 루트를 찾지 못했어요. 다른 홀드를 탭해보세요.",
        );
        setFlowStep("selectingStartHold");
        return;
      }

      setRouteResult(result);
      setFlowStep("routeEditing");
    } catch {
      setRouteResult(null);
      setHighlightError("루트 선택에 실패했어요. 다시 탭해보세요.");
      setFlowStep("selectingStartHold");
    }
  }

  function handleTopHoldPress(point: Point2D) {
    if (
      viewport.width <= 0 ||
      viewport.height <= 0 ||
      flowStep !== "selectingTopHold" ||
      !analysisResult ||
      !routeResult
    ) {
      return;
    }

    const analysisTopHoldPoint = viewportPointToAnalysisPoint(
      point,
      photo,
      analysisResult.image,
      transform,
      viewport.width,
      viewport.height,
    );
    const topHoldObject = selectNearestRouteHold(
      analysisTopHoldPoint,
      analysisResult.objects,
      routeResult,
    );

    if (!topHoldObject) {
      setHighlightError("선택할 수 있는 탑 홀드를 찾지 못했어요.");
      return;
    }

    if (topHoldObject.id === selectedStartHoldObjectId) {
      setHighlightError("스타트와 다른 탑 홀드를 선택하세요.");
      return;
    }

    setSelectedTopHoldObjectId(topHoldObject.id);
    setIsClearComplete(false);
    setHighlightError(null);
    setFlowStep("sizingSkeleton");
  }

  async function handleCanvasPress(point: Point2D) {
    if (flowStep === "selectingStartHold") {
      await handleStartHoldPress(point);
      return;
    }

    if (flowStep === "selectingTopHold") {
      handleTopHoldPress(point);
    }
  }

  function handleRouteHoldToggle(point: Point2D) {
    if (
      viewport.width <= 0 ||
      viewport.height <= 0 ||
      !analysisResult ||
      !routeResult
    ) {
      return;
    }

    const analysisPoint = viewportPointToAnalysisPoint(
      point,
      photo,
      analysisResult.image,
      transform,
      viewport.width,
      viewport.height,
    );
    const holdObject = findContainingHold(
      analysisPoint,
      analysisResult.objects,
    );

    if (!holdObject) {
      return;
    }

    if (holdObject.id === selectedTopHoldObjectId) {
      return;
    }

    setRouteResult((currentRoute) => {
      if (!currentRoute) {
        return currentRoute;
      }

      return {
        ...currentRoute,
        includedObjectIds: toggleRouteIncludedObjectIds({
          includedObjectIds: currentRoute.includedObjectIds,
          objectId: holdObject.id,
          startHoldObjectId: currentRoute.startHoldObjectId,
        }),
      };
    });
  }

  function handleReselectRoute() {
    setRouteResult(null);
    setSelectedStartHoldObjectId(null);
    setSelectedTopHoldObjectId(null);
    setIsClearComplete(false);
    setHighlightError(null);
    setFlowStep("selectingStartHold");
  }

  function handleReselectTopHold() {
    setSelectedTopHoldObjectId(null);
    setIsClearComplete(false);
    setHighlightError(null);
    setFlowStep("selectingTopHold");
  }

  function handleRetryAnalysis() {
    setAnalysisAttempt((currentAttempt) => currentAttempt + 1);
  }

  function handleStartWithoutAnalysis() {
    setAnalysisResult(null);
    setRouteResult(null);
    setSelectedStartHoldObjectId(null);
    setSelectedTopHoldObjectId(null);
    setIsClearComplete(false);
    setHighlightError(null);
    setFlowStep("sizingSkeleton");
  }

  function handleRetrySimulation() {
    setIsClearComplete(false);
    setFlowStep("simulating");
    setSimulationAttempt((currentAttempt) => currentAttempt + 1);
  }

  const holdCount = analysisResult
    ? analysisResult.objects.filter((object) => object.kind === "hold").length
    : 0;
  const overlayObjects =
    analysisResult && routeResult && flowStep !== "routeEditing"
      ? analysisResult.objects.filter((object) =>
          routeResult.includedObjectIds.includes(object.id),
        )
      : analysisResult
        ? analysisResult.objects.filter((object) => object.kind === "hold")
        : [];
  const overlayDisplayMode = routeResult ? "route" : "all-holds";
  const selectedStartHoldObject =
    analysisResult && selectedStartHoldObjectId
      ? analysisResult.objects.find(
          (object) => object.id === selectedStartHoldObjectId,
        )
      : null;
  const selectedTopHoldObject =
    analysisResult && selectedTopHoldObjectId
      ? analysisResult.objects.find(
          (object) => object.id === selectedTopHoldObjectId,
        )
      : null;
  const selectedStartHoldViewportCenter =
    analysisResult && selectedStartHoldObject
      ? analysisPointToViewportPoint(
          selectedStartHoldObject.center,
          analysisResult.image,
          photo,
          transform,
          viewport.width,
          viewport.height,
        )
      : null;
  const selectedTopHoldViewportCenter =
    analysisResult && selectedTopHoldObject
      ? analysisPointToViewportPoint(
          selectedTopHoldObject.center,
          analysisResult.image,
          photo,
          transform,
          viewport.width,
          viewport.height,
        )
      : null;
  const selectedTopHoldViewportThreshold =
    analysisResult && selectedTopHoldObject && selectedTopHoldViewportCenter
      ? Math.min(
          Math.max(
            selectedTopHoldObject.contour.reduce((maxDistance, point) => {
              const viewportPoint = analysisPointToViewportPoint(
                point,
                analysisResult.image,
                photo,
                transform,
                viewport.width,
                viewport.height,
              );

              return Math.max(
                maxDistance,
                Math.sqrt(
                  getDistanceSquared(
                    viewportPoint,
                    selectedTopHoldViewportCenter,
                  ),
                ),
              );
            }, 0) + 16,
            28,
          ),
          72,
        )
      : 0;
  const skeletonInitialCenter =
    selectedStartHoldViewportCenter && viewport.width > 0 && viewport.height > 0
      ? {
          x: Math.min(
            Math.max(selectedStartHoldViewportCenter.x, 36),
            viewport.width - 36,
          ),
          y: Math.min(
            Math.max(
              selectedStartHoldViewportCenter.y + viewport.height * 0.16,
              90,
            ),
            viewport.height - 150,
          ),
        }
      : undefined;
  const handleSkeletonPoseChange = useCallback(
    (pose: SkeletonPose) => {
      if (flowStep !== "simulating" || isClearComplete) {
        return;
      }

      if (
        isSimulationClearComplete({
          leftHand: pose.joints.leftHand,
          rightHand: pose.joints.rightHand,
          threshold: selectedTopHoldViewportThreshold,
          topHoldCenter: selectedTopHoldViewportCenter,
        })
      ) {
        setIsClearComplete(true);
      }
    },
    [
      flowStep,
      isClearComplete,
      selectedTopHoldViewportCenter,
      selectedTopHoldViewportThreshold,
    ],
  );
  const isAnalyzingHolds = flowStep === "analyzingHolds";
  const isSelectingRoute = flowStep === "selectingRoute";
  const isRouteDetectionNavigationLocked =
    shouldLockRouteDetectionNavigation(flowStep);
  const canUseSkeletonHistory = flowStep === "simulating";
  const shouldShowSkeletonOverlay =
    flowStep === "sizingSkeleton" || flowStep === "simulating";
  const shouldShowRetryButton = shouldShowWallAnalysisRetry({
    analysisResult,
    flowStep,
    highlightError,
  });
  const shouldShowFallbackStartButton = shouldShowWallAnalysisFallbackStart({
    analysisResult,
    flowStep,
    highlightError,
  });

  const infoTitle = (() => {
    switch (flowStep) {
      case "analyzingHolds":
        return "벽 사진에서 홀드 테두리를 찾고 있어요.";
      case "selectingStartHold":
        if (!analysisResult) {
          return "분석 결과를 불러오지 못했어요.";
        }
        if (holdCount === 0) {
          return "인식된 홀드가 없어요. 다른 사진으로 다시 시도해보세요.";
        }
        return "스타트 홀드를 선택하세요.";
      case "selectingRoute":
        return "선택한 홀드와 같은 색 루트를 찾고 있어요.";
      case "selectingTopHold":
        return "탑 홀드를 선택하세요.";
      case "routeEditing":
        return "인식되지 않은 홀드를 탭하여 루트를 보정하세요.";
      case "sizingSkeleton":
        return "캐릭터의 크기를 조정하고, 스타트 자세를 취해주세요.";
      case "simulating":
        return "캐릭터를 움직여 무브를 시뮬레이션해보세요.";
    }
  })();

  const loadingText = isAnalyzingHolds
    ? "벽 사진을 분석하고 있어요"
    : "같은 색 홀드를 묶고 있어요";

  function renderInstructionPanel() {
    return (
      <View pointerEvents="box-none" style={styles.instructionPanelOverlay}>
        <View pointerEvents="box-none" style={styles.instructionPanel}>
          <Text pointerEvents="none" style={styles.instructionEyebrow}>
            ROUTE DETECTION
          </Text>

          <Text pointerEvents="none" style={styles.instructionTitle}>
            {infoTitle}
          </Text>

          {isAnalyzingHolds || isSelectingRoute ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={brand.colors.primary} size="small" />
              <Text style={styles.loadingText}>{loadingText}</Text>
            </View>
          ) : null}

          {highlightError ? (
            <Text pointerEvents="none" style={styles.errorText}>
              {highlightError}
            </Text>
          ) : null}

          {shouldShowFallbackStartButton || shouldShowRetryButton ? (
            <View pointerEvents="box-none" style={styles.instructionActionRow}>
              {shouldShowFallbackStartButton ? (
                <Pressable
                  accessibilityLabel="분석 없이 시뮬레이션 시작"
                  onPress={handleStartWithoutAnalysis}
                  style={({ pressed }) => [
                    styles.startWithoutAnalysisButton,
                    pressed ? styles.startWithoutAnalysisButtonPressed : null,
                  ]}
                >
                  <Ionicons
                    color={brand.colors.primaryText}
                    name="body-outline"
                    size={15}
                  />
                  <Text style={styles.startWithoutAnalysisButtonText}>
                    분석 없이 시작
                  </Text>
                </Pressable>
              ) : null}

              {shouldShowRetryButton ? (
                <Pressable
                  accessibilityLabel="사진 분석 다시 시도"
                  onPress={handleRetryAnalysis}
                  style={({ pressed }) => [
                    styles.retryAnalysisButton,
                    pressed ? styles.retryAnalysisButtonPressed : null,
                  ]}
                >
                  <Ionicons
                    color={brand.colors.text}
                    name="refresh"
                    size={15}
                  />
                  <Text style={styles.retryAnalysisButtonText}>다시 시도</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {flowStep === "routeEditing" ? (
            <View pointerEvents="box-none" style={styles.instructionActionRow}>
              <Pressable
                onPress={handleReselectRoute}
                style={({ pressed }) => [
                  styles.reselectButton,
                  pressed ? styles.reselectButtonPressed : null,
                ]}
              >
                <Text style={styles.reselectButtonText}>스타트 다시 선택</Text>
              </Pressable>

              {selectedTopHoldObjectId ? (
                <Pressable
                  onPress={handleReselectTopHold}
                  style={({ pressed }) => [
                    styles.reselectButton,
                    pressed ? styles.reselectButtonPressed : null,
                  ]}
                >
                  <Text style={styles.reselectButtonText}>탑 다시 선택</Text>
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => setFlowStep("selectingTopHold")}
                style={({ pressed }) => [
                  styles.calibrationConfirmButton,
                  pressed ? styles.calibrationConfirmButtonPressed : null,
                ]}
              >
                <Text style={styles.calibrationConfirmButtonText}>확인</Text>
              </Pressable>
            </View>
          ) : null}

          {flowStep === "sizingSkeleton" ? (
            <View pointerEvents="box-none" style={styles.instructionActionRow}>
              <Pressable
                onPress={() => setFlowStep("routeEditing")}
                style={({ pressed }) => [
                  styles.reselectButton,
                  pressed ? styles.reselectButtonPressed : null,
                ]}
              >
                <Text style={styles.reselectButtonText}>이전</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setIsClearComplete(false);
                  setFlowStep("simulating");
                }}
                style={({ pressed }) => [
                  styles.calibrationConfirmButton,
                  pressed ? styles.calibrationConfirmButtonPressed : null,
                ]}
              >
                <Text style={styles.calibrationConfirmButtonText}>완료</Text>
              </Pressable>
            </View>
          ) : null}

          {flowStep === "simulating" && isClearComplete ? (
            <View pointerEvents="box-none" style={styles.instructionActionRow}>
              <Pressable
                accessibilityLabel="시뮬레이션 다시 시도"
                onPress={handleRetrySimulation}
                style={({ pressed }) => [
                  styles.clearSecondaryButton,
                  pressed ? styles.clearSecondaryButtonPressed : null,
                ]}
              >
                <Text style={styles.clearSecondaryButtonText}>다시 시도</Text>
              </Pressable>

              <Pressable
                accessibilityLabel="시뮬레이션 완료"
                onPress={onClearPhoto}
                style={({ pressed }) => [
                  styles.clearPrimaryButton,
                  pressed ? styles.clearPrimaryButtonPressed : null,
                ]}
              >
                <Text style={styles.clearPrimaryButtonText}>완료</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.canvasChrome}>
          <View style={styles.canvasChromeHeader}>
            <Image
              accessibilityIgnoresInvertColors
              resizeMode="contain"
              source={rupaLogo}
              style={styles.canvasHeaderLogo}
            />

            <View style={styles.canvasChromeActions}>
              <Pressable
                accessibilityLabel="스켈레톤 이동 실행 취소"
                disabled={
                  !canUseSkeletonHistory || !skeletonHistoryState.canUndo
                }
                onPress={() => skeletonOverlayRef.current?.undo()}
                style={[
                  styles.overlayIconButton,
                  !canUseSkeletonHistory || !skeletonHistoryState.canUndo
                    ? styles.overlayIconButtonDisabled
                    : null,
                ]}
              >
                <Ionicons
                  color={brand.colors.text}
                  name="arrow-undo"
                  size={19}
                />
              </Pressable>

              <Pressable
                accessibilityLabel="스켈레톤 이동 다시 실행"
                disabled={
                  !canUseSkeletonHistory || !skeletonHistoryState.canRedo
                }
                onPress={() => skeletonOverlayRef.current?.redo()}
                style={[
                  styles.overlayIconButton,
                  !canUseSkeletonHistory || !skeletonHistoryState.canRedo
                    ? styles.overlayIconButtonDisabled
                    : null,
                ]}
              >
                <Ionicons
                  color={brand.colors.text}
                  name="arrow-redo"
                  size={19}
                />
              </Pressable>

              <Pressable
                accessibilityLabel="현재 벽 사진 닫기"
                accessibilityState={{
                  disabled: isRouteDetectionNavigationLocked,
                }}
                disabled={isRouteDetectionNavigationLocked}
                onPress={() => setConfirmVisible(true)}
                style={[
                  styles.overlayIconButton,
                  isRouteDetectionNavigationLocked
                    ? styles.overlayIconButtonDisabled
                    : null,
                ]}
              >
                <Ionicons color={brand.colors.text} name="close" size={22} />
              </Pressable>
            </View>
          </View>
        </View>

        <View onLayout={handleViewportLayout} style={styles.canvasArea}>
          {viewport.width > 0 && viewport.height > 0 ? (
            <SimulationPhotoViewport
              photo={photo}
              transform={transform}
              viewportHeight={viewport.height}
              viewportWidth={viewport.width}
            />
          ) : null}

          {analysisResult && viewport.width > 0 && viewport.height > 0 ? (
            <RouteHighlightOverlay
              analysisImage={analysisResult.image}
              displayMode={overlayDisplayMode}
              objects={overlayObjects}
              photo={photo}
              route={routeResult}
              selectedStartHoldObjectId={selectedStartHoldObjectId}
              selectedTopHoldObjectId={selectedTopHoldObjectId}
              transform={transform}
              viewportHeight={viewport.height}
              viewportWidth={viewport.width}
            />
          ) : null}

          {routeResult && flowStep === "routeEditing" ? (
            <Pressable
              onPress={(event) =>
                handleRouteHoldToggle({
                  x: event.nativeEvent.locationX,
                  y: event.nativeEvent.locationY,
                })
              }
              style={styles.touchLayer}
            />
          ) : null}

          {flowStep === "selectingStartHold" ||
          flowStep === "selectingTopHold" ||
          flowStep === "selectingRoute" ||
          flowStep === "analyzingHolds" ? (
            <Pressable
              onPress={(event) =>
                void handleCanvasPress({
                  x: event.nativeEvent.locationX,
                  y: event.nativeEvent.locationY,
                })
              }
              style={styles.touchLayer}
            />
          ) : null}

          {shouldShowSkeletonOverlay &&
          viewport.width > 0 &&
          viewport.height > 0 ? (
            <SkeletonPoseOverlay
              key={simulationAttempt}
              ref={skeletonOverlayRef}
              allowEmptySpacePinchScale
              allowPinchScaleInSimulation
              characterRenderStyle="stickmanCharacterBlack"
              initialCenter={skeletonInitialCenter}
              mode={
                flowStep === "sizingSkeleton" ? "calibrating" : "simulating"
              }
              onHistoryStateChange={setSkeletonHistoryState}
              onPoseChange={handleSkeletonPoseChange}
              viewportHeight={viewport.height}
              viewportWidth={viewport.width}
            />
          ) : null}

          {renderInstructionPanel()}

          <Animated.View
            pointerEvents="none"
            style={[
              styles.simulationCue,
              {
                opacity: simulationCueOpacity,
                transform: [
                  { translateY: simulationCueTranslateY },
                  { scale: simulationCueScale },
                ],
              },
            ]}
          >
            <Text
              adjustsFontSizeToFit
              minimumFontScale={0.72}
              numberOfLines={1}
              style={styles.simulationCueText}
            >
              {isClearComplete
                ? "완등! 이제 실제 벽에서 시도해보세요."
                : "이제 다음 무브를 확인해보세요!"}
            </Text>
          </Animated.View>
        </View>

        <ConfirmModal
          body="현재 시뮬레이션에 올린 사진이 초기화됩니다."
          confirmLabel="삭제"
          onCancel={() => setConfirmVisible(false)}
          onConfirm={() => {
            setConfirmVisible(false);
            onClearPhoto();
          }}
          onRequestClose={() => setConfirmVisible(false)}
          title="사진을 삭제할까요?"
          visible={confirmVisible}
        />
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
  canvasChrome: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(37, 29, 21, 0.12)",
    backgroundColor: brand.colors.wall,
  },
  canvasChromeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  canvasHeaderLogo: {
    width: 78,
    height: 36,
  },
  canvasArea: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: brand.colors.wall,
  },
  canvasChromeActions: {
    flexDirection: "row",
    flexShrink: 0,
    marginLeft: "auto",
    justifyContent: "flex-end",
    gap: 10,
  },
  touchLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  instructionPanelOverlay: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 34,
    zIndex: 20,
  },
  instructionPanel: {
    alignSelf: "stretch",
    paddingHorizontal: 14,
    paddingTop: 11,
    paddingBottom: 12,
    borderRadius: 18,
    backgroundColor: "rgba(10, 10, 10, 0.68)",
  },
  instructionEyebrow: {
    color: brand.colors.accent,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  instructionTitle: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 21,
  },
  loadingRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: brand.colors.accentSoft,
    fontSize: 12,
    fontWeight: "700",
  },
  errorText: {
    marginTop: 8,
    color: brand.colors.danger,
    fontSize: 12,
    lineHeight: 16,
  },
  retryAnalysisButton: {
    alignSelf: "flex-start",
    minHeight: 34,
    borderRadius: 16,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: brand.colors.primary,
  },
  retryAnalysisButtonPressed: {
    backgroundColor: brand.colors.primaryPressed,
  },
  retryAnalysisButtonText: {
    color: brand.colors.primaryText,
    fontSize: 12,
    fontWeight: "900",
  },
  instructionActionRow: {
    marginTop: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  startWithoutAnalysisButton: {
    alignSelf: "flex-start",
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: brand.colors.primary,
  },
  startWithoutAnalysisButtonPressed: {
    backgroundColor: brand.colors.primaryPressed,
  },
  startWithoutAnalysisButtonText: {
    color: brand.colors.primaryText,
    fontSize: 12,
    fontWeight: "900",
  },
  reselectButton: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  reselectButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  reselectButtonText: {
    color: brand.colors.accentSoft,
    fontSize: 12,
    fontWeight: "800",
  },
  calibrationConfirmButton: {
    height: 31,
    minWidth: 56,
    borderRadius: 15.5,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    backgroundColor: brand.colors.primary,
  },
  calibrationConfirmButtonPressed: {
    backgroundColor: brand.colors.primaryPressed,
  },
  calibrationConfirmButtonText: {
    color: brand.colors.primaryText,
    fontSize: 12,
    fontWeight: "900",
  },
  clearSecondaryButton: {
    height: 32,
    minWidth: 84,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  clearSecondaryButtonPressed: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  clearSecondaryButtonText: {
    color: brand.colors.accentSoft,
    fontSize: 12,
    fontWeight: "900",
  },
  clearPrimaryButton: {
    height: 32,
    minWidth: 70,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 15,
    backgroundColor: brand.colors.primary,
  },
  clearPrimaryButtonPressed: {
    backgroundColor: brand.colors.primaryPressed,
  },
  clearPrimaryButtonText: {
    color: brand.colors.primaryText,
    fontSize: 12,
    fontWeight: "900",
  },
  simulationCue: {
    position: "absolute",
    top: 92,
    left: 10,
    right: 10,
    alignItems: "center",
  },
  simulationCueText: {
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.72)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  overlayIconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(37, 29, 21, 0.14)",
    backgroundColor: "rgba(255, 244, 223, 0.24)",
  },
  overlayIconButtonDisabled: {
    opacity: 0.3,
  },
});
