export type SimulationMenuDrawerInsets = {
  bottom: number;
  top: number;
};

export type SimulationMenuDrawerPadding = {
  paddingBottom: number;
  paddingTop: number;
};

export function getSimulationMenuDrawerPadding(
  insets: SimulationMenuDrawerInsets,
): SimulationMenuDrawerPadding;
