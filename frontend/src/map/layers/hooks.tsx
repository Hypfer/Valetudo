import { useTheme } from "@mui/material";
import React from "react";
import { RawMapData, RawMapEntityType } from "../../api";
import { MapLabel, MapLayer } from "../Map";
import { FourColorTheoremSolver } from "../map-color-finder";
import { RawMapEntityShape } from "../shapes";
import { getLayerColor, labelsFromMapData, layersFromMapData } from "./utils";

export const useMapLayers = (data: RawMapData): MapLayer[] => {
    const theme = useTheme();

    const fourColorTheoremSolver = React.useMemo(() => {
        return new FourColorTheoremSolver(data.layers, data.pixelSize);
    }, [data.layers, data.pixelSize]);

    const getColor = React.useMemo(() => {
        return getLayerColor(theme.map, (id) => {
            return (
                theme.map.segment[fourColorTheoremSolver.getColor(id)] ??
                theme.map.segment[theme.map.segment.length - 1]
            );
        });
    }, [fourColorTheoremSolver, theme.map]);

    return React.useMemo(() => {
        return layersFromMapData(data.layers, data.pixelSize, getColor);
    }, [data, getColor]);
};

export const useMapLabels = (data: RawMapData): MapLabel[] => {
    return React.useMemo(() => {
        return labelsFromMapData(data.layers, data.pixelSize);
    }, [data.layers, data.pixelSize]);
};

const entityOrder: Partial<Record<RawMapEntityType, number>> = {
    [RawMapEntityType.RobotPosition]: 1,
    [RawMapEntityType.ChargerLocation]: 2,
};

const maxEntityOrder =
    Math.max(
        ...Object.values(entityOrder).map((v) => {
            return v ?? 0;
        })
    ) + 1;

export const useMapEntities = (
    entities: RawMapData["entities"],
    typeArray?: RawMapEntityType[]
): JSX.Element[] => {
    return React.useMemo(() => {
        const filteredArray = typeArray ?
            entities.filter(({ type }) => {
                return typeArray.includes(type);
            }) :
            entities;

        const sortedArray = [...filteredArray].sort((a, b) => {
            return (
                (entityOrder[b.type] ?? maxEntityOrder) -
                (entityOrder[a.type] ?? maxEntityOrder)
            );
        });

        return sortedArray.map((entity, index) => {
            return <RawMapEntityShape entity={entity} key={index} />;
        });
    }, [entities, typeArray]);
};
