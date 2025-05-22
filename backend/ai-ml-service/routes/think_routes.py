# routes/think_routes.py

from flask import Blueprint, request, jsonify
from controllers.think_controller import process_text_and_prefill_form

think_bp = Blueprint("think", __name__)

@think_bp.route("/think", methods=["POST"])
def think_prefill_form():
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Missing 'text' field in request."}), 400
        
        input_text = data["text"]
        filled_data = process_text_and_prefill_form(input_text)
        return jsonify(filled_data), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500