from flask import Blueprint, g
import pandas as pd

# Crear el Blueprint
utils_bp = Blueprint('utils_bp', __name__)

@utils_bp.route('/info', methods=['GET'])
def get_info():
    """Endpoint para obtener información del DataFrame actual"""
    df = get_dataframe()
    if df is None:
        return {"error": "No hay datos cargados"}, 400
    
    return {
        "rows": len(df),
        "columns": len(df.columns),
        "column_names": df.columns.tolist()
    }

def calculate_measures(df):
    """Calcula medidas estadísticas para columnas numéricas y categóricas"""
    measures = {
        'numerical': {},
        'categorical': {}
    }

    # Procesar columnas numéricas
    numerical_columns = df.select_dtypes(include=['number']).columns
    for column in numerical_columns:
        measures['numerical'][column] = {
            'mean': float(df[column].mean()),
            'median': float(df[column].median()),
            'mode': float(df[column].mode().iloc[0]) if not df[column].mode().empty else None,
            'max': float(df[column].max()),
            'min': float(df[column].min()),
            'range': float(df[column].max() - df[column].min()),
            'unique_values': len(df[column].unique()),
            'type': 'numerical'
        }

    # Procesar columnas categóricas
    categorical_columns = df.select_dtypes(exclude=['number']).columns
    for column in categorical_columns:
        mode_value = df[column].mode().iloc[0] if not df[column].mode().empty else None
        measures['categorical'][column] = {
            'mode': mode_value,
            'unique_values': df[column].nunique(),
            'value_counts': df[column].value_counts().head(5).to_dict(),
            'type': 'categorical'
        }

    return measures

def save_dataframe(df):
    """Guarda el DataFrame en g para uso posterior"""
    g.dataframe = df

def get_dataframe():
    """Recupera el DataFrame guardado"""
    return getattr(g, 'dataframe', None)