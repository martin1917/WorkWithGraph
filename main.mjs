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
const registerEventHandlers = (cy) => {
    cy.on('ehcomplete', onEdgeCreated);
    cy.on('dbltap', 'node', onDoubleTapNode);
}

/**
 * создание контекстного меню
 */
const createContextMenu = (cy) => {
    let removed;    
    const eh = cy.edgehandles();
    return cy.contextMenus({
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
                    const name = prompt('write vertex\'s name');
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
            },

            {
                id: 'add-edge-mode',
                content: 'Режим "Добавления ребер"',
                coreAsWell: true,
                onClickFunction: function (event) {
                    eh.enableDrawMode();    
                    contextMenu.hideMenuItem('add-edge-mode');
                    contextMenu.showMenuItem('move-node-mode');
                }
            },
    
            {
                id: 'move-node-mode',
                content: 'Режим "Перемещения вершин"',
                coreAsWell: true,
                show: false,
                onClickFunction: function (event) {
                    eh.disableDrawMode();    
                    contextMenu.hideMenuItem('move-node-mode');
                    contextMenu.showMenuItem('add-edge-mode');
                }
            }
        ]
    });
}

const main = () => {
    const cy = window.cy = cytoscape({
        container: document.getElementById('cy'),
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

    registerEventHandlers(cy);
    createContextMenu(cy);
}

document.addEventListener('DOMContentLoaded', main);