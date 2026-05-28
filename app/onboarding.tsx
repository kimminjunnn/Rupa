import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Image,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
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
  isTutorialStepTargetReached,
  type OnboardingTutorialStepId,
} from "../src/lib/onboardingTutorialFlow";
import {
  parsePositiveNumber,
  toDisplayNumber,
  toNumericInput,
  validateBodyProfileDraft,
} from "../src/lib/bodyProfileForm";
import { useBodyProfileStore } from "../src/store/useBodyProfileStore";
import { useOnboardingStore } from "../src/store/useOnboardingStore";
import { brand } from "../src/theme/brand";
import {
  deriveWingspan,
  type BodyProfile,
  type WingspanMode,
} from "../src/types/bodyProfile";
import type {
  SkeletonEndpointName,
  SkeletonPose,
} from "../src/types/skeletonPose";

const TARGET_RADIUS = 24;
const HOLD_RADIUS = 12;
const PROFILE_PREVIEW_WIDTH = 260;
const PROFILE_PREVIEW_HEIGHT = 220;
type DirectJointTutorialGroup = "neck" | "elbows" | "knees";

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
  const [stepId, setStepId] = useState<OnboardingTutorialStepId>("welcome");
  const [startedEndpointSteps, setStartedEndpointSteps] = useState<
    Partial<Record<OnboardingTutorialStepId, boolean>>
  >({});
  const [isFreePractice, setIsFreePractice] = useState(false);
  const [freePracticeInputMode, setFreePracticeInputMode] = useState<
    "quadrants" | "handles"
  >("handles");
  const [isExitConfirmVisible, setIsExitConfirmVisible] = useState(false);
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
  const draftPreviewProfile = useMemo<BodyProfile>(() => {
    const height = parsePositiveNumber(draftHeight) ?? profile.height;
    const wingspan =
      parsePositiveNumber(draftWingspan) ?? deriveWingspan(height);

    return {
      height,
      wingspan,
      wingspanMode: draftWingspanMode,
    };
  }, [draftHeight, draftWingspan, draftWingspanMode, profile.height]);
  const targetLayout = useMemo(
    () =>
      viewport.width > 0 && viewport.height > 0
        ? createOnboardingTutorialTargetLayout(viewport.width, viewport.height)
        : null,
    [viewport.height, viewport.width],
  );
  const skeletonCenter =
    viewport.width > 0 && viewport.height > 0
      ? { x: viewport.width * 0.5, y: viewport.height * 0.46 }
      : undefined;
  const simulationInputMode = isFreePractice
    ? freePracticeInputMode
    : stepId === "directMode"
      ? "quadrants"
      : currentStep.inputMode;
  const reachedStepRef = useRef<OnboardingTutorialStepId | null>(null);
  const activeTutorialEndpoint =
    currentStep.target?.kind === "endpoint" ? currentStep.target.id : null;
  const isBodyTutorialStep = currentStep.target?.kind === "body";
  const directJointTutorialGroup = getDirectJointTutorialGroup(stepId);
  const isDirectJointTutorialStep = directJointTutorialGroup !== null;
  const isQuadrantTutorialStep =
    activeTutorialEndpoint !== null || isBodyTutorialStep;
  const isHeaderOnlyTutorialStep =
    !isFreePractice &&
    (stepId === "undo" || stepId === "redo" || stepId === "directMode");
  const shouldDisableDirectHandles =
    !isFreePractice && (isQuadrantTutorialStep || isHeaderOnlyTutorialStep);
  const shouldDisableQuadrants =
    !isFreePractice && (isHeaderOnlyTutorialStep || isDirectJointTutorialStep);
  const shouldPreviewEndpoint =
    activeTutorialEndpoint !== null && !startedEndpointSteps[stepId];
  const shouldPreviewBody = isBodyTutorialStep && !startedEndpointSteps[stepId];
  const shouldDimDirectJoints =
    !isFreePractice &&
    isDirectJointTutorialStep &&
    !startedEndpointSteps[stepId];
  const shouldShowInstructionPanel = !isFreePractice && stepId !== "complete";
  const shouldShowCompletionPanel = stepId === "complete" && !isFreePractice;
  const instructionBody =
    !isFreePractice && stepId === "leftHand" && startedEndpointSteps.leftHand
      ? "상단 홀드를 왼손으로 제압해봐요!"
      : currentStep.body;

  function getDirectJointTutorialGroup(
    currentStepId: OnboardingTutorialStepId,
  ): DirectJointTutorialGroup | null {
    switch (currentStepId) {
      case "neckJoint":
        return "neck";
      case "elbowJoint":
        return "elbows";
      case "kneeJoint":
        return "knees";
      default:
        return null;
    }
  }

  function isDirectJointTutorialTarget(
    group: DirectJointTutorialGroup,
    target: { kind: string; id?: string } | null,
  ) {
    if (group === "neck") {
      return target?.kind === "head";
    }

    if (target?.kind !== "joint") {
      return false;
    }

    return group === "elbows"
      ? target.id === "leftElbow" || target.id === "rightElbow"
      : target.id === "leftKnee" || target.id === "rightKnee";
  }

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

    if (nextHeight === null) {
      return;
    }

    setDraftWingspan(toDisplayNumber(deriveWingspan(nextHeight)));
  }

  function handleWingspanChange(text: string) {
    const nextText = toNumericInput(text);
    setDraftWingspan(nextText);
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
    const {
      height,
      heightError: nextHeightError,
      wingspan,
      wingspanError: nextWingspanError,
    } = validateBodyProfileDraft({
      height: draftHeight,
      wingspan: draftWingspan,
    });

    setHeightError(nextHeightError);
    setWingspanError(nextWingspanError);

    if (
      nextHeightError ||
      nextWingspanError ||
      height === null ||
      wingspan === null
    ) {
      return;
    }

    updateProfile({
      height,
      wingspan,
      wingspanMode: draftWingspanMode,
    });
    setStage("tutorial");
  }

  function advanceTutorial() {
    const nextStepId = getNextOnboardingTutorialStepId(stepId);

    if (nextStepId === "complete") {
      setStepId("complete");
      return;
    }

    reachedStepRef.current = null;
    setStepId(nextStepId);
  }

  function handleStartFreePractice() {
    completeOnboarding();
    setFreePracticeInputMode("quadrants");
    setIsFreePractice(true);
  }

  function handleExitTutorial() {
    completeOnboarding();
    router.replace("/(tabs)/simulation");
  }

  function handleRequestExitTutorial() {
    setIsExitConfirmVisible(true);
  }

  function handleCancelExitTutorial() {
    setIsExitConfirmVisible(false);
  }

  function handleConfirmExitTutorial() {
    setIsExitConfirmVisible(false);
    handleExitTutorial();
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

  function handleTutorialDragEnd(
    target: {
      kind: string;
      id?: string;
    } | null,
  ) {
    if (
      directJointTutorialGroup &&
      isDirectJointTutorialTarget(directJointTutorialGroup, target)
    ) {
      completedStepRef.current = stepId;
      advanceTutorial();
      return;
    }

    if (
      target?.kind !== currentStep.target?.kind ||
      (currentStep.target?.kind === "endpoint" &&
        target?.id !== activeTutorialEndpoint) ||
      reachedStepRef.current !== stepId
    ) {
      return;
    }

    if (
      stepId === "leftHand" ||
      stepId === "rightHandMatch" ||
      stepId === "leftFoot" ||
      stepId === "rightFoot" ||
      stepId === "body"
    ) {
      completedStepRef.current = stepId;
      advanceTutorial();
    }
  }

  function handleTutorialHandleStart(target: { kind: string; id?: string }) {
    if (
      !directJointTutorialGroup ||
      !isDirectJointTutorialTarget(directJointTutorialGroup, target)
    ) {
      return;
    }

    setStartedEndpointSteps((currentSteps) => ({
      ...currentSteps,
      [stepId]: true,
    }));
  }

  function handleTutorialQuadrantStart(target: "body" | SkeletonEndpointName) {
    if (
      target !== activeTutorialEndpoint &&
      target !== currentStep.target?.kind
    ) {
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
        <View style={styles.profileShell}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.profileKeyboardAvoider}
          >
            <TouchableWithoutFeedback
              accessible={false}
              onPress={Keyboard.dismiss}
            >
              <ScrollView
                contentContainerStyle={styles.profileScreen}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={styles.profileScrollView}
              >
                <View style={styles.profileHeader}>
                  <Image
                    accessibilityLabel="Rupa"
                    resizeMode="contain"
                    source={require("../assets/rupa-logo.png")}
                    style={styles.profileLogo}
                  />
                  <Text style={styles.profileTitle}>
                    키와 리치를 설정해주세요
                  </Text>
                  <Text style={styles.profileBody}>
                    입력한 키와 리치는 시뮬레이션 캐릭터에 반영됩니다.
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
                        returnKeyType="done"
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
                      <View
                        style={[
                          styles.modeBadge,
                          draftWingspanMode === "auto"
                            ? styles.modeBadgeAuto
                            : styles.modeBadgeCustom,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modeBadgeText,
                            draftWingspanMode === "auto"
                              ? styles.modeBadgeTextAuto
                              : styles.modeBadgeTextCustom,
                          ]}
                        >
                          {draftWingspanMode === "auto" ? "자동" : "커스텀"}
                        </Text>
                      </View>
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
                        returnKeyType="done"
                        style={styles.input}
                        value={draftWingspan}
                      />
                      <Text style={styles.unit}>cm</Text>
                    </View>
                    <View style={styles.fieldFooterRow}>
                      <Text style={styles.helper}> </Text>
                      <Pressable
                        onPress={handleRestoreAutoWingspan}
                        style={styles.inlineAction}
                      >
                        <Ionicons
                          color={brand.colors.primaryText}
                          name="refresh"
                          size={14}
                        />
                        <Text style={styles.inlineActionText}>
                          자동 계산 복원
                        </Text>
                      </Pressable>
                    </View>
                    {wingspanError ? (
                      <Text style={styles.errorText}>{wingspanError}</Text>
                    ) : null}
                  </View>
                </View>

                <View style={styles.profilePreviewPanel}>
                  <View style={styles.profilePreviewViewport}>
                    <SkeletonPoseOverlay
                      bodyProfile={draftPreviewProfile}
                      characterRenderStyle="stickmanCharacterBlack"
                      initialCenter={{
                        x: PROFILE_PREVIEW_WIDTH * 0.5,
                        y: PROFILE_PREVIEW_HEIGHT * 0.48,
                      }}
                      initialPoseVariant="standing"
                      interactive={false}
                      mode="simulating"
                      viewportHeight={PROFILE_PREVIEW_HEIGHT}
                      viewportWidth={PROFILE_PREVIEW_WIDTH}
                    />
                  </View>
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>

          <View style={styles.profileActionBar}>
            <Pressable onPress={handleSaveProfile} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>확인</Text>
              <Ionicons
                color={brand.colors.primaryText}
                name="arrow-forward"
                size={24}
              />
            </Pressable>
          </View>
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
          "neckJoint",
          "elbowJoint",
          "kneeJoint",
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
          "neckJoint",
          "elbowJoint",
          "kneeJoint",
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

  function shouldShowChromeControls() {
    return (
      isFreePractice ||
      stepId === "undo" ||
      stepId === "redo" ||
      stepId === "directMode" ||
      isDirectJointTutorialStep
    );
  }

  function renderTutorialChromeControls() {
    if (!shouldShowChromeControls()) {
      return null;
    }

    return (
      <>
        {renderSpotlightButton({
          disabled: !isFreePractice && stepId !== "directMode",
          icon:
            isFreePractice && freePracticeInputMode === "handles"
              ? "hand-left-outline"
              : isDirectJointTutorialStep
                ? "hand-left-outline"
                : "grid",
          isActive: !isFreePractice && stepId === "directMode",
          label:
            isFreePractice && freePracticeInputMode === "handles"
              ? "4분할 조작으로 전환"
              : "직접 조정으로 전환",
          onPress: () => {
            if (isFreePractice) {
              setFreePracticeInputMode((currentMode) =>
                currentMode === "handles" ? "quadrants" : "handles",
              );
              return;
            }

            if (stepId === "directMode") {
              advanceTutorial();
            }
          },
        })}
        {renderSpotlightButton({
          disabled: isFreePractice
            ? !historyState.canUndo
            : stepId !== "undo" || !historyState.canUndo,
          icon: "arrow-undo",
          isActive: !isFreePractice && stepId === "undo",
          label: "방금 움직임 되돌리기",
          onPress: () => {
            if (isFreePractice) {
              overlayRef.current?.undo();
              return;
            }

            if (stepId === "undo") {
              overlayRef.current?.undo();
              advanceTutorial();
            }
          },
        })}
        {renderSpotlightButton({
          disabled: isFreePractice
            ? !historyState.canRedo
            : stepId !== "redo" || !historyState.canRedo,
          icon: "arrow-redo",
          isActive: !isFreePractice && stepId === "redo",
          label: "되돌린 움직임 다시 실행",
          onPress: () => {
            if (isFreePractice) {
              overlayRef.current?.redo();
              return;
            }

            if (stepId === "redo") {
              overlayRef.current?.redo();
              advanceTutorial();
            }
          },
        })}
      </>
    );
  }

  function renderTutorialStage() {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.tutorialScreen}>
          <View style={styles.tutorialChrome}>
            <Image
              accessibilityLabel="Rupa"
              resizeMode="contain"
              source={require("../assets/rupa-logo.png")}
              style={styles.tutorialLogo}
            />

            <View style={styles.tutorialActions}>
              {renderTutorialChromeControls()}
              <Pressable
                accessibilityLabel="튜토리얼 나가기"
                onPress={handleRequestExitTutorial}
                style={styles.tutorialIconButton}
              >
                <Ionicons color={brand.colors.text} name="close" size={22} />
              </Pressable>
            </View>
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
                onTutorialHandleStart={handleTutorialHandleStart}
                onPoseChange={handlePoseChange}
                onTutorialDragEnd={handleTutorialDragEnd}
                onTutorialQuadrantStart={handleTutorialQuadrantStart}
                simulationInputMode={simulationInputMode}
                tutorialBodyOnly={isBodyTutorialStep}
                tutorialDisableDirectHandles={shouldDisableDirectHandles}
                tutorialDisableQuadrants={shouldDisableQuadrants}
                tutorialDimDirectJoints={shouldDimDirectJoints}
                tutorialDimInactiveQuadrants={
                  (activeTutorialEndpoint !== null && shouldPreviewEndpoint) ||
                  shouldPreviewBody
                }
                tutorialDirectJointGroup={directJointTutorialGroup}
                tutorialPreviewBody={shouldPreviewBody}
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

            {stepId === "undo" ||
            stepId === "redo" ||
            stepId === "directMode" ? (
              <View pointerEvents="none" style={styles.actionDimLayer} />
            ) : null}

            {shouldShowCompletionPanel ? (
              <View style={styles.completionLayer}>
                <View style={styles.completionPanel}>
                  <Text style={styles.completionTitle}>
                    {currentStep.title}
                  </Text>
                  <Text style={styles.completionBody}>{currentStep.body}</Text>
                  <View style={styles.completionActions}>
                    <Pressable
                      accessibilityLabel="자유롭게 움직여보기"
                      onPress={handleStartFreePractice}
                      style={styles.completionPrimaryButton}
                    >
                      <Text style={styles.completionPrimaryButtonText}>
                        자유롭게 움직여보기
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel="튜토리얼 나가기"
                      onPress={handleRequestExitTutorial}
                      style={styles.completionSecondaryButton}
                    >
                      <Text style={styles.completionSecondaryButtonText}>
                        나가기
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ) : null}

            {shouldShowInstructionPanel ? (
              <View pointerEvents="none" style={styles.instructionOverlay}>
                <View style={styles.instructionPanel}>
                  <Text style={styles.instructionStep}>
                    {currentStep.title}
                  </Text>
                  <Text style={styles.instructionBody}>{instructionBody}</Text>
                </View>
              </View>
            ) : null}

            <Modal
              animationType="fade"
              onRequestClose={handleCancelExitTutorial}
              transparent
              visible={isExitConfirmVisible}
            >
              <View style={styles.exitModalLayer}>
                <View style={styles.exitModalPanel}>
                  <Text style={styles.exitModalTitle}>
                    튜토리얼을 나갈까요?
                  </Text>
                  <Text style={styles.exitModalBody}>
                    조작 연습은 나중에 다시 볼 수 있어요.
                  </Text>
                  <View style={styles.exitModalActions}>
                    <Pressable
                      accessibilityLabel="튜토리얼 계속하기"
                      onPress={handleCancelExitTutorial}
                      style={styles.exitModalSecondaryButton}
                    >
                      <Text style={styles.exitModalSecondaryButtonText}>
                        계속하기
                      </Text>
                    </Pressable>
                    <Pressable
                      accessibilityLabel="튜토리얼 나가기 확인"
                      onPress={handleConfirmExitTutorial}
                      style={styles.exitModalPrimaryButton}
                    >
                      <Text style={styles.exitModalPrimaryButtonText}>
                        나가기
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Modal>
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
  profileShell: {
    flex: 1,
    backgroundColor: brand.colors.wall,
  },
  profileKeyboardAvoider: {
    flex: 1,
  },
  profileScrollView: {
    flex: 1,
    backgroundColor: brand.colors.wall,
  },
  profileScreen: {
    flexGrow: 1,
    gap: 20,
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 18,
    backgroundColor: brand.colors.wall,
  },
  profileHeader: {
    gap: 8,
  },
  profileLogo: {
    width: 116,
    height: 54,
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
  profilePreviewPanel: {
    height: PROFILE_PREVIEW_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(37,29,21,0.12)",
    borderRadius: 22,
    backgroundColor: "#f7efe1",
  },
  profilePreviewViewport: {
    width: PROFILE_PREVIEW_WIDTH,
    height: PROFILE_PREVIEW_HEIGHT,
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
  modeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  modeBadgeAuto: {
    backgroundColor: brand.colors.primary,
  },
  modeBadgeCustom: {
    backgroundColor: brand.colors.surfaceWarm,
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: "800",
  },
  modeBadgeTextAuto: {
    color: brand.colors.primaryText,
  },
  modeBadgeTextCustom: {
    color: brand.colors.mutedText,
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
  fieldFooterRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  helper: {
    flex: 1,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 22,
    backgroundColor: brand.colors.primary,
  },
  profileActionBar: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 18,
    backgroundColor: brand.colors.wall,
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
    zIndex: 22,
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
  tutorialLogo: {
    width: 94,
    height: 44,
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
  actionDimLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    backgroundColor: "rgba(15,15,15,0.34)",
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
  completionLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: "rgba(15,15,15,0.42)",
  },
  completionPanel: {
    width: "100%",
    maxWidth: 420,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 18,
    backgroundColor: "rgba(12,12,12,0.82)",
  },
  completionTitle: {
    color: brand.colors.accent,
    fontSize: 15,
    fontWeight: "900",
  },
  completionBody: {
    marginTop: 8,
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 27,
  },
  completionActions: {
    marginTop: 18,
    gap: 10,
  },
  completionPrimaryButton: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: brand.colors.primary,
  },
  completionPrimaryButtonText: {
    color: brand.colors.primaryText,
    fontSize: 16,
    fontWeight: "900",
  },
  completionSecondaryButton: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  completionSecondaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "900",
  },
  exitModalLayer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    backgroundColor: "rgba(15,15,15,0.5)",
  },
  exitModalPanel: {
    width: "100%",
    maxWidth: 360,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 16,
    borderRadius: 18,
    backgroundColor: "#fff8e7",
  },
  exitModalTitle: {
    color: brand.colors.text,
    fontSize: 20,
    fontWeight: "900",
  },
  exitModalBody: {
    marginTop: 8,
    color: brand.colors.mutedText,
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 22,
  },
  exitModalActions: {
    marginTop: 18,
    flexDirection: "row",
    gap: 10,
  },
  exitModalSecondaryButton: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(37,29,21,0.14)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.58)",
  },
  exitModalSecondaryButtonText: {
    color: brand.colors.text,
    fontSize: 15,
    fontWeight: "900",
  },
  exitModalPrimaryButton: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: brand.colors.primary,
  },
  exitModalPrimaryButtonText: {
    color: brand.colors.primaryText,
    fontSize: 15,
    fontWeight: "900",
  },
});
