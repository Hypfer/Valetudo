import {Box, Button, CircularProgress, Container, Fade, Grid, Typography, Zoom,} from '@material-ui/core';
import React from 'react';
import {
    Capability,
    RawMapEntityType,
    useCleanSegmentsMutation,
    useMapSegmentationPropertiesQuery,
    useRobotStatusQuery,
} from '../../api';
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
    const [iterationCount, setIterationCount] = React.useState(1);

    const {
        data: mapSegmentationProperties,
        isLoading: mapSegmentationPropertiesLoading,
        isError: mapSegmentationPropertiesLoadError,
        refetch: refetchMapSegmentationProperties,
    } = useMapSegmentationPropertiesQuery();
    const {data: status} = useRobotStatusQuery((state) => {return state.value});
    const {
        mutate: executeSegmentAction,
        isLoading: segmentActionExecuting
    } = useCleanSegmentsMutation({
        onSuccess: onDone,
    });

    const canClean = status === 'idle' || status === 'docked';
    const didSelectSegments = segments.length > 0;

    const handleClick = React.useCallback(() => {
        if (!didSelectSegments || !canClean) {
            return;
        }

        executeSegmentAction({
            segment_ids: segments,
            iterations: iterationCount
        });
    }, [canClean, didSelectSegments, executeSegmentAction, segments, iterationCount]);

    const handleIterationToggle = React.useCallback(() => {
        if (mapSegmentationProperties) {
            setIterationCount(iterationCount % mapSegmentationProperties.iterationCount.max + 1);
        }
    }, [iterationCount, setIterationCount, mapSegmentationProperties]);

    if (mapSegmentationPropertiesLoadError) {
        return (
            <Container>
                <Typography color="error">
                    Error loading {Capability.MapSegmentation} properties
                </Typography>
                <Box m={1}/>
                <Button color="primary" variant="contained" onClick={() => {return refetchMapSegmentationProperties()}}>
                    Retry
                </Button>
            </Container>
        );
    }

    if (mapSegmentationProperties === undefined && mapSegmentationPropertiesLoading) {
        return (
            <Container>
                <CircularProgress/>
            </Container>
        );
    }

    if (mapSegmentationProperties === undefined) {
        return (
            <Container>
                <Typography align="center">
                    No {Capability.ZoneCleaning} properties
                </Typography>
                ;
            </Container>
        );
    }



    return (
        <Grid container spacing={1} direction="row-reverse" flexWrap="wrap-reverse">
            <Grid item>
                <Zoom in>
                    <LayerActionButton
                        disabled={!didSelectSegments || segmentActionExecuting || !canClean}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={handleClick}
                    >
                        Clean {segments.length} segments
                        {segmentActionExecuting && (
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
                <Zoom in={mapSegmentationProperties.iterationCount.max > 1} unmountOnExit>
                    <LayerActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        style={{
                            textTransform: "initial"
                        }}
                        onClick={handleIterationToggle}
                    >
                        {iterationCount}x
                    </LayerActionButton>
                </Zoom>
            </Grid>
            <Grid item>
                <Zoom in={didSelectSegments && !segmentActionExecuting} unmountOnExit>
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
