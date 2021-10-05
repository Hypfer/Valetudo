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


class StructureManager {
    private mapStructures: Array<MapStructure>;
    private clientStructures: Array<ClientStructure>;
    private pixelSize = 5;

    private oldSegmentLabelActiveMap: any = {};

    constructor() {
        this.mapStructures = [];
        this.clientStructures = [];
    }

    setPixelSize(pixelSize: number): void {
        this.pixelSize = pixelSize;
    }

    updateMapStructuresFromMapData(rawMap: RawMapData): void {
        this.oldSegmentLabelActiveMap = {};

        this.mapStructures.forEach(s => {
            if (s.type === SegmentLabelMapStructure.TYPE) {
                const label = s as SegmentLabelMapStructure;

                this.oldSegmentLabelActiveMap[label.id] = label.selected;
            }
        });

        this.mapStructures = [];



        this.updateMapStructuresFromEntityMapData(rawMap.entities);
        this.updateMapStructuresFromLayerMapData(rawMap.layers);

        this.mapStructures.sort((a,b) => {
            return TYPE_SORT_MAPPING[a.type] - TYPE_SORT_MAPPING[b.type];
        });
    }

    private updateMapStructuresFromEntityMapData(entities: Array<RawMapEntity>) {
        entities.forEach(e => {
            switch (e.type) {
                case RawMapEntityType.RobotPosition: {
                    const p0 = this.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});

                    this.mapStructures.push(new RobotPositionMapStructure(p0.x, p0.y, e.metaData.angle ?? 0));
                    break;
                }
                case RawMapEntityType.ChargerLocation: {
                    const p0 = this.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});

                    this.mapStructures.push(new ChargerLocationMapStructure(p0.x, p0.y));
                    break;
                }
                case RawMapEntityType.GoToTarget: {
                    const p0 = this.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});

                    this.mapStructures.push(new GoToTargetMapStructure(p0.x, p0.y));
                    break;
                }
                case RawMapEntityType.ActiveZone: {
                    const p0 = this.convertCMCoordinatesToPixelSpace({x: e.points[0], y: e.points[1]});
                    const p1 = this.convertCMCoordinatesToPixelSpace({x: e.points[2], y: e.points[3]});
                    const p2 = this.convertCMCoordinatesToPixelSpace({x: e.points[4], y: e.points[5]});
                    const p3 = this.convertCMCoordinatesToPixelSpace({x: e.points[6], y: e.points[7]});

                    this.mapStructures.push(new ActiveZoneMapStructure(
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

                    this.mapStructures.push(new NoGoAreaMapStructure(
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

                    this.mapStructures.push(new NoMopAreaMapStructure(
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

                    this.mapStructures.push(new VirtualWallMapStructure(
                        p0.x, p0.y,
                        p1.x, p1.y
                    ));
                    break;
                }
            }
        });
    }

    private updateMapStructuresFromLayerMapData(layers: Array<RawMapLayer>) {
        layers.forEach(l => {
            switch (l.type) {
                case RawMapLayerType.Segment:
                    this.mapStructures.push(new SegmentLabelMapStructure(
                        l.dimensions.x.mid,
                        l.dimensions.y.mid,
                        l.metaData.segmentId ?? "",
                        !!this.oldSegmentLabelActiveMap[l.metaData.segmentId ?? ""],
                        !!l.metaData.active,
                        l.metaData.area,
                        l.metaData.name
                    ));

                    break;
            }
        });
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

    convertCMCoordinatesToPixelSpace(coordinates: {x: number, y: number}) : {x: number, y: number} {
        return {x: Math.floor(coordinates.x / this.pixelSize), y: Math.floor(coordinates.y / this.pixelSize)};

    }

    convertPixelCoordinatesToCMSpace(coordinates: {x: number, y: number}) : {x: number, y: number} {
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
