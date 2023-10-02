import Graph from "./src/Graph.mjs";
import {selectedElementStyle, defaultEdgeStyle, defaultNodeStyle} from "./graphStyles.mjs";
import {ehGhostPreviewEdgeActiveStyle, ehPreviewAndGhostEdgeStyle, ehNodeStyle} from "./edgeHandlesStyles.mjs";

/**
 * Обработчик, срабатывающий при создании ребра
 */
function handleEdgeCreated(event, sourceNode, targetNode, addedEdge) {
    const existingEdges = cy.edges().filter(edge => 
        edge.data('source') == sourceNode.data('id') && 
        edge.data('target') == targetNode.data('id'));

    if (existingEdges.length != 1) {
        alert('Ребро уже существует. Нажми на него два раза, чтобы изменить вес');
        addedEdge.remove();
        return;
    }

    const weightStr = prompt('Вес ребра');
    if (weightStr == null || weightStr.trim().length == 0 || isNaN(weightStr - '')) {
        alert('Введите ЦЕЛОЧИСЛЕННЫЙ вес ребра');
        addedEdge.remove();
        return;
    }        
    
    // update visual graph
    addedEdge.data('weight', weightStr);

    // update logic graph
    graph.addEdge(sourceNode.data('name'), targetNode.data('name'), weightStr - '');
    
    // update adj-matrix
    const table = document.querySelector('#table');    
    const row = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(sourceNode.data('name'));
    const col = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(targetNode.data('name'));
    table.rows[row].cells[col].firstChild.value = weightStr;
}

/**
 * Обработчик, срабатывающий при двойном нажатии на вершину графа
 */
function handleDoubleTapOnNode(event) {
    const vertex = event.target;
    const oldName = vertex.data('name');
    const name = prompt('Имя вершины', oldName);

    if (name == null || name.trim().length == 0) {
        alert('Имя вершины не может быть пустым!');
        return;
    }

    // update logic graph
    const updateRes = graph.updateNameVertex(oldName, name);

    if (!updateRes) {
        alert('Такая вершина уже есть');
        return;
    }

    // update visual graph
    vertex.data('name', name);

    // update adj-matrix
    const table = document.querySelector('#table');
    const index = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(oldName);
    table.rows[0].cells[index].innerHTML = name;
    table.rows[index].cells[0].innerHTML = name;
}

function handleDoubleTapOnEdge(event) {
    const edge = event.target;
    const oldWeight = edge.data('weight');
    const weight = prompt('Имя вершины', oldWeight);

    if (weight == null || weight.trim().length == 0) return;
    if (isNaN(weight - '')) {
        alert("Введите число");
        return;
    }

    // update logic graph
    const from = cy.elements(`node[id="${edge.data('source')}"]`).data('name');
    const to = cy.elements(`node[id="${edge.data('target')}"]`).data('name');
    graph.addEdge(from, to, weight - '');

    // update visual graph
    edge.data('weight', weight);

    // update adj-matrix
    const table = document.querySelector('#table');
    const i = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(from);
    const j = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(to);
    table.rows[i].cells[j].firstChild.value = weight;
}

/**
 * Создание контекстного меню
 */
