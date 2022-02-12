import React, {FunctionComponent} from "react";
import styles from "./LogViewer.module.css";
import {LogLevel, LogLine} from "../api";

type LogViewerProps = {
    logLines: Array<LogLine>,
    style?: React.CSSProperties,
    className?: string
};

function getLoglevelCssClass(level : LogLevel) {
    switch (level) {
        case LogLevel.trace:
            return styles.levelTrace;
        case LogLevel.debug:
            return styles.levelDebug;
        case LogLevel.info:
            return styles.levelInfo;
        case LogLevel.warn:
            return styles.levelWarn;
        case LogLevel.error:
            return styles.levelError;
        default:
            return styles.levelDefault;
    }
}


const LogViewer: FunctionComponent<LogViewerProps> = (props) => {
    const logRef = React.useRef(null);
    const [scrolledToBottom, setScrolledToBottom] = React.useState(true);
    const {logLines} = props;

    React.useEffect(() => {
        const currentLogRef = logRef.current;
        if (currentLogRef) {
            const elem = currentLogRef as HTMLElement;

            if (scrolledToBottom) {
                elem.scrollTop = elem.scrollHeight;
            }
        }
    }, [logLines, scrolledToBottom]);

    return (
        <>
            <div className={[styles.outerContainer, props.className].join(" ")} style={props.style}>
                <div
                    className={styles.container}
                    ref={logRef}
                    onScroll={() => {
                        const currentLogRef = logRef.current;
                        if (currentLogRef) {
                            const elem = currentLogRef as HTMLElement;

                            setScrolledToBottom(elem.scrollHeight - Math.abs(elem.scrollTop) === elem.clientHeight);
                        }
                    }}
                >
                    {
                        logLines.map((line, i) => {
                            return ( //The trailing spaces in the metadata section are important for copy-pasting
                                <div key={"logline." + i} className={styles.logline}>
                                    <div className={styles.metadata}>
                                        <span className={styles.timestamp}>{line.timestamp.toISOString()} </span>
                                        <span className={[styles.loglevel, getLoglevelCssClass(line.level)].join(" ")}>{line.level}</span>
                                    </div>
                                    <span className={styles.content}>{line.content}</span>
                                </div>

                            );
                        })
                    }
                </div>
            </div>
        </>
    );
};

export default LogViewer;
