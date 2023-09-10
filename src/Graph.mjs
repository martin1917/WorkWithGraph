import Vertex from './Vertex.mjs'

export default class Graph {
    constructor() {
        this.vertexes = [];
        this.matrix = [];
    }

    /**
     * Получение индексов соседних вершин
     * @param {number} indexOfVertex индекс вершины, для которой производится поиск
     * @returns {number[]} список соседних вершин
     */
    getNeighborIndexes(indexOfVertex) {
        const neighbors = [];
        for (let j = 0; j < this.matrix.length; j++) {
            if (this.matrix[indexOfVertex][j] > 0) {
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
            return;
        }

        const N = this.matrix.length;
        
        // минимальные расстояния до всех вершин из заданной
        const dist = new Array(N).fill(Number.MAX_VALUE);
        dist[fromVertex.index] = 0;

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
                    const newWeight = dist[cur] + this.matrix[cur][neighbor];
                    if (newWeight < dist[neighbor]) {
                        dist[neighbor] = newWeight;
                        steps[neighbor] = cur;
                    }
                }
            }
            
            // выбор следующей вершины с минимальным расстоянием
            let currentMinDist = Number.MAX_VALUE;
            let nextVertex = -1;
            for (let i = 0; i < dist.length; i++) {
                if (visitted.indexOf(i) == -1 && dist[i] < currentMinDist) {
                    currentMinDist = dist[i];
                    nextVertex = i;
                }
            }
            cur = nextVertex;
            
            if (cur != -1) {
                visitted.push(cur);
            }
        }
        
        // восстановление кратчайшего пути
        const path = [to];
        let v = toVertex.index;
        while (steps[v] != -1) {
            const prevVertex = this.vertexes.filter(x => x.index == steps[v])[0]
            path.push(prevVertex.label);
            v = steps[v];
        }
        
        return {
            minDist: dist[toVertex.index],
            path: path.reverse()
        };
    }

    /**
     * Добавление вершины
     * @param {string} name название вершины
     */
    addVertex(name) {
        const existedVertex = this.vertexes.filter(v => v.label == name)[0];
        if (existedVertex != undefined) {
            console.log(`не удалось добавить вершину. (веришна '${name}' уже существует)`);
            return;
        }

        // add essential cells
        for (let i = 0; i < this.matrix.length; i++) {
            this.matrix[i].push(null);
        }
        this.matrix.push(new Array(this.matrix.length + 1).fill(null));
        
        const vertex = new Vertex(name);
        vertex.index = this.matrix.length - 1;
        this.vertexes.push(vertex);
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
        for (let i = 0; i < removingVertex.index; i++) {
            for (let j = removingVertex.index; j < this.matrix.length - 1; j++) {
                this.matrix[i][j] = this.matrix[i][j + 1];
            }
        }

        // move rows to up
        for (let i = removingVertex.index; i < this.matrix.length - 1; i++) {
            for (let j = 0; j < removingVertex.index; j++) {
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