function createContextMenu() {
    cy.contextMenus({
        menuItems: [
            {
                id: 'remove',
                content: 'Удалить',
                image: {src: "assets/remove.svg", width: 12, height: 12, x: 6, y: 4},
                selector: 'node, edge',
                hasTrailingDivider: true,
                onClickFunction: function (event) {
                    const target = event.target || event.cyTarget;

                    if (target.isNode()) {
                        // remove from logic graph
                        graph.removeVertex(target.data('name'));
                        
                        // update adj-matrix
                        const table = document.querySelector('#table');
                        table.innerHTML = '';
                    
                        const firstRow = document.createElement('tr');
                        firstRow.appendChild(document.createElement('th'));    
                        for (let i = 0; i < graph.matrix.length; i++) {
                            const head = document.createElement('th');
                            head.innerHTML = `${graph.vertexes[i].label}`;
                            firstRow.appendChild(head);
                        }
                    
                        table.appendChild(firstRow);

                        for (let i = 0; i < graph.matrix.length; i++) {
                            const row = document.createElement('tr');
                            const firstCell = document.createElement('th');
                            firstCell.innerHTML = `${graph.vertexes[i].label}`;
                            row.appendChild(firstCell);
                            for (let j = 0; j < graph.matrix.length; j++) {
                                const cell = document.createElement('td');
                                const input = document.createElement('input');
                                input.style.width = '40px';
                                input.style.margin = '3px';
                                input.value = graph.getWeight(graph.vertexes[i].label, graph.vertexes[j].label) || '';
                    
                                if (i == j) {
                                    input.setAttribute('disabled', true);
                                }
                    
                                cell.appendChild(input);
                                row.appendChild(cell);
                            }
                            table.appendChild(row);
                        }
                    } 
                    else if (target.isEdge()) {
                        // remove from logic graph
                        const from = cy.elements(`node[id="${target.data('source')}"]`).data('name');
                        const to = cy.elements(`node[id="${target.data('target')}"]`).data('name');
                        graph.removeEdge(from, to);

                        // update adj-matrix
                        const row = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(from);
                        const col = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(to);
                        table.rows[row].cells[col].firstChild.value = '';
                    }
                    target.remove();
                },
            },
            
            {
                id: 'add-node',
                content: 'Добавить вершину',
                image: {src: "assets/add.svg", width: 12, height: 12, x: 6, y: 4},
                coreAsWell: true,
                onClickFunction: function (event) {
                    const name = prompt('Имя вершины');
                    if (name == null || name.trim().length == 0) {
                        alert('Имя вершины не может быть пустым!');
                        return;
                    }

                    const data = { group: 'nodes', name: name };                    
                    const pos = event.position || event.cyPosition;

                    // add to logic graph
                    const addResult = graph.addVertex(name);

                    if (!addResult) {
                        alert('Такая вершина уже существует');
                        return;
                    }
                    
                    // add to visual graph
                    cy.add({
                        data: data,
                        position: {
                            x: pos.x,
                            y: pos.y
                        }
                    });
                    
                    // update adj-matrix
                    const table = document.querySelector('#table');

                    if (table.rows.length == 0) {
                        const firstRow = document.createElement("tr");
                        firstRow.appendChild(document.createElement("th"));
                        const headCell = document.createElement("th");
                        headCell.innerHTML = name;
                        firstRow.appendChild(headCell);
                        table.appendChild(firstRow);                            
                        const row = document.createElement("tr");
                        const headRow = document.createElement("th");
                        headRow.innerHTML = name;                            
                        row.appendChild(headRow);
                        const cell = document.createElement("td");
                        const input = document.createElement('input');
                        input.style.width = '40px';
                        input.style.margin = '3px';
                        input.setAttribute('disabled', true);
                        cell.appendChild(input);
                        row.appendChild(cell);
                        table.appendChild(row);
                        return;
                    }

                    const headCell = document.createElement("th");
                    headCell.innerHTML = name;
                    table.rows[0].appendChild(headCell);

                    for (let i = 1; i < table.rows.length; i++) {
                        const cell = document.createElement("td");
                        const input = document.createElement('input');
                        input.style.width = '40px';
                        input.style.margin = '3px';
                        cell.appendChild(input);
                        table.rows[i].appendChild(cell);
                    }

                    const row = document.createElement("tr");
                    const headRow = document.createElement("th");
                    headRow.innerHTML = name;
                    row.appendChild(headRow);

                    for (let i = 1; i < table.rows.length; i++) {
                        const cell = document.createElement("td");
                        const input = document.createElement('input');
                        input.style.width = '40px';
                        input.style.margin = '3px';
                        cell.appendChild(input);
                        row.appendChild(cell);
                    }

                    const lastCell = document.createElement("td");
                    const input = document.createElement('input');
                    input.style.width = '40px';
                    input.style.margin = '3px';
                    input.setAttribute('disabled', true);
                    lastCell.appendChild(input);
                    row.appendChild(lastCell);
                    table.appendChild(row);
                }
            }
        ]
    });
}

