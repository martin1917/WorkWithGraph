export default class PathInfo {
    /**
     * @param {string} from начальная вершина
     * @param {string} to конечная вершина
     * @param {string[]} path путь
     * @param {number} distance расстояние
     */
    constructor(from, to, path, distance) {
        this.from = from;
        this.to = to;
        this.path = path;
        this.distance = distance;
    }
}