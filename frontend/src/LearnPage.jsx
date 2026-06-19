import React, { useEffect, useRef, useState } from "react";
import "./LearnPage.css";
import { useNavigate } from "react-router-dom";

import { predictGestureFromLandmarks } from "../utils/gestureModel";
import { judgeAnswer } from "../utils/answerJudge";
import { saveResult } from "../utils/resultStorage";

function LearnPage() {
  const targetNumber = 4;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  const [accuracy, setAccuracy] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [showExample, setShowExample] = useState(false);

  useEffect(() => {
    let camera = null;
    let hands = null;

    const init = async () => {

      if (!window.Hands || !window.Camera) {
        console.log("MediaPipe 로딩 대기 중...");
        setTimeout(init, 200);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");


      hands = new window.Hands({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      //  결과 콜백
      hands.onResults((results) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (results.image) {
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
        }

        if (!results.multiHandLandmarks) return;

        const landmarks = results.multiHandLandmarks[0];

        //  모델 예측
        const prediction = predictGestureFromLandmarks(landmarks, "learn");

        if (prediction.predictedNumber !== null) {
          setAccuracy(prediction.confidence);

          //  정답 판별
          const result = judgeAnswer({
            targetNumber,
            predictedNumber: prediction.predictedNumber,
            confidence: prediction.confidence,
            mode: "learn",
          });

          if (result.isCorrect) {
            saveResult({
              mode: "learn",
              totalCount: 1,
              correctCount: 1,
              wrongCount: 0,
              score: 100,
              accuracy: prediction.confidence,
              completedAt: new Date().toISOString(),
              results: [
                {
                  targetNumber,
                  predictedNumber: prediction.predictedNumber,
                  isCorrect: true,
                },
              ],
            });

            setModalOpen(true);
          }
        }
      });

      //  카메라 연결
      camera = new window.Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: 640,
        height: 480,
      });

      camera.start();
    };

    init();

    return () => {
      if (camera) camera.stop();
    };
  }, []);

  return (
    <div className="learn-wrapper">
      <div className="webcam-area">

        {/* top UI */}
        <div className="top-left-ui">
          <h2>숫자 {targetNumber}</h2>

          <button onClick={() => setShowExample((v) => !v)}>
            예시 보기
          </button>
        </div>

        {/* example */}
        {showExample && (
          <div className="example-box">
            <img src="/example4.png" alt="example" />
          </div>
        )}

        {/* video hidden */}
        <video ref={videoRef} style={{ display: "none" }} />

        {/* canvas output */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="camera-box"
        />
      </div>

      {/* modal */}
      {modalOpen && (
        <div className="modal-bg">
          <div className="modal">
            <h2>{accuracy.toFixed(1)}% 일치</h2>
            <p>학습 완료!</p>

            <button onClick={() => navigate("/")}>
              홈으로
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default LearnPage;