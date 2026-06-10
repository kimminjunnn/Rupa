const DRAWER_EDGE_PADDING = 18;
const FALLBACK_TOP_INSET = 58;
const FALLBACK_BOTTOM_INSET = 34;

function resolveInset(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function getSimulationMenuDrawerPadding(insets) {
  return {
    paddingTop: DRAWER_EDGE_PADDING + resolveInset(insets.top, FALLBACK_TOP_INSET),
    paddingBottom:
      DRAWER_EDGE_PADDING + resolveInset(insets.bottom, FALLBACK_BOTTOM_INSET),
  };
}
