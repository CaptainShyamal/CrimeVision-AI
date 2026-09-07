
import torch
from PIL import Image
from transformers import CLIPProcessor, CLIPVisionModelWithProjection
import glob
import numpy as np

# 1. Load CLIP model & processor
device = "cuda" if torch.cuda.is_available() else "cpu"
model = CLIPVisionModelWithProjection.from_pretrained("openai/clip-vit-base-patch32").to(device)
processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")

# 2. Load CCTV frames
frame_paths = sorted(glob.glob("cctv_frames/*.jpg"))[:50] 

if len(frame_paths) == 0:
    print("Error: No .jpg images found in the cctv_frames folder!")
    exit()

print(f"Found {len(frame_paths)} images. Processing through CLIP...")
images = [Image.open(p).convert("RGB") for p in frame_paths]

# 3. Extract normalized image embeddings
inputs = processor(images=images, return_tensors="pt", padding=True).to(device)
with torch.no_grad():
    # Use the vision model directly to get the 512-d projected features
    outputs = model(**inputs)
    image_features = outputs.image_embeds
    
    # L2 normalize embeddings for cosine similarity
    image_embeddings = image_features / image_features.norm(dim=-1, keepdim=True)

embeddings_np = image_embeddings.cpu().numpy()
np.save("cctv_clip_embeddings.npy", embeddings_np)

print(f"✅ Success! Extracted embeddings shape: {embeddings_np.shape}")