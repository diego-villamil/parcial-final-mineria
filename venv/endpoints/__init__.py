# __init__.py
from flask import Blueprint
from .upload import upload_bp
from .graphs import graphs_bp
from .contingency import contingency_bp
from .utils import utils_bp
from .correlation import correlation_bp


api_bp = Blueprint('api', __name__)
api_bp.register_blueprint(upload_bp, url_prefix='/upload')
api_bp.register_blueprint(graphs_bp, url_prefix='/graphs')
api_bp.register_blueprint(contingency_bp, url_prefix='/contingency')
api_bp.register_blueprint(utils_bp, url_prefix='/utils')
api_bp.register_blueprint(correlation_bp, url_prefix='/correlation')
