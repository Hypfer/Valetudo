/**
 * General functions for Valetudo map operations.
 *
 * The functions here are used both on the server and the client.
 * The source file resides in the client/js folder to facilitate deployment.
 */

const MapFunctions = function() {

};

/**
 * Converts an index in the map array to coordinates.
 *
 * @param index index to convert
 * @param width map width
 * @param height map height
 * @param size map entry size
 * @returns {number[]} coordinates as an array [x,y]
 */


MapFunctions.mapIndexToMapCoord = function(index, width, height, size) {
    let ridx = index / size;
    let x = ridx % width;
    return [x, (ridx - x) / width ];
};

/**
 * Converts coordinates to an index in the map array.
 * This is the inverse of mapIndexToMapCoord.
 *
 * @param {number[]} coord coordinates as an array [x,y]
 * @param {number} width map width
 * @param {number} height map height
 * @param {number} size map entry size
 * @returns {number} the map array index for the coordinates
 */
MapFunctions.mapCoordToMapIndex = function(coord, width, height, size) {
    return size * (coord[0] + coord[1] * width);
};

/**
 * Generic function to apply a transformation function to coordinates.
 *
 * @param {Function} transform the transform function to invoke
 * @param {number[]} coord coordinates as an array [x,y]
 * @param {number} width map width
 * @param {number} height map height
 * @returns {any} the result of the transform function, coordinates as an array [x,y]
 */
MapFunctions.applyCoordTransform = function(transform, coord, width, height) {
    return transform(coord, width, height);
};

/**
 * Coordinate transformation function that flips the y coordinate.
 *
 * @param {number[]} coord coordinates as an array [x,y]
 * @param {number} width map width
 * @param {number} height map height
 * @returns {number[]} coordinates coordinates as an array [x,y], where y is flipped.
 */
MapFunctions.TRANSFORM_COORD_FLIP_Y = function(coord, width, height) {
    return [coord[0], height - coord[1] - 1];
};

MapFunctions.logCoordToCanvasCoord = function(coord, flipY) {
    let f = flipY ? -1 : 1;
    let x = Math.round(2048 + coord[0] * 80);
    let y = Math.round(2048 + coord[1] * f * 80);
    return [x,y];
};

MapFunctions.canvasCoordToLogCoord = function(coord, flipY) {
    let f = flipY ? -1 : 1;
    let x = (coord[0] - 2048) / 80;
    let y = ((coord[1] - 2048)) / (f * 80);
    return [x,y];
};

MapFunctions.zoneCoordToLogCoord = function(coord) {
    let zx = coord[0], zy = coord[1];
    // There seems to be an offset of 150 mm in both directions,
    // i.e. goto (-1000, -1000) (zone coords) results in
    // (0.850, 0.850) in log coords.
    let lx = (-zx - 150) / 1000;
    let ly = (-zy - 150) / 1000;
    return [lx, ly];
};

MapFunctions.logCoordToZoneCoord = function(coord) {
    let lx = coord[0], ly = coord[1];
    let zx = -(Math.round(lx * 1000) + 150);
    let zy = -(Math.round(ly * 1000) + 150);
    return [zx, zy];
};

MapFunctions.zoneCoordToCanvasCoord = function(coord, flipY) {
    let lcoord = MapFunctions.zoneCoordToLogCoord(coord);
    return MapFunctions.logCoordToCanvasCoord(lcoord, flipY);
};

MapFunctions.canvasCoordToZoneCoord = function(coord, flipY) {
    let lcoord = MapFunctions.canvasCoordToLogCoord(coord, flipY);
    return MapFunctions.logCoordToZoneCoord(lcoord);
};


try {
    // server-side only
    module.exports = MapFunctions;
} catch (err) {
    /* exception can be ignored on client */
}
