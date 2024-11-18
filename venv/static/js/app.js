//app.js
$(document).ready(function () {
    // Variables globales para almacenar los datos
    let currentData = null;

    // Inicializar los tabs de Bootstrap
    $('#mainTabs a').on('click', function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    $('#infoSubTabs a').on('click', function (e) {
        e.preventDefault();
        $(this).tab('show');
    });

    // Manejar la carga de archivos
    $('#upload-button').on('click', function () {
        const file = $('#file-input').prop('files')[0];
        if (!file) {
            alert("Por favor selecciona un archivo.");
            return;
        }
        if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
            alert("Solo se permiten archivos CSV o Excel.");
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        // Mostrar indicador de carga
        $(this).prop('disabled', true).text('Cargando...');

        $.ajax({
            url: '/upload',
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function (response) {
                currentData = response;
                loadDataInfo(response);
                loadDynamicTable(response.rows);
                loadTrendMeasures(response.measures);
                loadGraphOptions(response.columns);
                loadNumericColumns()
                $('#upload-button').prop('disabled', false).text('Cargar Archivo');
            },
            error: function (xhr, status, error) {
                console.error("Error al cargar el archivo:", error);
                alert("Error al cargar el archivo: " + error);
                $('#upload-button').prop('disabled', false).text('Cargar Archivo');
            }
        });
    });

    function loadGraphOptions(columns) {
        const xSelect = $('#x-axis-select').empty().append('<option value="">Seleccione variable para eje X</option>');
        const ySelect = $('#y-axis-select').empty().append('<option value="">Seleccione variable para eje Y</option>');
        
        columns.forEach(column => {
            xSelect.append(`<option value="${column}">${column}</option>`);
            ySelect.append(`<option value="${column}">${column}</option>`);
        });
    }

    // Evento para generar gráfico
    $('#generate-graph').on('click', async function () {
        const xColumn = $('#x-axis-select').val();
        const yColumn = $('#y-axis-select').val();
        const graphType = $('#graph-type').val();
    
        if (!xColumn || !yColumn || !graphType) {
            alert("Por favor, selecciona las opciones de gráfico y ejes.");
            return;
        }
    
        try {
            const response = await fetch('/graphs/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ x: xColumn, y: yColumn, type: graphType })
            });
    
            if (response.ok) {
                const data = await response.json();
                const imageUrl = data.image_url;
    
                // Mostrar la imagen en el elemento <img> con id 'graph-canvas'
                $('#graph-canvas').attr('src', imageUrl);
            } else {
                const errorData = await response.json();
                console.error("Error al generar el gráfico:", errorData.error);
                alert("Error al generar el gráfico: " + errorData.error);
            }
        } catch (error) {
            alert("Hubo un problema al generar el gráfico.");
            console.error("Error en la generación del gráfico:", error);
        }
    });
    
    

    // Función para cargar la información del archivo
    function loadDataInfo(data) {
        // Configurar la tabla de primeros registros
        if ($.fn.DataTable.isDataTable('#head-table')) {
            $('#head-table').DataTable().destroy();
        }
        $('#head-table').DataTable({
            data: data.head,
            columns: data.columns.map(col => ({ title: col, data: col })),
            pageLength: 5,
            scrollX: true
        });

        // Mostrar información de columnas
        $('#columns-count').text(data.columns.length);
        const columnsList = $('#columns-list').empty();
        data.columns.forEach(col => {
            columnsList.append(`<li class="list-group-item">${col}</li>`);
        });

        // Configurar la tabla de valores nulos
        if ($.fn.DataTable.isDataTable('#null-values-table')) {
            $('#null-values-table').DataTable().destroy();
        }
        $('#null-values-table').DataTable({
            data: Object.entries(data.null_values),
            columns: [
                { title: 'Columna' },
                { title: 'Valores Nulos' }
            ],
            pageLength: 10,
            scrollX: true
        });

        // Mostrar información de tamaño
        $('#size-rows').text(data.size.toLocaleString());
        $('#file-size').text(data.file_size.toLocaleString());

        const categoricalColumns = Object.keys(data.measures.categorical);

        $('#variable1-select, #variable2-select').empty()
            .append('<option value="">Seleccione una variable</option>');

        // Agregar solo variables categóricas a los selectores
        categoricalColumns.forEach(column => {
            $('#variable1-select, #variable2-select').append(
                `<option value="${column}">${column}</option>`
            );
        });
    }

    function loadDynamicTable(data) {
        if ($.fn.DataTable.isDataTable('#dynamic-table-content')) {
            $('#dynamic-table-content').DataTable().destroy();
        }

        if (data && data.length > 0) {
            const columns = Object.keys(data[0]).map(col => ({
                title: col,
                data: col
            }));

            $('#dynamic-table-content').DataTable({
                data: data,
                columns: columns,
                pageLength: 10,
                scrollX: true,
                dom: 'Bfrtip',
                buttons: ['copy', 'csv', 'excel']
            });
        } else {
            $('#dynamic-table-content').html('<tr><td colspan="100%">No hay datos disponibles</td></tr>');
        }
    }

    function loadTrendMeasures(measures) {
        // Limpiar selects anteriores
        const numericalSelect = $('#numerical-select').empty()
            .append('<option value="">Seleccione una variable numérica</option>');
        const categoricalSelect = $('#categorical-select').empty()
            .append('<option value="">Seleccione una variable categórica</option>');

        // Cargar variables numéricas
        Object.keys(measures.numerical).forEach(column => {
            numericalSelect.append(`<option value="${column}">${column}</option>`);
        });

        // Cargar variables categóricas
        Object.keys(measures.categorical).forEach(column => {
            categoricalSelect.append(`<option value="${column}">${column}</option>`);
        });

        // Event handlers para variables numéricas
        $('#numerical-select, #numerical-measure').on('change', function () {
            const selectedColumn = $('#numerical-select').val();
            const selectedMeasure = $('#numerical-measure').val();

            if (selectedColumn && selectedMeasure) {
                showNumericalResults(measures.numerical[selectedColumn], selectedMeasure);
            }
        });

        // Event handlers para variables categóricas
        $('#categorical-select, #categorical-measure').on('change', function () {
            const selectedColumn = $('#categorical-select').val();
            const selectedMeasure = $('#categorical-measure').val();

            if (selectedColumn && selectedMeasure) {
                showCategoricalResults(measures.categorical[selectedColumn], selectedMeasure);
            }
        });
    }

    function showNumericalResults(columnData, measure) {
        const resultDiv = $('#numerical-result');

        if (measure === 'all') {
            resultDiv.html(`
            <div class="card">
                <div class="card-body">
                    <p><strong>Media:</strong> ${columnData.mean.toFixed(2)}</p>
                    <p><strong>Mediana:</strong> ${columnData.median.toFixed(2)}</p>
                    <p><strong>Moda:</strong> ${columnData.mode ? columnData.mode.toFixed(2) : 'No hay moda única'}</p>
                    <p><strong>Máximo:</strong> ${columnData.max.toFixed(2)}</p>
                    <p><strong>Mínimo:</strong> ${columnData.min.toFixed(2)}</p>
                    <p><strong>Rango:</strong> ${columnData.range.toFixed(2)}</p>
                    <p><strong>Valores Únicos:</strong> ${columnData.unique_values}</p>
                </div>
            </div>
        `);
        } else {
            let value = columnData[measure];
            let formattedValue = typeof value === 'number' ? value.toFixed(2) : value;

            resultDiv.html(`
            <div class="card">
                <div class="card-body">
                    <p><strong>${getMeasureName(measure)}:</strong> ${formattedValue}</p>
                </div>
            </div>
        `);
        }
    }

    function showCategoricalResults(columnData, measure) {
        const resultDiv = $('#categorical-result');

        if (measure === 'all') {
            let frequenciesHtml = Object.entries(columnData.value_counts)
                .map(([value, count]) => `<li>${value}: ${count}</li>`)
                .join('');

            resultDiv.html(`
            <div class="card">
                <div class="card-body">
                    <p><strong>Moda:</strong> ${columnData.mode}</p>
                    <p><strong>Valores Únicos:</strong> ${columnData.unique_values}</p>
                    <p><strong>Top 5 Frecuencias:</strong></p>
                    <ul>${frequenciesHtml}</ul>
                </div>
            </div>
        `);
        } else if (measure === 'value_counts') {
            let frequenciesHtml = Object.entries(columnData.value_counts)
                .map(([value, count]) => `<li>${value}: ${count}</li>`)
                .join('');

            resultDiv.html(`
            <div class="card">
                <div class="card-body">
                    <p><strong>Top 5 Frecuencias:</strong></p>
                    <ul>${frequenciesHtml}</ul>
                </div>
            </div>
        `);
        } else {
            resultDiv.html(`
            <div class="card">
                <div class="card-body">
                    <p><strong>${getMeasureName(measure)}:</strong> ${columnData[measure]}</p>
                </div>
            </div>
        `);
        }
    }

    function getMeasureName(measure) {
        const measureNames = {
            'mean': 'Media',
            'median': 'Mediana',
            'mode': 'Moda',
            'max': 'Máximo',
            'min': 'Mínimo',
            'range': 'Rango',
            'unique_values': 'Valores Únicos',
            'value_counts': 'Frecuencias'
        };
        return measureNames[measure] || measure;
    }


});



