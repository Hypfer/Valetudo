import { RawMapData, RawMapLayer, RawMapLayerType } from "../../api";
import { MapLabel, MapLayer } from "../Map";
import { pairWiseArray, pointClosestTo } from "../utils";

// @ts-ignore
import cleaningServicesSrc from "../shapes/assets/cleaning_services.svg";
import { Theme } from "@material-ui/core";

const cleaningServices = new window.Image();
cleaningServices.src = cleaningServicesSrc;

export const labelsFromMapData = (
    layers: RawMapData["layers"],
    pixelSize: RawMapData["pixelSize"]
): MapLabel[] => {
    return layers
        .filter((layer) => {
            return layer.type === "segment";
        })
        .map((layer) => {
            const { pixels, dimensions, metaData } = layer;
            const { name, segmentId, active } = metaData;
            const [x, y] = pointClosestTo(pairWiseArray(pixels), [
                dimensions.x.mid,
                dimensions.y.mid,
            ]);

            return {
                text: name ?? segmentId ?? "?",
                position: [x * pixelSize, y * pixelSize],
                icon: active ? cleaningServices : undefined,
            };
        });
};

export const getLayerColor = (
    theme: Theme["map"],
    segmentColorProvider: (
        segmentId: string
    ) => NonNullable<React.CSSProperties["color"]>
): ((layer: RawMapLayer) => NonNullable<React.CSSProperties["color"]>) => {
    return (layer) => {
        const { floor, wall } = theme;
        switch (layer.type) {
            case RawMapLayerType.Floor:
                return floor;
            case RawMapLayerType.Wall:
                return wall;
            case RawMapLayerType.Segment: {
                const { segmentId } = layer.metaData;

                if (segmentId === undefined) {
                    throw new Error("Segment given without id");
                }

                return segmentColorProvider(segmentId);
            }
        }
    };
};

export const layersFromMapData = (
    layers: RawMapData["layers"],
    pixelSize: RawMapData["pixelSize"],
    getColor: (layer: RawMapLayer) => NonNullable<React.CSSProperties["color"]>
): MapLayer[] => {
    return layers.map((layer) => {
        const { pixels, dimensions, type, metaData } = layer;

        return {
            id: metaData.segmentId ?? type,
            pixels,
            pixelSize,
            dimensions: {
                x: [dimensions.x.min, dimensions.x.max],
                y: [dimensions.y.min, dimensions.y.max],
            },
            color: getColor(layer),
        };
    });
};
