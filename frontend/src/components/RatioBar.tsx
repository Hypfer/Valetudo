import React, {CSSProperties, FunctionComponent} from "react";
import styles from "./RatioBar.module.css";
import {darken, lighten, useTheme} from "@mui/material";

type RatioBarPartition = {
    label: string;
    valueLabel?: string;
    value: number;
    color: NonNullable<CSSProperties["color"]>;
};

type RatioBarProps = {
    style?: React.CSSProperties,
    total: number;
    totalLabel?: string;
    partitions: Array<RatioBarPartition>;
    hideLegend?: boolean;
    noneLegendLabel?: string;
};

//Mostly adapted from the Material-UI LinearProgress bar https://github.com/mui-org/material-ui/blob/master/packages/material-ui/src/LinearProgress/LinearProgress.js
const RatioBar: FunctionComponent<RatioBarProps> = (props) => {
    const theme = useTheme();
    const {total, partitions} = props;

    let totalPercent = 0;

    const mappedPartitions = partitions.map((p: RatioBarPartition) => {
        const percent = (p.value / total) * 100;

        totalPercent += percent;

        return {
            label: p.label,
            valueLabel: p.valueLabel,
            color: p.color,
            percent: percent,
            totalPercent: totalPercent,
        };
    });

    // See https://github.com/mui-org/material-ui/blob/v5.0.1/packages/mui-material/src/LinearProgress/LinearProgress.js#L93
    const progressBackgroundColor = theme.palette.mode === "light" ?
        lighten(theme.palette.primary.main, 0.62) :
        darken(theme.palette.primary.main, 0.5);
    return (
        <>
            <span
                className={styles.ratioBarBase}
                style={{
                    backgroundColor: progressBackgroundColor,
                    ...props.style
                }}
                title={props.totalLabel}
            >
                {mappedPartitions.reverse().map((mp, i) => {
                    return (
                        <span
                            key={"bar." + i}
                            className={styles.ratioBarContent}
                            style={{
                                transform: `translateX(${-100 + mp.totalPercent}%)`,
                                backgroundColor: mp.color,
                            }}
                            title={mp.valueLabel}
                        >
                        </span>
                    );
                })}
            </span>
            {
                props.hideLegend !== true &&
                <span>
                    {
                        [
                            ...mappedPartitions.reverse(),
                            props.noneLegendLabel ? { color: progressBackgroundColor, label: props.noneLegendLabel} : undefined
                        ].filter(e => e !== undefined).map((mp, i) => {
                            return (
                                <span
                                    key={"legend." + i}
                                    style={{
                                        paddingRight: "5px",
                                        fontSize: "0.75rem",
                                        color: theme.palette.text.secondary,
                                    }}
                                >
                                    <span style={{color: mp!.color}}>●</span> {mp!.label}
                                </span>
                            );
                        })}
                </span>
            }
        </>
    );
};

export default RatioBar;
