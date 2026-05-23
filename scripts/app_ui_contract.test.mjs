import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homeSource = new URL("../app/index.tsx", import.meta.url);
const bottomTabBarSource = new URL(
  "../src/components/BottomTabBar.tsx",
  import.meta.url,
);
const simulationCanvasSource = new URL(
  "../src/components/SimulationCanvasStage.tsx",
  import.meta.url,
);
const simulationAdjustSource = new URL(
  "../src/components/SimulationAdjustStage.tsx",
  import.meta.url,
);
const simulationPhotoViewportSource = new URL(
  "../src/components/SimulationPhotoViewport.tsx",
  import.meta.url,
);
const settingsSource = new URL("../app/(tabs)/settings.tsx", import.meta.url);
const simulationInputSource = new URL(
  "../src/components/SimulationInputStage.tsx",
  import.meta.url,
);
const confirmModalSource = new URL(
  "../src/components/ConfirmModal.tsx",
  import.meta.url,
);
const routeHighlightOverlaySource = new URL(
  "../src/components/RouteHighlightOverlay.tsx",
  import.meta.url,
);
const homeGlassCardSource = new URL(
  "../src/components/HomeGlassCard.tsx",
  import.meta.url,
);
const homeHeroHoldsSource = new URL(
  "../src/components/HomeHeroHolds.tsx",
  import.meta.url,
);

test("home screen keeps internal skeleton lab out of the user entry flow", async () => {
  const source = await readFile(homeSource, "utf8");

  assert.doesNotMatch(source, /skeleton-lab/);
  assert.doesNotMatch(source, /스켈레톤 테스트/);
});

test("home hero image extends behind top and bottom safe areas", async () => {
  const source = await readFile(homeSource, "utf8");
  const heroSource = await readFile(homeHeroHoldsSource, "utf8");
  const safeAreaBlock = source.match(/safeArea:\s*\{[^}]*\}/)?.[0] ?? "";

  assert.match(source, /<View style=\{styles\.screen\}>[\s\S]*<HomeHeroHolds \/>[\s\S]*<SafeAreaView/);
  assert.doesNotMatch(safeAreaBlock, /backgroundColor/);
  assert.match(heroSource, /gym-wall-bg-bright\.png/);
  assert.doesNotMatch(heroSource, /warmCenterGlow/);
  assert.doesNotMatch(heroSource, /borderRadius:\s*999/);
});

test("home glass card uses the exported Rupa logo image", async () => {
  const source = await readFile(homeGlassCardSource, "utf8");

  assert.match(source, /Image/);
  assert.match(source, /assets\/rupa-logo\.png/);
  assert.doesNotMatch(source, /<Text style=\{styles\.brand\}/);
  assert.doesNotMatch(source, /logoPlate/);
  assert.match(source, /logoImage/);
  assert.match(source, /width: 190/);
  assert.match(source, /height: 79/);
  assert.doesNotMatch(source, /볼더링 시뮬레이터/);
  assert.doesNotMatch(source, /styles\.eyebrow/);
  assert.doesNotMatch(source, /styles\.title/);
  assert.doesNotMatch(source, /styles\.description/);
  assert.doesNotMatch(source, /BlurView/);
  assert.doesNotMatch(source, /styles\.shell/);
  assert.doesNotMatch(source, /styles\.blurLayer/);
  assert.doesNotMatch(source, /styles\.softFill/);
  assert.doesNotMatch(source, /styles\.topShine/);
  assert.doesNotMatch(source, /styles\.innerGlow/);
  assert.doesNotMatch(source, /styles\.borderOverlay/);
});

test("tab screens remove the decorative app header", async () => {
  const settings = await readFile(settingsSource, "utf8");
  const simulationInput = await readFile(simulationInputSource, "utf8");
  const simulationCanvas = await readFile(simulationCanvasSource, "utf8");

  assert.doesNotMatch(settings, /AppHeader/);
  assert.doesNotMatch(simulationInput, /AppHeader/);
  assert.doesNotMatch(simulationCanvas, /AppHeader/);
  assert.match(simulationInput, /backgroundColor: brand\.colors\.wall/);
  assert.match(settings, /backgroundColor: brand\.colors\.wall/);
  assert.match(simulationCanvas, /backgroundColor: brand\.colors\.wall/);
});

