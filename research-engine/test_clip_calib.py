import torch
import cv2
from PIL import Image
from transformers import CLIPModel, CLIPProcessor

device = 'cuda' if torch.cuda.is_available() else 'cpu'
print('Device:', device)
model = CLIPModel.from_pretrained('openai/clip-vit-base-patch32').to(device)
processor = CLIPProcessor.from_pretrained('openai/clip-vit-base-patch32')

# Extract frame from cctv_sample.mp4
cap = cv2.VideoCapture('research-engine/cctv_sample.mp4')
ret, frame = cap.read()
cap.release()
if ret:
    img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    
    statements = [
        'There was a red square on the camera.',
        'There was a red box in the recording.',
        'There was a blue car.',
        'Suspect in blue vehicle.',
        'Suspect was wearing a neon yellow raincoat and riding a red bicycle.'
    ]
    
    for stmt in statements:
        inputs = processor(text=[stmt], images=[img], return_tensors='pt', padding=True).to(device)
        with torch.no_grad():
            outputs = model(**inputs)
            img_feat = outputs.image_embeds / outputs.image_embeds.norm(dim=-1, keepdim=True)
            txt_feat = outputs.text_embeds / outputs.text_embeds.norm(dim=-1, keepdim=True)
            sim = (txt_feat @ img_feat.T)[0][0].item()
            
            # Calibrated cost:
            # Baseline reference similarity for zero-shot text-image match is ~0.20
            cost = 1.0 + (0.22 - sim) * 3.5
            cost = max(0.15, min(1.85, cost))
            is_contra = cost > 1.15
            print(f'Stmt: {stmt:<40} | Sim: {sim:.4f} | Cost: {cost:.4f} | Contradiction: {is_contra}')
