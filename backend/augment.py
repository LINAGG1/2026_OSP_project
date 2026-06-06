import cv2
import os

dataset_dir = "dataset"

for label in range(11):
    folder = os.path.join(dataset_dir, str(label))
    files = os.listdir(folder)
    
    for filename in files:
        if not filename.lower().endswith(('.jpg', '.jpeg', '.png')):
            continue
        
        if 'aug' in filename:  # 이미 증강된 파일 건너뛰기
            continue
        
        img_path = os.path.join(folder, filename)
        img = cv2.imread(img_path)
        flipped = cv2.flip(img, 1)
        
        if filename.startswith("right"):
            new_filename = "left_aug" + filename[5:]
        elif filename.startswith("left"):
            new_filename = "right_aug" + filename[4:]
        else:
            continue
        
        save_path = os.path.join(folder, new_filename)
        cv2.imwrite(save_path, flipped)
        print(f"저장: {save_path}")

print("증강 완료!")