/**
 * Изменении режима (добавление ребер <-> перемещение вершин)
 */
function handleChangeMode(event) {
    if (isMovingNodeMode) {
        document.querySelector('#change-mode-btn').innerHTML = 'Выкл. режим "Добавление ребер"';
        document.querySelector('#state-information').innerHTML = 'Добавление ребер';
        edgeHandles.enableDrawMode();
    } else {
        document.querySelector('#change-mode-btn').innerHTML = 'Вкл. режим "Добавление ребер"';
        document.querySelector('#state-information').innerHTML = 'Перемещение вершин';
        edgeHandles.disableDrawMode();
    }
    isMovingNodeMode = !isMovingNodeMode;
}

/**
 * Обработчик, срабатывающий при нажатии на вершину графа
 */
function handleTapOnNode(event) {
    if (pathPlan.fromVertex == null && pathPlan.toVertex == null) {
        pathPlan.fromVertex = event.target;
        pathPlan.fromVertex.style('background-color', 'lightgreen');
        const text = `Выберите вторую вершину (${pathPlan.fromVertex.data('name')} -> )`;
        document.querySelector('#state-information').innerHTML = text;
    }
    else if (pathPlan.fromVertex != null && pathPlan.toVertex == null) {
        if (event.target == pathPlan.fromVertex) {
            pathPlan.fromVertex.style('background-color', defaultNodeStyle.style["background-color"]);
            document.querySelector('#state-information').innerHTML = 'Выберите первую вершину';
            pathPlan.fromVertex = null;
        } else {
            pathPlan.toVertex = event.target;
            pathPlan.toVertex.style('background-color', 'lightgreen');
            const text = `Вершины выбраны (${pathPlan.fromVertex.data('name')} -> ${pathPlan.toVertex.data('name')})`;
            document.querySelector('#state-information').innerHTML = text;
        }
    }
    else if (pathPlan.fromVertex != null && pathPlan.toVertex != null) {
        if (event.target == pathPlan.toVertex) {
            pathPlan.toVertex.style('background-color', defaultNodeStyle.style["background-color"]);
            const text = `Выберите вторую вершину (${pathPlan.fromVertex.data('name')} -> )`;
            document.querySelector('#state-information').innerHTML = text;
            pathPlan.toVertex = null;
        }    
        if (event.target == pathPlan.fromVertex) {
            pathPlan.fromVertex.style('background-color', defaultNodeStyle.style["background-color"]);
            pathPlan.fromVertex = pathPlan.toVertex;
            pathPlan.toVertex = null;
            const text = `Выберите вторую вершину (${pathPlan.fromVertex.data('name')} -> )`;
            document.querySelector('#state-information').innerHTML = text;
        }
    }
}

/**
 * Поиск мин. пути
 */
function handleClickFindMinPath (event) {
    cy.nodes().lock();
    cy.addListener('tap', 'node', handleTapOnNode);
    document.querySelector('#state-information').innerHTML = 'Выберите первую вершину';    

    document.querySelector('#solve-dijkstra-btn').style.display = 'inline-block';
    document.querySelector('#cancel-finding-btn').style.display = 'inline-block';
    document.querySelector('#clear-path-btn').style.display = 'inline-block';
    document.querySelector('#change-mode-btn').style.display = 'none';
    document.querySelector('#find-min-path-btn').style.display = 'none';
    document.querySelector('#find-all-path-btn').style.display = 'none';
}

/**
 * Отмена поиска минимального пути
 */
