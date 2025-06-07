## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/dheeraj-sn/network-latency-simulator.git
```

### 2. Run the Go server

Make sure you have Go 1.24 or later installed.

```bash
go run main.go
```

The app will be available at: [http://localhost:8080](http://localhost:8080)

### 3. Use the Web Interface

- Click **"Add Node"** to create new nodes labeled A, B, C, ...
- Click two nodes to draw an edge between them
- Enter the edge weight when prompted
- Click **"Run Dijkstra"** and input a start node (e.g., `A`)
- Watch the shortest path get highlighted and nodes colored by distance

---

## 📁 Project Structure

```
.
├── main.go             # Go backend (Dijkstra implementation + API)
└── static/
    ├── index.html      # HTML interface
    └── script.js       # Cytoscape logic for interaction and visualization
```

---

## 📦 Dependencies

- **Backend**
  - [`github.com/oleiade/lane`](https://github.com/oleiade/lane): Priority queue for Dijkstra

- **Frontend**
  - [`Cytoscape.js`](https://js.cytoscape.org/): Interactive graph rendering

---

## ✅ Example Usage

1. Add nodes: A, B, C...
2. Create weighted edges by clicking two nodes
3. Run Dijkstra by specifying a start node
4. View path highlights and dynamic node coloring based on distance
---