import React, { useState } from "react";
import "./LearnPage.css";
import { useNavigate } from "react-router-dom";

function LearnPage() {
  const targetNumber = 4;
  const navigate = useNavigate();

  const [showExample, setShowExample] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [accuracy, setAccuracy] = useState(87); // 나중에 AI 값으로 교체

  // 예시 보기 (2초 후 자동 닫힘)
  const handleExample = () => {
    setShowExample(true);

    setTimeout(() => {
      setShowExample(false);
    }, 2000);
  };

  //  AI가 4라고 인식했다고 가정
  const fakeDetect = () => {
    setModalOpen(true);
  };

  return (
    <div className="learn-wrapper">

      {/* 웹캠 화면 */}
      <div className="webcam-area">

        {/* 좌측 상단 UI */}
        <div className="top-left-ui">
          <h2>숫자 {targetNumber}</h2>

          <button onClick={handleExample}>
            예시 보기
          </button>
        </div>

        {/* 예시 이미지 */}
        {showExample && (
          <div className="example-box">
            <img
              src="/example4.png"
              alt="example"
            />
          </div>
        )}

        {/* 웹캠 자리 (나중에 video로 교체) */}
        <div className="camera-box">
          <p>웹캠 화면 영역</p>
        </div>

        {/* 테스트용 버튼 (AI 대신) */}
        <button
          className="test-btn"
          onClick={fakeDetect}
        >
          (테스트) 4 인식
        </button>
      </div>

      {/*  정답 모달 */}
      {modalOpen && (
        <div className="modal-bg">
          <div className="modal">

            <h2>{accuracy}% 일치</h2>

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