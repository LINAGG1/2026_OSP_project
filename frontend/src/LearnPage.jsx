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
  const [showExample, setShowExample] = useState(true);
  
  const timerRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0, scale: 1, xOffset: 0, yOffset: 0 });

 
  const isFinishedRef = useRef(false);

  const startHideTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setShowExample(false);
    }, 2000);
  };

  useEffect(() => {
    startHideTimer();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleShowExampleBtn = () => {
    setShowExample(true);
    startHideTimer();
  };

  useEffect(() => {
    let camera = null;
    let hands = null;

    const mp = window;
    if (!mp.Hands || !mp.Camera) {
      console.error("MediaPipe 라이브러리가 로드되지 않았습니다. index.html을 확인하세요.");
      return;
    }

    const updateDimensions = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const wWidth = window.innerWidth;
      const wHeight = window.innerHeight;
      
      canvas.width = wWidth;
      canvas.height = wHeight;

      const imgWidth = 640;
      const imgHeight = 480;
      const scale = Math.max(wWidth / imgWidth, wHeight / imgHeight);
      
      dimensionsRef.current = {
        width: wWidth,
        height: wHeight,
        scale: scale,
        xOffset: (wWidth / 2) - (imgWidth / 2) * scale,
        yOffset: (wHeight / 2) - (imgHeight / 2) * scale
      };
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

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
        modelComplexity: 0, 
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults((results) => {
        
        if (isFinishedRef.current) return;

        ctx.save();
        ctx.clearRect(0, 0, dimensionsRef.current.width, dimensionsRef.current.height);
        
        if (results.image) {
          const { width: canvasWidth, height: canvasHeight, scale, xOffset, yOffset } = dimensionsRef.current;
          const imgWidth = results.image.width;
          const imgHeight = results.image.height;

          ctx.drawImage(results.image, xOffset, yOffset, imgWidth * scale, imgHeight * scale);

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
              z: landmark.z
            };
          });

          const prediction = predictGestureFromLandmarks(originalLandmarks, "learn");

          if (mp.drawLandmarks && mp.drawConnectors) {
            mp.drawLandmarks(ctx, convertedLandmarks, { color: '#FF0000', lineWidth: 1.5 });
            mp.drawConnectors(ctx, convertedLandmarks, mp.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2.5 });
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

       
          if (judgeResult.status === "correct") {
            isFinishedRef.current = true; 

            // 단 한 개의 성공 데이터 세트만 배열에 담아 전달
            const singleCorrectResult = [{
              targetNumber,
              predictedNumber: prediction.predictedNumber,
              isCorrect: true,
            }];

            const summary = createResultSummary("learn", singleCorrectResult);
            saveResult(summary);
            setModalOpen(true);
          }
        }
        ctx.restore();
      });

      camera = new mp.Camera(video, {
        onFrame: async () => {
          // 완료되면 웹캠 요청 자체를 중단하여 CPU 과부하 완전 방지
          if (!isFinishedRef.current && video) {
            await hands.send({ image: video });
          }
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
      window.removeEventListener("resize", updateDimensions);
      if (camera) camera.stop();
      if (hands) hands.close();
    };
  }, []);

  return (
    <div className="learn-wrapper">
      <div className="webcam-area">
        <div className="top-left-ui">
          <h2>숫자 {targetNumber}</h2>
          <button onClick={handleShowExampleBtn}>예시 보기</button>
        </div>

        {showExample && (
          <div className="example-box">
            <img src={`/example_${targetNumber}.jpeg`} alt={`숫자 ${targetNumber} 예시`} />
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