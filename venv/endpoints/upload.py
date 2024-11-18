# upload.py
from flask import Blueprint, request, jsonify
import pandas as pd
from .data_store import save_dataframe
from .utils import calculate_measures

upload_bp = Blueprint('upload_bp', __name__)

@upload_bp.route('/', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400

        # Leer el archivo según su extensión
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        elif file.filename.endswith('.xlsx'):
            df = pd.read_excel(file)
        else:
            return jsonify({"error": "Unsupported file format"}), 400

        # Guardar el DataFrame en el almacenamiento global
        save_dataframe(df)

        
        # Preparar la respuesta con información del archivo
        response = {
            'columns': df.columns.tolist(),
            'head': df.head().to_dict('records'),
            'size': len(df),
            'file_size': request.content_length,
            'null_values': df.isnull().sum().to_dict(),
            'measures': calculate_measures(df),
            'rows': df.to_dict('records')
        }

        return jsonify(response)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
