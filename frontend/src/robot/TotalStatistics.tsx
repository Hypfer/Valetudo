import React from "react";
import {Card, CardContent, CardMedia, Grid, Typography, useTheme,} from "@mui/material";
import {Capability, useTotalStatisticsQuery, ValetudoDataPointType} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import PaperContainer from "../components/PaperContainer";
import LoadingFade from "../components/LoadingFade";
import {adjustColorBrightness, getFriendlyStatName, getHumanReadableStatValue} from "../utils";

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

const StatisticsAward: React.FunctionComponent<{ achievement?: StatisticsAchievement }> = ({achievement}): JSX.Element => {
    const theme = useTheme();

    let foregroundColor;
    let textColor;
    let backgroundColor;
    let ribbonFill;


    if (achievement) {
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
            <svg viewBox="0 0 100 120" xmlns="http://www.w3.org/2000/svg">
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

const SORT_ORDER = {
    "time": 1,
    "area": 2,
    "count": 3
};

export default TotalStatistics;
