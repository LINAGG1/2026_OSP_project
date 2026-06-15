import os
import cv2
import json
import numpy as np
import mediapipe as mp
from preprocessing import normalize_landmarks

mp_hands = mp.solutions.hands
dataset_dir = "dataset"
X = []
y = []

print("데이터 로딩 중...")

with mp_hands.Hands(static_image_mode=True, max_num_hands=1, min_detection_confidence=0.5) as hands:
    for label in range(11):
        folder = os.path.join(dataset_dir, str(label))
        files = os.listdir(folder)
        
        for filename in files:
            if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
                continue
            
            img_path = os.path.join(folder, filename)
            img = cv2.imread(img_path)
            if img is None:
                continue
            
            rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            result = hands.process(rgb)
            
            if not result.multi_hand_landmarks:
                continue
            
            landmarks = result.multi_hand_landmarks[0].landmark
            coords = normalize_landmarks(landmarks)
            
            if coords:
                X.append(coords)
                y.append(label)

print(f"총 {len(X)}개 데이터 로딩 완료!")

data = {"X": X, "y": y}
with open("frontend/src/model_data.json", "w") as f:
    json.dump(data, f)

print("JSON 저장 완료! → frontend/src/model_data.json")