import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

def image_to_base64(file):
    return base64.b64encode(file.read()).decode('utf-8')

def analyze_design_image(image_file):
    image_b64 = image_to_base64(image_file)

    prompt_text = (
        "You are an expert UX/UI and cognitive design analyst trained in neuroscience-backed creative intelligence. "
        "Analyze the following image of a UI or design asset and generate a CI Scorecard based on the 5 key psychological pillars from the B.E.A.M.P. model. "
        "For each pillar, return:\n"
        "- A score out of 20 based on effectiveness.\n"
        "- 1–2 concise, high-impact observations or suggestions for improvement.\n\n"
        "Evaluate the image based on the following pillars:\n"
        "1. **Attention** – Use of visual contrast, focal clarity, layout prominence.\n"
        "2. **Emotion** – Aesthetic tone, color psychology, emotional resonance.\n"
        "3. **Comprehension** – Legibility, hierarchy of information, message clarity.\n"
        "4. **Memory** – Design distinctiveness, creativity, brand retention potential.\n"
        "5. **Persuasion** – CTA clarity, value framing, interactivity, motivation.\n\n"
        "Start immediately with the CI scorecard, do not include AI preamble.\n"
        "Return your response in the following **CI Scorecard format**: without markdown"
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt_text},
                    {
                        "inlineData": {
                            "mimeType": image_file.mimetype,
                            "data": image_b64
                        }
                    }
                ]
            }
        ]
    }

    headers = {"Content-Type": "application/json"}
    response = requests.post(GEMINI_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise Exception(f"Gemini API error: {response.text}")

    result = response.json()
    return result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")