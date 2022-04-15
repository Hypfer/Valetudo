import React, { FunctionComponent } from "react";
import { TimerActionControlProps } from "./types";
import {
    Capability,
    useMapSegmentationPropertiesQuery,
    useSegmentsQuery,
} from "../../api";
import {
    Box,
    Checkbox,
    CircularProgress,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemText,
    ListSubheader,
    MenuItem,
    Select,
    Typography,
} from "@mui/material";
import { Add as AddIcon, Remove as RemoveIcon } from "@mui/icons-material";

import { deepCopy } from "../../utils";

export const validateParams: Record<
    string,
    (props: Record<string, any>) => boolean
> = {
    full_cleanup: () => {
        return true;
    },
    segment_cleanup: (props) => {
        return props.segment_ids?.length > 0 && (props.iterations ?? 1 > 0);
    },
};

export const FallbackControls: FunctionComponent<TimerActionControlProps> =
    () => {
        return <Typography color="error">The currently configured action does not exist. Please select a different action.</Typography>;
    };


export const FullCleanupControls: FunctionComponent<TimerActionControlProps> =
    () => {
        // No params for full_cleanup
        return null;
    };

export const SegmentCleanupControls: FunctionComponent<TimerActionControlProps> =
    ({ disabled, params, setParams }) => {
        const segmentIds: Array<string> = React.useMemo(() => {
            return (params.segment_ids as Array<string>) || [];
        }, [params.segment_ids]);
        const iterationCount: number = (params.iterations as number) || 1;
        const customOrder: boolean = (params.custom_order as boolean) ?? false;

        const {
            data: segmentationProps,
            isLoading: segmentationPropsLoading,
            isError: segmentationPropsError,
        } = useMapSegmentationPropertiesQuery();
        const {
            data: segments,
            isLoading: segmentsLoading,
            isError: segmentsLoadError,
        } = useSegmentsQuery();

        const getSegmentLabel = React.useCallback(
            (segmentId: string) => {
                if (!segments) {
                    return "";
                }
                return (
                    segments.find((s) => {
                        return s.id === segmentId;
                    })?.name || "Unnamed segment: " + segmentId
                );
            },
            [segments]
        );

        const selectedSegmentList = React.useMemo(() => {
            return segmentIds.map((segmentId) => {
                return (
                    <ListItem
                        key={segmentId}
                        secondaryAction={
                            <IconButton
                                disabled={disabled}
                                edge="end"
                                aria-label="remove"
                                onClick={() => {
                                    const newParams = deepCopy(params);
                                    const sids: Array<string> =
                                        newParams.segment_ids as Array<string>;
                                    const removeIdx = sids.indexOf(segmentId);
                                    if (removeIdx !== -1) {
                                        sids.splice(removeIdx, 1);
                                    }
                                    setParams(newParams);
                                }}
                            >
                                <RemoveIcon />
                            </IconButton>
                        }
                    >
                        <ListItemText primary={getSegmentLabel(segmentId)} />
                    </ListItem>
                );
            });
        }, [getSegmentLabel, params, setParams, disabled, segmentIds]);

        const availableSegmentList = React.useMemo(() => {
            if (!segments) {
                return null;
            }
            return segments
                .filter((s) => {
                    return segmentIds.indexOf(s.id) === -1;
                })
                .map((segment) => {
                    return (
                        <ListItem
                            key={segment.id}
                            secondaryAction={
                                <IconButton
                                    disabled={disabled}
                                    edge="end"
                                    aria-label="add"
                                    onClick={() => {
                                        const newParams = deepCopy(params);
                                        if (newParams.segment_ids) {
                                            const sids: Array<string> =
                                                newParams.segment_ids as Array<string>;
                                            sids.push(segment.id);
                                        } else {
                                            newParams.segment_ids = [
                                                segment.id,
                                            ];
                                        }
                                        setParams(newParams);
                                    }}
                                >
                                    <AddIcon />
                                </IconButton>
                            }
                        >
                            <ListItemText
                                primary={
                                    segment.name ||
                                    "Unnamed segment: " + segment.id
                                }
                            />
                        </ListItem>
                    );
                });
        }, [disabled, params, segmentIds, setParams, segments]);

        if (segmentationPropsLoading || segmentsLoading) {
            return <CircularProgress />;
        }

        if (
            segmentationPropsError ||
            segmentsLoadError ||
            !segmentationProps ||
            !segments
        ) {
            return (
                <Typography color="error">
                    Error loading {Capability.MapSegmentation}
                </Typography>
            );
        }

        const iterationItems = [];
        for (
            let i = segmentationProps.iterationCount.min;
            i <= segmentationProps.iterationCount.max;
            i++
        ) {
            iterationItems.push(
                <MenuItem key={i} value={i}>
                    {i} {i === 1 ? "Iteration" : "Iterations"}
                </MenuItem>
            );
        }

        // Since material-ui does not support reordering lists yet, we implement our custom sorting
        // See https://next.material-ui.com/getting-started/supported-components/#main-content

        return (
            <>
                <FormControl>
                    <InputLabel id="segment-iterations-label">
                        Iterations
                    </InputLabel>
                    <Select
                        labelId="segment-iterations-label"
                        id="segment-iterations-select"
                        value={iterationCount}
                        disabled={disabled}
                        label="Iterations"
                        onChange={(e) => {
                            const newParams = deepCopy(params);
                            newParams.iterations = e.target.value;
                            setParams(newParams);
                        }}
                    >
                        {iterationItems}
                    </Select>
                </FormControl>
                <Box pt={1} />

                {segmentationProps.customOrderSupport && (
                    <FormControlLabel
                        control={
                            <Checkbox
                                disabled={disabled}
                                checked={customOrder}
                                onChange={(e) => {
                                    const newParams = deepCopy(params);
                                    newParams.custom_order = e.target.checked;
                                    setParams(newParams);
                                }}
                            />
                        }
                        label="Use custom order"
                    />
                )}
                <Box pt={1} />

                <List
                    dense
                    subheader={
                        <ListSubheader component="div">
                            Available segments
                        </ListSubheader>
                    }
                >
                    {availableSegmentList}
                </List>

                <List
                    dense
                    subheader={
                        <ListSubheader component="div">
                            Selected segments
                        </ListSubheader>
                    }
                >
                    {selectedSegmentList}
                </List>
            </>
        );
    };
