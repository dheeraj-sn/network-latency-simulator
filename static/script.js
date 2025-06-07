let cy = cytoscape({
  container: document.getElementById('cy'),
  elements: [],
  style: [
    {
      selector: 'node',
      style: {
        'label': 'data(id)',
        'background-color': '#666',
        'color': '#fff',
        'text-valign': 'center',
        'text-halign': 'center',
        'border-width': 2,
        'border-color': '#ccc'
      }
    },
    {
      selector: '.selected-node',
      style: {
        'border-width': 4,
        'border-color': '#0074D9',
        'background-color': '#0074D9',
        'color': '#fff'
      }
    },
    {
      selector: 'edge',
      style: {
        'label': 'data(weight)',
        'width': 2,
        'line-color': '#ccc',
        'target-arrow-shape': 'triangle',
        'target-arrow-color': '#ccc',
        'curve-style': 'bezier',
        'font-size': 10,
        'text-background-color': '#fff',
        'text-background-opacity': 0.8,
        'text-background-padding': 2,
        'text-margin-y': -10
      }
    },
    {
      selector: '.highlight',
      style: {
        'line-color': '#0074D9',
        'width': 4,
        'target-arrow-color': '#0074D9',
        'font-weight': 'bold'
      }
    }
  ],
  layout: { name: 'grid' }
});

let nodeCount = 0;
let selectedNode = null;

const weightInput = document.getElementById('weightInput');

// Add node on background click
cy.on('tap', function (e) {
  if (e.target === cy) {
    let id = String.fromCharCode(65 + nodeCount); // A, B, C, ...
    if (cy.getElementById(id).length > 0) {
      // If node id already exists, just increment
      nodeCount++;
      id = String.fromCharCode(65 + nodeCount);
    }
    cy.add({
      group: 'nodes',
      data: { id: id },
      position: e.position
    });
    nodeCount++;
  }
});

// Edge creation on node clicks
cy.on('tap', 'node', function (evt) {
  let node = evt.target;

  // Clicking the same node again cancels selection
  if (selectedNode && selectedNode === node) {
    selectedNode.removeClass('selected-node');
    selectedNode = null;
    weightInput.style.display = 'none';
    return;
  }

  if (selectedNode && selectedNode !== node) {
    // Show input near the second clicked node
    const pos = node.renderedPosition();
    const containerRect = cy.container().getBoundingClientRect();

    // Position input relative to container + node rendered position
    weightInput.style.left = (containerRect.left + pos.x) + 'px';
    weightInput.style.top = (containerRect.top + pos.y) + 'px';
    weightInput.style.display = 'block';
    weightInput.value = '1'; // default weight
    weightInput.focus();

    function createEdge() {
      const weight = parseFloat(weightInput.value);
      if (!isNaN(weight)) {
        cy.add({
          group: 'edges',
          data: {
            source: selectedNode.id(),
            target: node.id(),
            weight: weight
          }
        });
      }
      weightInput.style.display = 'none';
      selectedNode.removeClass('selected-node');
      selectedNode = null;
      weightInput.removeEventListener('blur', onBlur);
      weightInput.removeEventListener('keydown', onKeyDown);
    }

    function onBlur() {
      createEdge();
    }

    function onKeyDown(e) {
      if (e.key === 'Enter') {
        createEdge();
      }
      if (e.key === 'Escape') {
        weightInput.style.display = 'none';
        selectedNode.removeClass('selected-node');
        selectedNode = null;
        weightInput.removeEventListener('blur', onBlur);
        weightInput.removeEventListener('keydown', onKeyDown);
      }
    }

    weightInput.addEventListener('blur', onBlur);
    weightInput.addEventListener('keydown', onKeyDown);

  } else {
    if (selectedNode) selectedNode.removeClass('selected-node');
    selectedNode = node;
    node.addClass('selected-node');
    weightInput.style.display = 'none';
  }
});

// Delete selected node or edge with Delete or Backspace
document.addEventListener('keydown', function (e) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    cy.$(':selected').remove();
  }
});

// Clear the entire graph
function clearGraph() {
  cy.elements().remove();
  nodeCount = 0;
  selectedNode = null;
  weightInput.style.display = 'none';
}

// Run Dijkstra algorithm via backend call
function runDijkstra() {
  let start = prompt("Enter start node ID (e.g., A):");
  if (!start || !cy.getElementById(start).length) {
    alert("Invalid start node.");
    return;
  }

  let graph = {};
  cy.nodes().forEach(n => {
    graph[n.id()] = [];
  });

  cy.edges().forEach(e => {
    const src = e.source().id();
    const tgt = e.target().id();
    const weight = parseFloat(e.data('weight')) || 1;
    graph[src].push({ to: tgt, weight });
    graph[tgt].push({ to: src, weight }); // for undirected graph
  });

  fetch('/dijkstra', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ graph: graph, start: start })
  })
    .then(res => res.json())
    .then(data => {
      const { distances, parents } = data;

      cy.elements().removeClass('highlight');

      // Highlight shortest path tree edges
      for (let child in parents) {
        let parent = parents[child];
        cy.edges().filter(e =>
          (e.source().id() === parent && e.target().id() === child) ||
          (e.source().id() === child && e.target().id() === parent)
        ).addClass('highlight');
      }

      // Color nodes based on distance (green for close, red for far)
      cy.nodes().forEach(n => {
        const dist = distances[n.id()];
        if (dist !== undefined && dist < 1e9) {
          // Map distance to hue 120(green) → 0(red)
          let hue = Math.max(0, 120 - dist * 15);
          n.style('background-color', `hsl(${hue}, 70%, 50%)`);
        } else {
          n.style('background-color', '#666');
        }
      });

      console.log("Distances:", distances);
      console.log("Parents:", parents);
    })
    .catch(err => {
      alert("Error running Dijkstra: " + err);
    });
}