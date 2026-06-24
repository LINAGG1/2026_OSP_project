# 2026_OSP_project: AI 제스처 인식 기반 인터랙티브 기초 수어 교육 플랫폼

## 프로젝트 소개
웹캠 기반 실시간 손동작 인식을 통해 한국 숫자 수어(0~10)를 학습할 수 있는 인터랙티브 웹 서비스입니다.
MediaPipe를 이용해 손 landmark를 추출하고, KNN 기반 분류 로직을 통해 숫자 수어를 예측합니다. 별도의 서버 없이 React 브라우저 환경에서 학습과 퀴즈 기능을 제공합니다.

## 팀원
| 이름 | 학번 | 역할 |
|------|------|------|
| 이나경 | 2510118 | 팀장, React 아키텍처 설계, 컴포넌트 라우팅 및 전역 상태 관리, AI 파이프라인(MediaPipe-프론트엔드) 데이터 실시간 연동 총괄 |
| 김규린 | 2511798 | 수어 이미지 데이터셋 수집 및 가공, KNN 모델 학습 및 브라우저 포팅용 학습 데이터(JSON) 추출 |
| 조예원 | 2515468 | 브라우저용 KNN 예측 결과 처리, 디바운스 기반 정답/오답 판별 로직 구현, localStorage 기반 결과 데이터 관리 |

## 주요 기능
- **실시간 손 landmark 인식**: 브라우저 환경에서 MediaPipe.js를 활용한 웹캠 기반의 손 tracking 구현
- **숫자 수어 0~10 학습 모드**: 숫자별 수어 예시 가이드 제공 및 실시간 일치도 피드백 제공
- **과도기 동작 오인식 방지 (Hold 기능)**: 손을 완벽히 펴기 전 스쳐 지나가는 포즈를 거르기 위해, 올바른 자세를 **1.5초 동안 유지**해야 정답으로 최종 인정되는 디바운스(Debounce) 검증 알고리즘 적용
- **게임화된 퀴즈 모드**: 무작위 셔플링된 11개의 숫자가 제시되며, 정답 포즈를 **3초간 유지**하면 인터랙티브 게이지가 채워지며 정답 처리되는 미션 시스템
- **메모리 안정성 보장**: 페이지 이동 및 리액트 언마운트 시 불필요한 잔여 프레임 요청을 가드(Flag Guard)하여 MediaPipe 고유의 Wasm 포인터 에러 및 메모리 누수 방지
- **학습 데이터 영속성**: 브라우저 `localStorage` 기반으로 세션별 학습 진도율 점검 및 퀴즈 결과 스티커 보드 시각화

## 기술 스택
- **Frontend**: React.js, Vite, MediaPipe.js
- **AI/ML**: Python, MediaPipe, OpenCV, Scikit-learn(KNN)
- **Storage**: Browser localStorage
- **Deployment**: GitHub Pages (서버리스)

## 설치 및 실행 방법

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend (모델 학습)
```bash
conda create -n osp python=3.10
conda activate osp
pip install mediapipe==0.10.9 opencv-python scikit-learn
python backend/train_model.py
python backend/export_model_json.py
```

## 프로젝트 구조
```text
2026_OSP_project/
├── backend/                    # Python 모델 학습
│   ├── train_model.py
│   ├── export_model_json.py
│   └── preprocessing.py
├── frontend/                   # React 웹 서비스
│   ├── public/                 # 수어 예시 이미지
│   └── src/
│       ├── Home.jsx            # 홈 화면
│       ├── LearnPage.jsx       # 학습 화면
│       ├── QuizPage.jsx        # 퀴즈 화면
│       ├── model_data.json     # 브라우저 예측용 KNN 데이터
│       └── utils/
│           ├── gestureModel.js # 수어 예측 결과 처리
│           ├── answerJudge.js  # 정답 판별
│           └── resultStorage.js# 결과 저장 및 조회
└── dataset/                    # 수어 이미지 데이터셋 (gitignore)
```

## 사용 방법
1. `npm run dev` 실행 후 브라우저에서 `localhost:5173` 접속
2. 학습 모드: 숫자별 수어 예시 확인 후 따라하기
3. 퀴즈 모드: 제시된 숫자 수어 동작 수행

## 모델 정보
- **알고리즘**: KNN (K-Nearest Neighbors, k=10)
- **전체 데이터셋**: 1,320장
- **학습 사용 데이터**: 1,293개 (오른손 660장 + 좌우반전 왼손 633장)
- **입력 벡터**: MediaPipe 21개 landmark x,y 좌표 정규화 → 42차원
- **분류 클래스**: 숫자 수어 0~10 (11개 클래스)
- **학습 정확도**: 93.05% (test set 20% 기준)

## 브랜치 전략
- `main`: 최종 배포본
- `develop`: 통합 브랜치
- `feature/*`: 기능별 개발 브랜치