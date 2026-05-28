import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const homeSource = new URL("../app/index.tsx", import.meta.url);
const onboardingSource = new URL("../app/onboarding.tsx", import.meta.url);
const bottomTabBarSource = new URL(
  "../src/components/BottomTabBar.tsx",
  import.meta.url,
);
const simulationCanvasSource = new URL(
  "../src/components/SimulationCanvasStage.tsx",
  import.meta.url,
);
const simulationMenuDrawerSource = new URL(
  "../src/components/SimulationMenuDrawer.tsx",
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
const skeletonPoseOverlaySource = new URL(
  "../src/components/SkeletonPoseOverlay.tsx",
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
const routeDetectionApiSource = new URL(
  "../src/lib/routeDetectionApi.ts",
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

test("route detection API logs failure context to the console", async () => {
  const source = await readFile(routeDetectionApiSource, "utf8");

  assert.match(source, /console\.error\("route_detection_api_failed"/);
  assert.match(source, /status:\s*response\.status/);
  assert.match(source, /url:\s*requestUrl/);
  assert.match(source, /payload/);
  assert.match(source, /console\.error\("route_detection_api_request_failed"/);
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
  assert.match(source, /styles\.headerLogo/);
  assert.doesNotMatch(source, /<Text style=\{styles\.heroTitle\}>새 시뮬레이션<\/Text>/);
  assert.match(source, /minHeight: 300/);
  assert.doesNotMatch(source, /minHeight: 360/);
});

test("simulation photo adjustment matches the canvas photo work area", async () => {
  const source = await readFile(simulationAdjustSource, "utf8");
  const topChromeBlock = source.match(/topChrome:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
  const viewportWrapBlock = source.match(/viewportWrap:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
  const photoLayerBlock = source.match(/photoLayer:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";
  const bottomOverlayBlock =
    source.match(/adjustBottomOverlay:\s*\{[\s\S]*?\n  \}/)?.[0] ?? "";

  assert.match(source, /clampAdjustmentTranslations/);
  assert.match(source, /resolvePhotoLayerFrame/);
  assert.match(source, /확대한 뒤 위치를 맞춰보세요\./);
  assert.match(topChromeBlock, /alignItems: "center"/);
  assert.match(topChromeBlock, /paddingTop: 12/);
  assert.match(topChromeBlock, /paddingBottom: 18/);
  assert.match(topChromeBlock, /backgroundColor: "#0f0f0f"/);
  assert.match(viewportWrapBlock, /flex: 1/);
  assert.doesNotMatch(viewportWrapBlock, /StyleSheet\.absoluteFillObject/);
  assert.match(photoLayerBlock, /position: "absolute"/);
  assert.doesNotMatch(photoLayerBlock, /StyleSheet\.absoluteFillObject/);
  assert.match(bottomOverlayBlock, /position: "absolute"/);
  assert.match(bottomOverlayBlock, /left: 0/);
  assert.match(bottomOverlayBlock, /right: 0/);
  assert.match(bottomOverlayBlock, /backgroundColor: "rgba\(15, 15, 15, 0\.38\)"/);
});

test("simulation photo adjustment gates vertical dragging behind zoom", async () => {
  const source = await readFile(simulationAdjustSource, "utf8");

  assert.match(source, /clampAdjustmentTranslations/);
  assert.match(source, /event\.translationY/);
  assert.match(source, /startY/);
  assert.match(source, /scale\.value > 1/);
});

test("simulation photo adjustment starts slightly zoomed without vertical bias", async () => {
  const source = await readFile(simulationAdjustSource, "utf8");
  const resetEffectBlock =
    source.match(/useEffect\(\(\) => \{[\s\S]*?\n  \}, \[/)?.[0] ?? "";

  assert.match(source, /const MIN_ADJUST_SCALE = 1\.08/);
  assert.match(source, /scale\.value = MIN_ADJUST_SCALE/);
  assert.match(source, /startScale\.value = MIN_ADJUST_SCALE/);
  assert.match(source, /startScale\.value \* event\.scale,\s*MIN_ADJUST_SCALE,/);
  assert.match(resetEffectBlock, /translateY\.value = 0/);
  assert.doesNotMatch(resetEffectBlock, /translateY\.value = -/);
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
  assert.doesNotMatch(source, /styles\.introPanel/);
  assert.doesNotMatch(source, /styles\.introIcon/);
  assert.match(source, /styles\.settingsHeader/);
  assert.match(source, /styles\.settingsLogo/);
  assert.doesNotMatch(source, /fontSize: 30/);
  assert.match(source, /backgroundColor: "rgba\(255, 248, 231, 0\.9\)"/);
  assert.match(source, /borderColor: brand\.colors\.border/);
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
  assert.doesNotMatch(source, /accessibilityLabel="시뮬레이션 메뉴 열기"/);
  assert.match(source, /accessibilityLabel="현재 벽 사진 닫기"/);
  assert.match(source, /width: 44/);
  assert.match(source, /height: 44/);
});

test("simulation menu drawer exposes a temporary profile onboarding shortcut", async () => {
  const source = await readFile(simulationMenuDrawerSource, "utf8");

  assert.match(source, /임시: 키\/리치 입력/);
  assert.match(source, /params: \{ mode: "profile" \}/);
});

test("onboarding profile input remains usable while the numeric keyboard is open", async () => {
  const source = await readFile(onboardingSource, "utf8");
  const profileStageBlock =
    source.match(/function renderProfileStage\(\) \{[\s\S]*?\n  \}/)?.[0] ??
    "";

  assert.match(source, /KeyboardAvoidingView/);
  assert.match(source, /Keyboard\.dismiss/);
  assert.match(profileStageBlock, /keyboardShouldPersistTaps="handled"/);
  assert.match(profileStageBlock, /contentContainerStyle=\{styles\.profileScreen\}/);
});

test("quadrant core hint appears only while dragging the core", async () => {
  const source = await readFile(skeletonPoseOverlaySource, "utf8");
  const quadrantBlock =
    source.match(
      /mode === "simulating" && simulationInputMode === "quadrants" \? \([\s\S]*?\n      \) : null/,
    )?.[0] ?? "";

  assert.match(quadrantBlock, /isQuadrantCoreActive \? \(/);
  assert.match(source, /quadrantCoreIcon/);
  assert.match(source, /assets\/quadrant-controls\/core\.png/);
  assert.doesNotMatch(quadrantBlock, /<Text[\s\S]*몸통[\s\S]*<\/Text>/);
});

test("quadrant limb hint shows only the active touched region", async () => {
  const source = await readFile(skeletonPoseOverlaySource, "utf8");
  const quadrantBlock =
    source.match(
      /mode === "simulating" && simulationInputMode === "quadrants" \? \([\s\S]*?\n      \) : null/,
    )?.[0] ?? "";

  assert.match(quadrantBlock, /activeQuadrantEndpoint \? \(/);
  assert.match(quadrantBlock, /Image/);
  assert.match(quadrantBlock, /getQuadrantEndpointIcon\(activeQuadrantEndpoint\)/);
  assert.match(source, /assets\/quadrant-controls\/left-hand\.png/);
  assert.match(source, /assets\/quadrant-controls\/right-hand\.png/);
  assert.match(source, /assets\/quadrant-controls\/left-foot\.png/);
  assert.match(source, /assets\/quadrant-controls\/right-foot\.png/);
  assert.doesNotMatch(quadrantBlock, /ENDPOINTS\.map/);
});

test("quadrant icon hints stay translucent over wall photos", async () => {
  const source = await readFile(skeletonPoseOverlaySource, "utf8");

  assert.match(source, /backgroundColor: "rgba\(255,179,122,0\.07\)"/);
  assert.match(source, /backgroundColor: "rgba\(18,16,14,0\.38\)"/);
  assert.match(source, /borderColor: "rgba\(255,179,122,0\.46\)"/);
  assert.match(source, /opacity: 0\.68/);
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
  assert.doesNotMatch(source, /styles\.introPanel/);
  assert.match(source, /require\("\.\.\/\.\.\/assets\/rupa-logo\.png"\)/);
  assert.match(source, /styles\.settingsHeader/);
  assert.match(source, /styles\.settingsLogo/);
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
