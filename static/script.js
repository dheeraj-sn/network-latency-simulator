let cy = cytoscape({
    container: document.getElementById('cy'),
    elements: [
      { data: { id: 'A' } },
      { data: { id: 'B' } },
      { data: { id: 'C' } },
      { data: { id: 'D' } },
      { data: { source: 'A', target: 'B', weight: 2 } },
      { data: { source: 'A', target: 'C', weight: 1 } },
      { data: { source: 'B', target: 'D', weight: 1 } },
      { data: { source: 'C', target: 'D', weight: 5 } }
    ],
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(id)',
          'background-color': '#666',
          'color': '#fff',
          'text-valign': 'center',
          'text-halign': 'center'
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
          'curve-style': 'bezier'
        }
      },
      {
        selector: '.highlight',
        style: {
          'line-color': '#0074D9',
          'width': 4
        }
      }
    ]
  });
  
  function runDijkstra() {
    let graph = {};
    cy.nodes().forEach(node => {
      graph[node.id()] = [];
    });
    cy.edges().forEach(edge => {
      let source = edge.source().id();
      let target = edge.target().id();
      let weight = parseFloat(edge.data('weight'));
      graph[source].push({ to: target, weight: weight });
      graph[target].push({ to: source, weight: weight }); // undirected
    });
  
    fetch('/dijkstra', {
      method: 'POST',
      body: JSON.stringify({ graph: graph, start: 'A' })
    })
      .then(res => res.json())
      .then(data => {
        const { distances, parents } = data;
  
        // Reset styles
        cy.elements().removeClass('highlight');
  
        for (let child in parents) {
          let parent = parents[child];
          let edge = cy.edges().filter(e =>
            (e.source().id() === parent && e.target().id() === child) ||
            (e.target().id() === parent && e.source().id() === child)
          );
          edge.addClass('highlight');
        }
  
        cy.nodes().forEach(node => {
          let dist = distances[node.id()];
          node.style('background-color', `hsl(${Math.min(dist * 20, 120)}, 70%, 50%)`);
        });
  
        console.log("Shortest path tree:", parents);
        console.log("Distances:", distances);
      });
  }