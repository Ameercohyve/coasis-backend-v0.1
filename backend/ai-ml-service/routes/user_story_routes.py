# routes/prompt_routes.py
from flask import Blueprint, request, jsonify
from controllers.user_story_controller import get_user_story

user_story_bp = Blueprint("user-story", __name__)

@user_story_bp.route("/user-story", methods=["POST"])
def generate_enriched_prompt():
    print("getting user story")
    data = request.json
    user_prompt = data.get("prompt", "")

    if not user_prompt:
        return jsonify({"error": "Missing 'prompt' field"}), 400

    try:
        print("sending")
        enriched = get_user_story(user_prompt)
        
        return jsonify({"enriched_prompt": enriched})
    except Exception as e:
        return jsonify({"error": str(e)}), 500