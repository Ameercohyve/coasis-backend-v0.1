import os
import json
import re
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

def process_text_and_prefill_form(input_text: str) -> dict:
    print("start")
    schema_path = Path("static/form_data.json")
    expected_path = Path("static/expected_format.json")

    if not schema_path.exists() or not expected_path.exists():
        return {"error": "Required JSON files not found in static directory."}

    with open(schema_path, "r") as f:
        services_schema = json.load(f)

    with open(expected_path, "r") as f:
        expected_fields = json.load(f)
    
    print("opened")

    try:
        # Hierarchy: service -> subservices -> styles + applications
        hierarchy_lines = []
        for service in services_schema:
            hierarchy_lines.append(f"• {service['service']}")
            for sub in service.get("subservices", []):
                styles = ", ".join(sub.get("styles", []))
                hierarchy_lines.append(f"    - {sub['name']} (Styles: {styles})")
            apps = ", ".join(service.get("applications", []))
            hierarchy_lines.append(f"    Applications: {apps}")
        
        hierarchy_text = "\n".join(hierarchy_lines)

    except Exception as e:
        return {"error": f"Error processing service schema: {str(e)}"}

    key_list = "\n".join(f"- {key}" for key in expected_fields.keys())

    prompt = f"""
You're an intelligent assistant that extracts structured project data from free-form text.

The following are the form fields to infer:
{key_list}

Use only the following hierarchy when selecting:
{hierarchy_text}

Your selected subService must belong to the selectedService.
Your selected style must belong to the selected subService.
Your selected application must belong to the selectedService.

### User Input:
\"\"\"{input_text}\"\"\"

Return as many fields as you can fill, as a valid JSON object.
Compulsorily return service, subservice, style and application (take assumptions if needed).
Also add projectOverview (brief description of the project in 60-70 words followed by space, delimiter "$", space and then what should the outcome look like in another 50 words).
NO explanation. NO markdown. JSON only.
"""

    model = genai.GenerativeModel("gemini-2.0-flash")
    response = model.generate_content(prompt)
    raw_text = response.text.strip()

    try:
        json_str = re.search(r"\{[\s\S]*?\}", raw_text).group()
        return json.loads(json_str)
    except Exception as e:
        return {
            "error": f"Failed to parse Gemini response: {str(e)}",
            "raw_response": raw_text
        }