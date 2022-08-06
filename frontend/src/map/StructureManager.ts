import {RawMapData, RawMapEntity, RawMapEntityType, RawMapLayer, RawMapLayerType} from "../api";
import RobotPositionMapStructure from "./structures/map_structures/RobotPositionMapStructure";
import ChargerLocationMapStructure from "./structures/map_structures/ChargerLocationMapStructure";
import SegmentLabelMapStructure from "./structures/map_structures/SegmentLabelMapStructure";
import ActiveZoneMapStructure from "./structures/map_structures/ActiveZoneMapStructure";
import MapStructure from "./structures/map_structures/MapStructure";
import ClientStructure from "./structures/client_structures/ClientStructure";
import NoGoAreaMapStructure from "./structures/map_structures/NoGoAreaMapStructure";
import NoMopAreaMapStructure from "./structures/map_structures/NoMopAreaMapStructure";
import VirtualWallMapStructure from "./structures/map_structures/VirtualWallMapStructure";
import GoToTargetMapStructure from "./structures/map_structures/GoToTargetMapStructure";
import {median} from "../utils";
import {PointCoordinates} from "./utils/types";


class StructureManager {
    private mapStructures: Array<MapStructure>;
    private clientStructures: Array<ClientStructure>;
    private pixelSize = 5;

    constructor() {
        this.mapStructures = [];
        this.clientStructures = [];
    }

    setPixelSize(pixelSize: number): void {
        this.pixelSize = pixelSize;
    }

    getPixelSize() : number {
        return this.pixelSize;
    }

    updateMapStructuresFromMapData(rawMap: RawMapData): void {
        this.mapStructures = [
            ...this.buildMapStructuresFromEntityMapData(rawMap.entities),
            ...this.buildMapStructuresFromLayerMapData(rawMap.layers)
        ];

        this.mapStructures.sort((a,b) => {
            return TYPE_SORT_MAPPING[a.type] - TYPE_SORT_MAPPING[b.type];
        });
    }

