import {
    Box,
    Card,
    CardContent,
    Checkbox,
    Collapse,
    Container,
    Divider,
    Fade,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    FormLabel,
    Grid,
    IconButton,
    Input,
    InputAdornment,
    InputLabel,
    Popper,
    Switch,
    Typography,
    useTheme,
} from "@mui/material";
import {
    ArrowUpward,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,

    LinkOff as MQTTDisconnectedIcon,
    Link as MQTTConnectedIcon,
    Sync as MQTTConnectingIcon,
    Warning as MQTTErrorIcon
} from "@mui/icons-material";
import React from "react";
import {
    MQTTConfiguration,
    MQTTStatus,
    useMQTTConfigurationMutation,
    useMQTTConfigurationQuery,
    useMQTTPropertiesQuery,
    useMQTTStatusQuery
} from "../../api";
import {getIn, setIn} from "../../api/utils";
import {convertBytesToHumans, deepCopy} from "../../utils";
import {InputProps} from "@mui/material/Input/Input";
import LoadingFade from "../../components/LoadingFade";
import InfoBox from "../../components/InfoBox";
import PaperContainer from "../../components/PaperContainer";
import {MQTTIcon} from "../../components/CustomIcons";
import {LoadingButton} from "@mui/lab";
import TextInformationGrid from "../../components/TextInformationGrid";

const MQTTStatusComponent : React.FunctionComponent<{ status: MQTTStatus | undefined, statusLoading: boolean, statusError: boolean }> = ({
    status,
    statusLoading,
    statusError
}) => {

    if (statusLoading || !status) {
        return (
            <LoadingFade/>
        );
    }

    if (statusError) {
        return <Typography color="error">Error loading MQTT status</Typography>;
    }

    const getIconForState = () : JSX.Element => {
        switch (status.state) {
            case "disconnected":
                return <MQTTDisconnectedIcon sx={{ fontSize: "4rem" }}/>;
            case "ready":
                return <MQTTConnectedIcon sx={{ fontSize: "4rem" }}/>;
            case "init":
                return <MQTTConnectingIcon sx={{ fontSize: "4rem" }}/>;
            case "lost":
            case "alert":
                return <MQTTErrorIcon sx={{fontSize: "4rem"}}/>;
        }
    };

    const getContentForState = () : JSX.Element => {
        switch (status.state) {
            case "disconnected":
                return (
                    <Typography variant="h5">Disconnected</Typography>
                );
            case "ready":
                return (
                    <Typography variant="h5">Connected</Typography>
                );
            case "init":
                return (
                    <Typography variant="h5">Connecting/Reconfiguring</Typography>
                );
            case "lost":
            case "alert":
                return (
                    <Typography variant="h5">Connection error</Typography>
                );
        }
    };

    const getMessageStats = () : JSX.Element => {
        const items = [
            {
                header: "Messages Sent",
                body: status.stats.messages.count.sent.toString()
            },
            {
                header: "Bytes Sent",
                body: convertBytesToHumans(status.stats.messages.bytes.sent)
            },
            {
                header: "Messages Received",
                body: status.stats.messages.count.received.toString()
            },
            {
                header: "Bytes Received",
                body: convertBytesToHumans(status.stats.messages.bytes.received)
            },
        ];

        return <TextInformationGrid items={items}/>;
    };

    const getConnectionStats = () : JSX.Element => {
        const items = [
            {
                header: "Connects",
                body: status.stats.connection.connects.toString()
            },
            {
                header: "Disconnects",
                body: status.stats.connection.disconnects.toString()
            },
            {
                header: "Reconnects",
                body: status.stats.connection.reconnects.toString()
            },
            {
                header: "Errors",
                body: status.stats.connection.errors.toString()
            },
        ];

        return <TextInformationGrid items={items}/>;
    };


    return (
        <>
            <Grid container alignItems="center" direction="column" style={{paddingBottom:"1rem"}}>
                <Grid item style={{marginTop:"1rem"}}>
                    {getIconForState()}
                </Grid>
                <Grid
                    item
                    sx={{
                        maxWidth: "100% !important", //Why, MUI? Why?
                        wordWrap: "break-word",
                        textAlign: "center",
                        userSelect: "none"
                    }}
                >
                    {getContentForState()}
                </Grid>
                <Grid
                    item
                    container
                    direction="row"
                    style={{marginTop: "1rem"}}
                >
                    <Grid
                        item
                        style={{flexGrow: 1}}
                        p={1}
                    >
                        <Card
                            sx={{boxShadow: 3}}
                        >
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Message Statistics
                                </Typography>
                                <Divider/>
                                {getMessageStats()}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid
                        item
                        style={{flexGrow: 1}}
                        p={1}
                    >
                        <Card
                            sx={{boxShadow: 3}}
                        >
                            <CardContent>
                                <Typography variant="h6" gutterBottom>
                                    Connection Statistics
                                </Typography>
                                <Divider/>
                                {getConnectionStats()}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Grid>
        </>
    );
};


