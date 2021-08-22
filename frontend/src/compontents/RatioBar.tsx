import {CSSProperties, FunctionComponent} from 'react';
import styles from './RatioBar.module.css';

type RatioBarPartition = {
    label: string;
    value: number;
    color: NonNullable<CSSProperties['color']>
}

type RatioBarProps = {
    total: number,
    partitions: Array<RatioBarPartition>
}

//Mostly adapted from the Material-UI LinearProgress bar https://github.com/mui-org/material-ui/blob/master/packages/material-ui/src/LinearProgress/LinearProgress.js
const RatioBar : FunctionComponent<RatioBarProps> = (props) => {
    const {total, partitions} = props;

    let totalPercent = 0;

    const mappedPartitions = partitions.map((p: RatioBarPartition) => {
        const percent = (p.value / total) * 100;

        totalPercent += percent;

        return {
            label: p.label,
            color: p.color,
            percent: percent,
            totalPercent: totalPercent
        }
    });

    return (
        <div>
            <span className={styles.ratioBarBase}>
                {
                    mappedPartitions.reverse().map((mp, i) => {
                        return (
                            <span
                                key={"bar." + i}
                                className={styles.ratioBarContent}
                                style={{
                                    transform: `translateX(${-100 + mp.totalPercent}%)`,
                                    backgroundColor: mp.color
                                }}
                            >
                            </span>
                        )
                    })
                }
            </span>
            <span>
                {
                    mappedPartitions.reverse().map((mp, i) => {
                        return (
                            <span
                                key={"legend." + i}
                                style={{paddingRight: "5px", fontSize: "0.75rem", color: "rgba(255, 255, 255, 0.7)"}}
                            >
                                <span style={{color: mp.color}}>●</span> {mp.label}
                            </span>
                        )
                    })
                }
            </span>
        </div>
    );
}

export default RatioBar
