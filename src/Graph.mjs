import Vertex from './Vertex.mjs'
import DijkstraResult from './DijkstraResult.mjs'

export default class Graph {
    constructor() {
        this.vertexes = [];
        this.matrix = [];
    }

    updateNameVertex(oldName, name) {
        for (let vertex of this.vertexes) {
            if (vertex.label == name) {
                return false;
            }
        }

        const vertex = this.vertexes.filter(v => v.label == oldName)[0];
        vertex.label = name;
        return true;
    }

    /**
     * Получение индексов соседних вершин
     * @param {number} indexOfVertex индекс вершины, для которой производится поиск
     * @returns {number[]} список соседних вершин
     */
    getNeighborIndexes(indexOfVertex) {
        const neighbors = [];
        for (let j = 0; j < this.matrix.length; j++) {
            if (this.matrix[indexOfVertex][j] != null && this.matrix[indexOfVertex][j] > 0) {
                neighbors.push(j);
            }
        }
        return neighbors;
    }

    /**
     * Поиск кратчайшего пути по алгоритму Дейкстры
     * @param {string} from название начальной вершины
     * @param {string} to название конечной вершины
     */
    dijkstra(from, to) {
        const fromVertex = this.vertexes.filter(v => v.label == from)[0];
        const toVertex = this.vertexes.filter(v => v.label == to)[0];
        
        let err = '';
        if (fromVertex == undefined) {
            err += `веришны ${from} не существует\n`;
        }
        if (toVertex == undefined) {
            err += `веришны ${to} не существует\n`;
        }

        if (err.length != 0) {
            console.log(`не удалось расчитать минимальный путь.\n${err}`);
            return null;
        }

        const N = this.matrix.length;
        
        // минимальные расстояния до всех вершин из заданной
        const distances = new Array(N).fill(Number.MAX_VALUE);
        distances[fromVertex.index] = 0;

        // переходы
        const steps = {};
        steps[fromVertex.index] = -1;

        // посещенные вершины
        const visitted = [fromVertex.index];

        let cur = fromVertex.index;
        while (cur != toVertex.index) {
            // вычисление мин. путей до соседей
            const neighbors = this.getNeighborIndexes(cur);
            for (let neighbor of neighbors) {
                if (visitted.indexOf(neighbor) == -1) {
                    const newWeight = distances[cur] + this.matrix[cur][neighbor];
                    if (newWeight < distances[neighbor]) {
                        distances[neighbor] = newWeight;
                        steps[neighbor] = cur;
                    }
                }
            }
            
            // выбор следующей вершины с минимальным расстоянием
            let currentMinDist = Number.MAX_VALUE;
            let nextVertex = -1;
            for (let i = 0; i < distances.length; i++) {
                if (visitted.indexOf(i) == -1 && distances[i] < currentMinDist) {
                    currentMinDist = distances[i];
                    nextVertex = i;
                }
            }
            cur = nextVertex;

            if (cur == -1) return null;
            visitted.push(cur);
        }
        
        // восстановление кратчайшего пути
        const path = [to];
        let index = toVertex.index;
        while (steps[index] != -1) {
            const prevVertex = this.vertexes.filter(x => x.index == steps[index])[0]
            path.push(prevVertex.label);
            index = steps[index];
        }
        
        return new DijkstraResult(distances[toVertex.index], path.reverse());
    }

    /**
     * Добавление вершины
     * @param {string} name название вершины
     */
    addVertex(name) {
        const existedVertex = this.vertexes.filter(v => v.label == name)[0];
        if (existedVertex != undefined) {
            console.log(`не удалось добавить вершину. (веришна '${name}' уже существует)`);
            return false;
        }

        // add essential cells
        for (let i = 0; i < this.matrix.length; i++) {
            this.matrix[i].push(null);
        }
        this.matrix.push(new Array(this.matrix.length + 1).fill(null));
        
        const vertex = new Vertex(name);
        vertex.index = this.matrix.length - 1;
        this.vertexes.push(vertex);
        return true;
    }

    /**
     * Удаление ребра
     * @param {string} from название начальной вершины
     * @param {string} to название конечной вершины
     */
    removeEdge(from, to) {
        this.addEdge(from, to, null);
    }

    /**
     * Добавление ребра
     * @param {string} from название начальной вершины
     * @param {string} to название конечной вершины
     * @param {number} weight вес ребра
     */
    addEdge(from, to, weight) {
        const fromVertex = this.vertexes.filter(v => v.label == from)[0];
        const toVertex = this.vertexes.filter(v => v.label == to)[0];
        
        let err = '';
        if (fromVertex == undefined) {
            err += `веришны ${from} не существует\n`;
        }
        if (toVertex == undefined) {
            err += `веришны ${to} не существует\n`;
        }

        if (err.length != 0) {
            console.log(`не удалось добавить ребро.\n${err}`);
            return;
        }

        this.matrix[fromVertex.index][toVertex.index] = weight;
    }

    /**
     * Получение веса ребра
     * @param {string} from название начальной вершины
     * @param {string} to название конечной вершины
     * @returns {number} вес ребра
     */
    getWeight(from, to) {
        const fromVertex = this.vertexes.filter(v => v.label == from)[0];
        const toVertex = this.vertexes.filter(v => v.label == to)[0];
        
        let err = '';
        if (fromVertex == undefined) {
            err += `веришны ${from} не существует\n`;
        }
        if (toVertex == undefined) {
            err += `веришны ${to} не существует\n`;
        }

        if (err.length != 0) {
            console.log(`не удалось получить вес ребра.\n${err}`);
            return;
        }

        return this.matrix[fromVertex.index][toVertex.index];
    }

    /**
     * Удаление вершины
     * @param {string} name название вершины
     */
    removeVertex(name) {
        const removingVertex = this.vertexes.filter(v => v.label == name)[0];
        if (removingVertex == undefined) {
            console.log(`не удалось удалить вершину. (веришна '${name}' не существует)`);
            return;
        }

        // remove vertex
        this.vertexes.splice(this.vertexes.indexOf(removingVertex), 1);

        // move columns to left
        for (let i = 0; i < this.matrix.length; i++) {
            for (let j = removingVertex.index; j < this.matrix.length - 1; j++) {
                this.matrix[i][j] = this.matrix[i][j + 1];
            }
        }

        // move rows to up
        for (let i = removingVertex.index; i < this.matrix.length - 1; i++) {
            for (let j = 0; j < this.matrix.length; j++) {
                this.matrix[i][j] = this.matrix[i + 1][j];
            }
        }

        // set null value to diagonal cell
        this.matrix[removingVertex.index][removingVertex.index] = null;        

        // remove useless cells
        for (let i = 0; i < this.matrix.length; i++) {
            this.matrix[i].pop();
        }
        this.matrix.pop();

        // update indexes for remained vertexes
        for (let i = 0; i < this.vertexes.length; i++) {
            if (this.vertexes[i].index > removingVertex.index) {
                this.vertexes[i].index -= 1;
            }
        }
    }
}

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