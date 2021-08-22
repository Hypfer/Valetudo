import {
    Box,
    Button,
    Card,
    CardContent,
    CircularProgress,
    Container,
    Divider,
    Fade,
    Grid, LinearProgress,
    Link,
    styled,
    Typography,
} from '@material-ui/core';
import { withStyles } from '@material-ui/styles';
import {Refresh as RefreshIcon} from '@material-ui/icons';
import React from 'react';
import {
    useLatestGitHubReleaseLazyQuery,
    useRobotInformationQuery,
    useSystemHostInfoQuery,
    useValetudoVersionQuery,
} from '../api';
import RatioBar from "../compontents/RatioBar";
import {convertSecondsToHumans} from "../utils";

const TopRightIconButton = styled(Button)(({theme}) => {return {
    marginTop: -theme.spacing(1),
}});

const ThickLinearProgressWithTopMargin = withStyles({
    root: {
        "margin-top": "2px",
        height: "6px"
    }
})(LinearProgress);

const About = (): JSX.Element => {
    const {
        data: information,
        isLoading: infoLoading,
    } = useRobotInformationQuery();
    const {
        data: version,
        isLoading: versionLoading,
    } = useValetudoVersionQuery();
    const {
        data: release,
        isLoading: releaseLoading,
        refetch: fetchLatestRelease,
    } = useLatestGitHubReleaseLazyQuery();
    const {
        data: systemHostInfo,
        isLoading: systemHostInfoLoading,
        refetch: fetchSystemHostInfo,
    } = useSystemHostInfoQuery();


    const systemLoading = infoLoading || versionLoading;
    const isNewerRelease = (release?.tag_name ?? '0.0.0') > (version?.release ?? 'a');

    const systemInformation = React.useMemo(() => {
        if (systemLoading) {
            return (
                <Fade
                    in
                    style={{
                        transitionDelay: '500ms',
                    }}
                    unmountOnExit
                >
                    <CircularProgress/>
                </Fade>
            );
        }

        if (!information || !version) {
            return <Typography color="error">No robot information</Typography>;
        }

        const items: Array<[header: string, body: string]> = [
            ['Manufacturer', information.manufacturer],
            ['Model', information.modelName],
            ['Valetudo Implementation', information.implementation],
            ['Release', version.release],
            ['Commit', version.commit],
        ];

        return (
            <Grid container spacing={2}>
                {items.map(([header, body]) => {return (
                    <Grid item key={header}>
                        <Typography variant="caption" color="textSecondary">
                            {header}
                        </Typography>
                        <Typography variant="body2">{body}</Typography>
                    </Grid>
                )})}
            </Grid>
        );
    }, [information, systemLoading, version]);

    const releaseInformation = React.useMemo(() => {
        if (releaseLoading) {
            return (
                <Fade
                    in
                    style={{
                        transitionDelay: '500ms',
                    }}
                    unmountOnExit
                >
                    <CircularProgress/>
                </Fade>
            );
        }
        if (!release) {
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
                    <Typography variant="body2">{release.tag_name}</Typography>
                </Grid>
                <Grid item>
                    <Typography variant="caption" color="textSecondary">
                        Date
                    </Typography>
                    <Typography variant="body2">
                        {new Date(Date.parse(release.published_at)).toLocaleString()}
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
                            href={release.html_url}
                        >
                            View
                        </Link>
                    </Typography>
                </Grid>
            </Grid>
        );
    }, [release, releaseLoading]);

    const systemHostInformation = React.useMemo(() => {
        if (systemHostInfoLoading) {
            return (
                <Fade
                    in
                    style={{
                        transitionDelay: '500ms',
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

                    <ThickLinearProgressWithTopMargin variant="determinate" value={Math.min(100, systemHostInfo.load["1"] * 100)} />
                    <ThickLinearProgressWithTopMargin variant="determinate" value={Math.min(100, systemHostInfo.load["5"] * 100)} />
                    <ThickLinearProgressWithTopMargin variant="determinate" value={Math.min(100, systemHostInfo.load["15"] * 100)} />
                </Grid>
            </Grid>

        );
    }, [systemHostInfo, systemHostInfoLoading]);

    return (
        <Container>
            <Box pt={2}/>
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
                                    {isNewerRelease ? (
                                        <Typography variant="h6" color="textSecondary" gutterBottom>
                                            NEW!
                                        </Typography>
                                    ) : (
                                        <TopRightIconButton
                                            disabled={releaseLoading}
                                            onClick={() => {return fetchLatestRelease()}}
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
                                        onClick={() => {return fetchSystemHostInfo()}}
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
            </Grid>
        </Container>
    );
};

export default About;
