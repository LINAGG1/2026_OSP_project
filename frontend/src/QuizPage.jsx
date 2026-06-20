import React, { useEffect, useRef, useState } from "react";
import "./QuizPage.css";
import { useNavigate } from "react-router-dom";

import { predictGestureFromLandmarks } from "./utils/gestureModel";
import { judgeAnswer } from "./utils/answerJudge";
import { createResultSummary, saveResult } from "./utils/resultStorage";

function QuizPage() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const dimensionsRef = useRef({ width: 0, height: 0, scale: 1, xOffset: 0, yOffset: 0 });

  // 퀴즈 관련 상태
  const [quizList, setQuizList] = useState([]); 
  const [currentIndex, setCurrentIndex] = useState(0); 
  const [isAnswering, setIsAnswering] = useState(false); 
  const [correctCount, setCorrectCount] = useState(0); 
  
  const [showSuccessText, setShowSuccessText] = useState(false); 
  const [quizFinished, setQuizFinished] = useState(false); 

  // 3초 유지를 검증하기 위한 시간 체크용 카운트 및 타이머 Ref
  const [matchProgress, setMatchProgress] = useState(0); // 0% ~ 100% 게이지 시각화용
  const matchTimerRef = useRef(null);
  const isMatchingRef = useRef(false);

  const quizResultsRef = useRef([]); 

  // 1. 페이지 진입 시 0~10 무작위 셔플
  useEffect(() => {
    const numbers = Array.from({ length: 11 }, (_, i) => i);
    for (let i = numbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }
    setQuizList(numbers);
  }, []);

  const targetNumber = quizList[currentIndex];

  // 공통 함수: 정답 처리 및 다음 단계 이동
  const processCorrectAnswer = (predictedNum) => {
    setIsAnswering(true);
    setShowSuccessText(true);
    setCorrectCount((prev) => prev + 1);

    quizResultsRef.current.push({
      targetNumber,
      predictedNumber: predictedNum,
      isCorrect: true,
    });

    setTimeout(() => {
      moveToNextQuestion();
    }, 1000);
  };

  // 공통 함수: 도저히 몰라서 패스(오답) 버튼을 눌렀을 때 처리
  const handlePassQuestion = () => {
    if (isAnswering || quizFinished) return;
    
    // 타이머 및 게이지 초기화
    resetMatchTimer();

    // 오답 기록 저장
    quizResultsRef.current.push({
      targetNumber,
      predictedNumber: -1, 
      isCorrect: false,
    });

    moveToNextQuestion();
  };

  // 공통 함수: 다음 문제 이동 혹은 종료 처리
  const moveToNextQuestion = () => {
    setShowSuccessText(false);
    setMatchProgress(0);

    if (currentIndex < quizList.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsAnswering(false);
    } else {
      const summary = createResultSummary("quiz", quizResultsRef.current);
      saveResult(summary);
      setQuizFinished(true);
    }
  };

  // 타이머 리셋 함수
  const resetMatchTimer = () => {
    if (matchTimerRef.current) {
      clearInterval(matchTimerRef.current);
      matchTimerRef.current = null;
    }
    isMatchingRef.current = false;
    setMatchProgress(0);
  };

  useEffect(() => {
    if (quizList.length === 0 || quizFinished) return;

    let camera = null;
    let hands = null;

    const mp = window;
    if (!mp.Hands || !mp.Camera) return;

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
        width: wWidth, height: wHeight, scale,
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
        maxNumHands: 1, modelComplexity: 0,
        minDetectionConfidence: 0.6, minTrackingConfidence: 0.6,
      });

      hands.onResults((results) => {
        if (isAnswering || quizFinished) return;

        ctx.save();
        ctx.clearRect(0, 0, dimensionsRef.current.width, dimensionsRef.current.height);
        
        if (results.image) {
          const { width: canvasWidth, height: canvasHeight, scale, xOffset, yOffset } = dimensionsRef.current;
          ctx.drawImage(results.image, xOffset, yOffset, results.image.width * scale, results.image.height * scale);

          if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            resetMatchTimer();
            ctx.restore();
            return;
          }

          const originalLandmarks = results.multiHandLandmarks[0];
          const convertedLandmarks = originalLandmarks.map((landmark) => {
            const pixelX = landmark.x * results.image.width * scale + xOffset;
            const pixelY = landmark.y * results.image.height * scale + yOffset;
            return { x: pixelX / canvasWidth, y: pixelY / canvasHeight, z: landmark.z };
          });

          const prediction = predictGestureFromLandmarks(originalLandmarks, "quiz");

          if (mp.drawLandmarks && mp.drawConnectors) {
            mp.drawLandmarks(ctx, convertedLandmarks, { color: '#FF0000', lineWidth: 1.5 });
            mp.drawConnectors(ctx, convertedLandmarks, mp.HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 2.5 });
          }

          if (prediction.status !== "detected") {
            resetMatchTimer();
            ctx.restore();
            return;
          }

          const judgeResult = judgeAnswer(targetNumber, prediction.predictedNumber, prediction.confidence, "quiz");


          if (judgeResult.status === "correct") {
            if (!isMatchingRef.current) {
              isMatchingRef.current = true;
              let currentProgress = 0;

              // 20ms마다 게이지를 채움 (총 3000ms = 3초 유지 필요)
              matchTimerRef.current = setInterval(() => {
                currentProgress += (20 / 3000) * 100; //
                
                if (currentProgress >= 100) {
                  clearInterval(matchTimerRef.current);
                  processCorrectAnswer(prediction.predictedNumber);
                } else {
                  setMatchProgress(currentProgress);
                }
              }, 20);
            }
          } else {
            resetMatchTimer();
          }
        }
        ctx.restore();
      });

      camera = new mp.Camera(video, {
        onFrame: async () => {
          if (!isAnswering && !quizFinished && video) {
            await hands.send({ image: video });
          }
        },
        width: 640, height: 480
      });
      camera.start();
    };

    const timer = setTimeout(() => { init(); }, 500);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updateDimensions);
      if (camera) camera.stop();
      if (hands) hands.close();
      resetMatchTimer();
    };
  }, [quizList, currentIndex, isAnswering, quizFinished]);

  return (
    <div className="quiz-wrapper">
      <div className="webcam-area">
        {/* 왼쪽 위 가이드 문구 및 패스 버튼 */}
        <div className="top-left-ui-quiz">
          {targetNumber !== undefined && (
            <>
              <h2>숫자 {targetNumber}을 표현해보세요. ({currentIndex + 1}/11)</h2>
              <button className="pass-btn" onClick={handlePassQuestion}>모르겠어요 (넘어가기)</button>
            </>
          )}
        </div>

 
        {matchProgress > 0 && !showSuccessText && (
          <div className="hold-progress-container">
            <p>3초간 유지하세요!</p>
            <div className="hold-progress-bar">
              <div className="hold-progress-fill" style={{ width: `${matchProgress}%` }}></div>
            </div>
          </div>
        )}

        {showSuccessText && (
          <div className="success-overlay-text">
            <h1>정답입니다! 🎉</h1>
          </div>
        )}

        <video ref={videoRef} playsInline muted style={{ display: "none" }} />
        <canvas ref={canvasRef} className="camera-box" />
      </div>

      {quizFinished && (
        <div className="modal-bg-quiz">
          <div className="modal-quiz">
            <h2>🏆 퀴즈 결과 리포트</h2>
            <div className="score-box">
              <p className="main-score">총 11문제 중 <span>{correctCount}</span>개 정답!</p>
              <p className="percent-score">성취도: {Math.round((correctCount / 11) * 100)}%</p>
            </div>
            <p className="modal-comment">오늘의 수어 테스트를 완료하셨습니다!</p>
            <button onClick={() => navigate("/")}>홈으로</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default QuizPage;