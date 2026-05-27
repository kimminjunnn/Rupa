import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import {
  SkeletonPoseOverlay,
  type SkeletonPoseOverlayHandle,
  type SkeletonPoseOverlayHistoryState,
} from "../src/components/SkeletonPoseOverlay";
import {
  createOnboardingTutorialTargetLayout,
  getNextOnboardingTutorialStepId,
  getOnboardingTutorialStep,
  getTargetPointForStep,
  isTutorialStepTargetReached,
  type OnboardingTutorialStepId,
} from "../src/lib/onboardingTutorialFlow";
import { useBodyProfileStore } from "../src/store/useBodyProfileStore";
import { useOnboardingStore } from "../src/store/useOnboardingStore";
import { brand } from "../src/theme/brand";
import { deriveWingspan, type WingspanMode } from "../src/types/bodyProfile";
import type { SkeletonPose } from "../src/types/skeletonPose";
import type { SkeletonEndpointName } from "../src/types/skeletonPose";

const TARGET_RADIUS = 24;
const HOLD_RADIUS = 12;

function toNumericInput(text: string) {
  return text.replace(/\D+/g, "");
}

function parsePositiveNumber(value: string) {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
}

function toDisplayNumber(value: number) {
  return String(value);
}

export default function OnboardingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const shouldStartAtTutorial = params.mode === "tutorial";
  const { hasBodyProfile, profile, updateProfile } = useBodyProfileStore();
  const completeOnboarding = useOnboardingStore(
    (state) => state.completeOnboarding,
  );
  const [stage, setStage] = useState<"profile" | "tutorial">(
    shouldStartAtTutorial ? "tutorial" : "profile",
  );
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [stepId, setStepId] =
    useState<OnboardingTutorialStepId>("welcome");
  const [startedEndpointSteps, setStartedEndpointSteps] = useState<
    Partial<Record<OnboardingTutorialStepId, boolean>>
  >({});
  const [heightError, setHeightError] = useState<string | null>(null);
  const [wingspanError, setWingspanError] = useState<string | null>(null);
  const [draftHeight, setDraftHeight] = useState(
    hasBodyProfile ? toDisplayNumber(profile.height) : "170",
  );
  const [draftWingspan, setDraftWingspan] = useState(
    hasBodyProfile ? toDisplayNumber(profile.wingspan) : "172",
  );
  const [draftWingspanMode, setDraftWingspanMode] = useState<WingspanMode>(
    profile.wingspanMode,
  );
  const overlayRef = useRef<SkeletonPoseOverlayHandle>(null);
  const completedStepRef = useRef<OnboardingTutorialStepId | null>(null);
  const [historyState, setHistoryState] =
    useState<SkeletonPoseOverlayHistoryState>({
      canRedo: false,
      canUndo: false,
    });

  const currentStep = getOnboardingTutorialStep(stepId);
  const targetLayout = useMemo(
    () =>
      viewport.width > 0 && viewport.height > 0
        ? createOnboardingTutorialTargetLayout(viewport.width, viewport.height)
        : null,
    [viewport.height, viewport.width],
  );
  const currentTargetPoint = targetLayout
    ? getTargetPointForStep(stepId, targetLayout)
    : null;
  const skeletonCenter =
    viewport.width > 0 && viewport.height > 0
      ? { x: viewport.width * 0.5, y: viewport.height * 0.46 }
      : undefined;
  const simulationInputMode =
    stepId === "directMode" ? "quadrants" : currentStep.inputMode;
  const reachedStepRef = useRef<OnboardingTutorialStepId | null>(null);
  const activeTutorialEndpoint =
    currentStep.target?.kind === "endpoint" ? currentStep.target.id : null;
  const shouldPreviewEndpoint =
    activeTutorialEndpoint !== null && !startedEndpointSteps[stepId];
  const instructionBody =
    stepId === "leftHand" && startedEndpointSteps.leftHand
      ? "상단 홀드를 왼손으로 제압해봐요!"
      : currentStep.body;

  function handleViewportLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setViewport({ width, height });
  }

  function handleHeightChange(text: string) {
    const nextText = toNumericInput(text);
    setDraftHeight(nextText);
    setHeightError(null);

    if (draftWingspanMode !== "auto") {
      return;
    }

    const nextHeight = parsePositiveNumber(nextText);

    if (nextHeight) {
      setDraftWingspan(toDisplayNumber(deriveWingspan(nextHeight)));
    }
  }

  function handleWingspanChange(text: string) {
    setDraftWingspan(toNumericInput(text));
    setDraftWingspanMode("custom");
    setWingspanError(null);
  }

  function handleRestoreAutoWingspan() {
    const nextHeight = parsePositiveNumber(draftHeight) ?? profile.height;
    setDraftWingspanMode("auto");
    setDraftWingspan(toDisplayNumber(deriveWingspan(nextHeight)));
    setWingspanError(null);
  }

  function handleSaveProfile() {
    const nextHeight = parsePositiveNumber(draftHeight);
    const nextWingspan = parsePositiveNumber(draftWingspan);

    setHeightError(nextHeight ? null : "키는 0보다 큰 숫자로 입력해 주세요.");
    setWingspanError(
      nextWingspan ? null : "리치는 0보다 큰 숫자로 입력해 주세요.",
    );

    if (!nextHeight || !nextWingspan) {
      return;
    }

    updateProfile({
      height: nextHeight,
      wingspan: nextWingspan,
      wingspanMode: draftWingspanMode,
    });
    setStage("tutorial");
  }

  function advanceTutorial() {
    const nextStepId = getNextOnboardingTutorialStepId(stepId);

    if (nextStepId === "complete") {
      setStepId("complete");
      completeOnboarding();
      router.replace("/(tabs)/simulation");
      return;
    }

    reachedStepRef.current = null;
    setStepId(nextStepId);
  }

  function handlePoseChange(pose: SkeletonPose) {
    if (!targetLayout || currentStep.target === null) {
      return;
    }

    if (
      isTutorialStepTargetReached({
        layout: targetLayout,
        pose,
        radius: TARGET_RADIUS,
        step: currentStep,
      })
    ) {
      reachedStepRef.current = stepId;
    }
  }

  function handleTutorialDragEnd(target: {
    kind: string;
    id?: string;
  } | null) {
    if (
      target?.kind !== "endpoint" ||
      target.id !== activeTutorialEndpoint ||
      reachedStepRef.current !== stepId
    ) {
      return;
    }

    if (
      stepId === "leftHand" ||
      stepId === "rightHandMatch" ||
      stepId === "leftFoot" ||
      stepId === "rightFoot"
    ) {
      completedStepRef.current = stepId;
      advanceTutorial();
    }
  }

  function handleTutorialQuadrantStart(endpointName: SkeletonEndpointName) {
    if (endpointName !== activeTutorialEndpoint) {
      return;
    }

    setStartedEndpointSteps((currentSteps) => ({
      ...currentSteps,
      [stepId]: true,
    }));
  }

  function renderProfileStage() {
    return (
      <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
        <View style={styles.profileScreen}>
          <View style={styles.profileHeader}>
            <Text style={styles.eyebrow}>Rupa Onboarding</Text>
            <Text style={styles.profileTitle}>내 몸 기준부터 맞춰요</Text>
            <Text style={styles.profileBody}>
              입력한 키와 리치가 캐릭터 크기와 무브 거리의 기준이 됩니다.
            </Text>
          </View>

          <View style={styles.formPanel}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>키</Text>
              <View
                style={[
                  styles.inputShell,
                  heightError ? styles.inputShellInvalid : null,
                ]}
              >
                <TextInput
                  keyboardType="numeric"
                  onChangeText={handleHeightChange}
                  style={styles.input}
                  value={draftHeight}
                />
                <Text style={styles.unit}>cm</Text>
              </View>
              {heightError ? (
                <Text style={styles.errorText}>{heightError}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.fieldHeaderRow}>
                <Text style={styles.label}>리치</Text>
                <Pressable
                  onPress={handleRestoreAutoWingspan}
                  style={styles.inlineAction}
                >
                  <Ionicons
                    color={brand.colors.primaryText}
                    name="refresh"
                    size={14}
                  />
                  <Text style={styles.inlineActionText}>자동 계산</Text>
                </Pressable>
              </View>
              <View
                style={[
                  styles.inputShell,
                  wingspanError ? styles.inputShellInvalid : null,
                ]}
              >
                <TextInput
                  keyboardType="numeric"
                  onChangeText={handleWingspanChange}
                  style={styles.input}
                  value={draftWingspan}
                />
                <Text style={styles.unit}>cm</Text>
              </View>
              {wingspanError ? (
                <Text style={styles.errorText}>{wingspanError}</Text>
              ) : null}
            </View>
          </View>

          <Pressable onPress={handleSaveProfile} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>조작 연습하기</Text>
            <Ionicons
              color={brand.colors.primaryText}
              name="arrow-forward"
              size={24}
            />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function renderTutorialHolds() {
    if (!targetLayout) {
      return null;
    }

    return (
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Circle
          cx={targetLayout.handHold.x}
          cy={targetLayout.handHold.y}
          fill="#f97316"
          r={HOLD_RADIUS}
        />

        {[
          "leftFoot",
          "rightFoot",
          "body",
          "undo",
          "redo",
          "directMode",
          "dropKnee",
          "complete",
        ].includes(stepId) ? (
          <Circle
            cx={targetLayout.leftFootHold.x}
            cy={targetLayout.leftFootHold.y}
            fill="#22c55e"
            r={HOLD_RADIUS}
          />
        ) : null}

        {[
          "rightFoot",
          "body",
          "undo",
          "redo",
          "directMode",
          "dropKnee",
          "complete",
        ].includes(stepId) ? (
          <Circle
            cx={targetLayout.rightFootHold.x}
            cy={targetLayout.rightFootHold.y}
            fill="#3b82f6"
            r={HOLD_RADIUS}
          />
        ) : null}
      </Svg>
    );
  }

  function renderSpotlightButton({
    disabled,
    icon,
    isActive,
    label,
    onPress,
  }: {
    disabled?: boolean;
    icon: keyof typeof Ionicons.glyphMap;
    isActive: boolean;
    label: string;
    onPress: () => void;
  }) {
    return (
      <Pressable
        accessibilityLabel={label}
        disabled={disabled}
        onPress={onPress}
        style={[
          styles.tutorialIconButton,
          isActive ? styles.tutorialIconButtonSpotlight : null,
          disabled ? styles.tutorialIconButtonDisabled : null,
        ]}
      >
        <Ionicons color={brand.colors.text} name={icon} size={20} />
      </Pressable>
    );
  }

  function renderTutorialStage() {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.tutorialScreen}>
          <View style={styles.tutorialChrome}>
            {shouldStartAtTutorial ? (
              <Pressable
                accessibilityLabel="튜토리얼 나가기"
                onPress={() => router.replace("/(tabs)/simulation")}
                style={styles.exitButton}
              >
                <Ionicons color={brand.colors.text} name="close" size={22} />
              </Pressable>
            ) : null}

            <View style={styles.tutorialTitleWrap}>
              <Text style={styles.eyebrow}>Tutorial</Text>
              <Text style={styles.tutorialChromeTitle}>루파 조작 연습</Text>
            </View>

            <View style={styles.tutorialActions} />
          </View>

          <View onLayout={handleViewportLayout} style={styles.practiceCanvas}>
            {renderTutorialHolds()}

            {viewport.width > 0 && viewport.height > 0 ? (
              <SkeletonPoseOverlay
                ref={overlayRef}
                allowEmptySpacePinchScale
                allowPinchScaleInSimulation
                characterRenderStyle="stickmanCharacterBlack"
                initialCenter={skeletonCenter}
                initialPoseVariant="standing"
                mode="simulating"
                onHistoryStateChange={setHistoryState}
                onPoseChange={handlePoseChange}
                onTutorialDragEnd={handleTutorialDragEnd}
                onTutorialQuadrantStart={handleTutorialQuadrantStart}
                simulationInputMode={simulationInputMode}
                tutorialDimInactiveQuadrants={
                  activeTutorialEndpoint !== null && shouldPreviewEndpoint
                }
                tutorialPreviewQuadrantEndpoint={
                  shouldPreviewEndpoint ? activeTutorialEndpoint : null
                }
                tutorialQuadrantEndpoint={activeTutorialEndpoint}
                viewportHeight={viewport.height}
                viewportWidth={viewport.width}
              />
            ) : null}

            {stepId === "welcome" ? (
              <Pressable
                accessibilityLabel="손 조작 튜토리얼 시작"
                onLongPress={advanceTutorial}
                onPress={advanceTutorial}
                style={styles.welcomeTouchLayer}
              />
            ) : null}

            <View pointerEvents="none" style={styles.instructionOverlay}>
              <View style={styles.instructionPanel}>
                <Text style={styles.instructionStep}>
                  {stepId === "complete" ? "완료" : currentStep.title}
                </Text>
                <Text style={styles.instructionBody}>{instructionBody}</Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return stage === "profile" ? renderProfileStage() : renderTutorialStage();
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: brand.colors.wall,
  },
  profileScreen: {
    flex: 1,
    gap: 20,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 28,
    backgroundColor: brand.colors.wall,
  },
  profileHeader: {
    gap: 8,
  },
  eyebrow: {
    color: brand.colors.inactive,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  profileTitle: {
    color: brand.colors.text,
    fontSize: 32,
    fontWeight: "900",
    lineHeight: 38,
  },
  profileBody: {
    color: brand.colors.mutedText,
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  formPanel: {
    gap: 18,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: brand.colors.border,
    borderRadius: 22,
    backgroundColor: "rgba(255,248,231,0.92)",
  },
  fieldGroup: {
    gap: 9,
  },
  fieldHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  label: {
    color: brand.colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  inputShell: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: brand.colors.border,
    borderRadius: 18,
    backgroundColor: "#fffdf7",
  },
  inputShellInvalid: {
    borderColor: brand.colors.danger,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    color: brand.colors.text,
    fontSize: 24,
    fontWeight: "900",
  },
  unit: {
    paddingRight: 16,
    color: brand.colors.mutedText,
    fontSize: 15,
    fontWeight: "800",
  },
  inlineAction: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: brand.colors.primary,
  },
  inlineActionText: {
    color: brand.colors.primaryText,
    fontSize: 12,
    fontWeight: "900",
  },
  errorText: {
    color: brand.colors.danger,
    fontSize: 12,
    fontWeight: "700",
  },
  primaryButton: {
    minHeight: 64,
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 22,
    backgroundColor: brand.colors.primary,
  },
  primaryButtonText: {
    color: brand.colors.primaryText,
    fontSize: 19,
    fontWeight: "900",
  },
  tutorialScreen: {
    flex: 1,
    backgroundColor: brand.colors.wall,
  },
  tutorialChrome: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(37,29,21,0.12)",
    backgroundColor: brand.colors.wall,
  },
  exitButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(37,29,21,0.14)",
    borderRadius: 22,
    backgroundColor: "rgba(255,244,223,0.52)",
  },
  tutorialTitleWrap: {
    flex: 1,
  },
  tutorialChromeTitle: {
    color: brand.colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  tutorialActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  tutorialIconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(37,29,21,0.14)",
    borderRadius: 22,
    backgroundColor: "rgba(255,244,223,0.42)",
  },
  tutorialIconButtonSpotlight: {
    borderColor: brand.colors.primary,
    borderWidth: 3,
    backgroundColor: "#fff7d6",
    shadowColor: brand.colors.primary,
    shadowOpacity: 0.48,
    shadowRadius: 16,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    elevation: 8,
  },
  tutorialIconButtonDisabled: {
    opacity: 0.34,
  },
  practiceCanvas: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: "#f7efe1",
  },
  welcomeTouchLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    backgroundColor: "rgba(15,15,15,0.34)",
  },
  instructionOverlay: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 28,
    zIndex: 20,
  },
  instructionPanel: {
    paddingHorizontal: 16,
    paddingTop: 13,
    paddingBottom: 14,
    borderRadius: 18,
    backgroundColor: "rgba(12,12,12,0.72)",
  },
  instructionStep: {
    color: brand.colors.accent,
    fontSize: 12,
    fontWeight: "900",
  },
  instructionBody: {
    marginTop: 6,
    color: "#ffffff",
    fontSize: 17,
    fontWeight: "900",
    lineHeight: 23,
  },
});
