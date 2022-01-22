import React, {FunctionComponent} from "react";
import {
    Box,
    Divider,
    FormControl,
    Grid,
    IconButton,
    MenuItem,
    Paper,
    Select,
    SelectChangeEvent,
    styled,
    Typography
} from "@mui/material";
import {
    Quirk,
    useQuirksQuery,
    useSetQuirkValueMutation
} from "../../api";

import {QuirksHelp} from "./res/QuirksHelp";
import {
    Help as HelpIcon,
    Refresh as RefreshIcon,
    Star as QuirksIcon,
} from "@mui/icons-material";
import PaperContainer from "../../components/PaperContainer";
import {LoadingButton} from "@mui/lab";
import HelpDialog from "../../components/HelpDialog";

const StyledLoadingButton = styled(LoadingButton)(({theme}) => {
    return {
        minWidth: 0
    };
});


const QuirkControl: FunctionComponent<{ quirk: Quirk, style?: React.CSSProperties }> = (props) => {
    const {mutate: setQuirkValue, isLoading: quirkValueSetting} = useSetQuirkValueMutation();
    const handleChange = React.useCallback(
        (event: SelectChangeEvent<string>) => {
            setQuirkValue({
                id: props.quirk.id,
                value: event.target.value
            });
        },
        [props.quirk.id, setQuirkValue]
    );


    return (
        <Grid
            item
            style={props.style}
            sx={{
                width: {
                    "xs": "100%",
                    "sm": "60%"
                },
                marginLeft: "auto",
                marginRight: "auto"
            }}
        >
            <Paper
                sx={{
                    boxShadow: 3,
                    padding: "1rem"
                }}
            >
                <FormControl
                    variant="standard"
                    style={{
                        width: "100%"
                    }}
                >
                    <Typography variant="body1" sx={{mb: 0}}>
                        {props.quirk.title}
                    </Typography>
                    <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>
                    <Select
                        id={props.quirk.id + "-select"}
                        value={props.quirk.value}
                        onChange={handleChange}
                        disabled={quirkValueSetting}

                    >
                        {
                            props.quirk.options.map((o, i) => {
                                return (
                                    <MenuItem
                                        value={o}
                                        key={`${o}_${i}`}
                                    >
                                        {o}
                                    </MenuItem>
                                );
                            })
                        }
                    </Select>
                    <Typography
                        variant="body2"
                        sx={{mb: 1}}
                        style={{marginTop: "1rem"}}
                    >
                        {props.quirk.description}
                    </Typography>
                </FormControl>
            </Paper>
        </Grid>
    );
};

const Quirks: FunctionComponent = () => {
    const [helpDialogOpen, setHelpDialogOpen] = React.useState(false);

    const {
        data: quirks,
        isError: quirksLoadingError,
        isLoading: quirksLoading,
        isFetching: quirksFetching,
        refetch: refetchQuirks
    } = useQuirksQuery();

    const quirksContent = React.useMemo(() => {
        if (quirksLoadingError) {
            return (
                <Typography color="error" style={{textAlign: "center"}}>
                    Error loading quirks.
                </Typography>
            );
        }

        if (!quirksLoading && (!quirks || (Array.isArray(quirks) && quirks.length === 0))) {
            return (
                <Typography style={{textAlign: "center"}}>
                    No quirks. You might want to reload
                </Typography>
            );
        }

        if (!quirks) {
            return;
        }


        quirks.sort((qA, qB) => {
            return qA.title.localeCompare(qB.title);
        });

        return (
            <>
                {
                    quirks.map((quirk, i) => {
                        return <QuirkControl
                            quirk={quirk}
                            key={quirk.id}
                            style={i === quirks.length -1 ? {} : {paddingBottom: "1rem"}}
                        />;
                    })
                }
            </>
        );


    }, [quirksLoadingError, quirksLoading, quirks]);


    return (
        <PaperContainer>
            <Grid container direction="row">
                <Box style={{width: "100%"}}>
                    <Grid item container alignItems="center" spacing={1} justifyContent="space-between">
                        <Grid item style={{display:"flex"}}>
                            <Grid item style={{paddingRight: "8px"}}>
                                <QuirksIcon/>
                            </Grid>
                            <Grid item>
                                <Typography>Quirks</Typography>
                            </Grid>
                        </Grid>
                        <Grid item>
                            <Grid container>
                                <Grid
                                    item
                                    style={{marginTop:"-0.125rem"}} //:(
                                >
                                    <IconButton
                                        onClick={() => {
                                            return setHelpDialogOpen(true);
                                        }}
                                        title="Help"
                                    >
                                        <HelpIcon/>
                                    </IconButton>
                                </Grid>
                                <Grid item>
                                    <StyledLoadingButton
                                        loading={quirksFetching}
                                        onClick={() => {
                                            refetchQuirks();
                                        }}
                                        title="Refresh"
                                    >
                                        <RefreshIcon/>
                                    </StyledLoadingButton>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Divider sx={{mt: 1}} style={{marginBottom: "1rem"}}/>
                    <Grid container direction="column">
                        {quirksContent}
                    </Grid>
                </Box>
            </Grid>
            <HelpDialog
                dialogOpen={helpDialogOpen}
                setDialogOpen={(open: boolean) => {
                    setHelpDialogOpen(open);
                }}
                helpText={QuirksHelp}
            />
        </PaperContainer>
    );
};

export default Quirks;
