// import Graph from "./src/Graph.mjs";

// const main = () => {
//     const graph = new Graph();
//     graph.addVertex('a');
//     graph.addVertex('b');
//     graph.addVertex('c');
//     graph.addVertex('d');
//     graph.addVertex('e');

//     graph.addEdge('a', 'b', 10);
//     graph.addEdge('a', 'e', 100);
//     graph.addEdge('a', 'd', 30);
//     graph.addEdge('b', 'c', 50);
//     graph.addEdge('c', 'e', 10);
//     graph.addEdge('d', 'c', 20);
//     graph.addEdge('d', 'e', 60);

//     console.log(graph.matrix);

//     const res = graph.dijkstra('a', 'e');
//     console.log(res);
// };

// main();

const main = () => {
    const cy = window.cy = cytoscape({
        container: document.getElementById('cy'),

        style: [
            {
                selector: 'node',
                style: {
                    'content': 'data(name)',
                    'background-color': "rgb(153,153,153)"
                }
            },

            {
                selector: 'edge',
                style: {
                    'curve-style': 'bezier',
                    'target-arrow-shape': 'triangle',
                    'label': 'data(label)',
                    'color': 'green',
                    'edge-text-rotation': 'autorotate'
                }
            },

            {
                selector: ':selected',
                style: {
                    'border-width': 2,
                    'border-color': "rgb(1,105,217)"
                }
            },

            {
                selector: '.eh-handle',
                style: {
                    'background-color': 'red',
                    'width': 12,
                    'height': 12,
                    'shape': 'ellipse',
                    'overlay-opacity': 0,
                    'border-width': 12, // makes the handle easier to hit
                    'border-opacity': 0
                }
            },

            {
                selector: '.eh-hover',
                style: {
                    'background-color': 'red'
                }
            },

            {
                selector: '.eh-source',
                style: {
                    'border-width': 2,
                    'border-color': 'red'
                }
            },

            {
                selector: '.eh-target',
                style: {
                    'border-width': 2,
                    'border-color': 'red'
                }
            },

            {
                selector: '.eh-preview, .eh-ghost-edge',
                style: {
                    'background-color': 'red',
                    'line-color': 'red',
                    'target-arrow-color': 'red',
                    'source-arrow-color': 'red'
                }
            },

            {
                selector: '.eh-ghost-edge.eh-preview-active',
                style: {
                    'opacity': 0
                }
            }
        ],

        layout: {
            name: 'breadthfirst'
        },

        elements: {
            nodes: [],
            edges: []
        },
    });

    const eh = cy.edgehandles();

    cy.on('ehcomplete ', (event, sourceNode, targetNode, addedEdge) => {
        const res = prompt('write weight');
        if (res == null) {
            addedEdge.remove()
            return;
        }
        
        const existingEdges = cy.edges().filter(edge => 
            edge.data('source') == sourceNode.data('id') && 
            edge.data('target') == targetNode.data('id'));
          
        // update/create edge
        if (existingEdges.length > 1) {
            existingEdges[0].data('label', res);
            addedEdge.remove();
        } else {
            addedEdge.data('label', res);
        }

    });

    cy.on('dbltap', 'node', (event) => {
        const vertex = event.target;
        
        const name = prompt('write vertex\'s name', vertex.data('name'));
        if (name == null || name.trim().length == 0) {
            return
        }
        
        event.target.data('name', name);
    });

    let removed;    
    const contextMenu = cy.contextMenus({
        menuItems: [
            {
                id: 'remove',
                content: 'remove',
                tooltipText: 'remove',
                image: {src: "assets/remove.svg", width: 12, height: 12, x: 6, y: 4},
                selector: 'node, edge',
                onClickFunction: function (event) {
                    var target = event.target || event.cyTarget;
                    removed = target.remove();        
                    contextMenu.showMenuItem('undo-last-remove');
                },
                hasTrailingDivider: true
            },

            {
                id: 'undo-last-remove',
                content: 'undo last remove',
                selector: 'node, edge',
                show: false,
                coreAsWell: true,
                onClickFunction: function (event) {
                    if (removed) {
                        removed.restore();
                    }
                    contextMenu.hideMenuItem('undo-last-remove');
                },
                hasTrailingDivider: true
            },
            
            {
                id: 'add-node',
                content: 'add node',
                tooltipText: 'add node',
                image: {src: "assets/add.svg", width: 12, height: 12, x: 6, y: 4},
                coreAsWell: true,
                onClickFunction: function (event) {
                    const name = prompt('write vertex\'s name');
                    if (name == null || name.trim().length == 0) {
                        return;
                    }

                    var data = {
                        group: 'nodes',
                        name: name
                    };
        
                    var pos = event.position || event.cyPosition;
        
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
                id: 'draw-on',
                content: 'draw on',
                tooltipText: 'draw on',
                coreAsWell: true,
                onClickFunction: function (event) {
                    eh.enableDrawMode();    
                    contextMenu.hideMenuItem('draw-on');
                    contextMenu.showMenuItem('draw-off');
                }
            },
    
            {
                id: 'draw-off',
                content: 'draw off',
                tooltipText: 'draw off',
                coreAsWell: true,
                show: false,
                onClickFunction: function (event) {
                    eh.disableDrawMode();    
                    contextMenu.hideMenuItem('draw-off');
                    contextMenu.showMenuItem('draw-on');
                }
            }
        ]
    });
}

document.addEventListener('DOMContentLoaded', main);