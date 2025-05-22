# controllers/generate_controller.py
import os
import json
import requests
from openai import AzureOpenAI
from PIL import Image

# Azure OpenAI Configuration
client = AzureOpenAI(
    api_version="2024-02-01",
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT")
)

def generate_image_from_prompt(prompt_text: str) -> dict:
    result = client.images.generate(
        model="dall-e-3",  # Replace with your deployment name if different
        prompt=prompt_text,
        n=1
    )

    json_response = json.loads(result.model_dump_json())
    image_url = json_response["data"][0]["url"]

    image_dir = os.path.join(os.curdir, "images")
    os.makedirs(image_dir, exist_ok=True)

    image_path = os.path.join(image_dir, "generated_image.png")

    # Download and save image
    generated_image = requests.get(image_url).content
    with open(image_path, "wb") as img_file:
        img_file.write(generated_image)

    return {
        "image_url": image_url,
        "local_path": image_path
    }