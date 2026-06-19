import React, { useEffect, useRef, useState } from "react";
import "./LearnPage.css";
import { useNavigate } from "react-router-dom";

import { predictGestureFromLandmarks } from "./utils/gestureModel";
import { judgeAnswer } from "./utils/answerJudge";
import { createResultSummary, saveResult } from "./utils/resultStorage";

function LearnPage() {
  const targetNumber = 4;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const [accuracy, setAccuracy] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const resultsRef = useRef([]);

  useEffect(() => {
    let camera = null;
    let hands = null;

    // window 객체에서 안전하게 MediaPipe 가져오기
    const mp = window;
    if (!mp.Hands || !mp.Camera) {
      console.error("MediaPipe 라이브러리가 로드되지 않았습니다. index.html을 확인하세요.");
      return;
    }

    const init = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!video || !canvas) return;

      // 1. Hands 초기화
      hands = new mp.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      // 2. 결과 처리 루프
      hands.onResults((results) => {
        // [중요] 손 감지 여부와 상관없이 매 프레임마다 카메라 영상은 캔버스에 먼저 그립니다!
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results.image) {
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        }

        // 손이 안 보이면 여기서 리턴 (카메라 화면은 유지됨)
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
          ctx.restore();
          return;
        }

        const landmarks = results.multiHandLandmarks[0];

        // 손 제스처 예측 및 시각화
        const prediction = predictGestureFromLandmarks(landmarks, "learn");

        // 스켈레톤 그리기
        if (mp.drawLandmarks && mp.drawConnectors) {
          mp.drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });
          mp.drawConnectors(ctx, landmarks, mp.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
        }

        if (prediction.status !== "detected") {
          ctx.restore();
          return;
        }

        setAccuracy(prediction.confidence);

        // 정답 판별
        const judgeResult = judgeAnswer(
          targetNumber,
          prediction.predictedNumber,
          prediction.confidence,
          "learn"
        );

        resultsRef.current.push({
          targetNumber,
          predictedNumber: prediction.predictedNumber,
          isCorrect: judgeResult.status === "correct",
        });

        if (judgeResult.status === "correct") {
          const summary = createResultSummary("learn", resultsRef.current);
          saveResult(summary);
          setModalOpen(true);
        }

        ctx.restore();
      });

      // 3. Camera 인스턴스 생성 및 시작
      camera = new mp.Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: 640,
        height: 480,
      });

      camera.start();
    };

    // 약간의 딜레이를 주어 DOM과 window 객체가 완전히 준비된 후 실행되도록 유도
    const timer = setTimeout(() => {
      init();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, []);

  return (
    <div className="learn-wrapper">
      <div className="webcam-area">
        <div className="top-left-ui">
          <h2>숫자 {targetNumber}</h2>
          <button onClick={() => setShowExample((v) => !v)}>예시 보기</button>
        </div>

        {showExample && (
          <div className="example-box">
            <img src="/example4.png" alt="example" />
          </div>
        )}

        {/* 미디어 스트림을 받을 숨겨진 video 태그 (오타 수정 완료) */}
        <video ref={videoRef} playsInline muted style={{ display: "none" }} />

        {/* 실제로 화면을 그려서 보여줄 canvas 태그 */}
        <canvas ref={canvasRef} width={640} height={480} className="camera-box" />
      </div>

      {modalOpen && (
        <div className="modal-bg">
          <div className="modal">
            <h2>{accuracy.toFixed(1)}% 일치</h2>
            <p>학습 완료!</p>
            <button onClick={() => navigate("/")}>홈으로</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LearnPage;