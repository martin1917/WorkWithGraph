const defaultNodeStyle = {
    selector: 'node',
    style: {
        'content': 'data(name)',
        'background-color': "rgb(128, 128, 128)",
    }
};

const defaultEdgeStyle = {
    selector: 'edge',
    style: {
        'curve-style': 'bezier',
        'target-arrow-shape': 'triangle',
        'label': 'data(label)',
        'line-color': 'grey',
        'edge-text-rotation': 'autorotate'
    }
};

const selectedElementStyle = {
    selector: ':selected',
    style: {
        'border-width': 2,
        'border-color': "rgb(1,105,217)"
    }
};

export { defaultNodeStyle, defaultEdgeStyle, selectedElementStyle };