function handleClickCancelFinding(event) {
    cy.nodes().unlock();
    cy.removeListener('tap', 'node', handleTapOnNode);
    clearPath();
    if (isMovingNodeMode) {
        document.querySelector('#state-information').innerHTML = 'Перемещение вершин';
    } else {
        document.querySelector('#state-information').innerHTML = 'Добавление ребер';
    }

    document.querySelector('#solve-dijkstra-btn').style.display = 'none';
    document.querySelector('#cancel-finding-btn').style.display = 'none';
    document.querySelector('#clear-path-btn').style.display = 'none';
    document.querySelector('#change-mode-btn').style.display = 'inline-block';
    document.querySelector('#find-min-path-btn').style.display = 'inline-block';
    document.querySelector('#find-all-path-btn').style.display = 'inline-block';
}

/**
 * поиск мин. пути по алгоритму Дейкстры
 */
function handleClickDijkstra(event) {
    if (pathPlan.fromVertex != null && pathPlan.toVertex != null) {
        const res = graph.dijkstra(pathPlan.fromVertex.data('name'), pathPlan.toVertex.data('name'));
        if (res.distance == null) {
            document.querySelector('#state-information').innerHTML = `Такого пути (${pathPlan.fromVertex.data('name')} -> ${pathPlan.toVertex.data('name')}) не существует`;
            return;
        }

        document.querySelector('#state-information').innerHTML = `Мин. расстояние (${pathPlan.fromVertex.data('name')} -> ${pathPlan.toVertex.data('name')}) = ${res.distance}`;

        for (let i = 0; i < res.path.length; i++) {
            const fromVertex = cy.elements(`node[name="${res.path[i]}"]`);
            const toVertex = cy.elements(`node[name="${res.path[i + 1]}"]`);
            const edge = cy.elements(`edge[source="${fromVertex.id()}"][target="${toVertex.id()}"]`);
            edge.style('line-color', 'green');
            fromVertex.style('background-color', 'green');
        }
    }
}

/**
 * заполнение таблиц со всеми путями
 */
function fillTable(table, data) {
    const n = table.rows.length;
    for (let i = 1; i < n; i++) {
        table.removeChild(table.rows[table.rows.length - 1]);
    }

    for (let i = 0; i < data.length; i++) {
        const row = document.createElement('tr');

        const cellFrom = document.createElement('td');
        cellFrom.innerHTML = data[i].from;
        row.appendChild(cellFrom);

        const cellTo = document.createElement('td');
        cellTo.innerHTML = data[i].to;
        row.appendChild(cellTo);

        const cellPath = document.createElement('td');
        cellPath.innerHTML = data[i].path.join(' -> ');
        row.appendChild(cellPath);

        const cellDist = document.createElement('td');
        cellDist.innerHTML = data[i].distance != null ? data[i].distance : 'Нет пути';
        row.appendChild(cellDist);    
        table.appendChild(row);
    }
};

/**
 * Поиск всех путей
 */
function handleClickFindAllPath(event) {
    let start = performance.now();
    const resDijkstra = graph.dijkstraAll();
    const timeDijkstra = performance.now() - start;

    start = performance.now();
    const resFloid = graph.floid();
    const timeFloid = performance.now() - start;

    document.querySelector('.all-paths').style.display = 'flex';    
    document.querySelector('.dijkstra-paths .title').innerHTML = `[Дейкстра] Время: ${timeDijkstra} мс`;
    document.querySelector('.floid-paths .title').innerHTML = `[Флоид] Время: ${timeFloid} мс`;

    const dijkstraTable = document.querySelector('#dijkstra-paths-table');
    const floidTable = document.querySelector('#floid-paths-table');

    fillTable(dijkstraTable, resDijkstra);
    fillTable(floidTable, resFloid);
}

/**
 * убрать с графа отмеченный путь
 */
function clearPath() {
    pathPlan.fromVertex = null;
    pathPlan.toVertex = null;
    cy.nodes().style("background-color", defaultNodeStyle.style["background-color"]);
    cy.edges().style("line-color", defaultEdgeStyle.style["line-color"]);
    document.querySelector('#state-information').innerHTML = 'Выберите первую вершину';
}

/**
 * Создание графа
 */
