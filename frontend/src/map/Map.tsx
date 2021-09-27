import {ThemeProvider, useTheme} from "@mui/material";
import Konva from "konva";
import {KonvaEventObject} from "konva/lib/Node";
import React from "react";
import {Layer} from "react-konva";
import {useForkRef} from "../hooks";
import MapStage, {MapStageProps, MapStageRef} from "./MapStage";
import {ChipShape, PixelsShape} from "./shapes";

export interface MapLayer {
    id: string;
    pixels: number[];
    pixelSize: number;
    dimensions: { x: [min: number, max: number]; y: [min: number, max: number] };
    color: string;
}

export interface MapLabel {
    text: string;
    position: [x: number, y: number];
    icon?: CanvasImageSource;
}

export interface MapProps {
    layers: MapLayer[];
    entities?: Array<React.ReactNode>;
    labels?: MapLabel[];
    padding?: number;

    onClick?(position: [x: number, y: number]): void;
}

const Map = React.forwardRef<MapStageRef | null, MapProps>(
    (props, ref): JSX.Element => {
        const {layers, entities = [], labels = [], onClick, padding} = props;
        const stageRef = React.useRef<MapStageRef>(null);
        const forkedRef = useForkRef(ref, stageRef);
        const theme = useTheme();

        React.useEffect(() => {
            stageRef.current?.redraw();
        }, [entities]);

        const stageProps = React.useMemo<Omit<MapStageProps, "children">>(() => {
            const minX = Math.min(
                ...layers.map(
                    ({dimensions, pixelSize: scale}) => {
                        return dimensions.x[0] * scale;
                    }
                )
            );
            const maxX = Math.max(
                ...layers.map(
                    ({dimensions, pixelSize: scale}) => {
                        return dimensions.x[1] * scale;
                    }
                )
            );
            const minY = Math.min(
                ...layers.map(
                    ({dimensions, pixelSize: scale}) => {
                        return dimensions.y[0] * scale;
                    }
                )
            );
            const maxY = Math.max(
                ...layers.map(
                    ({dimensions, pixelSize: scale}) => {
                        return dimensions.y[1] * scale;
                    }
                )
            );

            return {
                width: maxX - minX,
                height: maxY - minY,
                offsetX: minX,
                offsetY: minY,
            };
        }, [layers]);

        const handleMapInteraction = React.useCallback(
            (event: KonvaEventObject<TouchEvent | MouseEvent>) => {
                const {currentTarget: stage} = event;
                if (onClick === undefined || !(stage instanceof Konva.Stage)) {
                    return;
                }

                const pointer = stage.getPointerPosition() ?? {x: 0, y: 0};
                const position: [number, number] = [
                    Math.floor(
                        (pointer.x - stage.x()) / stage.scaleX() + stage.offsetX()
                    ),
                    Math.floor(
                        (pointer.y - stage.y()) / stage.scaleY() + stage.offsetY()
                    ),
                ];

                onClick(position);
            },
            [onClick]
        );

        return (
            <MapStage
                {...stageProps}
                padding={padding}
                ref={forkedRef}
                style={{fontSize: theme.typography.body1.fontSize}}
                onClick={handleMapInteraction}
                onTap={handleMapInteraction}
            >
                {/*
        We have to provide the theme here to "bridge" the Stage.
        See: https://github.com/konvajs/react-konva#usage-with-react-context
      */}
                <ThemeProvider theme={theme}>
                    <Layer>
                        {layers.map(({pixels, color, id, pixelSize}) => {
                            return (
                                <PixelsShape
                                    key={id}
                                    pixels={pixels}
                                    pixelSize={pixelSize}
                                    fill={color}
                                />
                            );
                        })}
                        {entities}
                        {labels.map(({text, position, icon}) => {
                            const [x, y] = position;

                            return (
                                <ChipShape
                                    key={`${text}:${position.join(",")}`}
                                    text={text}
                                    x={x}
                                    y={y}
                                    icon={icon}
                                />
                            );
                        })}
                    </Layer>
                </ThemeProvider>
            </MapStage>
        );
    }
);

export default Map;
