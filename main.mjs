import Graph from "./src/Graph.mjs";
import DijkstraResult from "./src/DijkstraResult.mjs";
import {selectedElementStyle} from "./graphStyles.mjs";
import {defaultEdgeStyle} from "./graphStyles.mjs";
import {defaultNodeStyle} from "./graphStyles.mjs";
import {ehGhostPreviewEdgeActiveStyle} from "./edgeHandlesStyles.mjs";
import {ehPreviewAndGhostEdgeStyle} from "./edgeHandlesStyles.mjs";
import {ehNodeStyle} from "./edgeHandlesStyles.mjs";

const graph = new Graph();

/**
 * обработчик, вызываемый при создании ребра между вершинами
 * @param {*} event объект события
 * @param {*} sourceNode начальная вершина
 * @param {*} targetNode конечная вершина
 * @param {*} addedEdge созданное ребро
 */
const onEdgeCreated = (event, sourceNode, targetNode, addedEdge) => {
    const res = prompt('Вес ребра');
    if (res == null || res.trim().length == 0) {
        addedEdge.remove()
        return;
    }
    
    const existingEdges = cy.edges().filter(edge => 
        edge.data('source') == sourceNode.data('id') && 
        edge.data('target') == targetNode.data('id'));
    
    if (existingEdges.length > 1) {
        existingEdges[0].data('label', res);
        addedEdge.remove();
    } else {
        addedEdge.data('label', res);
    }
}

/**
 * обработчик вызываемый при двойнном нажатии на вершину
 * @param {*} event объект события
 */
const onDoubleTapNode = (event) => {
    const vertex = event.target;    
    const name = prompt('Имя вершины', vertex.data('name'));
    if (name == null || name.trim().length == 0) return; 
    vertex.data('name', name);
}

/**
 * регистрация всех обработчиков
 */
const registerEventHandlers = () => {
    const cy = window.cy;
    cy.on('ehcomplete', onEdgeCreated);
    cy.on('dbltap', 'node', onDoubleTapNode);
}

/**
 * создание контекстного меню
 */
const createContextMenu = () => {
    let removed;
    const cy = window.cy;
    const contextMenu = cy.contextMenus({
        menuItems: [
            {
                id: 'remove',
                content: 'Удалить',
                image: {src: "assets/remove.svg", width: 12, height: 12, x: 6, y: 4},
                selector: 'node, edge',
                hasTrailingDivider: true,
                onClickFunction: function (event) {
                    const target = event.target || event.cyTarget;
                    removed = target.remove();        
                    contextMenu.showMenuItem('undo-last-remove');
                },
            },

            {
                id: 'undo-last-remove',
                content: 'Отменить последнее изменение',
                selector: 'node, edge',
                show: false,
                coreAsWell: true,
                hasTrailingDivider: true,
                onClickFunction: function (event) {
                    if (removed) {
                        removed.restore();
                    }
                    contextMenu.hideMenuItem('undo-last-remove');
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

                    const data = {
                        group: 'nodes',
                        name: name
                    };
                    
                    const pos = event.position || event.cyPosition;
                    
                    cy.add({
                        data: data,
                        position: {
                            x: pos.x,
                            y: pos.y
                        }
                    });
                }
            }
        ]
    });
}

/**
 * Создание обработчика для изменения режима 
 * (добавление ребер <-> перемещение вершин)
 */
const changeMode = () => {
    let isMovingNodeMode = true;
    const eh = cy.edgehandles();
    return (event) => {
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
    };
}

const tapOnNode = () => {
    let fromVertex = null;
    let toVertex = null;
    
    return (event) => {        
        if (fromVertex == null && toVertex == null) {
            fromVertex = event.target;
            fromVertex.style('background-color', 'lightgreen');
            const text = `Выберите вторую вершину (${fromVertex.data('name')} -> )`;
            document.querySelector('#state-information').innerHTML = text;
        }
        else if (fromVertex != null && toVertex == null) {
            if (event.target == fromVertex) {
                fromVertex.style('background-color', defaultNodeStyle.style["background-color"]);
                document.querySelector('#state-information').innerHTML = 'Выберите первую вершину';
                fromVertex = null;
            } else {
                toVertex = event.target;
                toVertex.style('background-color', 'lightgreen');
                const text = `Вершины выбраны (${fromVertex.data('name')} -> ${toVertex.data('name')})`;
                document.querySelector('#state-information').innerHTML = text;
            }
        }
        else if (fromVertex != null && toVertex != null) {
            if (event.target == toVertex) {
                toVertex.style('background-color', defaultNodeStyle.style["background-color"]);
                const text = `Выберите вторую вершину (${fromVertex.data('name')} -> )`;
                document.querySelector('#state-information').innerHTML = text;
                toVertex = null;
            }    
            if (event.target == fromVertex) {
                fromVertex.style('background-color', defaultNodeStyle.style["background-color"]);
                fromVertex = toVertex;
                toVertex = null;
                const text = `Выберите вторую вершину (${fromVertex.data('name')} -> )`;
                document.querySelector('#state-information').innerHTML = text;
            }
        }

        console.log(`FROM ${fromVertex != null ? fromVertex.data('name') : 'нет'}`);
        console.log(`TO ${toVertex != null ? toVertex.data('name') : 'нет'}`);
        console.log('-----------------------------');
    }
}

let tmp = null;
const onClickFindMinPath = (event) => {
    const cy = window.cy;
    document.querySelector('#state-information').innerHTML = 'Выберите первую вершину';
    cy.nodes().lock();
    tmp = tapOnNode();
    cy.addListener('tap', 'node', tmp);
}

const main = () => {
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

    registerEventHandlers();
    createContextMenu();

    document.querySelector('#change-mode-btn').addEventListener('click', changeMode());
    document.querySelector('#find-min-path-btn').addEventListener('click', onClickFindMinPath);
    document.querySelector('#cancel-finding-btn').addEventListener('click', (event) => {
        if (tmp != null) {
            cy.removeListener('tap', 'node', tmp);
            cy.nodes().unlock();
            cy.nodes().style("background-color", defaultNodeStyle.style["background-color"]);
        }
    });
}

document.addEventListener('DOMContentLoaded', main);