function handleClickCreateGraph (event) {
    const nStr = prompt('Укажите кол-во вершин графа (1 <= N <= 10)').trim();
    if (nStr == null || nStr.length == 0) {
        alert('ПУСТОТА!!!');
        return;
    }

    const n = nStr - '';
    if (isNaN(n)) {
        alert('Вы ввели НЕ число');
        return;
    }

    if (n  < 1|| n > 10) {
        alert(`N = ${n} (1 <= N <= 10) !!!`);
        return;
    }
    
    // create logic graph
    graph = new Graph();
    for (let i = 1; i <= n; i++) {
        graph.addVertex(`${i}`);
    }

    // create adj-matrixd
    const table = document.querySelector('#table');
    table.innerHTML = '';

    const firstRow = document.createElement('tr');
    firstRow.appendChild(document.createElement('th'));    
    for (let i = 1; i <= n; i++) {
        const head = document.createElement('th');
        head.innerHTML = `${i}`;
        firstRow.appendChild(head);
    }

    table.appendChild(firstRow);

    for (let i = 1; i <= n; i++) {
        const row = document.createElement('tr');
        const firstCell = document.createElement('th');
        firstCell.innerHTML = `${i}`;
        row.appendChild(firstCell);
        for (let j = 1; j <= n; j++) {
            const cell = document.createElement('td');
            const input = document.createElement('input');
            input.style.width = '40px';
            input.style.margin = '3px';

            if (i == j) {
                input.setAttribute('disabled', true);
            }

            cell.appendChild(input);
            row.appendChild(cell);
        }
        table.appendChild(row);
    }
}

/**
 * Отрисовка графа
 */
function handleClickDrawGraph(event) {
    const table = document.querySelector('#table');

    cy.nodes().remove();
    cy.edges().remove();

    const step = 2 * Math.PI / (table.rows.length - 1);
    const r = 200;
    let x = 0;
    let y = 0;

    for (let i = 1; i < table.rows.length; i++) {
        cy.add({
            group: 'nodes',
            data: {
                name: table.rows[0].cells[i].innerHTML
            },
            position: {
                x: x + r * Math.cos(i * step),
                y: y + r * Math.sin(i * step),
            }
        });
    }

    for (let i = 1; i < table.rows.length; i++) {
        for (let j = 1; j < table.rows.length; j++) {
            const input = table.rows[i].cells[j].firstChild;
            const weight = input.value.trim() - '' || null;
            const from = table.rows[i].cells[0].innerHTML;
            const to = table.rows[0].cells[j].innerHTML;
    
            graph.addEdge(from, to, weight);
            if (weight != null) {
                cy.add({
                    group: 'edges',
                    data: {
                        source: cy.elements(`node[name="${from}"]`).id(),
                        target: cy.elements(`node[name="${to}"]`).id(),
                        weight: weight
                    },
                });
            }
        }    
    }
}

function handleClickLoadFile(e) {
    document.querySelector('#file-input').value = null;
    document.querySelector('#file-input').click();
}

function handleChangeFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file);

    reader.onload = () => {
        cy.elements().remove();

        let data = JSON.parse(reader.result);
        graph = new Graph();
        console.log(data);
        
        for (let node of data.nodes) {
            graph.addVertex(node.name);
            cy.add({
                data: { group: 'nodes', name: node.name },
                position: {
                    x: node.pos_x,
                    y: node.pos_y
                }
            });
        }

        for (let edge of data.edges) {
            graph.addEdge(edge.from, edge.to, edge.weight);
            cy.add({
                data: { 
                    group: 'edges', 
                    source: cy.elements(`node[name="${edge.from}"]`).id(),
                    target: cy.elements(`node[name="${edge.to}"]`).id(),
                    weight: edge.weight
                }
            });
        }
        
        if (data.nodes.length > 0) {
            const table = document.querySelector('#table');
            table.innerHTML = '';

            const firstRow = document.createElement('tr');
            firstRow.appendChild(document.createElement('th'));
            for (let i = 0; i < data.nodes.length; i++) {
                const cellHead = document.createElement('th');
                cellHead.innerHTML = `${data.nodes[i].name}`;
                firstRow.appendChild(cellHead);
            }
            table.appendChild(firstRow);

            for (let i = 0; i < data.nodes.length; i++) {
                const row = document.createElement('tr');
                const rowHead = document.createElement('th');
                rowHead.innerHTML = `${data.nodes[i].name}`;
                row.appendChild(rowHead);
                for (let j = 0; j < data.nodes.length; j++) {
                    const cell = document.createElement('td');
                    const input = document.createElement('input');
                    input.style.width = '40px';
                    input.style.margin = '3px';
                    input.value = graph.getWeight(data.nodes[i].name, data.nodes[j].name);
                    
                    if (i == j) {
                        input.setAttribute('disabled', true);
                    }

                    cell.appendChild(input);
                    row.appendChild(cell);
                }
                table.appendChild(row);
            }
        }
    }
}

