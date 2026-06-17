import cv2
import mediapipe as mp
import pickle
import numpy as np
from preprocessing import normalize_landmarks

# 모델 로드
with open("backend/model.pkl", "rb") as f:
    model = pickle.load(f)

mp_hands = mp.solutions.hands
mp_draw = mp.solutions.drawing_utils

hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.7,
    min_tracking_confidence=0.7
)

cap = cv2.VideoCapture(0)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.flip(frame, 1)
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    result = hands.process(rgb)

    if result.multi_hand_landmarks:
        for hand_landmarks in result.multi_hand_landmarks:
            mp_draw.draw_landmarks(frame, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            coords = normalize_landmarks(hand_landmarks.landmark)
            if coords:
                pred = model.predict([coords])[0]
                prob = model.predict_proba([coords])[0]
                confidence = round(max(prob) * 100, 1)

                cv2.putText(frame, f"{pred} ({confidence}%)",
                    (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)

    cv2.imshow("Sign Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()