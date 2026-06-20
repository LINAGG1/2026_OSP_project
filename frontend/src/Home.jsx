import React, { useEffect, useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";

import { getSavedResults, clearSavedResults } from "./utils/resultStorage";

function Home() {
  const navigate = useNavigate();

  const [completedNumbers, setCompletedNumbers] = useState([]); // 완료한 숫자 배열
  const [progress, setProgress] = useState(0); // 진도율 퍼센트

  // 화면이 켜질 때 실제 저장된 세션 데이터를 파싱하여 진도율 계산
  useEffect(() => {
    const loadProgressData = () => {

      const savedSessions = getSavedResults(); 
      
      if (savedSessions && savedSessions.length > 0) {
        const correctNumbers = [];

      
        savedSessions.forEach((session) => {
          if (session.mode === "learn" && Array.isArray(session.results)) {
            session.results.forEach((res) => {
              if (res.isCorrect === true && res.targetNumber !== null) {
                correctNumbers.push(res.targetNumber);
              }
            });
          }
        });

        // 동일 숫자를 여러 번 학습했을 수 있으므로 중복 제거 (예: [4, 4, 2] -> [4, 2])
        const uniqueCompleted = [...new Set(correctNumbers)];
        setCompletedNumbers(uniqueCompleted);

        // 0부터 10까지 총 11개의 숫자 중 완료한 비율 계산
        const totalNumbersCount = 11;
        const calculatedProgress = Math.round((uniqueCompleted.length / totalNumbersCount) * 100);
        setProgress(calculatedProgress);
      } else {
        // 데이터가 없으면 초기 상태 유지
        setCompletedNumbers([]);
        setProgress(0);
      }
    };

    loadProgressData();
  }, []);

  // 유틸 내 clearSavedResults 함수를 사용하여 안전하게 전체 기록 초기화
  const handleReset = () => {
    if (window.confirm("정말 모든 학습 및 퀴즈 기록을 초기화하시겠습니까?")) {
      const response = clearSavedResults();
      if (response.isCleared) {
        setCompletedNumbers([]);
        setProgress(0);
        alert(response.message);
      } else {
        alert("초기화에 실패했습니다.");
      }
    }
  };

  return (
    <div className="container">
      <h1>숫자 수어 학습 서비스</h1>

      <div className="content">
        {/* LEFT PANEL: 진도율 및 스티커 판 */}
        <div className="left-panel">
          <div className="progress-header">
            <h2>진도율</h2>
            <span className="progress-percent">{progress}%</span>
          </div>

          {/* 진도율 바 */}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>

          {/* 스티커 보드 (0 ~ 10 동그라미) */}
          <div className="sticker-board">
            {Array.from({ length: 11 }, (_, i) => {
              const isDone = completedNumbers.includes(i);

              return (
                <div 
                  key={i} 
                  className={`sticker ${isDone ? "completed" : ""}`}
                >
                  {i}
                </div>
              );
            })}

            {/* 초기화 버튼 */}
            <button className="sticker clear-btn" onClick={handleReset}>
              초기화
            </button>
          </div>
        </div>

        {/* RIGHT PANEL: 액션 버튼들 */}
        <div className="right-panel">
          <button className="action-btn" onClick={() => navigate("/learn")}>
            학습 시작
          </button>
          <button className="action-btn" onClick={() => navigate("/quiz")}>
            퀴즈 시작
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;