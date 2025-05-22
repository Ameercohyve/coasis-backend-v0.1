from flask import Blueprint, request, jsonify
from controllers.design_controller import analyze_design_image

design_bp = Blueprint("design", __name__)

@design_bp.route("/design-analyze", methods=["POST"])
def analyze_design():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    image = request.files['image']
    try:
        suggestions = analyze_design_image(image)
        return jsonify({"suggestions": suggestions})
    except Exception as e:
        return jsonify({"error": str(e)}), 500