const ehNodeStyle = {
    selector: '.eh-source, .eh-target',
    style: {
        'border-width': 2,
        'border-color': 'red'
    }
};

const ehPreviewAndGhostEdgeStyle = {
    selector: '.eh-preview, .eh-ghost-edge',
    style: {
        'background-color': 'red',
        'line-color': 'red',
        'target-arrow-color': 'red',
        'source-arrow-color': 'red'
    }
};

const ehGhostPreviewEdgeActiveStyle = {
    selector: '.eh-ghost-edge.eh-preview-active',
    style: {
        'opacity': 0
    }
};

export { ehNodeStyle, ehPreviewAndGhostEdgeStyle, ehGhostPreviewEdgeActiveStyle };