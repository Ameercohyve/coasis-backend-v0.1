# routes/generate_routes.py
from flask import Blueprint, request, jsonify
from controllers.generate_controller import generate_image_from_prompt

generate_bp = Blueprint("generate", __name__)

@generate_bp.route("/generate-image", methods=["POST"])
def generate_image():
    data = request.json
    prompt = data.get("prompt", "")

    if not prompt:
        return jsonify({"error": "Missing 'prompt' field"}), 400

    try:
        result = generate_image_from_prompt(prompt)
        return jsonify({
            "message": "Image generated successfully.",
            "image_url": result["image_url"],
            "saved_as": result["local_path"]
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500