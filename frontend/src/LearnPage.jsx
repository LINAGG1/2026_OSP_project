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

    const mp = window;
    if (!mp.Hands || !mp.Camera) {
      console.error("MediaPipe 라이브러리가 로드되지 않았습니다. index.html을 확인하세요.");
      return;
    }

    const resizeCanvas = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const init = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (!video || !canvas) return;

      hands = new mp.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.7,
      });

      hands.onResults((results) => {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (results.image) {
          const imgWidth = results.image.width;
          const imgHeight = results.image.height;
          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;

          // 영상을 전체 화면에 맞추기 위한 비율 계산
          const scale = Math.max(canvasWidth / imgWidth, canvasHeight / imgHeight);
          const xOffset = (canvasWidth / 2) - (imgWidth / 2) * scale;
          const yOffset = (canvasHeight / 2) - (imgHeight / 2) * scale;

          // 1. 배경 카메라 영상 그리기
          ctx.drawImage(results.image, xOffset, yOffset, imgWidth * scale, imgHeight * scale);

          // 손 데이터가 없으면 리턴
          if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            ctx.restore();
            return;
          }

          const originalLandmarks = results.multiHandLandmarks[0];

       
          const convertedLandmarks = originalLandmarks.map((landmark) => {

            const pixelX = landmark.x * imgWidth * scale + xOffset;
            const pixelY = landmark.y * imgHeight * scale + yOffset;

            return {

              x: pixelX / canvasWidth,
              y: pixelY / canvasHeight,
              z: landmark.z // z축은 비율에 영향이 없으므로 그대로 유지
            };
          });


          const prediction = predictGestureFromLandmarks(originalLandmarks, "learn");

          if (mp.drawLandmarks && mp.drawConnectors) {
            mp.drawLandmarks(ctx, convertedLandmarks, { color: '#FF0000', lineWidth: 2 });
            mp.drawConnectors(ctx, convertedLandmarks, mp.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 4 });
          }

          if (prediction.status !== "detected") {
            ctx.restore();
            return;
          }

          setAccuracy(prediction.confidence);

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
        }

        ctx.restore();
      });

      camera = new mp.Camera(video, {
        onFrame: async () => {
          await hands.send({ image: video });
        },
        width: 640,
        height: 480
      });

      camera.start();
    };

    const timer = setTimeout(() => {
      init();
    }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", resizeCanvas);
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

        <video ref={videoRef} playsInline muted style={{ display: "none" }} />
        <canvas ref={canvasRef} className="camera-box" />
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