import type { Point2D } from "../types/geometry";
import type {
  SkeletonControlJointName,
  SkeletonEndpointName,
  SkeletonPose,
} from "../types/skeletonPose";

export type OnboardingTutorialStepId =
  | "welcome"
  | "leftHand"
  | "rightHandMatch"
  | "leftFoot"
  | "rightFoot"
  | "body"
  | "undo"
  | "redo"
  | "directMode"
  | "dropKnee"
  | "complete";

export type OnboardingTutorialTarget =
  | { kind: "endpoint"; id: SkeletonEndpointName }
  | { kind: "body" }
  | { kind: "joint"; id: SkeletonControlJointName };

export type OnboardingTutorialStep = {
  id: OnboardingTutorialStepId;
  title: string;
  body: string;
  target: OnboardingTutorialTarget | null;
  inputMode: "quadrants" | "handles";
};

export const ONBOARDING_TUTORIAL_STEPS: OnboardingTutorialStep[] = [
  {
    id: "welcome",
    title: "조작 연습",
    body: "캐릭터를 움직이는 방법에 대해 알아보아요.",
    target: null,
    inputMode: "quadrants",
  },
  {
    id: "leftHand",
    title: "왼손으로 첫 홀드 잡기",
    body: "드래깅을 통해 손, 발을 움직일 수 있어요.",
    target: { kind: "endpoint", id: "leftHand" },
    inputMode: "quadrants",
  },
  {
    id: "rightHandMatch",
    title: "오른손 합손하기",
    body: "잘했어요! 이번엔 오른손을 움직여 합손해보세요!",
    target: { kind: "endpoint", id: "rightHand" },
    inputMode: "quadrants",
  },
  {
    id: "leftFoot",
    title: "왼발 올리기",
    body: "잘했어요! 이번엔 왼발을 올려볼까요?",
    target: { kind: "endpoint", id: "leftFoot" },
    inputMode: "quadrants",
  },
  {
    id: "rightFoot",
    title: "오른발 올리기",
    body: "오른쪽 발 홀드에 오른발을 올려 안정적인 자세를 만들어보세요.",
    target: { kind: "endpoint", id: "rightFoot" },
    inputMode: "quadrants",
  },
  {
    id: "body",
    title: "중심 옮기기",
    body: "몸통을 움직여 중심을 바꿀 수 있어요.",
    target: { kind: "body" },
    inputMode: "quadrants",
  },
  {
    id: "undo",
    title: "되돌리기",
    body: "방금 움직임을 되돌릴 수 있어요.",
    target: null,
    inputMode: "quadrants",
  },
  {
    id: "redo",
    title: "다시 실행",
    body: "되돌린 움직임을 다시 적용할 수 있어요.",
    target: null,
    inputMode: "quadrants",
  },
  {
    id: "directMode",
    title: "직접 조정",
    body: "목, 팔꿈치, 무릎도 직접 조정할 수 있어요.",
    target: null,
    inputMode: "handles",
  },
  {
    id: "dropKnee",
    title: "드롭니 만들기",
    body: "무릎을 안쪽으로 넣어 드롭니 자세를 만들 수 있어요.",
    target: { kind: "joint", id: "rightKnee" },
    inputMode: "handles",
  },
  {
    id: "complete",
    title: "연습 완료",
    body: "이제 벽 사진으로 시작해보세요.",
    target: null,
    inputMode: "handles",
  },
];

export type TutorialTargetLayout = {
  handHold: Point2D;
  leftFootHold: Point2D;
  rightFootHold: Point2D;
  bodyCenter: Point2D;
  dropKnee: Point2D;
};

export function createOnboardingTutorialTargetLayout(
  width: number,
  height: number,
): TutorialTargetLayout {
  return {
    handHold: { x: width * 0.5, y: height * 0.34 },
    leftFootHold: { x: width * 0.43, y: height * 0.53 },
    rightFootHold: { x: width * (1 - 0.43), y: height * 0.53 },
    bodyCenter: { x: width * 0.56, y: height * 0.42 },
    dropKnee: { x: width * 0.43, y: height * 0.55 },
  };
}

export function getTargetPointForStep(
  stepId: OnboardingTutorialStepId,
  layout: TutorialTargetLayout,
): Point2D | null {
  switch (stepId) {
    case "leftHand":
    case "rightHandMatch":
      return layout.handHold;
    case "leftFoot":
      return layout.leftFootHold;
    case "rightFoot":
      return layout.rightFootHold;
    case "body":
      return layout.bodyCenter;
    case "dropKnee":
      return layout.dropKnee;
    case "undo":
    case "redo":
    case "directMode":
    case "welcome":
    case "complete":
      return null;
  }
}

export function getSkeletonBodyCenter(pose: SkeletonPose): Point2D {
  return {
    x: (pose.joints.torso.x + pose.joints.pelvis.x) / 2,
    y: (pose.joints.torso.y + pose.joints.pelvis.y) / 2,
  };
}

function getDistance(first: Point2D, second: Point2D) {
  const x = first.x - second.x;
  const y = first.y - second.y;

  return Math.sqrt(x * x + y * y);
}

export function isTutorialStepTargetReached({
  layout,
  pose,
  radius,
  step,
}: {
  layout: TutorialTargetLayout;
  pose: SkeletonPose;
  radius: number;
  step: OnboardingTutorialStep;
}) {
  const targetPoint = getTargetPointForStep(step.id, layout);

  if (!step.target || !targetPoint) {
    return false;
  }

  const currentPoint =
    step.target.kind === "body"
      ? getSkeletonBodyCenter(pose)
      : pose.joints[step.target.id];

  return getDistance(currentPoint, targetPoint) <= radius;
}

export function getNextOnboardingTutorialStepId(
  currentStepId: OnboardingTutorialStepId,
): OnboardingTutorialStepId {
  const currentIndex = ONBOARDING_TUTORIAL_STEPS.findIndex(
    (step) => step.id === currentStepId,
  );
  const nextStep = ONBOARDING_TUTORIAL_STEPS[currentIndex + 1];

  return nextStep ? nextStep.id : "complete";
}

export function getOnboardingTutorialStep(
  stepId: OnboardingTutorialStepId,
): OnboardingTutorialStep {
  return (
    ONBOARDING_TUTORIAL_STEPS.find((step) => step.id === stepId) ??
    ONBOARDING_TUTORIAL_STEPS[0]
  );
}
