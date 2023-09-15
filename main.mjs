import Graph from "./src/Graph.mjs";
import {selectedElementStyle, defaultEdgeStyle, defaultNodeStyle} from "./graphStyles.mjs";
import {ehGhostPreviewEdgeActiveStyle, ehPreviewAndGhostEdgeStyle, ehNodeStyle} from "./edgeHandlesStyles.mjs";

/**
 * Обработчик, срабатывающий при создании ребра
 */
const onEdgeCreated = (event, sourceNode, targetNode, addedEdge) => {
    const weight = prompt('Вес ребра');
    if (weight == null || weight.trim().length == 0) {
        addedEdge.remove()
        return;
    }
    
    const existingEdges = cy.edges().filter(edge => 
        edge.data('source') == sourceNode.data('id') && 
        edge.data('target') == targetNode.data('id'));
    
    graph.addEdge(sourceNode.data('name'), targetNode.data('name'), weight - '');
    
    if (existingEdges.length > 1) {
        existingEdges[0].data('weight', weight);
        addedEdge.remove();
    } else {
        addedEdge.data('weight', weight);
    }

    const table = document.querySelector('#table');
    const from = sourceNode.data('name');
    const to = targetNode.data('name');
    
    const row = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(from);
    const col = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(to);
    table.rows[row].cells[col].firstChild.value = weight;
}

/**
 * Обработчик, срабатывающий при двойном нажатии на вершину графа
 */
const onDoubleTapNode = (event) => {
    const vertex = event.target;
    const oldName = vertex.data('name');
    const name = prompt('Имя вершины', oldName);
    if (name == null || name.trim().length == 0) return; 

    const updateRes = graph.updateNameVertex(oldName, name);
    if (!updateRes) {
        alert('Такая вершина уже есть');
        return;
    }

    vertex.data('name', name);
    const table = document.querySelector('#table');
    const index = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(oldName);
    table.rows[0].cells[index].innerHTML = name;
    table.rows[index].cells[0].innerHTML = name;
}

/**
 * Регистарция всех событий для графа
 */
const registerGraphEventHandlers = () => {
    cy.on('ehcomplete', onEdgeCreated);
    cy.on('dbltap', 'node', onDoubleTapNode);
}

/**
 * Создание контекстного меню
 */
const createContextMenu = () => {
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
                        graph.removeVertex(target.data('name'));
                        
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
                        const from = cy.elements(`node[id="${target.data('source')}"]`);
                        const to = cy.elements(`node[id="${target.data('target')}"]`);
                        graph.removeEdge(from.data('name'), to.data('name'));

                        const row = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(from.data('name'));
                        const col = [...table.rows[0].cells].map(x => x.innerHTML).indexOf(to.data('name'));
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
                    if (name == null || name.trim().length == 0) return;
                    const data = { group: 'nodes', name: name };                    
                    const pos = event.position || event.cyPosition;

                    const addResult = graph.addVertex(name);
                    if (addResult) {
                        cy.add({
                            data: data,
                            position: {
                                x: pos.x,
                                y: pos.y
                            }
                        });
                        
                        const table = document.querySelector('#table');

                        if (table.rows.length == 0) {
                            const firstRow = document.createElement("tr");
                            firstRow.appendChild(document.createElement("td"));
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

                    } else {
                        alert('Такая вершина уже существует');
                    }
                }
            }
        ]
    });
}

/**
 * Обработчик, срабатывающий при изменении режима
 * (добавление ребер <-> перемещение вершин)
 */
const onChangeMode = (event) => {
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
const onTapOnNode = (event) => {
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
 * Обработчик, срабатывающий при нажатии на кнопку "поиск мин. пути"
 */
const onClickFindMinPath = (event) => {
    cy.nodes().lock();
    cy.addListener('tap', 'node', onTapOnNode);
    document.querySelector('#state-information').innerHTML = 'Выберите первую вершину';    

    document.querySelector('#solve-dijkstra-btn').style.display = 'inline-block';
    document.querySelector('#cancel-finding-btn').style.display = 'inline-block';
    document.querySelector('#clear-path-btn').style.display = 'inline-block';
    document.querySelector('#change-mode-btn').style.display = 'none';
    document.querySelector('#find-min-path-btn').style.display = 'none';
}

/**
 * Обработчик, срабатывающий при нажатии на кнопку "отменить поиск"
 */
const onClickCancelFinding = (event) => {
    cy.nodes().unlock();
    cy.removeListener('tap', 'node', onTapOnNode);
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
}

/**
 * Обработчик, срабатывающий при нажатии на кнопку "найти по алгоритму Дейкстры"
 */
const onClickDijkstra = (event) => {
    if (pathPlan.fromVertex != null && pathPlan.toVertex != null) {
        const res = graph.dijkstra(pathPlan.fromVertex.data('name'), pathPlan.toVertex.data('name'));
        if (res == null) {
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
 * убрать с графа отмеченный путь
 */
const clearPath = () => {
    pathPlan.fromVertex = null;
    pathPlan.toVertex = null;
    cy.nodes().style("background-color", defaultNodeStyle.style["background-color"]);
    cy.edges().style("line-color", defaultEdgeStyle.style["line-color"]);
    document.querySelector('#state-information').innerHTML = 'Выберите первую вершину';
}

/**
 * Обработчик, срабатывающий при нажатии на кнопку "Создать граф"
 */
const onClickCreateGraph = (event) => {
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
    
    graph = new Graph();
    for (let i = 1; i <= n; i++) {
        graph.addVertex(`${i}`);
    }

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
 * Обработчик, срабатывающий при нажатии на кнопку "Нарисовать граф"
 */
const onClickDrawGraph = (event) => {
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
            if (weight != null) {
                const from = table.rows[i].cells[0].innerHTML;
                const to = table.rows[0].cells[j].innerHTML;
    
                graph.addEdge(from, to, weight);
    
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

/**
 * Регистрация обработчиков нажатия кнопок
 */
const registerEventHandlers = () => {
    document.querySelector('#change-mode-btn').addEventListener('click', onChangeMode);
    document.querySelector('#find-min-path-btn').addEventListener('click', onClickFindMinPath);
    document.querySelector('#cancel-finding-btn').addEventListener('click', onClickCancelFinding);
    document.querySelector('#solve-dijkstra-btn').addEventListener('click', onClickDijkstra);
    document.querySelector('#clear-path-btn').addEventListener('click', clearPath);
    document.querySelector('#log').addEventListener('click', (e) => console.log(graph));

    document.querySelector('#create-graph-btn').addEventListener('click', onClickCreateGraph);
    document.querySelector('#draw-graph-btn').addEventListener('click', onClickDrawGraph);
}

var cy = window.cy = cytoscape({
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
const edgeHandles = cy.edgehandles();
const pathPlan = { fromVertex: null, toVertex: null };
var isMovingNodeMode = true;
var graph = new Graph();

document.addEventListener('DOMContentLoaded', (e) => {
    createContextMenu();
    registerEventHandlers();
    registerGraphEventHandlers();
});