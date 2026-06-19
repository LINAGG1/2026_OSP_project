import React from "react";
import "./Home.css";

function Home() {
  const progress = 54;

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

          {/* sticker */}
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
          <button className="action-btn">학습 시작</button>
          <button className="action-btn">퀴즈 시작</button>
        </div>
      </div>
    </div>
  );
}

export default Home;