import {MapAreaVertex} from "./MapAreaVertex";
import {PossibleSegmentId, SegmentColorId, SegmentId} from "./ColorUtils";

export class MapAreaGraph {
    vertices: Array<MapAreaVertex>;
    vertexLookup: Map<SegmentId, MapAreaVertex>;


    constructor(vertices: Array<MapAreaVertex>) {
        this.vertices = vertices;
        this.vertexLookup = new Map();

        this.vertices.forEach((v) => {
            this.vertexLookup.set(v.id, v);
        });
    }

    connectVertices(id1 : PossibleSegmentId, id2: PossibleSegmentId) {
        if (id1 !== undefined && id2 !== undefined && id1 !== id2) {
            if (this.vertexLookup.has(id1)) {
                this.vertexLookup.get(id1)!.appendVertex(id2);
            }
            if (this.vertexLookup.has(id2)) {
                this.vertexLookup.get(id2)!.appendVertex(id1);
            }
        }
    }

    /**
     * Color the graphs vertices using a greedy algorithm. Any vertices that have already been assigned a color will not be changed.
     * Color assignment will start with the vertex that is connected with the highest number of edges. In most cases, this will
     * naturally lead to a distribution where only four colors are required for the whole graph. This is relevant for maps with a high
     * number of segments, as the naive, greedy algorithm tends to require a fifth color when starting coloring in a segment far from the map's center.
     *
     */
    colorAllVertices() {
        this.vertices.sort((l, r) => {
            return r.adjacentVertexIds.size - l.adjacentVertexIds.size;
        });

        this.vertices.forEach((v) => {
            if (v.adjacentVertexIds.size <= 0) {
                v.color = 0;
            } else {
                const adjacentVertices = this.getAdjacentVertices(v);

                const existingColors = adjacentVertices
                    .filter((vert) => {
                        return vert.color !== undefined;
                    })
                    .map((vert) => {
                        return vert.color;
                    }) as Array<number>;

                v.color = this.lowestColor(existingColors);
            }
        });
    }

    getAdjacentVertices(vertex: MapAreaVertex): Array<MapAreaVertex> {
        return Array.from(vertex.adjacentVertexIds).map((id) => {
            return this.getById(id);
        }).filter(adjacentVertex => {
            return adjacentVertex !== undefined;
        }) as Array<MapAreaVertex>;
    }

    getById(id: string): MapAreaVertex | undefined {
        return this.vertices.find((v) => {
            return v.id === id;
        });
    }

    lowestColor(colors: Array<SegmentColorId>) {
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
