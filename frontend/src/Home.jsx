import React from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

function Home() {
  const navigate = useNavigate();
  const progress = 54;

  return (
    <div className="container">
      <h1>숫자 수어 학습 서비스</h1>

      <div className="content">
        {/* LEFT */}
        <div className="left-panel">
          <div className="progress-header">
            <h2>진도율</h2>
            <span className="progress-percent">{progress}%</span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="sticker-board">
            {Array.from({ length: 11 }, (_, num) => (
              <div key={num} className="sticker">
                {num}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="right-panel">
          <button
            onClick={() => navigate("/learn")}
            className="action-btn"
          >
            학습 시작
          </button>

          <button
            onClick={() => navigate("/quiz")}
            className="action-btn"
          >
            퀴즈 시작
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;