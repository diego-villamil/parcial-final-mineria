# contingency.py
from flask import Blueprint, request, jsonify
import pandas as pd
from .data_store import get_dataframe

contingency_bp = Blueprint('contingency_bp', __name__)

@contingency_bp.route('/', methods=['POST'])
def generate_contingency():
    try:
        data = request.get_json()
        if not data or 'variable1' not in data or 'variable2' not in data:
            return jsonify({"error": "Missing variables"}), 400
        
        # Obtener el DataFrame guardado
        df = get_dataframe()
        if df is None:
            return jsonify({"error": "No data available"}), 400

        # Generar la tabla de contingencia
        contingency_table = pd.crosstab(
            df[data['variable1']], 
            df[data['variable2']]
        )

        # Convertir a un formato más fácil de manejar en JavaScript
        result = {
            'index': contingency_table.index.tolist(),
            'columns': contingency_table.columns.tolist(),
            'data': contingency_table.values.tolist()
        }
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
