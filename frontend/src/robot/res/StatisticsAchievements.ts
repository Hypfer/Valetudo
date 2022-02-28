import {ValetudoDataPointType} from "../../api";

export interface StatisticsAchievement {
    value: number;
    title: string;
    description: string;
}

export const statisticsAchievements: Record<ValetudoDataPointType, Array<StatisticsAchievement>> = {
    "area": [
        {
            value: 25_700_000_000,
            title: "Saarland",
            description: "Nice."
        },
        {
            value: 500_000_000,
            title: "Leipziger Messe",
            description: "You've cleaned more than the whole CCCongress: Leipziger Messe"
        },
        {
            value: 240_000_000,
            title: "CCH",
            description: "You've cleaned more than the whole CCCongress: Congress Center Hamburg (pre 2021)"
        },
        {
            value: 100_000_000,
            title: "bcc",
            description: "You've cleaned more than the whole CCCongress: bcc Berlin Congress Center"
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
            value: 256,
            title: "1 byte",
            description: "The cleanup count has exceeded the limit of what can be stored in a single byte"
        },
        {
            value: 10,
            title: "Baby steps",
            description: "Your robot has done its first 10 cleanups"
        }
    ],
};
