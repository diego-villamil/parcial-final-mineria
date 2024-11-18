# graphs.py
import matplotlib
matplotlib.use('Agg')  # Configura 'Agg' como el backend para evitar problemas de bucle de eventos
import matplotlib.pyplot as plt
from flask import Blueprint, request, jsonify, url_for
import os
from .data_store import get_dataframe

graphs_bp = Blueprint('graphs', __name__)
GRAPHICS_FOLDER = 'graficos'

@graphs_bp.route('/generate', methods=['POST'])
def generate_graph():
    try:
        # Crear la carpeta de gráficos si no existe
        if not os.path.exists(GRAPHICS_FOLDER):
            os.makedirs(GRAPHICS_FOLDER)

        # Obtener el DataFrame guardado
        df = get_dataframe()
        if df is None:
            print("Error: No data uploaded")
            return jsonify({"error": "No data uploaded"}), 400

        # Obtener el tipo de gráfico y columnas seleccionadas desde el frontend
        data = request.get_json()
        x_column = data.get('x')
        y_column = data.get('y')
        graph_type = data.get('type')

        # Validar entradas
        if not x_column or not y_column or not graph_type:
            print("Error: Missing graph parameters")
            return jsonify({"error": "Missing graph parameters"}), 400
        if x_column not in df.columns or y_column not in df.columns:
            print(f"Error: Columns '{x_column}' or '{y_column}' not found in data")
            return jsonify({"error": f"Columns '{x_column}' or '{y_column}' not found in data"}), 400

        # Crear el gráfico según el tipo seleccionado
        plt.figure(figsize=(8, 6))
        
        if graph_type == 'bar':
            plt.bar(df[x_column], df[y_column], color='skyblue')
        elif graph_type == 'pie':
            plt.pie(df[y_column], labels=df[x_column], autopct='%1.1f%%')
        elif graph_type == 'line':
            plt.plot(df[x_column], df[y_column], marker='o', color='blue')
        elif graph_type == 'scatter':
            plt.scatter(df[x_column], df[y_column], color='red')
        else:
            print(f"Error: Unsupported graph type '{graph_type}'")
            return jsonify({"error": f"Unsupported graph type '{graph_type}'"}), 400

        plt.title(f"Gráfico de tipo: {graph_type}")
        plt.xlabel(x_column)
        plt.ylabel(y_column)

        # Guardar el gráfico en la carpeta 'graficos'
        image_filename = f"{graph_type}_{x_column}_{y_column}.png"
        image_path = os.path.join(GRAPHICS_FOLDER, image_filename)
        plt.savefig(image_path)
        plt.close()

        # Devolver la URL de la imagen usando la ruta /graficos
        return jsonify({"image_url": url_for('graficos', filename=image_filename)})
    
    except Exception as e:
        print("Error al generar el gráfico:", str(e))
        return jsonify({"error": str(e)}), 500