test("simulation start screen balances primary action with body context", async () => {
  const source = await readFile(simulationInputSource, "utf8");

  assert.match(source, /useBodyProfileStore/);
  assert.match(source, /새 시뮬레이션/);
  assert.match(source, /현재 신체 정보/);
  assert.match(source, /router\.push\("\/\(tabs\)\/settings"\)/);
  assert.match(source, /hasBodyProfile/);
  assert.match(source, /신체 정보 입력 필요/);
  assert.match(source, /먼저 입력해 주세요/);
  assert.match(source, /styles\.profileStripRequired/);
  assert.match(source, /accessibilityRole="button"/);
  assert.match(source, /profile\.height/);
  assert.match(source, /profile\.wingspan/);
  assert.match(source, /styles\.profileStrip/);
  assert.doesNotMatch(source, /직접 입력/);
  assert.match(source, /minHeight: 300/);
  assert.doesNotMatch(source, /minHeight: 360/);
});

test("simulation photo adjustment keeps the photo between fixed chrome areas", async () => {
  const source = await readFile(simulationAdjustSource, "utf8");
  const viewportWrapBlock = source.match(/viewportWrap:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
  const photoLayerBlock = source.match(/photoLayer:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
  const bottomOverlayBlock =
    source.match(/adjustBottomOverlay:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(source, /resolveAdjustmentTranslations/);
  assert.match(viewportWrapBlock, /flex: 1/);
  assert.doesNotMatch(viewportWrapBlock, /StyleSheet\.absoluteFillObject/);
  assert.match(photoLayerBlock, /StyleSheet\.absoluteFillObject/);
  assert.doesNotMatch(bottomOverlayBlock, /position: "absolute"/);
  assert.match(bottomOverlayBlock, /backgroundColor: "#0f0f0f"/);
});

test("simulation photo adjustment gates vertical dragging behind zoom", async () => {
  const source = await readFile(simulationAdjustSource, "utf8");

  assert.match(source, /resolveAdjustmentTranslations/);
  assert.match(source, /event\.translationY/);
  assert.match(source, /startY/);
  assert.match(source, /scale\.value > 1/);
});

test("simulation canvas uses the same fixed photo work area as adjustment", async () => {
  const source = await readFile(simulationCanvasSource, "utf8");
  const photoViewportSource = await readFile(simulationPhotoViewportSource, "utf8");
  const canvasAreaBlock = source.match(/canvasArea:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
  const photoViewportBlock =
    photoViewportSource.match(/viewport:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
  const canvasChromeBlock =
    source.match(/canvasChrome:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
  const safeAreaBlock = source.match(/safeArea:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
  const canvasChromeActionsBlock =
    source.match(/canvasChromeActions:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
  const canvasHeaderLogoBlock =
    source.match(/canvasHeaderLogo:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
  const instructionPanelOverlayBlock =
    source.match(/instructionPanelOverlay:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(source, /<SafeAreaView edges=\{\["top"\]\}/);
  assert.doesNotMatch(source, /<SafeAreaView edges=\{\["top", "bottom"\]\}/);
  assert.match(source, /const rupaLogo = require\("\.\.\/\.\.\/assets\/rupa-logo\.png"\)/);
  assert.match(source, /<Image[\s\S]*source=\{rupaLogo\}[\s\S]*style=\{styles\.canvasHeaderLogo\}/);
  assert.doesNotMatch(source, /Rupa Simulation/);
  assert.doesNotMatch(source, /<View style=\{styles\.infoCard\}>[\s\S]*<Text style=\{styles\.infoTitle\}>\{infoTitle\}<\/Text>[\s\S]*styles\.canvasChromeActions/);
  assert.match(source, /function renderInstructionPanel/);
  assert.match(source, /renderInstructionPanel\(\)/);
  assert.match(source, /styles\.instructionPanelOverlay/);
  assert.match(source, /styles\.instructionPanel/);
  assert.match(source, /const canUseSkeletonHistory = flowStep === "simulating"/);
  assert.match(canvasAreaBlock, /flex: 1/);
  assert.doesNotMatch(canvasAreaBlock, /StyleSheet\.absoluteFillObject/);
  assert.match(canvasAreaBlock, /backgroundColor: brand\.colors\.wall/);
  assert.match(photoViewportBlock, /backgroundColor: brand\.colors\.wall/);
  assert.match(safeAreaBlock, /backgroundColor: brand\.colors\.wall/);
  assert.match(canvasChromeBlock, /backgroundColor: brand\.colors\.wall/);
  assert.match(canvasHeaderLogoBlock, /alignSelf: "flex-start"/);
  assert.doesNotMatch(canvasHeaderLogoBlock, /flex: 1/);
  assert.match(canvasChromeActionsBlock, /flexDirection: "row"/);
  assert.doesNotMatch(source, /BottomTabBar/);
  assert.doesNotMatch(source, /styles\.bottomTabOverlay/);
  assert.match(source, /styles\.simulationCue/);
  assert.match(source, /Animated\.sequence/);
  assert.match(source, /case "simulating":[\s\S]*캐릭터를 움직여 무브를 시뮬레이션해보세요\./);
  assert.doesNotMatch(source, /camera-outline/);
  assert.doesNotMatch(source, /images-outline/);
  assert.doesNotMatch(source, /statusChip/);
  assert.doesNotMatch(source, /name="trash-outline"/);
  assert.match(source, /name="close"/);
  assert.match(instructionPanelOverlayBlock, /bottom: 34/);
});

test("settings screen keeps the profile form visually organized", async () => {
  const source = await readFile(settingsSource, "utf8");

  assert.match(source, /hasBodyProfile/);
  assert.match(source, /hasBodyProfile \? toDisplayNumber\(profile\.height\) : "0"/);
  assert.match(source, /hasBodyProfile \? toDisplayNumber\(profile\.wingspan\) : "0"/);
  assert.match(source, /function toNumericInput/);
  assert.match(source, /text\.replace\(\/\\D\+\/g, ""\)/);
  assert.match(source, /const nextText = toNumericInput\(text\)/);
  assert.doesNotMatch(source, /placeholder=/);
  assert.doesNotMatch(source, /placeholderTextColor/);
  assert.doesNotMatch(source, /키 기준으로 자동 계산돼요/);
  assert.doesNotMatch(source, /키를 입력하면 자동 계산돼요/);
  assert.match(source, /styles\.introPanel/);
  assert.match(source, /styles\.introIcon/);
  assert.match(source, /backgroundColor: "rgba\(255, 248, 231, 0\.9\)"/);
  assert.match(source, /borderColor: "rgba\(37, 29, 21, 0\.1\)"/);
});

test("bottom tab bar stays compact and avoids the blue accent palette", async () => {
  const source = await readFile(bottomTabBarSource, "utf8");

  assert.doesNotMatch(source, /useSafeAreaInsets/);
  assert.doesNotMatch(source, /insets\.bottom/);
  assert.doesNotMatch(source, /accentSoft/);
  assert.match(source, /tabActive/);
  assert.doesNotMatch(source, /activeMarker/);
  assert.match(source, /paddingBottom: 12/);
});

test("simulation canvas icon actions are accessible and large enough to tap", async () => {
  const source = await readFile(simulationCanvasSource, "utf8");

  assert.doesNotMatch(source, /accessibilityLabel="새 벽 사진 촬영"/);
  assert.doesNotMatch(source, /accessibilityLabel="갤러리에서 벽 사진 선택"/);
  assert.match(source, /accessibilityLabel="현재 벽 사진 닫기"/);
  assert.match(source, /width: 44/);
  assert.match(source, /height: 44/);
});

test("simulation canvas selects top hold after route hold adjustment", async () => {
  const source = await readFile(simulationCanvasSource, "utf8");

  assert.match(source, /setFlowStep\("routeEditing"\)/);
  assert.match(source, /setFlowStep\("selectingTopHold"\)/);
  assert.ok(
    source.indexOf('setFlowStep("routeEditing")') <
      source.indexOf('setFlowStep("selectingTopHold")'),
  );
});

test("route overlay distinguishes start and top holds with borders only", async () => {
  const source = await readFile(routeHighlightOverlaySource, "utf8");

  assert.match(source, /startStrokeColor/);
  assert.match(source, /topStrokeColor/);
  assert.match(source, /const startStrokeColor = brand\.colors\.primary/);
  assert.match(source, /stroke=\{selectedStrokeColor \?\? strokeColor\}/);
  assert.doesNotMatch(source, /<Circle/);
  assert.doesNotMatch(source, /strokeWidth=\{4\.4\}/);
});

test("settings screen presents body fields as the primary work surface", async () => {
  const source = await readFile(settingsSource, "utf8");

  assert.doesNotMatch(source, /styles\.heroCard/);
  assert.doesNotMatch(source, /BODY PROFILE/);
  assert.match(source, /styles\.introCopy/);
});

test("settings save modal uses a quieter confirm button tone", async () => {
  const settings = await readFile(settingsSource, "utf8");
  const modal = await readFile(confirmModalSource, "utf8");

  assert.match(settings, /confirmTone="neutral"/);
  assert.match(modal, /confirmTone = "danger"/);
  assert.match(modal, /modalNeutralButton/);
});

test("simulation and settings tab surfaces avoid blue accent blocks", async () => {
  const settings = await readFile(settingsSource, "utf8");
  const simulationInput = await readFile(simulationInputSource, "utf8");

  assert.doesNotMatch(settings, /brand\.colors\.accent/);
  assert.doesNotMatch(simulationInput, /brand\.colors\.accent/);
  assert.doesNotMatch(simulationInput, /rgba\(220, 239, 240/);
});
