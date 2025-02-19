import {
    Box,
    Card,
    CardContent,
    Checkbox,
    Collapse,
    Container,
    Divider,
    FormControl,
    FormControlLabel,
    FormGroup,
    FormHelperText,
    Grid2,
    IconButton,
    Input,
    InputAdornment,
    InputLabel,
    Popper,
    Skeleton,
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
    Warning as MQTTErrorIcon,
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
import {convertBytesToHumans, deepCopy, extractHostFromUrl} from "../../utils";
import {InputProps} from "@mui/material/Input/Input";
import InfoBox from "../../components/InfoBox";
import PaperContainer from "../../components/PaperContainer";
import {MQTTIcon} from "../../components/CustomIcons";
import {LoadingButton} from "@mui/lab";
import TextInformationGrid from "../../components/TextInformationGrid";
import DetailPageHeaderRow from "../../components/DetailPageHeaderRow";

const MQTTStatusComponent: React.FunctionComponent<{
    status: MQTTStatus | undefined,
    statusLoading: boolean,
    statusError: boolean
}> = ({
    status,
    statusLoading,
    statusError
}) => {

    if (statusLoading || !status) {
        return (
            <Skeleton height={"4rem"}/>
        );
    }

    if (statusError) {
        return <Typography color="error">Error loading MQTT status</Typography>;
    }

    const getIconForState = (): React.ReactElement => {
        switch (status.state) {
            case "disconnected":
                return <MQTTDisconnectedIcon sx={{fontSize: "4rem"}}/>;
            case "ready":
                return <MQTTConnectedIcon sx={{fontSize: "4rem"}}/>;
            case "init":
                return <MQTTConnectingIcon sx={{fontSize: "4rem"}}/>;
            case "lost":
            case "alert":
                return <MQTTErrorIcon sx={{fontSize: "4rem"}}/>;
        }
    };

    const getContentForState = (): React.ReactElement => {
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

    const getMessageStats = (): React.ReactElement => {
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

    const getConnectionStats = (): React.ReactElement => {
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
        <Grid2 container alignItems="center" direction="column" style={{paddingBottom: "1rem"}}>
            <Grid2 style={{marginTop: "1rem"}}>
                {getIconForState()}
            </Grid2>
            <Grid2
                sx={{
                    maxWidth: "100% !important", //Why, MUI? Why?
                    wordWrap: "break-word",
                    textAlign: "center",
                    userSelect: "none"
                }}
            >
                {getContentForState()}
            </Grid2>
            <Grid2
                container
                direction="row"
                style={{marginTop: "1rem"}}
            >
                <Grid2
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
                </Grid2>
                <Grid2
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
                </Grid2>
            </Grid2>
        </Grid2>
    );
};


const GroupBox = (props: {
    title: string,
    children: React.ReactNode,
    checked?: boolean,
    disabled?: boolean,
    onChange?: ((event: React.ChangeEvent<HTMLInputElement>) => void)
}): React.ReactElement => {
    let title = (
        <Typography
            variant="subtitle1"
            sx={{
                marginBottom: 0,
                userSelect: "none"
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

const MQTTInput: React.FunctionComponent<{
    mqttConfiguration: MQTTConfiguration,
    modifyMQTTConfig: (value: any, configPath: Array<string>) => void,
    disabled?: boolean,

    title: string,
    helperText: string,
    required: boolean,
    configPath: Array<string>,
    additionalProps?: InputProps
    inputPostProcessor?: (value: any) => any
}> = ({
    mqttConfiguration,
    modifyMQTTConfig,
    disabled = false,

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

        >
            <InputLabel htmlFor={inputId}>{title}</InputLabel>
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

                {...additionalProps}
            />
            <FormHelperText id={helperId} sx={{userSelect: "none"}}>
                {helperText}
            </FormHelperText>
        </FormControl>
    );
};

const MQTTSwitch: React.FunctionComponent<{
    mqttConfiguration: MQTTConfiguration,
    modifyMQTTConfig: (value: any, configPath: Array<string>) => void,
    disabled?: boolean,

    title: string,
    configPath: Array<string>,
}> = ({
    mqttConfiguration,
    modifyMQTTConfig,
    disabled = false,

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

            label={title}
            sx={{userSelect: "none"}}
        />
    );
};

const MQTTOptionalExposedCapabilitiesEditor: React.FunctionComponent<{
    mqttConfiguration: MQTTConfiguration,
    modifyMQTTConfig: (value: any, configPath: Array<string>) => void,
    disabled?: boolean,

    configPath: Array<string>,
    exposableCapabilities: Array<string>
}> = ({
    mqttConfiguration,
    modifyMQTTConfig,
    disabled = false,

    configPath,
    exposableCapabilities
}) => {
    let selection: Array<string> = getIn(mqttConfiguration, configPath);

    return (
        <Container sx={{m: 0.2}}>
            <FormGroup>
                {
                    exposableCapabilities.map((capabilityName: string) => {
                        return (
                            <FormControlLabel
                                key={capabilityName}
                                control={
                                    <Checkbox
                                        checked={selection.includes(capabilityName)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                selection.push(capabilityName);
                                            } else {
                                                selection = selection.filter(e => {
                                                    return e !== capabilityName;
                                                });
                                            }

                                            modifyMQTTConfig(selection, configPath);
                                        }
                                        }
                                    />
                                }

                                label={capabilityName}
                                sx={{userSelect: "none"}}
                            />
                        );
                    })
                }

            </FormGroup>
        </Container>
    );
};

const sanitizeStringForMQTT = (value: string, allowSlashes = false) => {
    /*
      This rather limited set of characters is unfortunately required by Home Assistant
      Without Home Assistant, it would be enough to replace [\s+#/]

      See also: https://www.home-assistant.io/docs/mqtt/discovery/#discovery-topic
     */
    return value.replace(
        allowSlashes ? /[^a-zA-Z0-9_\-/]/g : /[^a-zA-Z0-9_-]/g,
        ""
    );
};

const sanitizeTopicPrefix = (value: string) => {
    return value.replace(
        /^\//,
        ""
    ).replace(
        /\/$/,
        ""
    );
};

const sanitizeConfigBeforeSaving = (mqttConfiguration: MQTTConfiguration) => {
    mqttConfiguration.customizations.topicPrefix = sanitizeTopicPrefix(mqttConfiguration.customizations.topicPrefix);
};

const MQTTConnectivity = (): React.ReactElement => {
    const theme = useTheme();

    const [anchorElement, setAnchorElement] = React.useState(null);

    const identifierElement = React.useRef(null);
    const topicElement = React.useRef(null);

    const {
        data: storedMQTTConfiguration,
        isPending: mqttConfigurationPending,
        isError: mqttConfigurationError,
    } = useMQTTConfigurationQuery();

    const {
        data: mqttStatus,
        isPending: mqttStatusPending,
        isError: mqttStatusError,
    } = useMQTTStatusQuery();

    const {
        data: mqttProperties,
        isPending: mqttPropertiesPending,
        isError: mqttPropertiesError
    } = useMQTTPropertiesQuery();

    const {mutate: updateMQTTConfiguration, isPending: mqttConfigurationUpdating} = useMQTTConfigurationMutation();

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

    if (mqttConfigurationPending || mqttPropertiesPending || !mqttConfiguration) {
        return (
            <>
                <Skeleton height={"12rem"}/>
                <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>
                <Skeleton height={"36rem"}/>
            </>
        );
    }

    if (mqttConfigurationError || mqttPropertiesError || !storedMQTTConfiguration || !mqttProperties) {
        return <Typography color="error">Error loading MQTT configuration</Typography>;
    }

    return (
        <>
            <MQTTStatusComponent
                status={mqttStatus}
                statusLoading={mqttStatusPending}
                statusError={mqttStatusError}
            />
            <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>

            <FormControlLabel
                control={
                    <Checkbox
                        checked={mqttConfiguration.enabled}
                        onChange={e => {
                            modifyMQTTConfig(e.target.checked, ["enabled"]);
                        }}
                    />
                }
                label="MQTT enabled"
                sx={{userSelect: "none", marginLeft: "0.5rem", marginBottom: "0.5rem"}}
            />

            <GroupBox title="Connection">
                <MQTTInput
                    mqttConfiguration={mqttConfiguration}
                    modifyMQTTConfig={modifyMQTTConfig}

                    title="Host"
                    helperText="The MQTT Broker hostname"
                    required={true}
                    configPath={["connection", "host"]}
                    inputPostProcessor={(value) => {
                        return extractHostFromUrl(value);
                    }}
                />
                <MQTTInput
                    mqttConfiguration={mqttConfiguration}
                    modifyMQTTConfig={modifyMQTTConfig}

                    title="Port"
                    helperText="The MQTT Broker port"
                    required={true}
                    configPath={["connection", "port"]}
                    additionalProps={{type: "number"}}
                />

                <GroupBox title="TLS" checked={mqttConfiguration.connection.tls.enabled}
                    onChange={(e) => {
                        modifyMQTTConfig(e.target.checked, ["connection", "tls", "enabled"]);
                    }}>
                    <MQTTInput
                        mqttConfiguration={mqttConfiguration}
                        modifyMQTTConfig={modifyMQTTConfig}

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
                    <br/><br/>
                    <MQTTSwitch
                        mqttConfiguration={mqttConfiguration}
                        modifyMQTTConfig={modifyMQTTConfig}
                        title="Ignore certificate errors"
                        configPath={["connection", "tls", "ignoreCertificateErrors"]}
                    />
                </GroupBox>

                <GroupBox title="Authentication">
                    <GroupBox title="Credentials"
                        checked={mqttConfiguration.connection.authentication.credentials.enabled}
                        onChange={(e) => {
                            modifyMQTTConfig(e.target.checked, ["connection", "authentication", "credentials", "enabled"]);
                        }}>
                        <MQTTInput
                            mqttConfiguration={mqttConfiguration}
                            modifyMQTTConfig={modifyMQTTConfig}

                            title="Username"
                            helperText="Username for authentication"
                            required={true}
                            configPath={["connection", "authentication", "credentials", "username"]}
                        />
                        <MQTTInput
                            mqttConfiguration={mqttConfiguration}
                            modifyMQTTConfig={modifyMQTTConfig}

                            title="Password"
                            helperText="Password for authentication"
                            required={false}
                            configPath={["connection", "authentication", "credentials", "password"]}
                            additionalProps={{
                                type: showMQTTAuthPasswordAsPlain ? "text" : "password",
                                endAdornment: (
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
                                            {showMQTTAuthPasswordAsPlain ? <VisibilityOffIcon/> : <VisibilityIcon/>}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </GroupBox>
                    <GroupBox title="Client certificate"
                        checked={mqttConfiguration.connection.authentication.clientCertificate.enabled}
                        onChange={(e) => {
                            modifyMQTTConfig(e.target.checked, ["connection", "authentication", "clientCertificate", "enabled"]);
                        }}>

                        <MQTTInput
                            mqttConfiguration={mqttConfiguration}
                            modifyMQTTConfig={modifyMQTTConfig}

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

            <GroupBox title="Integrations">
                <GroupBox title="Home Assistant" checked={mqttConfiguration.interfaces.homeassistant.enabled}
                    onChange={(e) => {
                        modifyMQTTConfig(e.target.checked, ["interfaces", "homeassistant", "enabled"]);
                    }}>
                    <FormControl component="fieldset" variant="standard">
                        <FormGroup sx={{marginLeft: "1rem"}}>
                            <MQTTSwitch
                                mqttConfiguration={mqttConfiguration}
                                modifyMQTTConfig={modifyMQTTConfig}
                                title="Delete autodiscovery metadata on shutdown"
                                configPath={["interfaces", "homeassistant", "cleanAutoconfOnShutdown"]}
                            />
                        </FormGroup>
                    </FormControl>
                </GroupBox>

                <GroupBox title="Homie" checked={mqttConfiguration.interfaces.homie.enabled}
                    onChange={(e) => {
                        modifyMQTTConfig(e.target.checked, ["interfaces", "homie", "enabled"]);
                    }}>
                    <FormControl component="fieldset" variant="standard">
                        <FormGroup sx={{marginLeft: "1rem"}}>
                            <MQTTSwitch
                                mqttConfiguration={mqttConfiguration}
                                modifyMQTTConfig={modifyMQTTConfig}
                                title="Delete autodiscovery metadata on shutdown"
                                configPath={["interfaces", "homie", "cleanAttributesOnShutdown"]}
                            />
                        </FormGroup>
                    </FormControl>
                </GroupBox>
            </GroupBox>

            <GroupBox title="Customizations">
                <MQTTInput
                    mqttConfiguration={mqttConfiguration}
                    modifyMQTTConfig={modifyMQTTConfig}

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
                    inputPostProcessor={(value) => {
                        return sanitizeStringForMQTT(
                            value,
                            true
                        ).replace(
                            /\/\//g,
                            "/"
                        );
                    }}
                />
                <MQTTInput
                    mqttConfiguration={mqttConfiguration}
                    modifyMQTTConfig={modifyMQTTConfig}

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
                    inputPostProcessor={(value) => {
                        return sanitizeStringForMQTT(value, false);
                    }}
                />
                <br/>
                <Typography variant="subtitle2" sx={{mt: "0.5rem", mb: "2rem", userSelect: "none"}} noWrap={false}>
                    The MQTT Topic structure will look like this:<br/>
                    <span style={{
                        fontFamily: "\"JetBrains Mono\",monospace",
                        fontWeight: 200,
                        overflowWrap: "anywhere",
                        userSelect: "text"
                    }}>
                        <span
                            style={{
                                color: theme.palette.warning.main
                            }}
                            ref={topicElement}
                        >
                            {sanitizeTopicPrefix(mqttConfiguration.customizations.topicPrefix) || mqttProperties.defaults.customizations.topicPrefix}
                        </span>
                        /<wbr/>
                        <span
                            style={{
                                color: theme.palette.secondary.main
                            }}
                            ref={identifierElement}
                        >
                            {mqttConfiguration.identity.identifier || mqttProperties.defaults.identity.identifier}
                        </span>
                            /<wbr/>BatteryStateAttribute/<wbr/>level
                    </span>
                </Typography>
                <MQTTSwitch
                    mqttConfiguration={mqttConfiguration}
                    modifyMQTTConfig={modifyMQTTConfig}
                    title="Provide map data"
                    configPath={["customizations", "provideMapData"]}
                />
            </GroupBox>

            {
                mqttProperties.optionalExposableCapabilities.length > 0 &&
                <GroupBox title="Optionally exposable capabilities">
                    <MQTTOptionalExposedCapabilitiesEditor
                        mqttConfiguration={mqttConfiguration}
                        modifyMQTTConfig={modifyMQTTConfig}
                        configPath={["optionalExposedCapabilities"]}
                        exposableCapabilities={mqttProperties.optionalExposableCapabilities}
                    />
                </GroupBox>
            }

            <Popper
                open={Boolean(anchorElement)}
                anchorEl={anchorElement}
            >
                <Box>
                    <ArrowUpward fontSize={"large"} color={"info"}/>
                </Box>
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
                    If you&apos;re experiencing problems regarding MQTT, make sure to try Mosquitto since some other
                    MQTT
                    brokers only implement a subset of the MQTT spec, which often leads to issues when used with
                    Valetudo.

                    <br/><br/>
                    If you&apos;re using Mosquitto but still experience issues, make sure that your ACLs (if any) are
                    correct and
                    you&apos;re also using the correct login credentials for those.
                    Valetudo will not receive any feedback from the broker if publishing fails due to ACL restrictions
                    as such feedback
                    simply isn&apos;t part of the MQTT v3.1.1 spec. MQTT v5 fixes this issue but isn&apos;t widely
                    available just yet.
                </Typography>
            </InfoBox>

            <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>

            <Grid2 container>
                <Grid2 style={{marginLeft: "auto"}}>
                    <LoadingButton
                        disabled={!configurationModified}
                        loading={mqttConfigurationUpdating}
                        color="primary"
                        variant="outlined"
                        onClick={() => {
                            sanitizeConfigBeforeSaving(mqttConfiguration);

                            updateMQTTConfiguration(mqttConfiguration);
                            setConfigurationModified(false);
                        }}
                    >
                        Save configuration
                    </LoadingButton>
                </Grid2>
            </Grid2>
        </>
    );
};

const MQTTConnectivityPage = (): React.ReactElement => {
    const {
        isFetching: mqttStatusFetching,
        refetch: refetchMqttStatus,
    } = useMQTTStatusQuery();

    return (
        <PaperContainer>
            <Grid2 container direction="row">
                <Box style={{width: "100%"}}>
                    <DetailPageHeaderRow
                        title="MQTT Connectivity"
                        icon={<MQTTIcon/>}
                        onRefreshClick={() => {
                            refetchMqttStatus().catch(() => {
                                /* intentional */
                            });
                        }}
                        isRefreshing={mqttStatusFetching}
                    />
                    <MQTTConnectivity/>
                </Box>
            </Grid2>
        </PaperContainer>
    );
};

export default MQTTConnectivityPage;
