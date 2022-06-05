import {PossibleSegmentColorId, SegmentId} from "./ColorUtils";

export class MapAreaVertex {
    id: SegmentId;
    adjacentVertexIds: Set<SegmentId>;
    color: PossibleSegmentColorId;

    constructor(id: SegmentId) {
        this.id = id;
        this.adjacentVertexIds = new Set();

        this.color = undefined;
    }

    appendVertex(vertexId: string) {
        if (vertexId !== undefined) {
            this.adjacentVertexIds.add(vertexId);
        }
    }
}
