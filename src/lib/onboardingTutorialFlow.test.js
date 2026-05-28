require("sucrase/register");

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  ONBOARDING_TUTORIAL_STEPS,
  createOnboardingTutorialTargetLayout,
  getSkeletonBodyCenter,
  getNextOnboardingTutorialStepId,
  getOnboardingTutorialStep,
  isTutorialBodyDirectionReached,
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
      "bodyLeft",
      "bodyRight",
      "undo",
      "redo",
      "directMode",
      "neckJoint",
      "elbowJoint",
      "kneeJoint",
      "complete",
    ],
  );
  assert.equal(getOnboardingTutorialStep("directMode").body, "목, 팔꿈치, 무릎도 직접 조정할 수 있어요.");
  assert.equal(getOnboardingTutorialStep("neckJoint").title, "목 조정하기");
  assert.equal(getOnboardingTutorialStep("elbowJoint").title, "팔꿈치 조정하기");
  assert.equal(getOnboardingTutorialStep("kneeJoint").title, "무릎 조정하기");
});

test("advances to the next tutorial step without delay when the target is reached", () => {
  assert.equal(getNextOnboardingTutorialStepId("welcome"), "leftHand");
  assert.equal(getNextOnboardingTutorialStepId("leftHand"), "rightHandMatch");
  assert.equal(getNextOnboardingTutorialStepId("rightFoot"), "bodyLeft");
  assert.equal(getNextOnboardingTutorialStepId("bodyLeft"), "bodyRight");
  assert.equal(getNextOnboardingTutorialStepId("bodyRight"), "undo");
  assert.equal(getNextOnboardingTutorialStepId("directMode"), "neckJoint");
  assert.equal(getNextOnboardingTutorialStepId("neckJoint"), "elbowJoint");
  assert.equal(getNextOnboardingTutorialStepId("elbowJoint"), "kneeJoint");
  assert.equal(getNextOnboardingTutorialStepId("kneeJoint"), "complete");
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

test("checks foot targets against their active control only", () => {
  const layout = createOnboardingTutorialTargetLayout(400, 700);
  const pose = createPose({
    leftFoot: layout.leftFootHold,
    rightFoot: layout.rightFootHold,
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
      step: getOnboardingTutorialStep("kneeJoint"),
    }),
    false,
  );
});

test("checks body direction targets against movement from the drag start center", () => {
  const startPose = createPose({
    torso: { x: 200, y: 190 },
    pelvis: { x: 200, y: 250 },
  });
  const startCenter = getSkeletonBodyCenter(startPose);
  const leftPose = createPose({
    torso: { x: 167, y: 190 },
    pelvis: { x: 167, y: 250 },
  });
  const rightPose = createPose({
    torso: { x: 233, y: 190 },
    pelvis: { x: 233, y: 250 },
  });
  const smallLeftPose = createPose({
    torso: { x: 181, y: 190 },
    pelvis: { x: 181, y: 250 },
  });

  assert.equal(
    isTutorialBodyDirectionReached({
      currentPose: leftPose,
      direction: "left",
      minDistance: 32,
      startCenter,
    }),
    true,
  );
  assert.equal(
    isTutorialBodyDirectionReached({
      currentPose: rightPose,
      direction: "right",
      minDistance: 32,
      startCenter,
    }),
    true,
  );
  assert.equal(
    isTutorialBodyDirectionReached({
      currentPose: smallLeftPose,
      direction: "left",
      minDistance: 32,
      startCenter,
    }),
    false,
  );
  assert.equal(
    isTutorialBodyDirectionReached({
      currentPose: leftPose,
      direction: "right",
      minDistance: 32,
      startCenter,
    }),
    false,
  );
});
