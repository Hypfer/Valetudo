import {
    Button,
    ButtonGroup,
    Card,
    CardContent,
    Container,
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
} from "../api";
import RatioBar from "../components/RatioBar";
import {convertSecondsToHumans} from "../utils";
import {useIsMobileView} from "../hooks";
import ReloadableCard from "../components/ReloadableCard";
import LoadingFade from "../components/LoadingFade";

const ThickLinearProgressWithTopMargin = styled(LinearProgress)({
    marginTop: "2px",
    height: "6px"
});

const SystemRuntimeInfo = (): JSX.Element => {
    const {
        data: systemRuntimeInfo,
        isLoading: systemRuntimeInfoLoading,
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
        <ReloadableCard title="Runtime Information" loading={systemRuntimeInfoLoading} onReload={() => {
            return fetchSystemRuntimeInfo();
        }}>
            {systemRuntimeInformation}
        </ReloadableCard>
    );
};

const About = (): JSX.Element => {
    const {
        data: robotInformation,
        isLoading: robotInformationLoading,
    } = useRobotInformationQuery();
    const {
        data: version,
        isLoading: versionLoading,
    } = useValetudoVersionQuery();
    const {
        data: systemHostInfo,
        isLoading: systemHostInfoLoading,
        refetch: fetchSystemHostInfo,
    } = useSystemHostInfoQuery();

    const systemLoading = robotInformationLoading || versionLoading || systemHostInfoLoading;

    const systemInformation = React.useMemo(() => {
        if (systemLoading) {
            return (
                <LoadingFade/>
            );
        }

        if (!robotInformation || !version) {
            return <Typography color="error">No robot information</Typography>;
        }

        const items: Array<[header: string, body: string]> = [
            ["Manufacturer", robotInformation.manufacturer],
            ["Model", robotInformation.modelName],
            ["Valetudo Implementation", robotInformation.implementation],
            ["Release", version.release],
            ["Commit", version.commit],
        ];

        return (
            <Grid container spacing={2}>
                {items.map(([header, body]) => {
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
        );
    }, [robotInformation, systemLoading, version]);

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
                        partitions={[
                            {
                                label: "System",
                                value: systemHostInfo.mem.total - systemHostInfo.mem.free - systemHostInfo.mem.valetudo_current,
                                color: "#7AC037"
                            },
                            {
                                label: "Valetudo",
                                value: systemHostInfo.mem.valetudo_current,
                                color: "#DF5618"
                            },
                            {
                                label: "Valetudo (Max)",
                                value: systemHostInfo.mem.valetudo_max - systemHostInfo.mem.valetudo_current,
                                color: "#19A1A1"
                            },
                        ]}
                    />
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="caption" color="textSecondary">
                        System Load (1, 5, 15 Minutes)
                    </Typography>

                    <ThickLinearProgressWithTopMargin variant="determinate"
                        value={Math.min(100, systemHostInfo.load["1"] * 100)}/>
                    <ThickLinearProgressWithTopMargin variant="determinate"
                        value={Math.min(100, systemHostInfo.load["5"] * 100)}/>
                    <ThickLinearProgressWithTopMargin variant="determinate"
                        value={Math.min(100, systemHostInfo.load["15"] * 100)}/>
                </Grid>
            </Grid>

        );
    }, [systemHostInfo, systemHostInfoLoading]);

    return (
        <Container>
            <Grid container spacing={2}>
                <Grid item>
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                System
                            </Typography>
                            <Divider/>
                            {systemInformation}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item>
                    <ReloadableCard title="System Host Information" loading={systemHostInfoLoading}
                        onReload={() => {
                            return fetchSystemHostInfo();
                        }}>
                        {systemHostInformation}
                    </ReloadableCard>
                </Grid>
                <Grid item>
                    <SystemRuntimeInfo/>
                </Grid>
            </Grid>
        </Container>
    );
};

export default About;
