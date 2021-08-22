import {CircularProgress, Fade, Grid, Typography, Zoom,} from '@material-ui/core';
import React from 'react';
import {RawMapEntityType, useCleanSegmentsMutation, useRobotStatusQuery,} from '../../api';
import Map from '../Map';
import {LayerActionButton, LayerActionsContainer} from './Styled';
import {MapLayersProps} from './types';
import {manhatten, pairWiseArray} from '../utils';
import Color from 'color';
import {useMapEntities, useMapLabels, useMapLayers} from './hooks';

interface SegmentsLayerOverlayProps {
    segments: string[];

    onClear(): void;

    onDone(): void;
}

const SegmentsLayerOverlay = (
    props: SegmentsLayerOverlayProps
): JSX.Element => {
    const {segments, onClear, onDone} = props;
    const {data: status} = useRobotStatusQuery((state) => {return state.value});
    const {mutate, isLoading} = useCleanSegmentsMutation({
        onSuccess: onDone,
    });

    const canClean = status === 'idle' || status === 'docked';
    const didSelectSegments = segments.length > 0;

    const handleClick = React.useCallback(() => {
        if (!didSelectSegments || !canClean) {
            return;
        }

        mutate(segments);
    }, [canClean, didSelectSegments, mutate, segments]);

    return (
        <Grid container spacing={1} direction="row-reverse" flexWrap="wrap-reverse">
            <Grid item>
                <Zoom in>
                    <LayerActionButton
                        disabled={!didSelectSegments || isLoading || !canClean}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={handleClick}
                    >
                        Clean {segments.length} segments
                        {isLoading && (
                            <CircularProgress
                                color="inherit"
                                size={18}
                                style={{marginLeft: 10}}
                            />
                        )}
                    </LayerActionButton>
                </Zoom>
            </Grid>
            <Grid item>
                <Zoom in={didSelectSegments && !isLoading} unmountOnExit>
                    <LayerActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onClear}
                    >
                        Clear
                    </LayerActionButton>
                </Zoom>
            </Grid>
            <Grid item>
                <Fade in={didSelectSegments && !canClean} unmountOnExit>
                    <Typography variant="caption" color="textSecondary">
                        Can only start segment cleaning when idle
                    </Typography>
                </Fade>
            </Grid>
        </Grid>
    );
};

const ShownEntities = [
    RawMapEntityType.RobotPosition,
    RawMapEntityType.ChargerLocation,
];

const SegmentsLayer = (props: MapLayersProps): JSX.Element => {
    const {data, padding, onDone} = props;
    const [selectedSegments, setSelectedSegments] = React.useState<string[]>([]);

    const layers = useMapLayers(data);
    const labels = useMapLabels(data);
    const entities = useMapEntities(data.entities, ShownEntities);

    const handleClear = React.useCallback(() => {
        setSelectedSegments([]);
    }, []);

    const handleClick = React.useCallback(
        (position: [number, number]) => {
            const [x, y] = position;
            const scaledPosition: [number, number] = [
                Math.floor(x / data.pixelSize),
                Math.floor(y / data.pixelSize),
            ];

            const segment = data.layers
                .filter((layer) => {return layer.type === 'segment'})
                .find((layer) =>
                    {return pairWiseArray(layer.pixels).some(
                        (pixel) => {return manhatten(scaledPosition, pixel) === 0}
                    )}
                );
            const segmentId = segment?.metaData.segmentId;
            if (segmentId === undefined) {
                return;
            }

            setSelectedSegments((prev) => {
                if (prev.includes(segmentId)) {
                    return prev.filter((v) => {return v !== segmentId});
                }

                return [...prev, segmentId];
            });
        },
        [data]
    );

    const coloredLayers = React.useMemo(
        () =>
        {return layers.map((layer) =>
            {return selectedSegments.includes(layer.id)
                ? layer
                : {...layer, color: Color(layer.color).desaturate(0.7).hex()}}
        )},
        [layers, selectedSegments]
    );

    return (
        <>
            <Map
                layers={coloredLayers}
                entities={entities}
                labels={labels}
                padding={padding}
                onClick={handleClick}
            />
            <LayerActionsContainer>
                <SegmentsLayerOverlay
                    onClear={handleClear}
                    onDone={onDone}
                    segments={selectedSegments}
                />
            </LayerActionsContainer>
        </>
    );
};

export default SegmentsLayer;
