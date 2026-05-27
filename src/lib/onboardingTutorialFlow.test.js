require("sucrase/register");

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  ONBOARDING_TUTORIAL_STEPS,
  createOnboardingTutorialTargetLayout,
  getNextOnboardingTutorialStepId,
  getOnboardingTutorialStep,
  isTutorialStepTargetReached,
} = require("./onboardingTutorialFlow.ts");

function createPose(overrides = {}) {
  return {
    joints: {
      head: { x: 200, y: 110 },
      neck: { x: 200, y: 140 },
      torso: { x: 200, y: 190 },
      pelvis: { x: 200, y: 250 },
      leftShoulder: { x: 170, y: 150 },
      leftElbow: { x: 145, y: 190 },
      leftHand: { x: 120, y: 230 },
      rightShoulder: { x: 230, y: 150 },
      rightElbow: { x: 255, y: 190 },
      rightHand: { x: 280, y: 230 },
      leftHip: { x: 178, y: 255 },
      leftKnee: { x: 160, y: 320 },
      leftFoot: { x: 145, y: 380 },
      rightHip: { x: 222, y: 255 },
      rightKnee: { x: 240, y: 320 },
      rightFoot: { x: 255, y: 380 },
      ...overrides,
    },
  };
}

test("defines the onboarding tutorial sequence from matching hands through direct adjustment", () => {
  assert.deepEqual(
    ONBOARDING_TUTORIAL_STEPS.map((step) => step.id),
    [
      "welcome",
      "leftHand",
      "rightHandMatch",
      "leftFoot",
      "rightFoot",
      "body",
      "undo",
      "redo",
      "directMode",
      "dropKnee",
      "complete",
    ],
  );
  assert.equal(getOnboardingTutorialStep("directMode").body, "목, 팔꿈치, 무릎도 직접 조정할 수 있어요.");
  assert.equal(getOnboardingTutorialStep("dropKnee").body, "무릎을 안쪽으로 넣어 드롭니 자세를 만들 수 있어요.");
});

test("advances to the next tutorial step without delay when the target is reached", () => {
  assert.equal(getNextOnboardingTutorialStepId("welcome"), "leftHand");
  assert.equal(getNextOnboardingTutorialStepId("leftHand"), "rightHandMatch");
  assert.equal(getNextOnboardingTutorialStepId("rightFoot"), "body");
  assert.equal(getNextOnboardingTutorialStepId("dropKnee"), "complete");
  assert.equal(getNextOnboardingTutorialStepId("complete"), "complete");
});

test("uses one shared head-height hold for left hand and right hand matching", () => {
  const layout = createOnboardingTutorialTargetLayout(400, 700);
  const leftHandStep = getOnboardingTutorialStep("leftHand");
  const rightHandStep = getOnboardingTutorialStep("rightHandMatch");
  const poseAtSharedHold = createPose({
    leftHand: layout.handHold,
    rightHand: layout.handHold,
  });

  assert.equal(
    isTutorialStepTargetReached({
      layout,
      pose: poseAtSharedHold,
      radius: 18,
      step: leftHandStep,
    }),
    true,
  );
  assert.equal(
    isTutorialStepTargetReached({
      layout,
      pose: poseAtSharedHold,
      radius: 18,
      step: rightHandStep,
    }),
    true,
  );
});

test("checks foot, body, and drop-knee targets against their active control only", () => {
  const layout = createOnboardingTutorialTargetLayout(400, 700);
  const pose = createPose({
    leftFoot: layout.leftFootHold,
    rightFoot: layout.rightFootHold,
    rightKnee: layout.dropKnee,
    torso: { x: layout.bodyCenter.x, y: layout.bodyCenter.y - 30 },
    pelvis: { x: layout.bodyCenter.x, y: layout.bodyCenter.y + 30 },
  });

  assert.equal(
    isTutorialStepTargetReached({
      layout,
      pose,
      radius: 18,
      step: getOnboardingTutorialStep("leftFoot"),
    }),
    true,
  );
  assert.equal(
    isTutorialStepTargetReached({
      layout,
      pose,
      radius: 18,
      step: getOnboardingTutorialStep("rightFoot"),
    }),
    true,
  );
  assert.equal(
    isTutorialStepTargetReached({
      layout,
      pose,
      radius: 18,
      step: getOnboardingTutorialStep("body"),
    }),
    true,
  );
  assert.equal(
    isTutorialStepTargetReached({
      layout,
      pose,
      radius: 18,
      step: getOnboardingTutorialStep("dropKnee"),
    }),
    true,
  );
});
