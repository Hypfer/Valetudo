import {
    Button,
    ButtonGroup,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    LinearProgress,
    Paper,
    Skeleton,
    Stack,
    styled,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";
import React from "react";
import {
    useRobotInformationQuery,
    useSystemHostInfoQuery,
    useSystemRuntimeInfoQuery,
    useValetudoVersionQuery,
    useRobotPropertiesQuery,
    useValetudoInformationQuery,
} from "../api";
import RatioBar from "../components/RatioBar";
import {convertSecondsToHumans} from "../utils";
import {useIsMobileView} from "../hooks";
import ReloadableCard from "../components/ReloadableCard";
import LoadingFade from "../components/LoadingFade";
import PaperContainer from "../components/PaperContainer";
import TextInformationGrid from "../components/TextInformationGrid";

const ThickLinearProgressWithTopMargin = styled(LinearProgress)({
    marginTop: "2px",
    height: "6px"
});



const SystemRuntimeInfo = (): JSX.Element => {
    const {
        data: systemRuntimeInfo,
        isLoading: systemRuntimeInfoLoading,
        isFetching: systemRuntimeInfoFetching,
        refetch: fetchSystemRuntimeInfo,
    } = useSystemRuntimeInfoQuery();

    const [nodeDialogOpen, setNodeDialogOpen] = React.useState(false);
    const [envDialogOpen, setEnvDialogOpen] = React.useState(false);

    const mobileView = useIsMobileView();

    const systemRuntimeInformation = React.useMemo(() => {
        if (systemRuntimeInfoLoading) {
            return <Skeleton/>;
        }

        if (!systemRuntimeInfo) {
            return <Typography color="error">No runtime information</Typography>;
        }

        const topItems: Array<[header: string, body: string]> = [
            ["Valetudo uptime", convertSecondsToHumans(systemRuntimeInfo.uptime)],
            ["UID", String(systemRuntimeInfo.uid)],
            ["GID", String(systemRuntimeInfo.gid)],
            ["PID", String(systemRuntimeInfo.pid)],
            ["argv", systemRuntimeInfo.argv.join(" ")]
        ];

        const versionRows = Object.keys(systemRuntimeInfo.versions).map(lib => {
            const version = systemRuntimeInfo.versions[lib];
            return (
                <TableRow
                    key={lib}
                    sx={{"&:last-child td, &:last-child th": {border: 0}}}
                >
                    <TableCell component="th" scope="row">{lib}</TableCell>
                    <TableCell align="right">{version}</TableCell>
                </TableRow>
            );
        });

        const environmentRows = Object.keys(systemRuntimeInfo.env).sort().map(key => {
            const value = systemRuntimeInfo.env[key];
            return (
                <TableRow
                    key={key}
                    sx={{"&:last-child td, &:last-child th": {border: 0}}}
                >
                    <TableCell component="th" scope="row">{key}</TableCell>
                    <TableCell>{value}</TableCell>
                </TableRow>
            );
        });

        return (
            <Stack spacing={2}>
                <Grid container spacing={2}>
                    {topItems.map(([header, body]) => {
                        return (
                            <Grid item key={header}>
                                <Typography variant="caption" color="textSecondary">
                                    {header}
                                </Typography>
                                <Typography variant="body2">{body}</Typography>
                            </Grid>
                        );
                    })}
                </Grid>
                <ButtonGroup variant="outlined">
                    <Button onClick={() => {
                        setNodeDialogOpen(true);
                    }}>Node</Button>
                    <Button onClick={() => {
                        setEnvDialogOpen(true);
                    }}>Environment</Button>
                </ButtonGroup>

                <Dialog
                    open={nodeDialogOpen}
                    onClose={() => {
                        setNodeDialogOpen(false);
                    }}
                    scroll={"body"}
                    fullScreen={mobileView}
                >
                    <DialogTitle>Node information</DialogTitle>
                    <DialogContent dividers>
                        <Stack spacing={2}>
                            <Grid container spacing={2}>
                                <Grid item>
                                    <Typography variant="caption" color="textSecondary">
                                        execPath
                                    </Typography>
                                    <Typography variant="body2">{systemRuntimeInfo.execPath}</Typography>
                                </Grid>
                                <Grid item>
                                    <Typography variant="caption" color="textSecondary">
                                        execArgv
                                    </Typography>
                                    <Typography
                                        variant="body2">{systemRuntimeInfo.execArgv.join(" ")}</Typography>
                                </Grid>
                            </Grid>

                            <TableContainer component={Paper}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Dependency</TableCell>
                                            <TableCell align="right">Version</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {versionRows}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setNodeDialogOpen(false);
                        }}>Close</Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={envDialogOpen}
                    onClose={() => {
                        setEnvDialogOpen(false);
                    }}
                    fullScreen={mobileView}
                    maxWidth={"xl"}
                    scroll={"body"}
                >
                    <DialogTitle>Environment</DialogTitle>
                    <DialogContent>
                        <TableContainer component={Paper}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Key</TableCell>
                                        <TableCell>Value</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {environmentRows}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setEnvDialogOpen(false);
                        }}>Close</Button>
                    </DialogActions>
                </Dialog>
            </Stack>
        );
    }, [systemRuntimeInfoLoading, systemRuntimeInfo, nodeDialogOpen, envDialogOpen, mobileView]);

    return (
        <ReloadableCard
            title="Runtime Information"
            loading={systemRuntimeInfoFetching}
            onReload={() => {
                return fetchSystemRuntimeInfo();
            }}
            boxShadow={3}
        >
            {systemRuntimeInformation}
        </ReloadableCard>
    );
};

