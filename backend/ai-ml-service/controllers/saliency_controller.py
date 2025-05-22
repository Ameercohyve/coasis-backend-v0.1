import cv2
import numpy as np

def generate_saliency_heatmap(image_path, output_path="static/output.png"):
    image = cv2.imread(image_path)
    if image is None:
        raise FileNotFoundError(f"Image not found at: {image_path}")
    
    image = cv2.resize(image, (600, 400))

    saliency = cv2.saliency.StaticSaliencySpectralResidual_create()
    (success, saliencyMap) = saliency.computeSaliency(image)
    saliencyMap = (saliencyMap * 255).astype("uint8")

    heatmap = cv2.applyColorMap(saliencyMap, cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(image, 0.6, heatmap, 0.4, 0)

    cv2.imwrite(output_path, overlay)
    return output_path