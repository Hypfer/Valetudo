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
    styled,
    Typography,
} from '@material-ui/core';
import React from 'react';
import {Capability, useGoToLocationPresetMutation, useGoToLocationPresetsQuery, useRobotStatusQuery,} from '../api';

const StyledFormControl = styled(FormControl)({
    minWidth: 120,
});

const GoToLocationPresets = (): JSX.Element => {
    const {data: status} = useRobotStatusQuery((status) => {return status.value});
    const {
        data: locations,
        isLoading: isLocationsLoading,
        isError,
    } = useGoToLocationPresetsQuery();
    const {
        isLoading: isCommandLoading,
        mutate: goToLocation,
    } = useGoToLocationPresetMutation({
        onSuccess() {
            setSelected('');
        },
    });
    const [selected, setSelected] = React.useState<string>('');

    const handleChange = React.useCallback(
        (event: React.ChangeEvent<{ value: unknown }>) => {
            setSelected(event.target.value as string);
        },
        []
    );

    const canGo = status === 'idle' || status === 'docked';

    const handleGo = React.useCallback(() => {
        if (selected === '' || !canGo) {
            return;
        }

        goToLocation(selected);
    }, [canGo, goToLocation, selected]);

    const body = React.useMemo(() => {
        if (isLocationsLoading) {
            return (
                <Grid item>
                    <CircularProgress size={20}/>
                </Grid>
            );
        }

        if (isError || locations === undefined) {
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
                                <em>Location</em>
                            </MenuItem>
                            {locations.map(({name, id}) => {return (
                                <MenuItem key={id} value={id}>
                                    {name}
                                </MenuItem>
                            )})}
                        </Select>
                        {!canGo && selected !== '' && (
                            <FormHelperText>Can only go to location when idle</FormHelperText>
                        )}
                    </StyledFormControl>
                </Grid>
                <Grid item xs>
                    <Box display="flex" justifyContent="flex-end">
                        <Button
                            disabled={!selected || isCommandLoading || !canGo}
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
        isCommandLoading,
        isError,
        isLocationsLoading,
        locations,
        selected,
    ]);

    return (
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
    );
};

export default GoToLocationPresets;
