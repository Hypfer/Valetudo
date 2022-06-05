import {MapAreaVertex} from "./MapAreaVertex";
import {MapAreaGraph} from "./MapAreaGraph";
import {RawMapLayer} from "../../../api";
import {create2DArray, PossibleSegmentId, SegmentColorId, SegmentId} from "./ColorUtils";

export class FourColorTheoremSolver {
    /*
     * This class determines how to color the different map segments contained in the given layers object.
     * The resulting color mapping will ensure that no two adjacent segments share the same color.
     * The map is evaluated row-by-row and column-by-column in order to find every pair of segments that are in "line of sight" of each other.
     * Each pair of segments is then represented as an edge in a graph where the vertices represent the segments themselves.
     * We then use a simple greedy algorithm to color all vertices so that none of its edges connect it to a vertex with the same color.
     *
     * @param {Array<object>} layers - the data containing the map image (array of pixel offsets)
     * @param {number} pixelSize - Used to calculate the resolution of the theorem. Assumes a robot diameter of 30cm and calculates the minimum size of a room.
     */
    private readonly stepFunction: (c: number) => number;
    private readonly areaGraph: MapAreaGraph | undefined;

    constructor(layers: Array<RawMapLayer>, pixelSize: number) {
        /**
         * @param {number} resolution - Minimal resolution of the map scanner in pixels. Any number higher than one will lead to this many pixels being skipped when finding segment boundaries.
         * For example: If the robot measures 30cm in length/width, this should be set to 6, as no room can be smaller than 6 pixels. This of course implies that a pixel represents 5cm in the real world.
         */
        const resolution = Math.floor(30 / pixelSize);
        this.stepFunction = function (c) {
            return c + resolution;
        };

        const preparedLayers = this.preprocessLayers(layers);
        if (preparedLayers !== undefined) {
            const mapData = this.createPixelToSegmentMapping(preparedLayers);
            this.areaGraph = this.buildGraph(mapData);
            this.areaGraph.colorAllVertices();
        }
    }

    /*
     * @param {string} segmentId - ID of the segment you want to get the color for.
     * The segment ID is extracted from the layer meta data in the first contructor parameter of this class.
     * @returns {number} The segment color, represented as an integer. Starts at 0 and goes up the minimal number of colors required to color the map without collisions.
     */
    getColor(segmentId: string) : SegmentColorId {
        if (this.areaGraph === undefined) {
            // Layer preprocessing seems to have failed. Just return a default value for any input.
            return 0;
        }

        const segmentFromGraph = this.areaGraph.getById(segmentId);

        if (segmentFromGraph && segmentFromGraph.color !== undefined) {
            return segmentFromGraph.color;
        } else {
            return 0;
        }
    }

    private preprocessLayers(layers: Array<RawMapLayer>): PreparedLayers | undefined {
        const internalSegments : Array<{
            segmentId: SegmentId,
            name: string | undefined,
            pixels: Array<Pixel>
        }>= [];

        const boundaries: Boundaries = {
            minX: Infinity,
            maxX: -Infinity,
            minY: Infinity,
            maxY: -Infinity,
        };


        const filteredLayers = layers.filter((layer) => {
            return layer.type === "segment";
        });

        if (filteredLayers.length <= 0) {
            return undefined;
        }

        filteredLayers.forEach((layer) => {
            const allPixels = [];
            for (let index = 0; index < layer.pixels.length - 1; index += 2) {
                const p = {
                    x: layer.pixels[index],
                    y: layer.pixels[index + 1],
                };
                FourColorTheoremSolver.setBoundaries(boundaries, p);
                allPixels.push(p);
            }

            if (layer.metaData.segmentId !== undefined) {
                internalSegments.push({
                    segmentId: layer.metaData.segmentId,
                    name: layer.metaData.name,
                    pixels: allPixels,
                });
            }

        });

        return {
            boundaries: boundaries,
            segments: internalSegments,
        };
    }

    private static setBoundaries(res: Boundaries, pixel: Pixel) {
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

    private createPixelToSegmentMapping(preparedLayers: PreparedLayers) {
        const pixelData = create2DArray(
            preparedLayers.boundaries.maxX + 1,
            preparedLayers.boundaries.maxY + 1
        );
        const segmentIds: Array<SegmentId> = [];

        preparedLayers.segments.forEach((seg) => {
            segmentIds.push(seg.segmentId);

            seg.pixels.forEach((p) => {
                pixelData[p.x][p.y] = seg.segmentId;
            });
        });

        return {
            map: pixelData as Array<Array<string>>,
            segmentIds: segmentIds,
            boundaries: preparedLayers.boundaries,
        };
    }

    private buildGraph(mapData: {map: Array<Array<PossibleSegmentId>>, segmentIds: Array<SegmentId>, boundaries: Boundaries}) {
        const vertices = mapData.segmentIds.map((i) => {
            return new MapAreaVertex(i);
        });

        const graph = new MapAreaGraph(vertices);

        this.traverseMap(
            mapData.boundaries,
            mapData.map,
            (x: number, y: number, currentSegmentId: PossibleSegmentId, pixelData: Array<Array<PossibleSegmentId>>) => {
                const newSegmentId = pixelData[x][y];

                graph.connectVertices(currentSegmentId, newSegmentId);
                return newSegmentId !== undefined ? newSegmentId : currentSegmentId;
            }
        );

        return graph;
    }

    private traverseMap(boundaries: Boundaries, pixelData: Array<Array<PossibleSegmentId>>, func : TraverseFunction) {
        // row-first traversal
        for (
            let y = boundaries.minY;
            y <= boundaries.maxY;
            y = this.stepFunction(y)
        ) {
            let rowFirstSegmentId = undefined;
            for (
                let x = boundaries.minX;
                x <= boundaries.maxX;
                x = this.stepFunction(x)
            ) {
                rowFirstSegmentId = func(x, y, rowFirstSegmentId, pixelData);
            }
        }
        // column-first traversal
        for (
            let x = boundaries.minX;
            x <= boundaries.maxX;
            x = this.stepFunction(x)
        ) {
            let colFirstSegmentId = undefined;
            for (
                let y = boundaries.minY;
                y <= boundaries.maxY;
                y = this.stepFunction(y)
            ) {
                colFirstSegmentId = func(x, y, colFirstSegmentId, pixelData);
            }
        }
    }
}

type Pixel = {
    x: number,
    y: number
}

type Boundaries = {
    minX: number,
    maxX: number,
    minY: number,
    maxY: number
}

type PreparedLayers = {
    boundaries: Boundaries
    segments: Array<{
        segmentId: SegmentId,
        name: string | undefined,
        pixels: Array<Pixel>
    }>
}

type TraverseFunction = (
    x: number,
    y: number,
    currentSegmentId: PossibleSegmentId,
    pixelData: Array<Array<PossibleSegmentId>>
) => PossibleSegmentId
