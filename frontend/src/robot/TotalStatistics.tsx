import React from "react";
import {
    Button,
    Card,
    CardContent,
    CardMedia,
    Dialog, DialogActions, DialogContent,
    DialogTitle,
    Grid2,
    IconButton,
    Skeleton,
    Typography,
    useTheme,
} from "@mui/material";
import {Capability, useTotalStatisticsQuery, ValetudoDataPoint} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import PaperContainer from "../components/PaperContainer";
import {adjustColorBrightness, getFriendlyStatName, getHumanReadableStatValue} from "../utils";
import {History as HistoryIcon} from "@mui/icons-material";
import {StatisticsAchievement, statisticsAchievements} from "./res/StatisticsAchievements";
import {useIsMobileView} from "../hooks";

const achievementColors = {
    light: {
        foreground: "#ffb922",
        text: "#ffb922",
        background: "#002990"
    },
    dark: {
        foreground: "",
        text: "",
        background: ""
    },
    noAchievement: {
        foreground: "#191919",
        text: "#191919",
        background: "#333333"
    }
};
achievementColors.dark = {
    foreground: adjustColorBrightness(achievementColors.light.foreground, -20),
    text: adjustColorBrightness(achievementColors.light.foreground, -5),
    background: adjustColorBrightness(achievementColors.light.background, -20),
};

const StatisticsGridItem: React.FunctionComponent<{ dataPoint: ValetudoDataPoint}> = ({ dataPoint}): React.ReactElement => {
    const [overviewDialogOpen, setOverviewDialogOpen] = React.useState(false);
    const mobileView = useIsMobileView();

    const mostRecentAchievement = statisticsAchievements[dataPoint.type].find(achievement => {
        return dataPoint.value >= achievement.value;
    });

    return (
        <>
            <Grid2 size={{xs: 12, sm:4}} style={{userSelect: "none"}}>
                <Card style={{height: "100%"}}>
                    <Grid2 container style={{height: "100%"}}>
                        <Grid2
                            style={{
                                marginLeft: "auto",
                                marginRight: "auto"
                            }}
                        >
                            <CardMedia
                                component={StatisticsAward}
                                achievement={mostRecentAchievement}
                                achieved={mostRecentAchievement !== undefined}
                            />
                        </Grid2>
                        <Grid2 style={{alignSelf: "flex-end", width: "100%"}}>
                            <CardContent style={{paddingBottom: "16px"}}>
                                {<Typography variant="body1" mb={2}>
                                    {mostRecentAchievement?.description || "No achievement yet"}
                                </Typography>}

                                <Grid2 container>
                                    <Grid2
                                        style={{
                                            flexGrow: 3
                                        }}
                                    >
                                        <Typography sx={{fontSize: 14}} color="text.secondary" gutterBottom>
                                            {`Total ${getFriendlyStatName(dataPoint)}`}
                                        </Typography>
                                        <Typography variant="h5" component="div">
                                            {getHumanReadableStatValue(dataPoint)}
                                        </Typography>
                                    </Grid2>
                                    <Grid2
                                        style={{marginTop: "auto"}}
                                    >
                                        <IconButton
                                            onClick={() => {
                                                setOverviewDialogOpen(true);
                                            }}
                                            title="Achievement Overview"
                                        >
                                            <HistoryIcon/>
                                        </IconButton>
                                    </Grid2>
                                </Grid2>
                            </CardContent>
                        </Grid2>
                    </Grid2>
                </Card>
            </Grid2>
            <Dialog
                open={overviewDialogOpen}
                onClose={() => {
                    setOverviewDialogOpen(false);
                }}
                fullScreen={mobileView}
            >
                <DialogTitle style={{userSelect: "none"}}>
                    {getFriendlyStatName(dataPoint)} Achievements
                </DialogTitle>

                <DialogContent dividers>
                    <Grid2 container spacing={2}>
                        {[...statisticsAchievements[dataPoint.type]].reverse().map((achievement, i) => {
                            const notYetAchievedAchievement : StatisticsAchievement = {
                                value: achievement.value,
                                title: "?",
                                description: "Not yet achieved"
                            };
                            const achieved = dataPoint.value >= achievement.value;
                            const achievementToDisplay = achieved ? achievement : notYetAchievedAchievement;

                            return (
                                <Grid2 size={{xs: 12, sm:4}} style={{userSelect: "none"}} key={`${dataPoint.type}_overview_${i}`}>
                                    <Card style={{height: "100%"}}>
                                        <Grid2 container style={{height: "100%"}}>
                                            <Grid2
                                                style={{
                                                    marginLeft: "auto",
                                                    marginRight: "auto"
                                                }}
                                            >
                                                <CardMedia
                                                    component={StatisticsAward}
                                                    achievement={achievementToDisplay}
                                                    achieved={achieved}
                                                />
                                            </Grid2>
                                            <Grid2 style={{alignSelf: "flex-end", width: "100%"}}>
                                                <CardContent style={{paddingBottom: "16px"}}>
                                                    <Typography variant="body1" mb={2}>
                                                        {achievementToDisplay.description}
                                                    </Typography>
                                                    {
                                                        achieved && <>
                                                            <Typography sx={{fontSize: 14}} color="text.secondary" gutterBottom>
                                                                Achieved at
                                                            </Typography>
                                                            <Typography variant="body1" mb={2}>
                                                                {
                                                                    getHumanReadableStatValue({
                                                                        type: dataPoint.type,
                                                                        value: achievementToDisplay.value,
                                                                        timestamp: dataPoint.timestamp
                                                                    })
                                                                }
                                                            </Typography>
                                                        </>
                                                    }
                                                </CardContent>
                                            </Grid2>
                                        </Grid2>
                                    </Card>
                                </Grid2>
                            );
                        })}
                    </Grid2>

                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setOverviewDialogOpen(false);
                    }}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

