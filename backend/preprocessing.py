import mediapipe as mp
import cv2
import numpy as np

mp_hands = mp.solutions.hands

def extract_landmarks(image_path):
    """이미지에서 landmark 추출"""
    with mp_hands.Hands(
        static_image_mode=True,
        max_num_hands=1,
        min_detection_confidence=0.5
    ) as hands:
        img = cv2.imread(image_path)
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        result = hands.process(img_rgb)

        if not result.multi_hand_landmarks:
            return None  # 손 인식 못 하면 None

        landmarks = result.multi_hand_landmarks[0].landmark
        return landmarks

def normalize_landmarks(landmarks):
    """손목 기준으로 좌표 정규화"""
    # 손목(0번) 좌표를 기준점으로
    wrist_x = landmarks[0].x
    wrist_y = landmarks[0].y

    coords = []
    for lm in landmarks:
        coords.append(lm.x - wrist_x)
        coords.append(lm.y - wrist_y)

    # 최대값으로 스케일링
    max_val = max(abs(v) for v in coords)
    if max_val == 0:
        return None
    coords = [v / max_val for v in coords]

    return coords  # 42개 값 (21개 x,y 쌍)