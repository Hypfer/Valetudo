import {
    alpha,
    FormControl,
    Grid2,
    InputBase,
    InputLabel,
    MenuItem,
    Select,
    styled,
    Typography,
} from "@mui/material";
import {Refresh as RefreshIcon, FilterAlt as FilterAltIcon} from "@mui/icons-material";
import React from "react";
import styles from "./Log.module.css";
import {LogLevel, LogLine, useLogLevelMutation, useLogLevelQuery, useValetudoLogQuery} from "../api";
import LogViewer from "../components/LogViewer";
import {LoadingButton} from "@mui/lab";
import PaperContainer from "../components/PaperContainer";

const Search = styled("div")(({theme}) => {
    return {
        position: "relative",
        borderRadius: theme.shape.borderRadius,
        backgroundColor: alpha(theme.palette.common.white, 0.15),
        "&:hover": {
            backgroundColor: alpha(theme.palette.common.white, 0.25),
        },
        marginRight: theme.spacing(2),
        marginLeft: 0,
        width: "100%",
        flexGrow: 1,
        [theme.breakpoints.up("sm")]: {
            width: "auto",
        },
    };
});

const SearchIconWrapper = styled("div")(({theme}) => {
    return {
        padding: theme.spacing(0, 2),
        height: "100%",
        position: "absolute",
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
    };
});

const StyledInputBase = styled(InputBase)(({theme}) => {
    return {
        color: "inherit",
        flexGrow: 1,
        display: "flex",
        "& .MuiInputBase-input": {
            padding: theme.spacing(1, 1, 1, 0),
            // vertical padding + font size from searchIcon
            paddingLeft: `calc(1em + ${theme.spacing(4)})`,
            transition: theme.transitions.create("width"),
            width: "100%",
            flexGrow: 1,
            [theme.breakpoints.up("md")]: {
                width: "20ch",
            },
        },
    };
});


const Log = (): React.ReactElement => {
    const [filter, setFilter] = React.useState("");

    const {
        data: logData,
        isFetching: logDataFetching,
        isError: logError,
        refetch: logRefetch,
    } = useValetudoLogQuery();

    const {
        data: logLevel,
        isError: logLevelError,
        refetch: logLevelRefetch
    } = useLogLevelQuery();

    const {mutate: mutateLogLevel} = useLogLevelMutation();

    const logLines = React.useMemo(() => {
        if (logError || logLevelError) {
            return <Typography color="error">Error loading log</Typography>;
        }

        const processedLog : Array<LogLine> = [];
        let filteredLog;

        if (logData) {
            // noinspection RegExpRedundantEscape
            const loglineRegex = /^\[(?<timestamp>\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z)\] \[(?<level>[A-Z]+)\] (?<content>.*)$/;

            logData.split("\n").forEach(line => {
                const match = loglineRegex.exec(line);

                if (match && match.groups) {
                    processedLog.push({
                        timestamp: new Date(match.groups.timestamp),
                        level: match.groups.level.toLowerCase() as LogLevel,
                        content: match.groups.content
                    });
                } else if (processedLog[processedLog.length -1]) {
                    processedLog[processedLog.length -1].content += "\n" + line;
                }
            });
        }

        const lowerFilter = filter.toLowerCase();

        if (filter) {
            filteredLog = processedLog.filter(line => {
                return line.level.includes(lowerFilter) || line.content.toLowerCase().includes(lowerFilter);
            });
        } else {
            filteredLog = processedLog;
        }

        return (
            <Grid2 container>
                <Grid2
                    container
                    alignItems={"center"}
                    columnSpacing={1}
                    rowSpacing={2}
                    columns={{xs: 4, sm: 12}}
                    sx={{
                        mb: 2,
                        userSelect: "none",
                        width: "100%"
                    }}
                >
                    <Grid2 size={{xs: 4, sm:9}}>
                        <Search>
                            <SearchIconWrapper>
                                <FilterAltIcon/>
                            </SearchIconWrapper>
                            <StyledInputBase
                                placeholder="Filter…"
                                inputProps={{
                                    "aria-label": "filter",
                                    value: filter,
                                    onChange: (e: any) => {
                                        setFilter((e.target as HTMLInputElement).value);
                                    }
                                }}
                            />
                        </Search>
                    </Grid2>
                    <Grid2 size={{xs: 3, sm:2}}>
                        <FormControl fullWidth>
                            <InputLabel id="log-level-selector">Current Level</InputLabel>
                            <Select
                                labelId="log-level-selector"
                                value={logLevel?.current || "info"}
                                label="Current Level"
                                onChange={(e) => {
                                    mutateLogLevel({
                                        level: e.target.value as LogLevel
                                    });
                                }}
                            >
                                {logLevel?.presets.map(preset => {
                                    return <MenuItem key={preset} value={preset}>{preset}</MenuItem>;
                                })}
                            </Select>
                        </FormControl>
                    </Grid2>
                    <Grid2 size={{xs: 1, sm:1}}>
                        <LoadingButton
                            loading={logDataFetching}
                            onClick={() => {
                                logLevelRefetch().catch(err => {
                                    // eslint-disable-next-line no-console
                                    console.error(err);
                                });
                                logRefetch().catch(err => {
                                    // eslint-disable-next-line no-console
                                    console.error(err);
                                });
                            }}
                            title="Refresh"
                        >
                            <RefreshIcon/>
                        </LoadingButton>
                    </Grid2>
                </Grid2>
                <Grid2
                    sx={{
                        width: "100%"
                    }}
                >
                    <LogViewer
                        className={styles.logViewer}
                        style={{
                            width: "100%"
                        }}
                        logLines={filteredLog}
                    />
                </Grid2>
            </Grid2>
        );
    }, [logData, logDataFetching, logError, logRefetch, logLevel, logLevelError, logLevelRefetch, mutateLogLevel, filter, setFilter]);

    return (
        <PaperContainer>
            {logLines}
        </PaperContainer>
    );
};

export default Log;
