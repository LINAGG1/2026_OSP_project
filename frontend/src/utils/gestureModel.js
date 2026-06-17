import modelData from "../model_data.json";

const HAND_LANDMARK_COUNT = 21;
const NORMALIZED_COORDINATE_COUNT = HAND_LANDMARK_COUNT * 2;
const K_NEIGHBORS = 10;
const LOW_CONFIDENCE_THRESHOLD = 70;
const SUPPORTED_MODES = new Set(["learn", "quiz"]);
const PREDICTION_STATUS = {
  DETECTED: "detected",
  PENDING: "pending",
  ERROR: "error",
};

/**
 * 손목을 기준으로 landmark 좌표 정규화
 * 사용할 수 없는 데이터는 null 반환
 */
export function normalizeLandmarks(landmarks) {
  if (!Array.isArray(landmarks) || landmarks.length !== HAND_LANDMARK_COUNT) {
    return null;
  }

  const hasInvalidCoordinate = landmarks.some(
    (landmark) =>
      landmark == null ||
      !Number.isFinite(landmark.x) ||
      !Number.isFinite(landmark.y),
  );

  if (hasInvalidCoordinate) {
    return null;
  }

  const wrist = landmarks[0];
  const coordinates = landmarks.flatMap((landmark) => [
    landmark.x - wrist.x,
    landmark.y - wrist.y,
  ]);

  const maxValue = Math.max(...coordinates.map(Math.abs));
  if (maxValue === 0) {
    return null;
  }

  return coordinates.map((coordinate) => coordinate / maxValue);
}

/**
 * 정규화된 좌표와 학습 데이터를 비교하여 숫자 예측
 */
export function predictGesture(normalizedLandmarks) {
  const isValidInput =
    Array.isArray(normalizedLandmarks) &&
    normalizedLandmarks.length === NORMALIZED_COORDINATE_COUNT &&
    normalizedLandmarks.every(Number.isFinite);

  if (!isValidInput) {
    return {
      predictedNumber: null,
      status: PREDICTION_STATUS.ERROR,
      confidence: 0,
      message: "인식에 실패했습니다. 다시 시도해 주세요.",
    };
  }

  const { X: trainingCoordinates, y: trainingLabels } = modelData;
  if (
    !Array.isArray(trainingCoordinates) ||
    !Array.isArray(trainingLabels) ||
    trainingCoordinates.length !== trainingLabels.length ||
    trainingCoordinates.length < K_NEIGHBORS
  ) {
    return {
      predictedNumber: null,
      status: PREDICTION_STATUS.ERROR,
      confidence: 0,
      message: "인식에 실패했습니다. 다시 시도해 주세요.",
    };
  }

  const nearestNeighbors = trainingCoordinates
    .map((coordinates, index) => {
      if (
        !Array.isArray(coordinates) ||
        coordinates.length !== NORMALIZED_COORDINATE_COUNT
      ) {
        return { distance: Number.POSITIVE_INFINITY, label: trainingLabels[index] };
      }

      let squaredDistance = 0;
      for (let i = 0; i < NORMALIZED_COORDINATE_COUNT; i += 1) {
        const difference = normalizedLandmarks[i] - coordinates[i];
        squaredDistance += difference * difference;
      }

      return { distance: squaredDistance, label: trainingLabels[index] };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, K_NEIGHBORS);

  const voteCounts = new Map();
  nearestNeighbors.forEach(({ label }) => {
    voteCounts.set(label, (voteCounts.get(label) ?? 0) + 1);
  });

  const [predictedNumber, voteCount] = [...voteCounts.entries()].sort(
    ([labelA, countA], [labelB, countB]) => countB - countA || labelA - labelB,
  )[0];
  const confidence = (voteCount / K_NEIGHBORS) * 100;

  return {
    predictedNumber,
    status: PREDICTION_STATUS.DETECTED,
    confidence,
    message: `숫자 ${predictedNumber}로 인식되었습니다.`,
  };
}

/**
 * landmark 정규화부터 예측 결과 반환까지 처리
 */
export function predictGestureFromLandmarks(landmarks, mode) {
  if (!SUPPORTED_MODES.has(mode)) {
    return {
      predictedNumber: null,
      status: PREDICTION_STATUS.ERROR,
      confidence: 0,
      message: "지원하지 않는 사용 모드입니다.",
    };
  }

  if (!Array.isArray(landmarks) || landmarks.length === 0) {
    return {
      predictedNumber: null,
      status: PREDICTION_STATUS.PENDING,
      confidence: 0,
      message: "손을 화면 안에 위치시켜 주세요.",
    };
  }

  if (landmarks.length !== HAND_LANDMARK_COUNT) {
    return {
      predictedNumber: null,
      status: PREDICTION_STATUS.PENDING,
      confidence: 0,
      message: "손 landmark를 다시 인식해 주세요.",
    };
  }

  const normalizedLandmarks = normalizeLandmarks(landmarks);
  if (normalizedLandmarks === null) {
    return {
      predictedNumber: null,
      status: PREDICTION_STATUS.ERROR,
      confidence: 0,
      message: "인식에 실패했습니다. 다시 시도해 주세요.",
    };
  }

  const prediction = predictGesture(normalizedLandmarks);
  if (
    prediction.predictedNumber !== null &&
    prediction.confidence < LOW_CONFIDENCE_THRESHOLD
  ) {
    return {
      ...prediction,
      status: PREDICTION_STATUS.PENDING,
      message: "손 모양을 더 정확히 보여주세요.",
    };
  }

  return prediction;
}
