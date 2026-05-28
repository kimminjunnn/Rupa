export type BodyProfileDraftValidation = {
  height: number | null;
  heightError: string | null;
  wingspan: number | null;
  wingspanError: string | null;
};

export function toDisplayNumber(value: number) {
  return String(value);
}

export function toNumericInput(text: string) {
  return text.replace(/\D+/g, "");
}

export function parsePositiveNumber(value: string) {
  if (value.trim().length === 0) {
    return null;
  }

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function validateBodyProfileDraft({
  height,
  wingspan,
}: {
  height: string;
  wingspan: string;
}): BodyProfileDraftValidation {
  const nextHeight = parsePositiveNumber(height);
  const nextWingspan = parsePositiveNumber(wingspan);

  return {
    height: nextHeight,
    heightError:
      nextHeight === null ? "키는 0보다 큰 숫자로 입력해 주세요." : null,
    wingspan: nextWingspan,
    wingspanError:
      nextWingspan === null ? "리치는 0보다 큰 숫자로 입력해 주세요." : null,
  };
}
