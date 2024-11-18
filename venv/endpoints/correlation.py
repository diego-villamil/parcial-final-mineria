from flask import Blueprint, request, jsonify
import pandas as pd
import numpy as np
from . import data_store  # Importamos el módulo data_store

correlation_bp = Blueprint('correlation', __name__)

def get_numeric_columns(df):
    """Retorna solo las columnas numéricas del DataFrame"""
    return df.select_dtypes(include=[np.number]).columns.tolist()

@correlation_bp.route('/get_numeric_columns', methods=['GET'])
def get_numeric_columns_route():
    """Endpoint para obtener las columnas numéricas disponibles"""
    try:
        df = data_store.get_dataframe()
        if df is None:
            return jsonify({'error': 'No hay datos cargados'}), 400
        
        numeric_columns = get_numeric_columns(df)
        return jsonify({'columns': numeric_columns})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@correlation_bp.route('/calculate', methods=['POST'])
def calculate_correlation():
    """Endpoint para calcular la matriz de correlación"""
    try:
        # Obtener el DataFrame
        df = data_store.get_dataframe()
        if df is None:
            return jsonify({'error': 'No hay datos cargados'}), 400

        # Obtener las columnas desde el JSON de la solicitud
        data = request.get_json()
        columns = data.get('columns', [])

        # Validar la solicitud
        if not columns or not isinstance(columns, list):
            return jsonify({'error': 'La clave "columns" debe ser una lista de nombres de columnas válidas.'}), 400

        # Validar que las columnas existan y sean numéricas
        numeric_columns = get_numeric_columns(df)
        invalid_columns = [col for col in columns if col not in numeric_columns]

        if invalid_columns:
            return jsonify({
                'error': f'Las siguientes columnas no son válidas o no son numéricas: {invalid_columns}'
            }), 400

        if len(columns) < 2:
            return jsonify({
                'error': 'Se requieren al menos dos columnas para calcular la correlación.'
            }), 400

        # Filtrar datos y manejar valores NaN
        filtered_df = df[columns].dropna()
        if filtered_df.empty:
            return jsonify({
                'error': 'No hay suficientes datos no nulos en las columnas seleccionadas para calcular la correlación.'
            }), 400

        # Calcular la matriz de correlación
        correlation_matrix = filtered_df.corr()

        # Convertir la matriz a un formato JSON
        result = {
            'columns': columns,
            'index': columns,
            'data': correlation_matrix.values.tolist()
        }

        return jsonify({'correlation_matrix': result})

    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        return jsonify({'error': str(e), 'trace': error_trace}), 500

    """Endpoint para calcular la matriz de correlación"""
    try:
        df = data_store.get_dataframe()
        if df is None:
            return jsonify({'error': 'No hay datos cargados'}), 400

        data = request.get_json()
        columns = data.get('columns', [])
        
        # Validar que las columnas existan y sean numéricas
        numeric_columns = get_numeric_columns(df)
        invalid_columns = [col for col in columns if col not in numeric_columns]
        
        if invalid_columns:
            return jsonify({
                'error': f'Las siguientes columnas no son válidas o no son numéricas: {invalid_columns}'
            }), 400

        if len(columns) < 2:
            return jsonify({
                'error': 'Se requieren al menos dos columnas para calcular la correlación.'
            }), 400

        # Calcular la matriz de correlación
        correlation_matrix = df[columns].corr()
        
        # Convertir la matriz a un formato más adecuado para JSON
        result = {
            'columns': columns,
            'index': columns,
            'data': correlation_matrix.values.tolist()
        }
        
        return jsonify({'correlation_matrix': result})

    except Exception as e:
        return jsonify({'error': str(e)}), 500