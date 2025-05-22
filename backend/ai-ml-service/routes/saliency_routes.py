import os
from flask import Blueprint, request, jsonify, send_file
from controllers.saliency_controller import generate_saliency_heatmap

saliency_bp = Blueprint("saliency", __name__)
UPLOAD_FOLDER = "static"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@saliency_bp.route("/vision-saliency", methods=["POST"])
def saliency_api():
    if 'image' not in request.files:
        return jsonify({"error": "No image uploaded"}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"error": "No image selected"}), 400

    image_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(image_path)

    output_path = generate_saliency_heatmap(image_path)
    return send_file(output_path, mimetype='image/png')