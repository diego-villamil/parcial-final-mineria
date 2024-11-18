import os
from flask import Flask, render_template, send_from_directory
from endpoints import api_bp  # Importar el Blueprint desde endpoints

app = Flask(__name__)

# Registrar el Blueprint de los endpoints en la app principal
app.register_blueprint(api_bp)

# Definir una ruta para servir archivos desde la carpeta 'graficos'
@app.route('/graficos/<filename>')
def graficos(filename):
    return send_from_directory('graficos', filename)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)