const SystemInformation = (): JSX.Element => {
    const {
        data: robotInformation,
        isLoading: robotInformationLoading,
    } = useRobotInformationQuery();
    const {
        data: version,
        isLoading: versionLoading,
    } = useValetudoVersionQuery();
    const {
        data: valetudoInformation,
        isLoading: valetudoInformationLoading
    } = useValetudoInformationQuery();
    const {
        data: systemHostInfo,
        isLoading: systemHostInfoLoading,
        isFetching: systemHostInfoFetching,
        refetch: fetchSystemHostInfo,
    } = useSystemHostInfoQuery();
    const {
        data: robotProperties,
        isLoading: robotPropertiesLoading
    } = useRobotPropertiesQuery();

    const valetudoInformationViewLoading = versionLoading || valetudoInformationLoading;

    const valetudoInformationView = React.useMemo(() => {
        if (valetudoInformationViewLoading) {
            return (
                <LoadingFade/>
            );
        }

        if (!version && !valetudoInformation) {
            return <Typography color="error">No valetudo information</Typography>;
        }

        const items = [
            {
                header: "Release",
                body: version?.release
            },
            {
                header: "Commit",
                body: version?.commit
            },
            {
                header: "Embedded",
                body: valetudoInformation?.embedded ? "true" : "false"
            },
            {
                header: "System ID",
                body: valetudoInformation?.systemId
            }
        ].filter(item => {
            return item.body !== undefined;
        }) as Array<{header: string, body: string}>;

        return (
            <TextInformationGrid items={items}/>
        );
    }, [valetudoInformationViewLoading, version, valetudoInformation]);


    const robotInformationViewLoading = robotInformationLoading || robotPropertiesLoading;

    const robotInformationView = React.useMemo(() => {
        if (robotInformationViewLoading) {
            return (
                <LoadingFade/>
            );
        }

        if (!robotInformation && !robotProperties) {
            return <Typography color="error">No robot information</Typography>;
        }

        const items = [
            {
                header: "Manufacturer",
                body: robotInformation?.manufacturer
            },
            {
                header: "Model",
                body: robotInformation?.modelName
            },
            {
                header: "Valetudo Implementation",
                body: robotInformation?.implementation
            },
            {
                header: "Firmware Version",
                body: robotProperties?.firmwareVersion
            }
        ].filter(item => {
            return item.body !== undefined;
        }) as Array<{header: string, body: string}>;

        return (
            <TextInformationGrid items={items}/>
        );

    }, [robotInformation, robotInformationViewLoading, robotProperties]);

    const systemHostInformation = React.useMemo(() => {
        if (systemHostInfoLoading) {
            return (
                <LoadingFade/>
            );
        }
        if (!systemHostInfo) {
            return (
                <Typography color="textSecondary">No system host information</Typography>
            );
        }


        return (
            <Grid container spacing={2}>
                <Grid item>
                    <Typography variant="caption" color="textSecondary">
                        Hostname
                    </Typography>
                    <Typography variant="body2">{systemHostInfo.hostname}</Typography>
                </Grid>
                <Grid item>
                    <Typography variant="caption" color="textSecondary">
                        Arch
                    </Typography>
                    <Typography variant="body2">{systemHostInfo.arch}</Typography>
                </Grid>
                <Grid item>
                    <Typography variant="caption" color="textSecondary">
                        Uptime
                    </Typography>
                    <Typography variant="body2">
                        {convertSecondsToHumans(systemHostInfo.uptime)}
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                        System Memory (RAM)
                    </Typography>

                    <RatioBar
                        total={systemHostInfo.mem.total}
                        totalLabel={`${((systemHostInfo.mem.free) / 1024 / 1024).toFixed(2)} MiB`}
                        partitions={
                            [
                                {
                                    label: "System",
                                    value: systemHostInfo.mem.total - systemHostInfo.mem.free - systemHostInfo.mem.valetudo_current,
                                    valueLabel: `${((systemHostInfo.mem.total - systemHostInfo.mem.free - systemHostInfo.mem.valetudo_current) / 1024 / 1024).toFixed(2)} MiB`,
                                    color: "#7AC037"
                                },
                                {
                                    label: "Valetudo",
                                    value: systemHostInfo.mem.valetudo_current,
                                    valueLabel: `${((systemHostInfo.mem.valetudo_current) / 1024 / 1024).toFixed(2)} MiB`,
                                    color: "#DF5618"
                                },
                                {
                                    label: "Valetudo (Max)",
                                    value: systemHostInfo.mem.valetudo_max - systemHostInfo.mem.valetudo_current,
                                    valueLabel: `${((systemHostInfo.mem.valetudo_max) / 1024 / 1024).toFixed(2)} MiB`,
                                    color: "#19A1A1"
                                }
                            ]
                        }
                    />
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                        System Load (1, 5, 15 Minutes)
                    </Typography>

                    <ThickLinearProgressWithTopMargin
                        variant="determinate"
                        value={Math.min(100, systemHostInfo.load["1"] * 100)}
                        title={systemHostInfo.load["1"].toFixed(2)}
                    />
                    <ThickLinearProgressWithTopMargin
                        variant="determinate"
                        value={Math.min(100, systemHostInfo.load["5"] * 100)}
                        title={systemHostInfo.load["5"].toFixed(2)}
                    />
                    <ThickLinearProgressWithTopMargin
                        variant="determinate"
                        value={Math.min(100, systemHostInfo.load["15"] * 100)}
                        title={systemHostInfo.load["15"].toFixed(2)}
                    />
                </Grid>
            </Grid>

        );
    }, [systemHostInfo, systemHostInfoLoading]);

    return (
        <PaperContainer>
            <Grid
                container
                spacing={2}
            >
                <Grid
                    item
                    style={{flexGrow: 1}}
                >
                    <Card
                        sx={{boxShadow: 3}}
                    >
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Robot
                            </Typography>
                            <Divider/>
                            {robotInformationView}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid
                    item
                    style={{flexGrow: 1}}
                >
                    <Card
                        sx={{boxShadow: 3}}
                    >
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Valetudo
                            </Typography>
                            <Divider/>
                            {valetudoInformationView}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid
                    item
                    style={{flexGrow: 1}}
                >
                    <ReloadableCard title="System Host Information" loading={systemHostInfoFetching}
                        boxShadow={3}
                        onReload={() => {
                            return fetchSystemHostInfo();
                        }}>
                        {systemHostInformation}
                    </ReloadableCard>
                </Grid>
                <Grid
                    item
                    style={{flexGrow: 1}}
                >
                    <SystemRuntimeInfo/>
                </Grid>
            </Grid>
        </PaperContainer>
    );
};

export default SystemInformation;
