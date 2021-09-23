import {
    Button,
    ButtonGroup,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Fade,
    Grid,
    LinearProgress,
    Link,
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
} from "@material-ui/core";
import {withStyles} from "@material-ui/styles";
import {Refresh as RefreshIcon} from "@material-ui/icons";
import React from "react";
import {
    useLatestGitHubReleaseLazyQuery,
    useRobotInformationQuery,
    useSystemHostInfoQuery,
    useSystemRuntimeInfoQuery,
    useValetudoVersionQuery,
} from "../api";
import RatioBar from "../components/RatioBar";
import {convertSecondsToHumans} from "../utils";
import {useIsMobileView} from "../hooks";

const TopRightIconButton = styled(Button)(({theme}) => {
    return {
        marginTop: -theme.spacing(1),
    };
});

const ThickLinearProgressWithTopMargin = withStyles({
    root: {
        "margin-top": "2px",
        height: "6px"
    }
})(LinearProgress);

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
        <Card>
            <CardContent>
                <Grid
                    container
                    spacing={4}
                    alignItems="center"
                    justifyContent="space-between"
                >
                    <Grid item>
                        <Typography variant="h6" gutterBottom>
                            Runtime Information
                        </Typography>
                    </Grid>
                    <Grid item>
                        <TopRightIconButton
                            disabled={systemRuntimeInfoLoading}
                            onClick={() => {
                                return fetchSystemRuntimeInfo();
                            }}
                        >
                            <RefreshIcon/>
                        </TopRightIconButton>
                    </Grid>
                </Grid>
                <Divider/>
                {systemRuntimeInformation}
            </CardContent>
        </Card>
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
        data: githubReleaseInformation,
        isLoading: githubReleaseInformationLoading,
        refetch: fetchGithubReleaseInformation,
    } = useLatestGitHubReleaseLazyQuery();
    const {
        data: systemHostInfo,
        isLoading: systemHostInfoLoading,
        refetch: fetchSystemHostInfo,
    } = useSystemHostInfoQuery();

    const systemLoading = robotInformationLoading || versionLoading || systemHostInfoLoading;
    const newerReleaseAvailable = (githubReleaseInformation?.tag_name ?? "0.0.0") > (version?.release ?? "a");

    const systemInformation = React.useMemo(() => {
        if (systemLoading) {
            return (
                <Fade
                    in
                    style={{
                        transitionDelay: "500ms",
                    }}
                    unmountOnExit
                >
                    <CircularProgress/>
                </Fade>
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

    const releaseInformation = React.useMemo(() => {
        if (githubReleaseInformationLoading) {
            return (
                <Fade
                    in
                    style={{
                        transitionDelay: "500ms",
                    }}
                    unmountOnExit
                >
                    <CircularProgress/>
                </Fade>
            );
        }
        if (!githubReleaseInformation) {
            return (
                <Typography color="textSecondary">No release information</Typography>
            );
        }

        return (
            <Grid container spacing={2}>
                <Grid item>
                    <Typography variant="caption" color="textSecondary">
                        Version
                    </Typography>
                    <Typography variant="body2">{githubReleaseInformation.tag_name}</Typography>
                </Grid>
                <Grid item>
                    <Typography variant="caption" color="textSecondary">
                        Date
                    </Typography>
                    <Typography variant="body2">
                        {new Date(Date.parse(githubReleaseInformation.published_at)).toLocaleString()}
                    </Typography>
                </Grid>
                <Grid item>
                    <Typography variant="caption" color="textSecondary">
                        Changelog
                    </Typography>
                    <Typography variant="body2">
                        <Link
                            rel="noreferrer"
                            target="_blank"
                            color="inherit"
                            href={githubReleaseInformation.html_url}
                        >
                            View
                        </Link>
                    </Typography>
                </Grid>
            </Grid>
        );
    }, [githubReleaseInformation, githubReleaseInformationLoading]);

    const systemHostInformation = React.useMemo(() => {
        if (systemHostInfoLoading) {
            return (
                <Fade
                    in
                    style={{
                        transitionDelay: "500ms",
                    }}
                    unmountOnExit
                >
                    <CircularProgress/>
                </Fade>
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
                    <Card>
                        <CardContent>
                            <Grid
                                container
                                spacing={4}
                                alignItems="center"
                                justifyContent="space-between"
                            >
                                <Grid item>
                                    <Typography variant="h6" gutterBottom>
                                        Latest release
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    {newerReleaseAvailable ? (
                                        <Typography variant="h6" color="textSecondary" gutterBottom>
                                            NEW!
                                        </Typography>
                                    ) : (
                                        <TopRightIconButton
                                            disabled={githubReleaseInformationLoading}
                                            onClick={() => {
                                                return fetchGithubReleaseInformation();
                                            }}
                                        >
                                            <RefreshIcon/>
                                        </TopRightIconButton>
                                    )}
                                </Grid>
                            </Grid>
                            <Divider/>
                            {releaseInformation}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item>
                    <Card>
                        <CardContent>
                            <Grid
                                container
                                spacing={4}
                                alignItems="center"
                                justifyContent="space-between"
                            >
                                <Grid item>
                                    <Typography variant="h6" gutterBottom>
                                        System Host Information
                                    </Typography>
                                </Grid>
                                <Grid item>
                                    <TopRightIconButton
                                        disabled={systemHostInfoLoading}
                                        onClick={() => {
                                            return fetchSystemHostInfo();
                                        }}
                                    >
                                        <RefreshIcon/>
                                    </TopRightIconButton>
                                </Grid>
                            </Grid>
                            <Divider/>
                            {systemHostInformation}
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item>
                    <SystemRuntimeInfo/>
                </Grid>
            </Grid>
        </Container>
    );
};

export default About;