const GroupBox = (props: { title: string, children: React.ReactNode, checked?: boolean, disabled?: boolean, onChange?: ((event: React.ChangeEvent<HTMLInputElement>) => void) }): JSX.Element => {
    let title = (
        <Typography
            variant="subtitle1"
            sx={{
                marginBottom: 0,
            }}
        >
            {props.title}
        </Typography>
    );
    if (props.onChange) {
        title = (
            <FormControlLabel
                control={
                    <Checkbox
                        checked={props.checked}
                        disabled={props.disabled}
                        onChange={props.onChange}
                    />
                }
                disableTypography
                label={title}
            />
        );
    }

    return (
        <Container sx={{m: 0.2}}>
            {title}
            <Collapse in={props.checked || !props.onChange} appear={false}>
                <div>
                    {props.children}
                </div>
            </Collapse>
            <Box pt={1}/>
        </Container>
    );
};

const MQTTInput : React.FunctionComponent<{
    mqttConfiguration: MQTTConfiguration,
    modifyMQTTConfig: (value: any, configPath: Array<string>) => void,
    disabled: boolean,

    title: string,
    helperText: string,
    required: boolean,
    configPath: Array<string>,
    additionalProps?: InputProps
    inputPostProcessor?: (value: any) => any
}> = ({
    mqttConfiguration,
    modifyMQTTConfig,
    disabled,

    title,
    helperText,
    required,
    configPath,
    additionalProps,
    inputPostProcessor
}) => {
    const idBase = "mqtt-config-" + configPath.join("-");
    const inputId = idBase + "-input";
    const helperId = idBase + "-helper";
    const value = getIn(mqttConfiguration, configPath);
    const error = required && !value;

    return (
        <FormControl
            required={required}
            error={error}
            component="fieldset"
            sx={{ml: 1, mt: 2}}
            disabled={disabled}
        >
            <InputLabel htmlFor={inputId} disabled={disabled}>{title}</InputLabel>
            <Input
                id={inputId}
                value={value}
                onChange={(e) => {
                    let newValue = additionalProps?.type === "number" ? parseInt(e.target.value) : e.target.value;
                    if (inputPostProcessor) {
                        newValue = inputPostProcessor(newValue);
                    }

                    modifyMQTTConfig(newValue, configPath);
                }}
                aria-describedby={helperId}
                disabled={disabled}
                {...additionalProps}
            />
            <FormHelperText id={helperId} disabled={disabled}>
                {helperText}
            </FormHelperText>
        </FormControl>
    );
};

const MQTTSwitch : React.FunctionComponent<{
    mqttConfiguration: MQTTConfiguration,
    modifyMQTTConfig: (value: any, configPath: Array<string>) => void,
    disabled: boolean,

    title: string,
    configPath: Array<string>,
}> = ({
    mqttConfiguration,
    modifyMQTTConfig,
    disabled,

    title,
    configPath,
}) => {
    const value = getIn(mqttConfiguration, configPath);
    return (
        <FormControlLabel
            control={
                <Switch checked={value} onChange={(e) => {
                    modifyMQTTConfig(e.target.checked, configPath);
                }}/>
            }
            disabled={disabled}
            label={title}
        />
    );
};