function loadContingencyTables(data) {
    const variables = Object.keys(data);
    $('#variable1-select, #variable2-select').empty()
        .append('<option value="">Seleccione una variable</option>');

    variables.forEach(variable => {
        $('#variable1-select, #variable2-select').append(
            `<option value="${variable}">${variable}</option>`
        );
    });
}

document.getElementById('generate-graph').addEventListener('click', async () => {
    const xColumn = document.getElementById('x-axis-select').value;
    const yColumn = document.getElementById('y-axis-select').value;
    const graphType = document.getElementById('graph-type').value;

    if (!xColumn || !yColumn || !graphType) {
        alert("Por favor, selecciona las opciones de gráfico y ejes.");
        return;
    }

    const response = await fetch('/graphs/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x: xColumn, y: yColumn, type: graphType })
    });
    
    if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        document.getElementById('graph-canvas').src = url;
    } else {
        const error = await response.json();
        alert("Error: " + error.message);
    }
});

function loadCorrelationOptions(numericalColumns) {
    const container = $('#numerical-variables-list');
    container.empty();

    numericalColumns.forEach(column => {
        container.append(`
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${column}" id="check-${column}">
                <label class="form-check-label" for="check-${column}">
                    ${column}
                </label>
            </div>
        `);
    });
}

$('#generate-correlation').on('click', function () {
    const selectedVariables = [];
    $('#numerical-variables-list input:checked').each(function () {
        selectedVariables.push($(this).val());
    });

    if (selectedVariables.length < 2) {
        alert('Por favor seleccione al menos 2 variables');
        return;
    }

    $.ajax({
        url: '/correlation',
        type: 'POST',
        data: JSON.stringify({
            variables: selectedVariables
        }),
        contentType: 'application/json',
        success: function (response) {
            displayCorrelationMatrix(response);
        },
        error: function (xhr, status, error) {
            alert('Error al calcular correlaciones: ' + error);
        }
    });
});

