import os
import cv2
import pickle
import numpy as np
from sklearn.neighbors import KNeighborsClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
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

X = np.array(X)
y = np.array(y)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

knn = KNeighborsClassifier(n_neighbors=10)
knn.fit(X_train, y_train)

y_pred = knn.predict(X_test)
acc = accuracy_score(y_test, y_pred)
print(f"정확도: {acc * 100:.2f}%")

with open("backend/model.pkl", "wb") as f:
    pickle.dump(knn, f)

print("모델 저장 완료! → backend/model.pkl")