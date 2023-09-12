import Graph from "./src/Graph.mjs";
import {selectedElementStyle, defaultEdgeStyle, defaultNodeStyle} from "./graphStyles.mjs";
import {ehGhostPreviewEdgeActiveStyle, ehPreviewAndGhostEdgeStyle, ehNodeStyle} from "./edgeHandlesStyles.mjs";

const onEdgeCreated = (event, sourceNode, targetNode, addedEdge) => {
    const res = prompt('Вес ребра');
    if (res == null || res.trim().length == 0) {
        addedEdge.remove()
        return;
    }
    
    const existingEdges = cy.edges().filter(edge => 
        edge.data('source') == sourceNode.data('id') && 
        edge.data('target') == targetNode.data('id'));
    
    graph.addEdge(sourceNode.data('name'), targetNode.data('name'), res - '');
    
    if (existingEdges.length > 1) {
        existingEdges[0].data('weight', res);
        addedEdge.remove();
    } else {
        addedEdge.data('weight', res);
    }
}

const onDoubleTapNode = (event) => {
    const vertex = event.target;
    const oldName = vertex.data('name');
    const name = prompt('Имя вершины', oldName);
    if (name == null || name.trim().length == 0) return; 

    const updateRes = graph.updateNameVertex(oldName, name);
    if (updateRes) {
        vertex.data('name', name);
    } else {
        alert('Такая вершина уже есть');
    }
}

const registerGraphEventHandlers = () => {
    cy.on('ehcomplete', onEdgeCreated);
    cy.on('dbltap', 'node', onDoubleTapNode);
}

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
                    } else if (target.isEdge()) {
                        const from = cy.elements(`node[id="${target.data('source')}"]`);
                        const to = cy.elements(`node[id="${target.data('target')}"]`);
                        graph.removeEdge(from.data('name'), to.data('name'));
                    }
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
                    } else {
                        alert('Такая вершина уже существует');
                    }
                }
            }
        ]
    });
}

const onChangeModeHandler = (event) => {
    if (isMovingNodeMode) {
        document.querySelector('#change-mode-btn').innerHTML = 'Выкл. режим "Добавление ребер"';
        document.querySelector('#state-information').innerHTML = 'Добавление ребер';
        eh.enableDrawMode();
    } else {
        document.querySelector('#change-mode-btn').innerHTML = 'Вкл. режим "Добавление ребер"';
        document.querySelector('#state-information').innerHTML = 'Перемещение вершин';
        eh.disableDrawMode();
    }
    isMovingNodeMode = !isMovingNodeMode;
}

const onTapOnNodeHandler = (event) => {
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

const onClickFindMinPath = (event) => {
    cy.nodes().lock();
    cy.addListener('tap', 'node', onTapOnNodeHandler);
    document.querySelector('#state-information').innerHTML = 'Выберите первую вершину';    

    document.querySelector('#solve-dijkstra-btn').style.display = 'inline-block';
    document.querySelector('#cancel-finding-btn').style.display = 'inline-block';
    document.querySelector('#clear-path-btn').style.display = 'inline-block';
    document.querySelector('#change-mode-btn').style.display = 'none';
    document.querySelector('#find-min-path-btn').style.display = 'none';
}

const onClickCancelFinding = (event) => {
    cy.nodes().unlock();
    cy.removeListener('tap', 'node', onTapOnNodeHandler);
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

const onClickDijkstra = (event) => {
    if (pathPlan.fromVertex != null && pathPlan.toVertex != null) {
        const res = graph.dijkstra(pathPlan.fromVertex.data('name'), pathPlan.toVertex.data('name'));
        console.log(res.distance);
        console.log(res.path);

        document.querySelector('#state-information').innerHTML = `Мин. расстояние = ${res.distance}`;

        for (let i = 0; i < res.path.length; i++) {
            const fromVertex = cy.elements(`node[name="${res.path[i]}"]`);
            const toVertex = cy.elements(`node[name="${res.path[i + 1]}"]`);
            const edge = cy.elements(`edge[source="${fromVertex.id()}"][target="${toVertex.id()}"]`);
            edge.style('line-color', 'green');
            fromVertex.style('background-color', 'green');
        }
    }
}

const clearPath = () => {
    pathPlan.fromVertex = null;
    pathPlan.toVertex = null;
    cy.nodes().style("background-color", defaultNodeStyle.style["background-color"]);
    cy.edges().style("line-color", defaultEdgeStyle.style["line-color"]);
    document.querySelector('#state-information').innerHTML = 'Выберите первую вершину';
}

const registerEventHandlers = () => {
    document.querySelector('#change-mode-btn').addEventListener('click', onChangeModeHandler);
    document.querySelector('#find-min-path-btn').addEventListener('click', onClickFindMinPath);
    document.querySelector('#cancel-finding-btn').addEventListener('click', onClickCancelFinding);
    document.querySelector('#solve-dijkstra-btn').addEventListener('click', onClickDijkstra);
    document.querySelector('#clear-path-btn').addEventListener('click', clearPath);

    document.querySelector('#log').addEventListener('click', (e) => console.log(graph));
}

const main = () => {
    registerGraphEventHandlers();
    createContextMenu();
    registerEventHandlers();
}

const cy = window.cy = cytoscape({
    container: document.querySelector('.cy'),
    layout: { name: 'breadthfirst' },
    style: [
        defaultNodeStyle,
        defaultEdgeStyle,
        selectedElementStyle,
        ehNodeStyle,
        ehPreviewAndGhostEdgeStyle,
        ehGhostPreviewEdgeActiveStyle
    ]
});
const eh = cy.edgehandles();
const pathPlan = { fromVertex: null, toVertex: null };
var isMovingNodeMode = true;
const graph = new Graph();

document.addEventListener('DOMContentLoaded', main);