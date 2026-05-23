export type PhotoDimensions = {
  width: number;
  height: number;
};

function hasValidDimensions(dimensions: PhotoDimensions | null): dimensions is PhotoDimensions {
  return (
    dimensions !== null &&
    Number.isFinite(dimensions.width) &&
    Number.isFinite(dimensions.height) &&
    dimensions.width > 0 &&
    dimensions.height > 0
  );
}

export function resolveReliablePhotoDimensions(
  pickerDimensions: PhotoDimensions,
  decodedDimensions: PhotoDimensions | null,
): PhotoDimensions {
  if (hasValidDimensions(decodedDimensions)) {
    return decodedDimensions;
  }

  return {
    width: Math.max(1, pickerDimensions.width || 1),
    height: Math.max(1, pickerDimensions.height || 1),
  };
}
