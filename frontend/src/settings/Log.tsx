import {
    alpha,
    Container,
    FormControl,
    Grid,
    IconButton,
    InputBase,
    InputLabel,
    MenuItem,
    Select,
    styled,
    TextField,
    Typography,
} from "@mui/material";
import {Refresh as RefreshIcon, FilterAlt as FilterAltIcon} from "@mui/icons-material";
import React from "react";
import {useLogLevelMutation, useLogLevelQuery, useValetudoLogQuery} from "../api";

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
            marginLeft: theme.spacing(3),
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


const Log = (): JSX.Element => {
    const [filter, setFilter] = React.useState("");
    const logRef = React.useRef(null);

    const {
        data: logData,
        isError: logError,
        refetch: logRefetch,
    } = useValetudoLogQuery();

    const {
        data: logLevel,
        isError: logLevelError,
        refetch: logLevelRefetch
    } = useLogLevelQuery();

    React.useEffect(() => {
        const currentLogRef = logRef.current;
        if (logData && currentLogRef) {
            const textArea = currentLogRef as HTMLTextAreaElement;
            textArea.scrollTop = textArea.scrollHeight;
        }
    }, [logData]);

    const {mutate: mutateLogLevel} = useLogLevelMutation();

    const logLines = React.useMemo(() => {
        if (logError || logLevelError) {
            return <Typography color="error">Error loading log</Typography>;
        }

        const lowerFilter = filter.toLowerCase();
        const filteredData = filter ? logData?.split("\n").filter(l => {
            return l.toLowerCase().includes(lowerFilter);
        }).join("\n") : logData;

        return (
            <React.Fragment>
                <Grid container alignItems={"center"} columnSpacing={1} rowSpacing={2} columns={{xs: 4, sm: 12}}
                    sx={{mb: 2}}>
                    <Grid item xs={4} sm={9}>
                        <Search>
                            <SearchIconWrapper>
                                <FilterAltIcon/>
                            </SearchIconWrapper>
                            <StyledInputBase
                                placeholder="Filter…"
                                inputProps={{
                                    "aria-label": "filter",
                                    value: filter,
                                    onChange: (e) => {
                                        setFilter((e.target as HTMLInputElement).value);
                                    }
                                }}
                            />
                        </Search>
                    </Grid>
                    <Grid item xs={3} sm={2}>
                        <FormControl fullWidth>
                            <InputLabel id="log-level-selector">Log level</InputLabel>
                            <Select
                                labelId="log-level-selector"
                                value={logLevel?.current || "info"}
                                label="Log level"
                                onChange={(e) => {
                                    mutateLogLevel({
                                        level: e.target.value as string
                                    });
                                }}
                            >
                                {logLevel?.presets.map(preset => {
                                    return <MenuItem key={preset} value={preset}>{preset}</MenuItem>;
                                })}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={1} sm={1}>
                        <IconButton
                            onClick={() => {
                                logLevelRefetch().then();
                                logRefetch().then();
                            }}
                        >
                            <RefreshIcon/>
                        </IconButton>
                    </Grid>
                </Grid>
                <TextField focused InputProps={{
                    readOnly: true,
                    sx: {
                        fontFamily: "monospace"
                    },
                }} inputRef={logRef} fullWidth multiline label="Log content" value={filteredData} rows={15}/>
            </React.Fragment>
        );
    }, [logData, logError, logRefetch, logLevel, logLevelError, logLevelRefetch, mutateLogLevel, filter, setFilter]);

    return (
        <Container>
            {logLines}
        </Container>
    );
};

export default Log;
