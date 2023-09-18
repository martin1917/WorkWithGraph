export default class DijkstraResult {
    /**
     * @param {string} from начальная вершина
     * @param {string} to конечная вершина
     * @param {number} distance расстояние
     * @param {string[]} path путь
     */
    constructor(from, to, distance, path) {
        this.from = from;
        this.to = to;
        this.distance = distance;
        this.path = path;
    }
}