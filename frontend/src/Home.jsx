import React, { useState } from "react";
import "./Home.css";

import { useNavigate } from "react-router-dom";

import { clearSavedResults } from "./utils/resultStorage";

function Home() {

  const navigate = useNavigate();


  const [progress, setProgress] = useState(54);

  //  진도율 초기화 버튼 클릭 핸들러
  const handleClearProgress = () => {
    if (window.confirm("정말 진도율 기록을 초기화하시겠습니까?")) {
      const result = clearSavedResults();

      // 반환값 구조 { isCleared: true, status: "cleared", message: "..." } 연동
      if (result && result.status === "cleared") {
        alert(result.message);
        setProgress(0); // 화면 진도율 0%로 초기화
      } else {
        alert("초기화 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <div className="container">
      <h1>숫자 수어 학습 서비스</h1>

      <div className="content">
        {/* LEFT */}
        <div className="left-panel">
          {/* 진도율 헤더 */}
          <div className="progress-header">
            <h2>진도율</h2>
            <span className="progress-percent">{progress}%</span>
          </div>

          {/* progress bar */}
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          {/* sticker board (3 * 4 = 총 12개 칸) */}
          <div className="sticker-board">
            {/* 0번부터 10번까지의 기존 수어 숫자 스티커 (11개) */}
            {Array.from({ length: 11 }, (_, num) => (
              <div key={num} className="sticker">
                {num}
              </div>
            ))}

            <button className="sticker clear-btn" onClick={handleClearProgress}>
              초기화
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right-panel">
          {/*  학습 시작 버튼을 누르면 /learn 경로로 이동 */}
          <button className="action-btn" onClick={() => navigate("/learn")}>
            학습 시작
          </button>
          
          {/*  퀴즈 시작 버튼을 누르면 /quiz 경로(퀴즈 화면)로 이동 */}
          <button className="action-btn" onClick={() => navigate("/quiz")}>
            퀴즈 시작
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;