    private buildMapStructuresFromEntityMapData(entities: Array<RawMapEntity>): Array<MapStructure> {
        const mapStructures: Array<MapStructure> = [];

        entities.forEach(e => {
            switch (e.type) {
                case RawMapEntityType.RobotPosition: {
                    const p0 = this.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});

                    mapStructures.push(new RobotPositionMapStructure(p0.x, p0.y, e.metaData.angle ?? 0));
                    break;
                }
                case RawMapEntityType.ChargerLocation: {
                    const p0 = this.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});

                    mapStructures.push(new ChargerLocationMapStructure(p0.x, p0.y));
                    break;
                }
                case RawMapEntityType.GoToTarget: {
                    const p0 = this.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});

                    mapStructures.push(new GoToTargetMapStructure(p0.x, p0.y));
                    break;
                }
                case RawMapEntityType.ActiveZone: {
                    const p0 = this.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});
                    const p1 = this.convertCMCoordinatesToPixelSpace({x: e.points[2], y: e.points[3]});
                    const p2 = this.convertCMCoordinatesToPixelSpace({x: e.points[4], y: e.points[5]});
                    const p3 = this.convertCMCoordinatesToPixelSpace({x: e.points[6], y: e.points[7]});

                    mapStructures.push(new ActiveZoneMapStructure(
                        p0.x, p0.y,
                        p1.x, p1.y,
                        p2.x, p2.y,
                        p3.x, p3.y,
                    ));
                    break;
                }
                case RawMapEntityType.NoGoArea: {
                    const p0 = this.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});
                    const p1 = this.convertCMCoordinatesToPixelSpace({x: e.points[2], y: e.points[3]});
                    const p2 = this.convertCMCoordinatesToPixelSpace({x: e.points[4], y: e.points[5]});
                    const p3 = this.convertCMCoordinatesToPixelSpace({x: e.points[6], y: e.points[7]});

                    mapStructures.push(new NoGoAreaMapStructure(
                        p0.x, p0.y,
                        p1.x, p1.y,
                        p2.x, p2.y,
                        p3.x, p3.y,
                    ));
                    break;
                }
                case RawMapEntityType.NoMopArea: {
                    const p0 = this.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});
                    const p1 = this.convertCMCoordinatesToPixelSpace({x: e.points[2], y: e.points[3]});
                    const p2 = this.convertCMCoordinatesToPixelSpace({x: e.points[4], y: e.points[5]});
                    const p3 = this.convertCMCoordinatesToPixelSpace({x: e.points[6], y: e.points[7]});

                    mapStructures.push(new NoMopAreaMapStructure(
                        p0.x, p0.y,
                        p1.x, p1.y,
                        p2.x, p2.y,
                        p3.x, p3.y,
                    ));
                    break;
                }
                case RawMapEntityType.VirtualWall: {
                    const p0 = this.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});
                    const p1 = this.convertCMCoordinatesToPixelSpace({x: e.points[2], y: e.points[3]});

                    mapStructures.push(new VirtualWallMapStructure(
                        p0.x, p0.y,
                        p1.x, p1.y
                    ));
                    break;
                }
            }
        });

        return mapStructures;
    }

    private buildMapStructuresFromLayerMapData(layers: Array<RawMapLayer>): Array<MapStructure> {
        const mapStructures: Array<MapStructure> = [];
        const previouslySelectedSegmentLabelsMap: Record<string, boolean | undefined> = {};

        this.mapStructures.forEach(s => {
            if (s.type === SegmentLabelMapStructure.TYPE) {
                const label = s as SegmentLabelMapStructure;

                previouslySelectedSegmentLabelsMap[label.id] = label.selected;
            }
        });


        layers.forEach(l => {
            switch (l.type) {
                case RawMapLayerType.Segment: {
                    const coords = {
                        x: l.dimensions.x.avg,
                        y: l.dimensions.y.avg
                    };


                    /*
                        Sometimes, you will have segments that are for example cornered hallways.
                        In these cases, the label placement might be off leading to user confusion

                        Using the avg instead of the segment mid solves this partly, however it's
                        still not perfect.
                        Calculating the median works even better but also requires more resources,
                        which is why it's not done by the backend.

                        As end devices usually have much more ram to spare, we can easily do it here.
                        However, to not waste CPU cycles for no benefit, we try to only do that
                        when the shape of the room is odd, which can be detected by avg and mid
                        diverging significantly

                        >= 8 pixels is just guesswork here and might require additional tuning
                     */
                    if (
                        Math.abs(l.dimensions.x.mid - l.dimensions.x.avg) >= 8 ||
                        Math.abs(l.dimensions.y.mid - l.dimensions.y.avg) >= 8
                    ) {
                        const pixels = {
                            x: [] as Array<number>,
                            y: [] as Array<number>
                        };

                        for (let i = 0; i < l.pixels.length; i = i + 2) {
                            pixels.x.push(l.pixels[i]);
                            pixels.y.push(l.pixels[i + 1]);
                        }

                        coords.x = median(pixels.x);
                        coords.y = median(pixels.y);
                    }

                    mapStructures.push(new SegmentLabelMapStructure(
                        coords.x,
                        coords.y,
                        l.metaData.segmentId ?? "",
                        !!previouslySelectedSegmentLabelsMap[l.metaData.segmentId ?? ""],
                        !!l.metaData.active,
                        l.metaData.area,
                        l.metaData.name
                    ));

                    break;
                }
            }
        });

        return mapStructures;
    }

    removeMapStructure(structure: MapStructure): void {
        this.mapStructures = this.mapStructures.filter(s => {
            return s !== structure;
        });
    }

    getMapStructures(): Array<MapStructure> {
        return this.mapStructures;
    }

    getClientStructures(): Array<ClientStructure> {
        return this.clientStructures;
    }

    addClientStructure(structure: ClientStructure): void {
        this.clientStructures.push(structure);
    }

    removeClientStructure(structure: ClientStructure): void {
        this.clientStructures = this.clientStructures.filter(s => {
            return s !== structure;
        });
    }

    convertCMCoordinatesToPixelSpace(coordinates: PointCoordinates) : PointCoordinates {
        return {x: Math.floor(coordinates.x / this.pixelSize), y: Math.floor(coordinates.y / this.pixelSize)};

    }

    convertPixelCoordinatesToCMSpace(coordinates: PointCoordinates) : PointCoordinates {
        return {x: Math.floor(coordinates.x * this.pixelSize), y: Math.floor(coordinates.y * this.pixelSize)};
    }
}

// This is important because it determines the draw order
const TYPE_SORT_MAPPING = {
    [NoGoAreaMapStructure.TYPE]: 5,
    [NoMopAreaMapStructure.TYPE]: 5,
    [VirtualWallMapStructure.TYPE]: 5,

    [ChargerLocationMapStructure.TYPE]: 14,
    [SegmentLabelMapStructure.TYPE]: 15,
    [RobotPositionMapStructure.TYPE]: 16
};

export default StructureManager;