const MQTTConnectivity = (): JSX.Element => {
    const theme = useTheme();

    const [anchorElement, setAnchorElement] = React.useState(null);

    const identifierElement = React.useRef(null);
    const topicElement = React.useRef(null);

    const {
        data: storedMQTTConfiguration,
        isLoading: mqttConfigurationLoading,
        isError: mqttConfigurationError,
    } = useMQTTConfigurationQuery();

    const {
        data: mqttStatus,
        isLoading: mqttStatusLoading,
        isError: mqttStatusError
    } = useMQTTStatusQuery();

    const {
        data: mqttProperties,
        isLoading: mqttPropertiesLoading,
        isError: mqttPropertiesError
    } = useMQTTPropertiesQuery();

    const {mutate: updateMQTTConfiguration, isLoading: mqttConfigurationUpdating} = useMQTTConfigurationMutation();

    const [mqttConfiguration, setMQTTConfiguration] = React.useState<MQTTConfiguration | null>(null);
    const [configurationModified, setConfigurationModified] = React.useState<boolean>(false);


    const [showMQTTAuthPasswordAsPlain, setShowMQTTAuthPasswordAsPlain] = React.useState(false);

    React.useEffect(() => {
        if (storedMQTTConfiguration && !configurationModified && !mqttConfigurationUpdating) {
            setMQTTConfiguration(deepCopy(storedMQTTConfiguration));
            setConfigurationModified(false);
        }
    }, [storedMQTTConfiguration, configurationModified, mqttConfigurationUpdating]);

    const modifyMQTTConfig = React.useCallback((value: any, configPath: Array<string>): void => {
        if (!mqttConfiguration) {
            return;
        }
        const newConfig = deepCopy(mqttConfiguration);
        setIn(newConfig, value, configPath);
        setMQTTConfiguration(newConfig);
        setConfigurationModified(true);
    }, [mqttConfiguration]);

    if (mqttConfigurationLoading || mqttPropertiesLoading || !mqttConfiguration) {
        return (
            <LoadingFade/>
        );
    }

    if (mqttConfigurationError || mqttPropertiesError || !storedMQTTConfiguration || !mqttProperties) {
        return <Typography color="error">Error loading MQTT configuration</Typography>;
    }

    const disabled = !mqttConfiguration.enabled;

    return (
        <PaperContainer>
            <Grid container direction="row">
                <Box style={{width: "100%"}}>
                    <Grid item container alignItems="center" spacing={1} justifyContent="space-between">
                        <Grid item style={{display:"flex"}}>
                            <Grid item style={{paddingRight: "8px"}}>
                                <MQTTIcon/>
                            </Grid>
                            <Grid item>
                                <Typography>MQTT Connectivity</Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Divider sx={{mt: 1}}/>
                    <MQTTStatusComponent
                        status={mqttStatus}
                        statusLoading={mqttStatusLoading}
                        statusError={mqttStatusError}
                    />
                    <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>

                    <FormControlLabel control={<Checkbox checked={mqttConfiguration.enabled} onChange={e => {
                        modifyMQTTConfig(e.target.checked, ["enabled"]);
                    }}/>} label="MQTT enabled"/>

                    <GroupBox title="Connection">
                        <MQTTInput
                            mqttConfiguration={mqttConfiguration}
                            modifyMQTTConfig={modifyMQTTConfig}
                            disabled={disabled}

                            title="Host"
                            helperText="The MQTT Broker hostname"
                            required={true}
                            configPath={["connection", "host"]}
                        />
                        <MQTTInput
                            mqttConfiguration={mqttConfiguration}
                            modifyMQTTConfig={modifyMQTTConfig}
                            disabled={disabled}

                            title="Port"
                            helperText="The MQTT Broker port"
                            required={true}
                            configPath={["connection", "port"]}
                            additionalProps={{type: "number"}}
                        />

                        <GroupBox title="TLS" checked={mqttConfiguration.connection.tls.enabled} disabled={disabled}
                            onChange={(e) => {
                                modifyMQTTConfig(e.target.checked, ["connection", "tls", "enabled"]);
                            }}>
                            <MQTTInput
                                mqttConfiguration={mqttConfiguration}
                                modifyMQTTConfig={modifyMQTTConfig}
                                disabled={disabled}

                                title="CA"
                                helperText="The optional Certificate Authority to verify the connection with"
                                required={false}
                                configPath={["connection", "tls", "ca"]}
                                additionalProps={{
                                    multiline: true,
                                    minRows: 3,
                                    maxRows: 10,
                                }}
                            />
                        </GroupBox>

                        <GroupBox title="Authentication">
                            <GroupBox title="Credentials" disabled={disabled}
                                checked={mqttConfiguration.connection.authentication.credentials.enabled}
                                onChange={(e) => {
                                    modifyMQTTConfig(e.target.checked, ["connection", "authentication", "credentials", "enabled"]);
                                }}>
                                <MQTTInput
                                    mqttConfiguration={mqttConfiguration}
                                    modifyMQTTConfig={modifyMQTTConfig}
                                    disabled={disabled}

                                    title="Username"
                                    helperText="Username for authentication"
                                    required={true}
                                    configPath={["connection", "authentication", "credentials", "username"]}
                                />
                                <MQTTInput
                                    mqttConfiguration={mqttConfiguration}
                                    modifyMQTTConfig={modifyMQTTConfig}
                                    disabled={disabled}

                                    title="Password"
                                    helperText="Password for authentication"
                                    required={false}
                                    configPath={["connection", "authentication", "credentials", "password"]}
                                    additionalProps={{
                                        type: showMQTTAuthPasswordAsPlain ? "text" : "password",
                                        endAdornment : (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={() => {
                                                        setShowMQTTAuthPasswordAsPlain(!showMQTTAuthPasswordAsPlain);
                                                    }}
                                                    onMouseDown={e => {
                                                        e.preventDefault();
                                                    }}
                                                    edge="end"
                                                >
                                                    {showMQTTAuthPasswordAsPlain ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                                </IconButton>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </GroupBox>
                            <GroupBox title="Client certificate" disabled={disabled}
                                checked={mqttConfiguration.connection.authentication.clientCertificate.enabled}
                                onChange={(e) => {
                                    modifyMQTTConfig(e.target.checked, ["connection", "authentication", "clientCertificate", "enabled"]);
                                }}>

                                <MQTTInput
                                    mqttConfiguration={mqttConfiguration}
                                    modifyMQTTConfig={modifyMQTTConfig}
                                    disabled={disabled}

                                    title="Certificate"
                                    helperText="The full certificate as a multi-line string"
                                    required={true}
                                    configPath={["connection", "authentication", "clientCertificate", "certificate"]}
                                    additionalProps={{
                                        multiline: true,
                                        minRows: 3,
                                        maxRows: 10
                                    }}
                                />
                                <MQTTInput
                                    mqttConfiguration={mqttConfiguration}
                                    modifyMQTTConfig={modifyMQTTConfig}
                                    disabled={disabled}

                                    title="Key"
                                    helperText="The full key as a multi-line string"
                                    required={true}
                                    configPath={["connection", "authentication", "clientCertificate", "key"]}
                                    additionalProps={{
                                        multiline: true,
                                        minRows: 3,
                                        maxRows: 10
                                    }}
                                />
                            </GroupBox>
                        </GroupBox>
                    </GroupBox>

                    <GroupBox title="Identity" disabled={disabled}>
                        <MQTTInput
                            mqttConfiguration={mqttConfiguration}
                            modifyMQTTConfig={modifyMQTTConfig}
                            disabled={disabled}

                            title="Friendly name"
                            helperText="The human-readable name of the robot"
                            required={false}
                            configPath={["identity", "friendlyName"]}
                            additionalProps={{
                                placeholder: mqttProperties.defaults.identity.friendlyName,
                            }}
                        />
                        <MQTTInput
                            mqttConfiguration={mqttConfiguration}
                            modifyMQTTConfig={modifyMQTTConfig}
                            disabled={disabled}

                            title="Identifier"
                            helperText="The machine-readable name of the robot"
                            required={false}
                            configPath={["identity", "identifier"]}
                            additionalProps={{
                                placeholder: mqttProperties.defaults.identity.identifier,
                                color: "secondary",
                                onFocus: () => {
                                    setAnchorElement(identifierElement.current);
                                },
                                onBlur: () => {
                                    setAnchorElement(null);
                                },
                            }}
                            inputPostProcessor={(value: string) => {
                                return value.replace(/[\s+#]/g,"");
                            }}
                        />
                    </GroupBox>

                    <GroupBox title="Customizations" disabled={disabled}>
                        <MQTTInput
                            mqttConfiguration={mqttConfiguration}
                            modifyMQTTConfig={modifyMQTTConfig}
                            disabled={disabled}

                            title="Topic prefix"
                            helperText="MQTT topic prefix"
                            required={false}
                            configPath={["customizations", "topicPrefix"]}
                            additionalProps={{
                                placeholder: mqttProperties.defaults.customizations.topicPrefix,
                                color: "warning",
                                onFocus: () => {
                                    setAnchorElement(topicElement.current);
                                },
                                onBlur: () => {
                                    setAnchorElement(null);
                                },
                            }}
                            inputPostProcessor={(value: string) => {
                                return value.replace(/[\s+#]/g,"");
                            }}
                        />
                        <br/>
                        <Typography variant="subtitle2" sx={{mt: 1}} noWrap={false}>
                            The MQTT Topic structure will look like this:<br/>
                            <span style={{fontFamily: "\"JetBrains Mono\",monospace", fontWeight: 200, overflowWrap: "anywhere"}}>
                                <span style={{
                                    color: theme.palette.warning.main
                                }} ref={topicElement}>
                                    {mqttConfiguration.customizations.topicPrefix || mqttProperties.defaults.customizations.topicPrefix}
                                </span>
                        /<wbr/>
                                <span style={{
                                    color: theme.palette.secondary.main
                                }} ref={identifierElement}>
                                    {mqttConfiguration.identity.identifier || mqttProperties.defaults.identity.identifier}
                                </span>
                            /<wbr/>BatteryStateAttribute/<wbr/>level
                            </span>
                        </Typography>
                        <br/>
                        <MQTTSwitch
                            mqttConfiguration={mqttConfiguration}
                            modifyMQTTConfig={modifyMQTTConfig}
                            disabled={disabled}
                            title="Provide map data"
                            configPath={["customizations", "provideMapData"]}
                        />
                    </GroupBox>

                    <GroupBox title="Interfaces" disabled={disabled}>
                        <GroupBox title="Homie" checked={mqttConfiguration.interfaces.homie.enabled} disabled={disabled}
                            onChange={(e) => {
                                modifyMQTTConfig(e.target.checked, ["interfaces", "homie", "enabled"]);
                            }}>
                            <FormControl component="fieldset" variant="standard">
                                <FormLabel component="legend">Select the options for Homie integration</FormLabel>
                                <FormGroup>
                                    <MQTTSwitch
                                        mqttConfiguration={mqttConfiguration}
                                        modifyMQTTConfig={modifyMQTTConfig}
                                        disabled={disabled}
                                        title={"Provide autodiscovery for \"I Can't Believe It's Not Valetudo\" map"}
                                        configPath={["interfaces", "homie", "addICBINVMapProperty"]}
                                    />
                                    <MQTTSwitch
                                        mqttConfiguration={mqttConfiguration}
                                        modifyMQTTConfig={modifyMQTTConfig}
                                        disabled={disabled}
                                        title="Delete autodiscovery on shutdown"
                                        configPath={["interfaces", "homie", "cleanAttributesOnShutdown"]}
                                    />
                                </FormGroup>
                            </FormControl>
                        </GroupBox>

                        <GroupBox title="Home Assistant" checked={mqttConfiguration.interfaces.homeassistant.enabled} disabled={disabled}
                            onChange={(e) => {
                                modifyMQTTConfig(e.target.checked, ["interfaces", "homeassistant", "enabled"]);
                            }}>
                            <FormControl component="fieldset" variant="standard">
                                <FormLabel component="legend">Select the options for Home Assistant integration</FormLabel>
                                <FormGroup>
                                    <MQTTSwitch
                                        mqttConfiguration={mqttConfiguration}
                                        modifyMQTTConfig={modifyMQTTConfig}
                                        disabled={disabled}
                                        title="Delete autodiscovery on shutdown"
                                        configPath={["interfaces", "homeassistant", "cleanAutoconfOnShutdown"]}
                                    />
                                </FormGroup>
                            </FormControl>
                        </GroupBox>
                    </GroupBox>

                    <Popper open={Boolean(anchorElement)} anchorEl={anchorElement} transition>
                        {({TransitionProps}) => {
                            return (
                                <Fade {...TransitionProps} timeout={350}>
                                    <Box>
                                        <ArrowUpward fontSize={"large"} color={"info"}/>
                                    </Box>
                                </Fade>
                            );
                        }}
                    </Popper>

                    <InfoBox
                        boxShadow={5}
                        style={{
                            marginTop: "2rem",
                            marginBottom: "2rem"
                        }}
                    >
                        <Typography color="info">
                            Valetudo recommends the use of the Eclipse Mosquitto MQTT Broker, which is FOSS, has a
                            tiny resource footprint and is part of basically every GNU/Linux distribution.
                            You can also install it as a container via the container management solution of your choice.

                            <br/><br/>
                            If you&apos;re experiencing problems regarding MQTT, make sure to try Mosquitto since some other MQTT
                            brokers only implement a subset of the MQTT spec, which often leads to issues when used with Valetudo.

                            <br/><br/>
                            If you&apos;re using Mosquitto but still experience issues, make sure that your ACLs (if any) are correct and
                            you&apos;re also using the correct login credentials for those.
                            Valetudo will not receive any feedback from the broker if publishing fails due to ACL restrictions as such feedback
                            simply isn&apos;t part of the MQTT v3.1.1 spec. MQTT v5 fixes this issue but isn&apos;t widely available just yet.
                        </Typography>
                    </InfoBox>

                    <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>

                    <Grid container>
                        <Grid item style={{marginLeft: "auto"}}>
                            <LoadingButton
                                disabled={!configurationModified}
                                loading={mqttConfigurationUpdating}
                                color="primary"
                                variant="outlined"
                                onClick={() => {
                                    updateMQTTConfiguration(mqttConfiguration);
                                    setConfigurationModified(false);
                                }}
                            >
                                Save configuration
                            </LoadingButton>
                        </Grid>
                    </Grid>
                </Box>
            </Grid>
        </PaperContainer>
    );
};

export default MQTTConnectivity;