function handleClickSaveGraph(event) {
    const nodes = cy.nodes().map(x => {
        return {
            name: x.data('name'),
            pos_x: x.position('x'),
            pos_y: x.position('y')
        }
    });

    const edges = cy.edges().map(x => x.data()).map(x => {
        return {
            from: cy.elements(`node[id="${x.source}"]`).data('name'),
            to: cy.elements(`node[id="${x.target}"]`).data('name'),
            weight: x.weight
        }
    });

    const data = { nodes, edges };
    const json = JSON.stringify(data);
    download(json, 'json.txt', 'text/plain');
}

// https://stackoverflow.com/questions/34156282/how-do-i-save-json-to-local-text-file
function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

/**
 * Регистарция всех событий для графа
 */
function registerGraphEventHandlers() {
    cy.on('ehcomplete', handleEdgeCreated);
    cy.on('dbltap', 'node', handleDoubleTapOnNode);
    cy.on('dbltap', 'edge', handleDoubleTapOnEdge);
}

/**
 * Регистрация обработчиков нажатия кнопок
 */
function registerEventHandlers() {
    document.querySelector('#change-mode-btn').addEventListener('click', handleChangeMode);
    document.querySelector('#find-min-path-btn').addEventListener('click', handleClickFindMinPath);
    document.querySelector('#find-all-path-btn').addEventListener('click', handleClickFindAllPath);
    document.querySelector('#solve-dijkstra-btn').addEventListener('click', handleClickDijkstra);
    document.querySelector('#cancel-finding-btn').addEventListener('click', handleClickCancelFinding);
    document.querySelector('#clear-path-btn').addEventListener('click', clearPath);

    document.querySelector('#draw-graph-btn').addEventListener('click', handleClickDrawGraph);
    document.querySelector('#create-graph-btn').addEventListener('click', handleClickCreateGraph);
    
    document.querySelector('#save-graph-btn').addEventListener('click', handleClickSaveGraph);    
    document.querySelector('#load-graph-btn').addEventListener('click', handleClickLoadFile);
    document.querySelector('#file-input').addEventListener('change', handleChangeFile);

    document.querySelector('#log').addEventListener('click', (e) => console.log(graph));
}

// полотно для отрисовки графов
const cy = window.cy = cytoscape({
    container: document.querySelector('.cy'),
    layout: { name: 'breadthfirst' },
    zoomingEnabled: false,
    style: [
        defaultNodeStyle,
        defaultEdgeStyle,
        selectedElementStyle,
        ehNodeStyle,
        ehPreviewAndGhostEdgeStyle,
        ehGhostPreviewEdgeActiveStyle
    ]
});

// управление ребрами
const edgeHandles = cy.edgehandles();

// состояние (перемещение вершин <-> добавление ребер)
var isMovingNodeMode = true;

// начальная и конечная вершины для поиска пути
const pathPlan = { fromVertex: null, toVertex: null };

// время поиска для разных аогритмов
const timeEllapsed = {dijkstra: null, floid: null};

// граф с которым идет работа
var graph = new Graph();

document.addEventListener('DOMContentLoaded', (e) => {
    createContextMenu();
    registerEventHandlers();
    registerGraphEventHandlers();
});