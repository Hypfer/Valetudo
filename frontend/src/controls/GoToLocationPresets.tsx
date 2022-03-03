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
    useGoToLocationPresetMutation,
    useGoToLocationPresetsQuery,
    useRobotStatusQuery,
} from "../api";

const StyledFormControl = styled(FormControl)({
    minWidth: 120,
});

const GoToLocationPresets = (): JSX.Element => {
    const { data: status } = useRobotStatusQuery((status) => {
        return status.value;
    });
    const {
        data: goToLocations,
        isLoading: goToLocationPresetsLoading,
        isError: goToLocationPresetLoadError,
    } = useGoToLocationPresetsQuery();
    const {
        isLoading: goToLocationPresetIsExecuting,
        mutate: goToLocationPreset
    } = useGoToLocationPresetMutation({
        onSuccess() {
            setSelected("");
        },
    });
    const [selected, setSelected] = React.useState<string>("");

    const handleChange = React.useCallback(
        (event: SelectChangeEvent<string>) => {
            setSelected(event.target.value);
        },
        []
    );

    const canGo = status === "idle" || status === "docked";

    const handleGo = React.useCallback(() => {
        if (selected === "" || !canGo) {
            return;
        }

        goToLocationPreset(selected);
    }, [canGo, goToLocationPreset, selected]);

    const body = React.useMemo(() => {
        if (goToLocationPresetsLoading) {
            return (
                <Grid item>
                    <CircularProgress size={20} />
                </Grid>
            );
        }

        if (goToLocationPresetLoadError || goToLocations === undefined) {
            return (
                <Grid item>
                    <Typography color="error">
                        Error loading {Capability.GoToLocation}
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
                            {goToLocations.map(({ name, id }) => {
                                return (
                                    <MenuItem key={id} value={id}>
                                        {name}
                                    </MenuItem>
                                );
                            })}
                        </Select>
                        {!canGo && selected !== "" && (
                            <FormHelperText>Can only go to location when idle</FormHelperText>
                        )}
                    </StyledFormControl>
                </Grid>
                <Grid item xs>
                    <Box display="flex" justifyContent="flex-end">
                        <Button
                            disabled={!selected || goToLocationPresetIsExecuting || !canGo}
                            onClick={handleGo}
                        >
                            Go
                        </Button>
                    </Box>
                </Grid>
            </>
        );
    }, [
        canGo,
        handleChange,
        handleGo,
        goToLocationPresetIsExecuting,
        goToLocationPresetLoadError,
        goToLocationPresetsLoading,
        goToLocations,
        selected,
    ]);

    return (
        <Grid item>
            <Paper>
                <Box px={2} py={1}>
                    <Grid container direction="row" alignItems="center" spacing={1}>
                        <Grid item>
                            <Typography variant="subtitle1">Go to</Typography>
                        </Grid>
                        {body}
                    </Grid>
                </Box>
            </Paper>
        </Grid>
    );
};

export default GoToLocationPresets;
