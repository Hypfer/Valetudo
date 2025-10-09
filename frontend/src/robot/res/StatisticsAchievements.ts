import {ValetudoDataPointType} from "../../api";

export interface StatisticsAchievement {
    value: number;
    title: string;
    description: string;
}

// units are cm², seconds and.. count.
export const statisticsAchievements: Record<ValetudoDataPointType, Array<StatisticsAchievement>> = {
    "area": [
        {
            value: 25_690_000_000_000,
            title: "Saarland",
            description: "Ei jo."
        },
        {
            value: Math.pow(32768 * 2.54,2), // 32768 units per axis with 1 unit being 1 inch
            title: "Source Map",
            description: "You've cleaned more than the maximum playable area of a full Source Engine (Half-Life 2) map"
        },
        {
            value: 500_000_000,
            title: "Leipziger Messe",
            description: "You've cleaned more than the whole CCCongress: Leipziger Messe"
        },
        {
            value: Math.pow(8192 * 2.54,2), // 8192 units per axis with 1 unit being 1 inch
            title: "GoldSrc Map",
            description: "You've cleaned more than the maximum playable area of a full GoldSrc (Half-Life 1) map"
        },
        {
            value: 360_000_000,
            title: "CCH (Again)",
            description: "You've cleaned more than the whole CCCongress: Congress Center Hamburg (post 2022)"
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
            value: 1.67 * Math.pow(10,34) * 365.25 * 24 * 60 * 60,
            title: "Proton Decay",
            description: "50% of all matter in the universe might've already decayed into energy"
        },
        {
            value: 30 * 24 * 60 * 60,
            title: "Subscription",
            description: "One entire month of continuous cleaning"
        },
        {
            value: 7 * 24 * 60 * 60,
            title: "A week",
            description: "More than an entire week of continuous cleaning",
        },
        {
            value: (new Date("1969-07-21T02:56:00Z").getTime() - new Date("1969-07-16T13:32:00Z").getTime())/1000,
            title: "Desolation",
            description: "More than the time it took the Apollo 11 mission from liftoff to man setting foot on the moon"
        },
        {
            value: 24 * 60 * 60,
            title: "A day",
            description: "More than an entire day of continuous cleaning",
        },
        {
            value: 60 * 60,
            title: "An hour",
            description: "More than an entire hour of continuous cleaning",
        },
    ],
    "count": [
        {
            value: 6.02214076 * Math.pow(10,23),
            title: "1 Mole",
            description: "The SI base unit for \"amount of substance\""
        },
        {
            value: 1_337,
            title: "1337",
            description: "r0b0t v4cuum h4x0r"
        },
        {
            value: 1_024,
            title: "2^10",
            description: "The true size of 1k"
        },
        {
            value: 1000,
            title: "1k",
            description: "1000 cleanups"
        },
        {
            value: 512,
            title: "1 Block",
            description: "Make sure to align your partitions"
        },
        {
            value: 365,
            title: "Daily Driver",
            description: "One year of daily cleanups"
        },
        {
            value: 256,
            title: "1 byte",
            description: "The cleanup count has exceeded the limit of what can be stored in a single byte"
        },
        {
            value: 64,
            title: "Y2K38 Compliant",
            description: "Enough bits to survive the next extinction event"
        },
        {
            value: 10,
            title: "Baby steps",
            description: "Your robot has done its first 10 cleanups"
        }
    ],
};
