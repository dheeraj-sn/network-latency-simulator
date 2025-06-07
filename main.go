package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/oleiade/lane"
)

type Edge struct {
	To     string  `json:"to"`
	Weight float64 `json:"weight"`
}

type Graph map[string][]Edge

type Request struct {
	Graph Graph  `json:"graph"`
	Start string `json:"start"`
}

type Response struct {
	Distances map[string]float64 `json:"distances"`
	Parents   map[string]string  `json:"parents"`
}

type QueueItem struct {
	node     string
	distance float64
}

func dijkstra(graph Graph, start string) (map[string]float64, map[string]string) {
	// Initialize distances map with infinity for all nodes
	distances := make(map[string]float64)
	parents := make(map[string]string)

	// Set initial distances to infinity for all nodes
	for node := range graph {
		distances[node] = 1e9
	}

	// Distance to start node is 0
	distances[start] = 0

	// Initialize priority queue
	pq := lane.NewPQueue(lane.MINPQ)

	// Push start node into priority queue
	pq.Push(QueueItem{
		node:     start,
		distance: 0,
	}, 0) // priority is the distance

	// Main algorithm loop
	for pq.Size() > 0 {
		// Get node with minimum distance
		item, _ := pq.Pop()
		current := item.(QueueItem)

		// If we've found a better path to this node, skip it
		if current.distance > distances[current.node] {
			continue
		}

		// Update distances to neighbors
		for _, edge := range graph[current.node] {
			newDistance := distances[current.node] + edge.Weight
			if newDistance < distances[edge.To] {
				distances[edge.To] = newDistance
				parents[edge.To] = current.node
				// Push the new distance into the priority queue
				pq.Push(QueueItem{
					node:     edge.To,
					distance: newDistance,
				}, int(newDistance))
			}
		}
	}

	return distances, parents
}

func handleDijkstra(w http.ResponseWriter, r *http.Request) {
	var req Request
	_ = json.NewDecoder(r.Body).Decode(&req)
	distances, parents := dijkstra(req.Graph, req.Start)
	res := Response{
		Distances: distances,
		Parents:   parents,
	}
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(res)
}

func main() {
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/", fs)
	http.HandleFunc("/dijkstra", handleDijkstra)
	log.Println("Server started on port 8080")
	http.ListenAndServe(":8080", nil)
}
