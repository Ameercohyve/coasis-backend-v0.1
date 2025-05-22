# controllers/prompt_controller.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}"

def enrich_text_prompt(prompt_text):
    system_prompt = (
        "You are a prompt engineer and visual creative director. "
        "Given a short text input from a user, enrich it into a detailed, high-quality image generation prompt. "
        "Use vivid visual language, stylistic cues, lighting and ambiance, camera framing if relevant, and creative details. "
        "Avoid repeating the original prompt word-for-word. Return only the enriched prompt as plain text."
    )

    payload = {
        "contents": [
            {
                "parts": [
                    {"text": f"{system_prompt}\n\nUser input: {prompt_text}"}
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