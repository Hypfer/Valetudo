import React from "react";
import {Card, CardContent, CardMedia, Grid, Typography,} from "@mui/material";
import {Capability, useTotalStatisticsQuery, ValetudoDataPointType} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import PaperContainer from "../components/PaperContainer";
import LoadingFade from "../components/LoadingFade";
import {getFriendlyStatName, getHumanReadableStatValue} from "../utils";

interface StatisticsAchievement {
    value: number;
    title: string;
    description: string;
}

const statisticsAchievements: Record<ValetudoDataPointType, Array<StatisticsAchievement>> = {
    "area": [
        {
            value: 25_700_000_000,
            title: "Saarland",
            description: "Nice."
        },
        {
            value: 500_000_000,
            title: "Leipziger Messe",
            description: "You've cleaned more than the whole Leipziger Messe"
        },
        {
            value: 240_000_000,
            title: "CCH",
            description: "You've cleaned more than the whole Congress Center Hamburg (pre 2021)"
        },
        {
            value: 100_000_000,
            title: "bcc",
            description: "You've cleaned more than the whole bcc Berlin Congress Center"
        },
        {
            value: 1_620_000,
            title: "Sports",
            description: "You've cleaned more than an entire volleyball court"
        },
        {
            value: 700_000,
            title: "Breathe",
            description: "You've cleaned more than the approximate surface area of a human lung"
        },
        {
            value: 10_000,
            title: "Metric",
            description: "You've cleaned more than the area of an entire A0 paper"
        },
    ],
    "time": [
        {
            value: 604_800,
            title: "A week",
            description: "More than an entire week of continuous cleaning",
        },
        {
            value: 86_400,
            title: "A day",
            description: "More than an entire day of continuous cleaning",
        },
        {
            value: 3_600,
            title: "An hour",
            description: "More than an entire hour of continuous cleaning",
        },
    ],
    "count": [
        {
            value: 1000,
            title: "1k",
            description: "1000 cleanups"
        },
        {
            value: 10,
            title: "Baby steps",
            description: "Your robot has done its first 10 cleanups"
        }
    ],
};

const StatisticsAward: React.FunctionComponent<{ achievement?: StatisticsAchievement }> = ({achievement}): JSX.Element => {
    const badgeBorder = achievement ? "#ffb922" : "#191919";
    const badgeColor = achievement ? "#002990" : "#333333";
    const ribbonFill = achievement ? "url(#ribbonGradient)" : "url(#ribbonGradientDisabled)";

    let fontSize = 14;

    if (achievement?.title) {
        if (achievement.title.length >= 14) {
            fontSize = 8;
        } else if (achievement.title.length >= 12) {
            fontSize = 10;
        } else if (achievement.title.length >= 10) {
            fontSize = 12;
        } else {
            fontSize = 14;
        }
    }

    return (
        <svg viewBox="0 0 150 123.937" width="100%" xmlns="http://www.w3.org/2000/svg">
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
            <path d="m45.607 64.007h58.738v59.93l-29.369-15.115-29.369 15.115z" fill={ribbonFill}/>
            <path d="m75 102.535-8.67-5.792-10.226 2.033-5.793-8.668-10.226-2.035-2.035-10.226-8.669-5.793 2.033-10.226-5.792-8.67 5.792-8.67-2.033-10.226 8.669-5.793 2.035-10.226 10.226-2.035 5.793-8.669 10.226 2.033 8.67-5.792 8.67 5.792 10.226-2.033 5.793 8.669 10.226 2.035 2.035 10.226 8.668 5.793-2.033 10.226 5.792 8.67-5.792 8.67 2.033 10.226-8.668 5.793-2.035 10.226-10.226 2.035-5.793 8.668-10.226-2.033z" stroke={badgeBorder} strokeWidth="3" fill={badgeColor}/>
            <text x="75" y="55">
                <tspan fill="#ffd000" fontSize={fontSize} textAnchor="middle" x="75" y="58">
                    {achievement?.title}
                </tspan>
            </text>
        </svg>
    );
};

const TotalStatisticsInternal: React.FunctionComponent = (): JSX.Element => {
    const {
        data: totalStatisticsState,
        isLoading: totalStatisticsLoading,
        isError: totalStatisticsError,
    } = useTotalStatisticsQuery();

    return React.useMemo(() => {
        if (totalStatisticsLoading) {
            return (
                <LoadingFade/>
            );
        }

        if (totalStatisticsError || !totalStatisticsState) {
            return <Typography color="error">Error loading statistics</Typography>;
        }

        const statistics =
            totalStatisticsState.map((dataPoint) => {
                const achievement = statisticsAchievements[dataPoint.type].find(achievement => {
                    return dataPoint.value >= achievement.value;
                });

                return (
                    <Grid item xs={12} sm={4} key={dataPoint.type}>
                        <Card style={{height: "100%"}}>
                            <CardMedia component={StatisticsAward} achievement={achievement}/>
                            <CardContent>
                                {<Typography variant="body1" mb={2}>
                                    {achievement?.description || "No achievement yet"}
                                </Typography>}

                                <Typography sx={{fontSize: 14}} color="text.secondary" gutterBottom>
                                    {getFriendlyStatName(dataPoint)}
                                </Typography>
                                <Typography variant="h5" component="div">
                                    {getHumanReadableStatValue(dataPoint)}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                );
            });

        return (
            <>
                <Grid container spacing={2}>
                    {statistics}
                </Grid>
            </>
        );
    }, [totalStatisticsError, totalStatisticsLoading, totalStatisticsState]);
};

const TotalStatistics = (): JSX.Element => {
    const [supported] = useCapabilitiesSupported(Capability.TotalStatistics);

    return (
        <PaperContainer>
            {supported ? <TotalStatisticsInternal/> : (
                <Typography color="error">This robot does not support total statistics.</Typography>
            )}
        </PaperContainer>
    );
};

export default TotalStatistics;
