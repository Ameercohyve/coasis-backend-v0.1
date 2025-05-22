# controllers/prompt_controller.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

def get_user_story(prompt_text):
    system_prompt = (
        "You are a product designer and user researcher. "
        "Given a short description of an idea or product, expand it into a user story. "
        "Cover who the users are, their motivations and needs, how they would interact with the product, and what key features or experiences they would expect. "
        "Use clear, structured sentences. Avoid repeating the original description verbatim. "
        "Focus on realistic usage scenarios and bring the user journey to life."
        "Return only the user story as plain text."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_prompt}\n\nInput description: {prompt_text}"}
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