const StatisticsAward: React.FunctionComponent<{ achievement?: StatisticsAchievement, achieved?: boolean }> = ({achievement, achieved}): React.ReactElement => {
    const theme = useTheme();

    let foregroundColor;
    let textColor;
    let backgroundColor;
    let ribbonFill;


    if (achievement && achieved) {
        ribbonFill = "url(#ribbonGradient)";

        if (theme.palette.mode === "light") {
            foregroundColor = achievementColors.light.foreground;
            textColor = achievementColors.light.text;
            backgroundColor = achievementColors.light.background;
        } else {
            foregroundColor = achievementColors.dark.foreground;
            textColor = achievementColors.dark.text;
            backgroundColor = achievementColors.dark.background;
        }

    } else {
        foregroundColor = achievementColors.noAchievement.foreground;
        textColor = achievementColors.noAchievement.text;
        backgroundColor = achievementColors.noAchievement.background;

        ribbonFill = "url(#ribbonGradientDisabled)";
    }

    let fontSize = 14;
    let textAnchorY = 54;

    if (achievement?.title) {
        if (achievement.title.length >= 14) {
            fontSize = 8;
            textAnchorY = 52.5;
        } else if (achievement.title.length >= 12) {
            fontSize = 10;
            textAnchorY = 53;
        } else if (achievement.title.length >= 10) {
            fontSize = 12;
            textAnchorY = 53.5;
        }
    }

    return (
        <div
            style={{
                width:"90%",
                marginLeft: "auto",
                marginRight: "auto",

                marginTop: "1rem",

                userSelect: "none"
            }}
        >
            <svg width="300" height="360" viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg" style={{width: "100%", height: "100%"}}>
                <defs>
                    <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: "#000934", stopOpacity: 1}} />
                        <stop offset="80%" style={{stopColor: "#000b67", stopOpacity: 1}}/>
                    </linearGradient>
                    <linearGradient id="ribbonGradientDisabled" x1="0%" y1="-50%" x2="0%" y2="100%">
                        <stop offset="0%" style={{stopColor: "#111111", stopOpacity: 1}} />
                        <stop offset="80%" style={{stopColor: "#222222", stopOpacity: 1}}/>
                    </linearGradient>
                </defs>
                <g transform="matrix(.97692 0 0 .96031 -23.268 -4.3406)">
                    <path d="m45.608 69.55h58.738v59.93l-29.369-15.115-29.369 15.115z" fill={ribbonFill}/>
                    <path d="m47.655 69.55h54.69v56.233l-27.345-14.182-27.345 14.182z" fill="none" stroke={foregroundColor} strokeWidth=".93469"/>
                </g>
                <g transform="matrix(.97692 0 0 .97692 -23.269 -5.3921)" stroke={foregroundColor}>
                    <path d="m75 106.08-8.67-5.792-10.226 2.033-5.793-8.668-10.226-2.035-2.035-10.226-8.669-5.793 2.033-10.226-5.792-8.67 5.792-8.67-2.033-10.226 8.669-5.793 2.035-10.226 10.226-2.035 5.793-8.669 10.226 2.033 8.67-5.792 8.67 5.792 10.226-2.033 5.793 8.669 10.226 2.035 2.035 10.226 8.668 5.793-2.033 10.226 5.792 8.67-5.792 8.67 2.033 10.226-8.668 5.793-2.035 10.226-10.226 2.035-5.793 8.668-10.226-2.033z" fill={backgroundColor} strokeWidth="3"/>
                    <path d="m75 101.51-7.8677-5.2561-9.2797 1.8449-5.2569-7.866-9.2797-1.8467-1.8467-9.2798-7.8668-5.257 1.8449-9.2798-5.256-7.8678 5.256-7.8678-1.8449-9.2798 7.8668-5.257 1.8467-9.2798 9.2797-1.8467 5.2569-7.8669 9.2797 1.8449 7.8677-5.2561 7.8677 5.2561 9.2797-1.8449 5.2569 7.8669 9.2797 1.8467 1.8467 9.2798 7.8659 5.257-1.8449 9.2798 5.256 7.8678-5.256 7.8678 1.8449 9.2798-7.8659 5.257-1.8467 9.2798-9.2797 1.8467-5.2569 7.866-9.2797-1.8449z" fill="none" strokeWidth=".90747"/>
                </g>
                <text x="50" y="50">
                    <tspan x="50" y={textAnchorY} fill={textColor} fontSize={fontSize} textAnchor="middle">
                        {achievement?.title}
                    </tspan>
                </text>
            </svg>
        </div>
    );
};

