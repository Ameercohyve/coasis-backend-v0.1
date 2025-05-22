import os
import uuid
from flask import Blueprint, request, send_file, jsonify
from controllers.prd_controller import generate_prd_docx  # assuming renamed properly

prd_bp = Blueprint("prd", __name__)

@prd_bp.route("/prd-generate", methods=["POST"])
def generate_prd():
    data = request.json
    prompt = data.get("initial_prompt")

    if not prompt:
        return jsonify({"error": "Missing 'initial_prompt'"}), 400

    filename = f"PRD_{uuid.uuid4().hex[:8]}.docx"
    output_dir = "output"
    output_path = os.path.join(output_dir, filename)
    print(output_path)
    os.makedirs(output_dir, exist_ok=True)

    try:
        generate_prd_docx(prompt, output_path)
        print("returned")
        return send_file(
            output_path, 
            as_attachment=True,
            download_name=filename,
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 500