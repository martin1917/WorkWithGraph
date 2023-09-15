export default class DijkstraResult {
    /**
     * @param {number} distance расстояние
     * @param {string[]} path путь
     */
    constructor(distance, path) {
        this.distance = distance;
        this.path = path;
    }
}