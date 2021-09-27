import {
    Accordion,
    AccordionActions,
    AccordionDetails,
    AccordionSummary,
    Button,
    Checkbox,
    CircularProgress,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    FormLabel,
    Grid,
    Typography,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon } from "@mui/icons-material";
import React from "react";
import {
    Segment,
    useCleanSegmentsMutation,
    useRobotStatusQuery,
    useSegmentsQuery,
} from "../api";

const Segments = (): JSX.Element => {
    const { data: state } = useRobotStatusQuery((status) => {
        return status.value;
    });
    const {
        data: segments,
        isLoading: segmentsLoading,
        isError: segmentsLoadError,
        refetch: refetchSegments,
    } = useSegmentsQuery();
    const {
        isLoading: cleanSegmentsIsExecuting,
        mutate: cleanSegments
    } = useCleanSegmentsMutation({
        onSuccess() {
            setSelected({});
        },
    });
    const [selected, setSelected] = React.useState<Record<string, boolean>>({});
    const isLoading = segmentsLoading || cleanSegmentsIsExecuting;

    const handleCheckboxChange = React.useCallback(
        ({ target }: React.ChangeEvent<HTMLInputElement>) => {
            setSelected((prev) => {
                return {
                    ...prev,
                    [target.id]: target.checked,
                };
            });
        },
        []
    );
    const handleRetry = React.useCallback(() => {
        refetchSegments();
    }, [refetchSegments]);

    const handleClean = React.useCallback(() => {
        cleanSegments({
            segment_ids: Object.entries(selected)
                .filter(([, selected]) => {
                    return selected;
                })
                .map(([id]) => {
                    return id;
                })
        });
    }, [cleanSegments, selected]);

    const namedSegments = segments?.filter(
        (segment): segment is Segment & { name: NonNullable<Segment["name"]> } => {
            return segment.name !== undefined;
        }
    );
    const noSegmentsSelected = Object.values(selected).every((val) => {
        return !val;
    });
    const statusAllowsCleaning = state === "idle" || state === "docked";

    const details = React.useMemo(() => {
        if (segmentsLoadError) {
            return (
                <Typography color="error">
                    An error occurred while loading segments
                </Typography>
            );
        }

        if (namedSegments === undefined || namedSegments.length === 0) {
            return <Typography>No named segments found</Typography>;
        }

        return (
            <FormControl component="fieldset">
                <FormGroup>
                    <FormLabel component="legend">
                        Select segments to be cleaned
                    </FormLabel>
                    {namedSegments.map(({ name, id }) => {
                        return (
                            <FormControlLabel
                                key={id}
                                control={
                                    <Checkbox
                                        checked={selected[id] ?? false}
                                        onChange={handleCheckboxChange}
                                        id={id}
                                    />
                                }
                                label={name}
                            />
                        );
                    })}
                </FormGroup>
                <FormHelperText>Can only start cleaning when idle</FormHelperText>
            </FormControl>
        );
    }, [handleCheckboxChange, segmentsLoadError, namedSegments, selected]);

    return (
        <Accordion disabled={namedSegments === undefined && isLoading}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container justifyContent="space-between" alignItems="center">
                    <Grid item>
                        <Typography>Segments</Typography>
                    </Grid>
                    {isLoading && (
                        <Grid item>
                            <CircularProgress color="inherit" size="1rem" />
                        </Grid>
                    )}
                </Grid>
            </AccordionSummary>
            <Divider />
            <AccordionDetails>{details}</AccordionDetails>
            <Divider />
            <AccordionActions>
                {segmentsLoadError ? (
                    <Button size="small" onClick={handleRetry}>
                        Retry
                    </Button>
                ) : (
                    <Button
                        size="small"
                        disabled={noSegmentsSelected || !statusAllowsCleaning}
                        onClick={handleClean}
                    >
                        Clean segments
                    </Button>
                )}
            </AccordionActions>
        </Accordion>
    );
};

export default Segments;
