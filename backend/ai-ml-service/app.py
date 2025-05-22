from flask import Flask
from flask_cors import CORS

from routes.prd_routes import prd_bp
from routes.saliency_routes import saliency_bp
from routes.design_routes import design_bp
from routes.prompt_routes import prompt_bp
from routes.generate_routes import generate_bp
from routes.think_routes import think_bp
from routes.user_story_routes import user_story_bp

app = Flask(__name__)

CORS(app, resources={
    r"/api/*": {"origins": "*"}
})

app.register_blueprint(prd_bp, url_prefix="/api")
app.register_blueprint(saliency_bp, url_prefix="/api")
app.register_blueprint(design_bp, url_prefix="/api")
app.register_blueprint(prompt_bp, url_prefix="/api")
app.register_blueprint(generate_bp, url_prefix="/api")
app.register_blueprint(think_bp, url_prefix="/api")
app.register_blueprint(user_story_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True)
