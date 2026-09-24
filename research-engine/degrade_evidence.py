import cv2
import numpy as np
import os

def degrade_frame(frame):
    # 1. Darken the image (Night-time / low-light simulation)
    hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    v = cv2.subtract(v, 70) # Reduce brightness
    v = np.clip(v, 0, 255)
    hsv = cv2.merge((h, s, v))
    dark_frame = cv2.cvtColor(hsv, cv2.HSV_BGR)

    # 2. Add Gaussian Blur (Out-of-focus / cheap lens simulation)
    blurred_frame = cv2.GaussianBlur(dark_frame, (21, 21), 0)

    # 3. Add Gaussian Noise (Sensor static / poor compression)
    noise = np.random.normal(0, 30, blurred_frame.shape).astype(np.uint8)
    noisy_frame = cv2.add(blurred_frame, noise)
    
    return noisy_frame

def create_degraded_video(input_path="cctv_sample.mp4", output_path="cctv_degraded.mp4"):
    if not os.path.exists(input_path):
        print(f"❌ Error: Could not find '{input_path}'. Make sure it is in this folder!")
        return

    print(f"🎥 Reading clean evidence: {input_path}")
    cap = cv2.VideoCapture(input_path)
    
    # Get video properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    print("🌧️ Applying Out-of-Distribution (OOD) degradation filters...")
    
    # Setup output writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        # Corrupt the frame
        degraded = degrade_frame(frame)
        out.write(degraded)

    cap.release()
    out.release()
    print(f"✅ Successfully created degraded evidence: {output_path}")

if __name__ == "__main__":
    create_degraded_video()