const TotalStatisticsInternal: React.FunctionComponent = (): React.ReactElement => {
    const {
        data: totalStatisticsState,
        isPending: totalStatisticsPending,
        isError: totalStatisticsError,
    } = useTotalStatisticsQuery();

    return React.useMemo(() => {
        if (totalStatisticsPending) {
            return (
                <Skeleton height={"24rem"}/>
            );
        }

        if (totalStatisticsError || !totalStatisticsState) {
            return <Typography color="error">Error loading statistics</Typography>;
        }

        const statistics = totalStatisticsState.sort((a, b) => {
            const aMapped = SORT_ORDER[a.type] ?? 10;
            const bMapped = SORT_ORDER[b.type] ?? 10;

            if (aMapped < bMapped) {
                return -1;
            } else if (bMapped < aMapped) {
                return 1;
            } else {
                return 0;
            }
        }).map((dataPoint) => {
            return <StatisticsGridItem dataPoint={dataPoint} key={dataPoint.type}/>;
        });

        return (
            <Grid2 container spacing={2}>
                {statistics}
            </Grid2>
        );
    }, [totalStatisticsError, totalStatisticsPending, totalStatisticsState]);
};

const TotalStatistics = (): React.ReactElement => {
    const [supported] = useCapabilitiesSupported(Capability.TotalStatistics);

    return (
        <PaperContainer>
            {supported ? <TotalStatisticsInternal/> : (
                <Typography color="error">This robot does not support total statistics.</Typography>
            )}
        </PaperContainer>
    );
};

const SORT_ORDER = {
    "time": 1,
    "area": 2,
    "count": 3
};

export default TotalStatistics;
