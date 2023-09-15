import Vertex from './Vertex.mjs'
import DijkstraResult from './DijkstraResult.mjs'
import FloidResult from './FloidResult.mjs'

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
    _getNeighborIndexes(indexOfVertex) {
        const neighbors = [];
        for (let j = 0; j < this.matrix.length; j++) {
            if (this.matrix[indexOfVertex][j] != null && this.matrix[indexOfVertex][j] > 0) {
                neighbors.push(j);
            }
        }
        return neighbors;
    }

    floid() {
        // инициализация
        let size =  this.matrix.length
        let dist = new Array(size).fill(0).map(_ => new Array(size).fill(Number.MAX_VALUE));
        let next = new Array(size).fill(0).map(_ => new Array(size).fill(null));
        for (let i = 0; i < size; i++) {
            for (let j = 0; j < size; j++) {
                if (this.matrix[i][j] != null) {
                    dist[i][j] = this.matrix[i][j];
                    next[i][j] = j;
                }
            }
            dist[i][i] = 0;
            next[i][i] = i;
        }

        // поиск путей между всему парами вершин
        for (let k = 0; k < this.matrix.length; k++) {
            for (let i = 0; i < this.matrix.length; i++) {
                for (let j = 0; j < this.matrix.length; j++) {
                    if (dist[i][k] + dist[k][j] < dist[i][j]) {
                        dist[i][j] = dist[i][k] + dist[k][j];
                        next[i][j] = next[i][k];
                    }
                }
            }   
        }

        let allPath = [];
        for (let i = 0; i < dist.length; i++) {
            for (let j = 0; j < dist.length; j++) {
                let path = this._getPath(next, i, j);
                allPath.push(new FloidResult(
                    this.vertexes[i].label,
                    this.vertexes[j].label,
                    path.map(i => this.vertexes[i].label),
                    dist[i][j] == Number.MAX_VALUE ? null : dist[i][j]
                ));
            }
        } 

        return allPath;
    }

    _getPath(next, from, to) {
        if (next[from][to] == null || from == to) {
            return [];
        }

        let path = [from];
        while (from != to) {
            from = next[from][to];
            path.push(from);
        }

        return path;
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
            const neighbors = this._getNeighborIndexes(cur);
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

        // добавление недостающий ячеек
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

        // удаление вершины
        this.vertexes.splice(this.vertexes.indexOf(removingVertex), 1);

        // перемещение колонок влево
        for (let i = 0; i < this.matrix.length; i++) {
            for (let j = removingVertex.index; j < this.matrix.length - 1; j++) {
                this.matrix[i][j] = this.matrix[i][j + 1];
            }
        }

        // перемещение строк вверх
        for (let i = removingVertex.index; i < this.matrix.length - 1; i++) {
            for (let j = 0; j < this.matrix.length; j++) {
                this.matrix[i][j] = this.matrix[i + 1][j];
            }
        }

        // зануляем диагональный элемент
        this.matrix[removingVertex.index][removingVertex.index] = null;        

        // удаление ненужных ячеек
        for (let i = 0; i < this.matrix.length; i++) {
            this.matrix[i].pop();
        }
        this.matrix.pop();
        
        // обновление индексов
        for (let i = 0; i < this.vertexes.length; i++) {
            if (this.vertexes[i].index > removingVertex.index) {
                this.vertexes[i].index -= 1;
            }
        }
    }
}

// graph.addVertex('a');
// graph.addVertex('b');
// graph.addVertex('c');
// graph.addVertex('d');
// graph.addVertex('e');

// graph.addEdge('a', 'b', 10);
// graph.addEdge('a', 'e', 100);
// graph.addEdge('a', 'd', 30);
// graph.addEdge('b', 'c', 50);
// graph.addEdge('c', 'e', 10);
// graph.addEdge('d', 'c', 20);
// graph.addEdge('d', 'e', 60);