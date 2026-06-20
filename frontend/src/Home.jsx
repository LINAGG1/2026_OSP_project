import React, { useEffect, useState } from "react";
import "./Home.css";
import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();


  const [completedNumbers, setCompletedNumbers] = useState([]); // 완료한 숫자 배열 (예: [0, 1, 4])
  const [progress, setProgress] = useState(0); // 진도율 퍼센트 (0 ~ 100)

  // 화면이 켜질 때 로컬 스토리지에서 학습 데이터를 읽어옴
  useEffect(() => {
    const loadProgressData = () => {
      try {


        const rawData = localStorage.getItem("signSessionResults");
        
        if (rawData) {
          const parsedData = JSON.parse(rawData);
          
          // 중복을 제거하고 '성공(isCorrect: true)'한 targetNumber만 골라냄
          const correctNumbers = parsedData
            .filter((item) => item.isCorrect === true)
            .map((item) => item.targetNumber);
          
          // 중복 숫자 제거 (동일 숫자를 여러 번 학습했을 수 있으므로)
          const uniqueCompleted = [...new Set(correctNumbers)];
          
          setCompletedNumbers(uniqueCompleted);

          // 0부터 10까지 총 11개의 숫자 중 완료한 비율 계산
          const totalNumbersCount = 11;
          const calculatedProgress = Math.round((uniqueCompleted.length / totalNumbersCount) * 100);
          setProgress(calculatedProgress);
        } else {
          // 기록이 아예 없는 초보 유저 상태
          setCompletedNumbers([]);
          setProgress(0);
        }
      } catch (error) {
        console.error("진도율 데이터를 불러오는 중 오류 발생:", error);
        setCompletedNumbers([]);
        setProgress(0);
      }
    };

    loadProgressData();
  }, []);

  // 초기화 버튼 클릭 시 로컬 스토리지 비우기 및 상태 리셋
  const handleReset = () => {
    if (window.confirm("정말 모든 학습 기록을 초기화하시겠습니까?")) {
      localStorage.removeItem("signSessionResults");
      setCompletedNumbers([]);
      setProgress(0);
      alert("학습 기록이 초기화되었습니다.");
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
              //  현재 숫자가 완료된 숫자 배열에 포함되어 있는지 확인함
              const isDone = completedNumbers.includes(i);

              return (
                <div 
                  key={i} 
                  /* 완료 여부에 따라 'completed' 클래스를 동적으로 붙여줌 */
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