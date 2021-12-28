import {Box, Checkbox, Container, FormControlLabel, Grid, TextField, Typography,} from "@mui/material";
import React from "react";
import {useHTTPBasicAuthConfigurationMutation, useHTTPBasicAuthConfigurationQuery} from "../../api";
import LoadingFade from "../../components/LoadingFade";
import {LoadingButton} from "@mui/lab";
import InfoBox from "../../components/InfoBox";

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

            <InfoBox
                boxShadow={3}
                style={{
                    marginTop: "2rem",
                    marginBottom: "2rem"
                }}
            >
                <Typography color="info">
                    Valetudo will by default try to block access from public-routable IP addresses
                    for your safety and convenience.
                    <br/><br/>
                    If you want to allow external access to your Valetudo instance, consider using a VPN such as
                    WireGuard or OpenVPN to ensure the safety of your network.
                    <br/><br/>
                    If you don&apos;t want to use a VPN, usage of a reverse proxy in front of Valetudo and all of your other
                    IoT things and network services is strongly recommended, as a recent version of a proper WebServer
                    such as nginx, the Apache HTTP Server or similar will likely be more secure than Valetudo itself.
                    <br/>
                    Moreover, this approach will group all access logs to all services in a single place.
                    It&apos;s also much easier to implement some kind of Single sign-on that way.
                </Typography>
            </InfoBox>


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