function loadDataInfo(data) {
    loadContingencyTables(data.columns);
    loadGraphOptions(data.columns);
    loadCorrelationOptions(data.measures.numerical);
}


function displayContingencyTable(response) {
    const table = $('<table>').addClass('contingency-table');
    
    // Crear encabezado de columna con un espacio vacío inicial para el índice
    const headerRow = $('<tr>');
    headerRow.append('<th></th>'); // Espacio vacío para el índice
    response.columns.forEach(column => {
        headerRow.append(`<th>${column}</th>`);
    });
    table.append(headerRow);

    // Crear filas de la tabla
    response.index.forEach((rowLabel, rowIndex) => {
        const row = $('<tr>');
        
        // Encabezado de cada fila (índice)
        row.append(`<th>${rowLabel}</th>`);
        
        // Agregar los datos de la fila
        response.data[rowIndex].forEach(cell => {
            row.append(`<td>${cell}</td>`);
        });
        
        table.append(row);
    });

    // Limpiar el contenedor y agregar la tabla generada
    $('#contingency-table-container').empty().append(table);
}

$('#generate-contingency').on('click', function () {
    const var1 = $('#variable1-select').val();
    const var2 = $('#variable2-select').val();

    if (!var1 || !var2) {
        alert('Por favor seleccione ambas variables');
        return;
    }

    if (var1 === var2) {
        alert('Por favor seleccione dos variables diferentes');
        return;
    }

    $.ajax({
        url: '/contingency',
        type: 'POST',
        data: JSON.stringify({
            variable1: var1,
            variable2: var2
        }),
        contentType: 'application/json',
        success: function (response) {
            displayContingencyTable(response);
        },
        error: function (xhr, status, error) {
            alert('Error al generar la tabla de contingencia: ' + error);
        }
    });
});

// Agregamos este código a tu archivo app.js

// Manejador para el tab de correlación
$('#correlation-tab').on('shown.bs.tab', function (e) {
    //loadNumericColumns();
});

