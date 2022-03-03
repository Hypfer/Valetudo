import {
    Box,
    Button,
    CircularProgress,
    FormControl,
    FormHelperText,
    Grid,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    styled,
    Typography,
} from "@mui/material";
import React from "react";
import {
    Capability,
    useCleanZonePresetMutation,
    useRobotStatusQuery,
    useZonePresetsQuery,
} from "../api";

const StyledFormControl = styled(FormControl)({
    minWidth: 120,
});

const ZonePresets = (): JSX.Element => {
    const { data: status } = useRobotStatusQuery((status) => {
        return status.value;
    });
    const {
        data: zonePresets,
        isLoading: zonePresetsLoading,
        isError: errorLoadingZonePresets,
    } = useZonePresetsQuery();
    const {
        isLoading: cleanZonePresetExecuting,
        mutate: cleanZonePreset
    } = useCleanZonePresetMutation({
        onSuccess() {
            setSelected("");
        },
    });
    const [selected, setSelected] = React.useState<string>("");
    const canClean = status === "idle" || status === "docked";

    const handleChange = React.useCallback(
        (event: SelectChangeEvent<string>) => {
            setSelected(event.target.value as string);
        },
        []
    );

    const handleClean = React.useCallback(() => {
        if (selected === "" || !canClean) {
            return;
        }
        cleanZonePreset(selected);
    }, [canClean, cleanZonePreset, selected]);

    const body = React.useMemo(() => {
        if (zonePresetsLoading) {
            return (
                <Grid item>
                    <CircularProgress size={20} />
                </Grid>
            );
        }

        if (errorLoadingZonePresets || zonePresets === undefined) {
            return (
                <Grid item>
                    <Typography color="error">
                        Error loading {Capability.ZoneCleaning}
                    </Typography>
                </Grid>
            );
        }

        return (
            <>
                <Grid item>
                    <StyledFormControl>
                        <Select
                            value={selected}
                            onChange={handleChange}
                            displayEmpty
                            variant="standard"
                        >
                            <MenuItem value="">
                                <em>Preset</em>
                            </MenuItem>
                            {zonePresets.map(({ name, id }) => {
                                return (
                                    <MenuItem key={id} value={id}>
                                        {name}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                        {!canClean && selected !== "" && (
                            <FormHelperText>Can only start cleaning when idle</FormHelperText>
                        )}
                    </StyledFormControl>
                </Grid>
                <Grid item xs>
                    <Box display="flex" justifyContent="flex-end">
                        <Button
                            disabled={!selected || cleanZonePresetExecuting || !canClean}
                            onClick={handleClean}
                        >
                            Clean
                        </Button>
                    </Box>
                </Grid>
            </>
        );
    }, [
        canClean,
        handleChange,
        handleClean,
        cleanZonePresetExecuting,
        errorLoadingZonePresets,
        zonePresetsLoading,
        selected,
        zonePresets,
    ]);

    return (
        <Grid item>
            <Paper>
                <Box px={2} py={1}>
                    <Grid container direction="row" alignItems="center" spacing={1}>
                        <Grid item>
                            <Typography variant="subtitle1">Clean zone preset</Typography>
                        </Grid>
                        {body}
                    </Grid>
                </Box>
            </Paper>
        </Grid>
    );
};
export default ZonePresets;
