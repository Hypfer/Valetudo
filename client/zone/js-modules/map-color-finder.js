export class FourColorTheoremSolver {

    /**
     * This class determines how to color the different map segments contained in the given layers object.
     * The resulting color mapping will ensure that no two adjacent segments share the same color.
     * 
     * The map is evaluated row-by-row and column-by-column in order to find every pair of segments that are in "line of sight" of each other.
     * Each pair of segments is then represented as an edge in a graph where the vertices represent the segments themselves.
     * We then use a simple greedy algorithm to color all vertices so that none of its edges connect it to a vertex with the same color.
     * 
     * @param {Array<object>} layers - the data containing the map image (array of pixel offsets)
     */
    constructor(layers) {
        var preparedLayers = this.preprocessLayers(layers);
        var map = this.createPixelToSegmentMapping(preparedLayers);
        this.areaGraph = this.buildGraph(map);
        this.areaGraph.colorAllVertices();
    }

    /**
     * 
     * @param {number} segmentIndex - Zero-based index of the segment you want to get the color for.
     * Segments are in the same order they had when they were passed into the class constructor.
     * @returns {number} The segment color, represented as an integer. Starts at 0 and goes up the minimal number of colors required to color the map without collisions.
     */
    getColor(segmentIndex) {
        return this.areaGraph.getById(segmentIndex).color;
    }

    preprocessLayers(layers) {
        var segmentCounter = 0;
        var internalSegments = [];
        var boundaries = {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity
        }
        layers.filter(layer => layer.type == "segment")
            .forEach(layer => {
                var allPixels = [];
                for (let index = 0; index < layer.pixels.length / 2; index += 2) {
                    var p = {
                        x: layer.pixels[index],
                        y: layer.pixels[index + 1]
                    };
                    this.setBoundaries(boundaries, p);
                    allPixels.push(p);
                }
                internalSegments.push({
                    segmentIndex: segmentCounter++,
                    pixels: allPixels
                });
            });
        return {
            boundaries: boundaries,
            segments: internalSegments
        };
    }

    setBoundaries(res, pixel) {
        if (pixel.x < res.minX) {
            res.minX = pixel.x;
        }
        if (pixel.y < res.minY) {
            res.minY = pixel.y;
        }
        if (pixel.x > res.maxX) {
            res.maxX = pixel.x;
        }
        if (pixel.y > res.maxY) {
            res.maxY = pixel.y;
        }
    }

    createPixelToSegmentMapping(preparedLayers) {
        var pixelData = this.create2DArray(
            preparedLayers.boundaries.maxX + 1,
            preparedLayers.boundaries.maxY + 1
        );
        var numberOfSegments = 0;
        preparedLayers.segments.forEach(seg => {
            numberOfSegments += 1;
            seg.pixels.forEach(p => {
                pixelData[p.x][p.y] = seg.segmentIndex;
            });
        });
        return {
            map: pixelData,
            numberOfSegments: numberOfSegments,
            boundaries: preparedLayers.boundaries
        };
    }

    buildGraph(mapData) {
        var vertices = this.makeArray(mapData.numberOfSegments).map(i => new MapAreaVertex(i));
        var graph = new MapAreaGraph(vertices);
        this.traverseMap(mapData.boundaries, mapData.map, (x, y, currentSegmentId, pixelData) => {
            var newSegmentId = pixelData[x][y];
            graph.connectVertices(currentSegmentId, newSegmentId);
            return newSegmentId != undefined ? newSegmentId : currentSegmentId;
        });
        return graph;
    }

    traverseMap(boundaries, pixelData, func) {
        // row-first traversal        
        for (let y = boundaries.minY; y <= boundaries.maxY; y++) {
            var currentSegmentId = undefined;
            for (let x = boundaries.minX; x <= boundaries.maxX; x++) {
                currentSegmentId = func(x, y, currentSegmentId, pixelData);
            }
        }
        // column-first traversal
        for (let x = boundaries.minX; x <= boundaries.maxX; x++) {
            var currentSegmentId = undefined;
            for (let y = boundaries.minY; y <= boundaries.maxY; y++) {
                currentSegmentId = func(x, y, currentSegmentId, pixelData);
            }
        }
    }

    /**
     * Credit for this function goes to the authors of this StackOverflow answer: https://stackoverflow.com/a/966938
     */
    create2DArray(length) {
        var arr = new Array(length || 0),
            i = length;
        if (arguments.length > 1) {
            var args = Array.prototype.slice.call(arguments, 1);
            while (i--) arr[length - 1 - i] = this.create2DArray.apply(this, args);
        }
        return arr;
    }

    makeArray(n) {
        return Array.apply(null, { length: n }).map(Number.call, Number);
    }
}

class MapAreaVertex {
    constructor(id) {
        this.id = id;
        this.adjacentVertexIds = [];
        this.color = undefined;
    }

    appendVertex(vertexId) {
        if (vertexId != undefined && !this.adjacentVertexIds.includes(vertexId)) {
            this.adjacentVertexIds.push(vertexId);
        }
    }
}

class MapAreaGraph {
    constructor(vertices) {
        this.vertices = vertices;
    }

    connectVertices(id1, id2) {
        if (id1 != undefined && id2 != undefined && id1 != id2) {
            this.getById(id1)?.appendVertex(id2);
            this.getById(id2)?.appendVertex(id1);
        }
    }

    /**
     * Color the graphs vertices using a greedy algorithm. Any vertices that have already been assigned a color will not be changed.
     */
    colorAllVertices() {
        this.vertices.forEach(v => {
            if (v.adjacentVertexIds.length <= 0) {
                v.color = 0;
            }
            else {
                var existingColors = v.adjacentVertexIds.map(vid => this.getById(vid))
                    .filter(vert => vert.color != undefined)
                    .map(vert => vert.color);
                v.color = this.lowestColor(existingColors);
            }
        });
    }

    getById(id) {
        return this.vertices.find(v => v.id == id);
    }

    lowestColor(colors) {
        if (colors.length <= 0) {
            return 0;
        }
        for (let index = 0; index < colors.length + 1; index++) {
            if (!colors.includes(index)) {
                return index;
            }
        }
    }
}