export interface RawMapData {
    metaData: RawMapDataMetaData;
    size: {
        x: number;
        y: number;
    };
    pixelSize: number;
    layers: RawMapLayer[];
    entities: RawMapEntity[];
}

export interface RawMapEntity {
    metaData: RawMapEntityMetaData;
    points: number[];
    type: RawMapEntityType;
}

export interface RawMapEntityMetaData {
    angle?: number;
    label?: string;
    id?: string;
}

export interface RawMapLayer {
    metaData: RawMapLayerMetaData;
    type: RawMapLayerType;
    pixels: number[];
    compressedPixels?: number[];
    dimensions: {
        x: RawMapLayerDimension;
        y: RawMapLayerDimension;
        pixelCount: number;
    };
}

export interface RawMapLayerDimension {
    min: number;
    max: number;
    mid: number;
    avg: number;
}

export interface RawMapLayerMetaData {
    area: number;
    segmentId?: string;
    name?: string;
    active?: boolean;
    material?: RawMapLayerMaterial
}

export enum RawMapLayerType {
    Floor = "floor",
    Segment = "segment",
    Wall = "wall",
}

export enum RawMapLayerMaterial {
    Generic = "generic",
    Tile = "tile",
    Wood = "wood",
    WoodHorizontal = "wood_horizontal",
    WoodVertical = "wood_vertical"
}

export enum RawMapEntityType {
    ChargerLocation = "charger_location",
    RobotPosition = "robot_position",
    GoToTarget = "go_to_target",
    Obstacle = "obstacle",
    Path = "path",
    PredictedPath = "predicted_path",
    VirtualWall = "virtual_wall",
    NoGoArea = "no_go_area",
    NoMopArea = "no_mop_area",
    ActiveZone = "active_zone",
    Carpet = "carpet"
}

export interface RawMapDataMetaData {
    version: number;
    nonce: string;
}