// Función para cargar las columnas numéricas con checkboxes
function loadNumericColumns() {
    // Limpiar el contenedor inmediatamente
    const columnCheckboxes = document.getElementById("column-checkboxes");
    columnCheckboxes.innerHTML = '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Cargando...</span></div>';

    fetch('/correlation/get_numeric_columns')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || !Array.isArray(data.columns)) {
                throw new Error('Formato de datos inválido');
            }

            columnCheckboxes.innerHTML = ''; // Limpiar el spinner
            
            // Crear un contenedor para los checkboxes
            const checkboxContainer = document.createElement('div');
            checkboxContainer.className = 'row g-3';
            
            data.columns.forEach(column => {
                const colDiv = document.createElement('div');
                colDiv.className = 'col-md-4';
                
                const formCheck = document.createElement('div');
                formCheck.className = 'form-check';
                
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.name = "columns";
                checkbox.value = column;
                checkbox.id = `col-${column}`;
                checkbox.className = "form-check-input";

                const label = document.createElement("label");
                label.htmlFor = `col-${column}`;
                label.appendChild(document.createTextNode(column));
                label.className = "form-check-label";

                formCheck.appendChild(checkbox);
                formCheck.appendChild(label);
                colDiv.appendChild(formCheck);
                checkboxContainer.appendChild(colDiv);
            });
            
            columnCheckboxes.appendChild(checkboxContainer);
        })
        .catch(error => {
            console.error("Error al cargar columnas numéricas:", error);
            columnCheckboxes.innerHTML = `
                <div class="alert alert-danger">
                    <h5 class="alert-heading">Error al cargar las columnas</h5>
                    <p>${error.message}</p>
                </div>`;
        });
}

// Manejador mejorado para el botón de calcular correlación
document.getElementById("calculate-correlation").addEventListener("click", function () {
    const selectedColumns = Array.from(document.querySelectorAll('input[name="columns"]:checked'))
        .map(checkbox => checkbox.value);

    if (selectedColumns.length < 2) {
        alert("Por favor, selecciona al menos dos columnas para calcular la correlación.");
        return;
    }

    // Mostrar spinner mientras se calcula
    const container = document.getElementById('correlation-table-container');
    container.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Calculando...</span>
            </div>
            <p class="mt-2">Calculando correlaciones...</p>
        </div>`;

    fetch('/correlation/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns: selectedColumns })
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            throw new Error(data.error);
        }
        container.innerHTML = generateCorrelationTable(data.correlation_matrix);
    })
    .catch(error => {
        console.error("Error al calcular la correlación:", error);
        container.innerHTML = `
            <div class="alert alert-danger">
                <h5 class="alert-heading">Error al calcular la correlación</h5>
                <p>${error.message}</p>
            </div>`;
    });
});

// Función mejorada para generar la tabla de correlación
function generateCorrelationTable(matrix) {
    // Validar si hay valores NaN o constantes
    const hasInvalidData = matrix.data.some(row => 
        row.some(value => isNaN(value))
    );

    let html = '';
    
    // Mostrar advertencia si hay datos inválidos
    if (hasInvalidData) {
        html += `
            <div class="alert alert-warning mb-3">
                <h5 class="alert-heading">Advertencia en los datos</h5>
                <p>Algunas correlaciones no pudieron ser calculadas debido a:</p>
                <ul>
                    <li>Posibles valores no numéricos en las columnas</li>
                    <li>Valores faltantes en los datos</li>
                    <li>Columnas con valores constantes</li>
                </ul>
            </div>`;
    }

    html += `
        <div class="table-responsive mt-4">
            <table class="table table-bordered table-hover">
                <thead class="table-light">
                    <tr>
                        <th></th>`;
    
    // Encabezados de columnas
    matrix.columns.forEach(col => {
        html += `<th scope="col">${col}</th>`;
    });
    html += "</tr></thead><tbody>";

    // Filas de la tabla
    matrix.index.forEach((row, i) => {
        html += `<tr>
            <th scope="row" class="table-light">${row}</th>`;
        matrix.data[i].forEach(value => {
            if (isNaN(value)) {
                html += '<td class="table-secondary">N/A</td>';
            } else {
                // Calcular el color basado en el valor de correlación
                const colorIntensity = Math.abs(value);
                const color = value > 0 ? 
                    `rgba(0, 123, 255, ${colorIntensity * 0.5})` : 
                    `rgba(220, 53, 69, ${colorIntensity * 0.5})`;
                const textColor = colorIntensity > 0.7 ? 'white' : 'black';
                
                html += `<td style="background-color: ${color}; color: ${textColor}">
                    ${value.toFixed(2)}
                </td>`;
            }
        });
        html += "</tr>";
    });

    html += `</tbody></table></div>
        <div class="mt-3 small">
            <div class="d-flex align-items-center mb-2">
                <div style="width: 20px; height: 20px; background-color: rgba(0, 123, 255, 0.5); margin-right: 10px;"></div>
                <span>Correlación positiva</span>
            </div>
            <div class="d-flex align-items-center">
                <div style="width: 20px; height: 20px; background-color: rgba(220, 53, 69, 0.5); margin-right: 10px;"></div>
                <span>Correlación negativa</span>
            </div>
        </div>`;

    return html;
}

// Función para llamar cuando se carga nueva data
