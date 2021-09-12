import React, { FunctionComponent } from "react";
import { TimerActionControlProps } from "./types";
import {
    Capability,
    useGoToLocationPresetsQuery,
    useMapSegmentationPropertiesQuery,
    useSegmentsQuery,
    useZonePresetsQuery,
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
} from "@material-ui/core";
import { Add as AddIcon, Remove as RemoveIcon } from "@material-ui/icons";

import { deepCopy } from "../../utils";

export const validateParams: Record<
    string,
    (props: Record<string, any>) => boolean
> = {
    full_cleanup: () => {
        return true;
    },
    zone_cleanup: (props) => {
        return props.zone_id && props.zone_id !== "none";
    },
    segment_cleanup: (props) => {
        return props.segment_ids?.length > 0 && (props.iterations ?? 1 > 0);
    },
    goto_location: (props) => {
        return props.goto_id && props.goto_id !== "none";
    },
};

export const FullCleanupControls: FunctionComponent<TimerActionControlProps> =
    () => {
        // No params for full_cleanup
        return null;
    };

export const ZoneCleanupControls: FunctionComponent<TimerActionControlProps> =
    ({ disabled, params, setParams }) => {
        const selectedZoneId = params.zone_id ?? "none";

        const {
            data: zonePresets,
            isLoading: zonePresetsLoading,
            isError: zonePresetsError,
        } = useZonePresetsQuery();

        const zoneMenuItems = React.useMemo(() => {
            if (!zonePresets) {
                return null;
            }
            return zonePresets.map(({ name, id }) => {
                return (
                    <MenuItem key={id} value={id}>
                        {name || "Unnamed zone: " + id}
                    </MenuItem>
                );
            });
        }, [zonePresets]);

        if (zonePresetsLoading) {
            return <CircularProgress />;
        }

        if (zonePresetsError) {
            return (
                <Typography color="error">
                    Error loading {Capability.ZoneCleaning}
                </Typography>
            );
        }

        return (
            <FormControl>
                <InputLabel id={"zone-label"}>Select zone</InputLabel>
                <Select
                    labelId={"zone-label"}
                    id={"zone-select"}
                    value={selectedZoneId}
                    label="Select zone"
                    disabled={disabled}
                    onChange={(e) => {
                        setParams({
                            zone_id: e.target.value,
                        });
                    }}
                >
                    <MenuItem value={"none"}>
                        <em>No zone selected</em>
                    </MenuItem>
                    {zoneMenuItems}
                </Select>
            </FormControl>
        );
    };

export const SegmentCleanupControls: FunctionComponent<TimerActionControlProps> =
    ({ disabled, params, setParams }) => {
        const segmentIds: Array<string> = React.useMemo(() => {
            return (params.segment_ids as Array<string>) || [];
        }, [params]);
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

export const GoToLocationControls: FunctionComponent<TimerActionControlProps> =
    ({ params, setParams, disabled }) => {
        const selectedGoToId = params.goto_id ?? "none";

        const {
            data: goToLocations,
            isLoading: goToLocationPresetsLoading,
            isError: goToLocationPresetLoadError,
        } = useGoToLocationPresetsQuery();

        const goToMenuItems = React.useMemo(() => {
            if (!goToLocations) {
                return null;
            }
            return goToLocations.map(({ name, id }) => {
                return (
                    <MenuItem key={id} value={id}>
                        {name || "Unnamed go to location: " + id}
                    </MenuItem>
                );
            });
        }, [goToLocations]);

        if (goToLocationPresetsLoading) {
            return <CircularProgress />;
        }

        if (goToLocationPresetLoadError) {
            return (
                <Typography color="error">
                    Error loading {Capability.GoToLocation}
                </Typography>
            );
        }

        return (
            <FormControl>
                <InputLabel id={"go-to-location-label"}>
                    Select go to location
                </InputLabel>
                <Select
                    labelId={"go-to-location-label"}
                    id={"go-to-location-select"}
                    value={selectedGoToId}
                    label="Select go to location"
                    disabled={disabled}
                    onChange={(e) => {
                        setParams({
                            goto_id: e.target.value,
                        });
                    }}
                >
                    <MenuItem value={"none"}>
                        <em>No go to location selected</em>
                    </MenuItem>
                    {goToMenuItems}
                </Select>
            </FormControl>
        );
    };
