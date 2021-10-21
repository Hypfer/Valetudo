import {Box, Checkbox, Container, FormControlLabel, Grid, TextField, Typography,} from "@mui/material";
import React from "react";
import {useHTTPBasicAuthConfigurationMutation, useHTTPBasicAuthConfigurationQuery} from "../../api";
import LoadingFade from "../../components/LoadingFade";
import {LoadingButton} from "@mui/lab";

const HTTPBasicAuth = (): JSX.Element => {
    const {
        data: storedConfiguration,
        isLoading: configurationLoading,
        isError: configurationError,
    } = useHTTPBasicAuthConfigurationQuery();

    const {mutate: updateConfiguration, isLoading: configurationUpdating} = useHTTPBasicAuthConfigurationMutation();

    const [enabled, setEnabled] = React.useState(false);
    const [username, setUsername] = React.useState("");
    const [password, setPassword] = React.useState("");

    React.useEffect(() => {
        if (storedConfiguration) {
            setEnabled(storedConfiguration.enabled);
            setUsername(storedConfiguration.username);
            setPassword(storedConfiguration.password);
        }
    }, [storedConfiguration]);

    if (configurationLoading) {
        return (
            <LoadingFade/>
        );
    }

    if (configurationError || !storedConfiguration) {
        return <Typography color="error">Error loading HTTP Basic Auth configuration</Typography>;
    }

    return (
        <Container>
            <FormControlLabel control={<Checkbox checked={enabled} onChange={e => {
                setEnabled(e.target.checked);
            }}/>} label="HTTP Basic Auth enabled" sx={{mb: 1}}/>
            <Grid container spacing={1} sx={{mb: 1}}>
                <Grid item xs="auto">
                    <TextField label="Username" value={username}
                        variant="standard" disabled={!enabled} onChange={e => {
                            setUsername(e.target.value);
                        }}/>
                </Grid>
                <Grid item xs="auto">
                    <TextField label="Password" value={password}
                        variant="standard" disabled={!enabled} type="password" onChange={e => {
                            setPassword(e.target.value);
                        }}/>
                </Grid>
            </Grid>

            <Typography color="error" variant="subtitle2" sx={{mb: 1}}>
                <strong>Note:</strong> HTTP Basic Authentication may not be enough to make exposing
                Valetudo to the internet safe. Please consider alternatives such as using a VPN.
            </Typography>
            <LoadingButton loading={configurationUpdating} color="primary" variant="contained" onClick={() => {
                updateConfiguration({
                    enabled,
                    username,
                    password
                });
            }}>Save configuration</LoadingButton>

            <Box pt={3}/>
        </Container>
    );
};

export default HTTPBasicAuth;
