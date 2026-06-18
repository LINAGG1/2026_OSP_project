const STORAGE_KEY = "signSessionResults";
const SUPPORTED_MODES = new Set(["learn", "quiz"]);

function canUseLocalStorage() {
  return typeof localStorage !== "undefined";
}

function getStorageResults() {
  if (!canUseLocalStorage()) {
    return [];
  }

  const savedResults = localStorage.getItem(STORAGE_KEY);
  if (savedResults === null) {
    return [];
  }

  const parsedResults = JSON.parse(savedResults);
  return Array.isArray(parsedResults) ? parsedResults : [];
}

function normalizeResult(result) {
  return {
    targetNumber: result?.targetNumber ?? null,
    predictedNumber: result?.predictedNumber ?? null,
    isCorrect: result?.isCorrect ?? null,
    confidence: Number.isFinite(result?.confidence) ? result.confidence : 0,
    status: result?.status ?? "pending",
  };
}

function isValidResultSummary(resultSummary) {
  return (
    resultSummary !== null &&
    typeof resultSummary === "object" &&
    !Array.isArray(resultSummary) &&
    SUPPORTED_MODES.has(resultSummary.mode) &&
    Number.isInteger(resultSummary.totalCount) &&
    Number.isInteger(resultSummary.correctCount) &&
    Number.isInteger(resultSummary.wrongCount) &&
    Number.isFinite(resultSummary.score) &&
    Number.isFinite(resultSummary.accuracy) &&
    typeof resultSummary.completedAt === "string" &&
    Array.isArray(resultSummary.results)
  );
}

/**
 * 학습/퀴즈 결과 데이터 생성
 */
export function createResultSummary(mode, results) {
  if (!SUPPORTED_MODES.has(mode)) {
    return null;
  }

  const normalizedResults = Array.isArray(results)
    ? results.map(normalizeResult)
    : [];

  const totalCount = normalizedResults.length;
  const correctCount = normalizedResults.filter(
    (result) => result.isCorrect === true,
  ).length;
  const wrongCount = normalizedResults.filter(
    (result) => result.isCorrect === false,
  ).length;
  const accuracy =
    totalCount === 0 ? 0 : Math.round((correctCount / totalCount) * 100);

  return {
    mode,
    totalCount,
    correctCount,
    wrongCount,
    score: accuracy,
    accuracy,
    completedAt: new Date().toISOString(),
    results: normalizedResults,
  };
}

/**
 * 결과 데이터를 localStorage에 저장
 */
export function saveResult(resultSummary) {
  if (!isValidResultSummary(resultSummary)) {
    return {
      isSaved: false,
      message: "저장할 결과 데이터가 올바르지 않습니다.",
    };
  }

  if (!canUseLocalStorage()) {
    return {
      isSaved: false,
      message: "결과 저장에 실패했습니다.",
    };
  }

  try {
    const savedResults = getStorageResults();
    const nextResults = [...savedResults, resultSummary];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextResults));

    return {
      isSaved: true,
      message: "결과가 저장되었습니다.",
    };
  } catch {
    return {
      isSaved: false,
      message: "결과 저장에 실패했습니다.",
    };
  }
}

/**
 * 저장된 학습/퀴즈 결과 조회
 */
export function getSavedResults() {
  try {
    return getStorageResults();
  } catch {
    return [];
  }
}
