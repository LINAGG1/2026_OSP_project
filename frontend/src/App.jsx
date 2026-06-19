function App() {
  const progress = 54;

  return (
    <div className="container">
      <h1>숫자 수어 학습 서비스</h1>

      <div className="content">
        <div className="left-panel">
          <h2>진도율</h2>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <p className="progress-text">{progress}%</p>
        </div>

        <div className="right-panel">
          <button className="action-btn">학습 시작</button>
          <button className="action-btn">퀴즈 시작</button>
        </div>
      </div>
    </div>
  );
}

export default App;