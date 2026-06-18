const MIN_SIGN_NUMBER = 0;
const MAX_SIGN_NUMBER = 10;
const LOW_CONFIDENCE_THRESHOLD = 70;
const SUPPORTED_MODES = new Set(["learn", "quiz"]);
const JUDGE_STATUS = {
  CORRECT: "correct",
  INCORRECT: "incorrect",
  PENDING: "pending",
  ERROR: "error",
};

function isValidSignNumber(value) {
  return (
    Number.isInteger(value) &&
    value >= MIN_SIGN_NUMBER &&
    value <= MAX_SIGN_NUMBER
  );
}

function createJudgeResult({
  isCorrect,
  status,
  targetNumber,
  predictedNumber,
  confidence,
  message,
}) {
  return {
    isCorrect,
    status,
    targetNumber,
    predictedNumber,
    confidence,
    message,
  };
}

/**
 * 목표 숫자와 예측 숫자를 비교하여 정답 여부 판별
 */
export function judgeAnswer(targetNumber, predictedNumber, confidence, mode) {
  if (!SUPPORTED_MODES.has(mode)) {
    return createJudgeResult({
      isCorrect: null,
      status: JUDGE_STATUS.ERROR,
      targetNumber,
      predictedNumber,
      confidence,
      message: "지원하지 않는 사용 모드입니다.",
    });
  }

  if (!isValidSignNumber(targetNumber)) {
    return createJudgeResult({
      isCorrect: null,
      status: JUDGE_STATUS.ERROR,
      targetNumber,
      predictedNumber,
      confidence,
      message: "정답 숫자를 다시 확인해 주세요.",
    });
  }

  if (predictedNumber === null || predictedNumber === undefined) {
    return createJudgeResult({
      isCorrect: null,
      status: JUDGE_STATUS.PENDING,
      targetNumber,
      predictedNumber: null,
      confidence: 0,
      message: "모델 예측 결과가 없습니다.",
    });
  }

  if (!isValidSignNumber(predictedNumber)) {
    return createJudgeResult({
      isCorrect: null,
      status: JUDGE_STATUS.ERROR,
      targetNumber,
      predictedNumber,
      confidence,
      message: "인식에 실패했습니다. 다시 시도해 주세요.",
    });
  }

  if (!Number.isFinite(confidence)) {
    return createJudgeResult({
      isCorrect: null,
      status: JUDGE_STATUS.ERROR,
      targetNumber,
      predictedNumber,
      confidence: 0,
      message: "인식에 실패했습니다. 다시 시도해 주세요.",
    });
  }

  if (confidence < LOW_CONFIDENCE_THRESHOLD) {
    return createJudgeResult({
      isCorrect: null,
      status: JUDGE_STATUS.PENDING,
      targetNumber,
      predictedNumber,
      confidence,
      message: "손 모양을 더 정확히 보여주세요.",
    });
  }

  const isCorrect = targetNumber === predictedNumber;

  return createJudgeResult({
    isCorrect,
    status: isCorrect ? JUDGE_STATUS.CORRECT : JUDGE_STATUS.INCORRECT,
    targetNumber,
    predictedNumber,
    confidence,
    message: isCorrect ? "정답입니다." : "다시 시도해보세요.",
  });
}
