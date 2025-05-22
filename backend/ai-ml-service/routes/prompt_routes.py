# routes/prompt_routes.py
from flask import Blueprint, request, jsonify
from controllers.prompt_controller import enrich_text_prompt

prompt_bp = Blueprint("prompt", __name__)

@prompt_bp.route("/prompt-enrich", methods=["POST"])
def generate_enriched_prompt():
    print("enriching prompt")
    data = request.json
    user_prompt = data.get("prompt", "")

    if not user_prompt:
        return jsonify({"error": "Missing 'prompt' field"}), 400

    try:
        print("sending")
        enriched = enrich_text_prompt(user_prompt)
        
        return jsonify({"enriched_prompt": enriched})
    except Exception as e:
        return jsonify({"error": str(e)}), 500