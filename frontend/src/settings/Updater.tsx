import {
    UpdaterState,
    useUpdaterCommandMutation,
    useUpdaterStateQuery
} from "../api";
import {
    Refresh as RefreshIcon,
    SystemUpdateAlt as UpdaterIcon,
    Warning as ErrorIcon,
    Download as DownloadIcon,
    PendingActions as ApprovalPendingIcon,
    Info as IdleIcon,
    RestartAlt as ApplyPendingIcon,
    ExpandMore as ExpandMoreIcon,
    UpdateDisabled as UpdaterDisabledIcon
} from "@mui/icons-material";
import {
    Accordion, AccordionDetails,
    AccordionSummary,
    Box,
    Container,
    Divider,
    Grid,
    IconButton,
    Paper,
    Typography
} from "@mui/material";
import React, {FunctionComponent} from "react";
import LoadingFade from "../components/LoadingFade";
import {LoadingButton} from "@mui/lab";
import ConfirmationDialog from "../components/ConfirmationDialog";

import style from "./Updater.module.css";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const Updater = (): JSX.Element => {
    const {
        data: updaterState,
        isLoading: updaterStateLoading,
        isError: updaterStateError,
        refetch: refetchUpdaterState,
    } = useUpdaterStateQuery();

    return (
        <Container>
            <Paper style={{marginBottom: "16px"}}>
                <Grid container direction="row">
                    <Box px={2} pt={1} style={{width: "100%"}}>
                        <Grid item container alignItems="center" spacing={1} justifyContent="space-between">
                            <Grid item style={{display:"flex"}}>
                                <Grid item style={{paddingRight: "8px"}}><UpdaterIcon/></Grid>
                                <Grid item>
                                    <Typography>Updater</Typography>
                                </Grid>
                            </Grid>
                            <Grid item>
                                <IconButton onClick={() => {
                                    refetchUpdaterState();
                                }}>
                                    <RefreshIcon/>
                                </IconButton>
                            </Grid>
                        </Grid>
                        <Divider sx={{mt: 1}}/>

                        <UpdaterStateComponent
                            state={updaterState}
                            stateLoading={updaterStateLoading}
                            stateError={updaterStateError}
                        />
                    </Box>
                </Grid>
            </Paper>
        </Container>
    );
};

const UpdaterStateComponent : React.FunctionComponent<{ state: UpdaterState | undefined, stateLoading: boolean, stateError: boolean }> = ({
    state,
    stateLoading,
    stateError
}) => {
    if (stateLoading || !state) {
        return (
            <LoadingFade/>
        );
    }

    if (stateError) {
        return <Typography color="error">Error loading Updater state</Typography>;
    }

    const getIconForState = () : JSX.Element => {
        switch (state.__class) {
            case "ValetudoUpdaterErrorState":
                return <ErrorIcon sx={{ fontSize: "3rem" }}/>;
            case "ValetudoUpdaterDownloadingState":
                return <DownloadIcon sx={{ fontSize: "3rem" }}/>;
            case "ValetudoUpdaterApprovalPendingState":
                return <ApprovalPendingIcon sx={{ fontSize: "3rem" }}/>;
            case "ValetudoUpdaterIdleState":
                return <IdleIcon sx={{ fontSize: "3rem" }}/>;
            case "ValetudoUpdaterApplyPendingState":
                return <ApplyPendingIcon sx={{ fontSize: "3rem" }}/>;
            case "ValetudoUpdaterDisabledState":
                return <UpdaterDisabledIcon sx={{ fontSize: "3rem" }}/>;
        }
    };

    const getContentForState = () : JSX.Element | undefined => {
        switch (state.__class) {
            case "ValetudoUpdaterErrorState":
                return (
                    <Typography color="red"> {state.message}</Typography>
                );
            case "ValetudoUpdaterDownloadingState":
                return (
                    <>
                        <Typography>Valetudo is currently downloading release {state.version}</Typography>
                        <br/>
                        <Typography>Please be patient...</Typography>
                    </>
                );
            case "ValetudoUpdaterApprovalPendingState":
                return (
                    <Accordion
                        defaultExpanded={true}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                            <Typography>Changelog for Valetudo {state.version}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box style={{width:"100%", paddingLeft: "16px", paddingRight:"16px"}}>
                                <ReactMarkdown
                                    remarkPlugins={[gfm]}
                                    rehypePlugins={[rehypeRaw]}
                                    className={style.reactMarkDown}
                                >
                                    {state.changelog ? state.changelog: ""}
                                </ReactMarkdown>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                );
            case "ValetudoUpdaterIdleState":
                return (
                    <Typography>You&apos;re current running {state.currentVersion}</Typography>
                );
            case "ValetudoUpdaterApplyPendingState":
                return (
                    <Typography>Successfully downloaded {state.version}</Typography>
                );
            case "ValetudoUpdaterDisabledState":
                return (
                    <Typography>The Updater was disabled in the Valetudo config.</Typography>
                );
        }
    };


    return (
        <>
            <Grid container alignItems="center" direction="column" style={{paddingBottom:"16px"}}>
                <Grid item style={{marginTop:"8px"}}>
                    {getIconForState()}
                </Grid>
                <Grid item>
                    {getContentForState()}
                </Grid>
                {
                    state.__class === "ValetudoUpdaterApplyPendingState" &&
                    <Typography color="red" style={{marginTop:"1rem", width: "80%"}}>
                        Please keep in mind that updating can be a dangerous operation.<br/>
                        Make sure that you&apos;ve thoroughly read the changelog to be aware of possible breaking changes.<br/><br/>
                        Also, during updates, you should always be prepared for some troubleshooting so please do not click apply if you currently don&apos;t have time for that.
                    </Typography>
                }
            </Grid>
            <Divider sx={{mt: 1}}/>
            <UpdaterControls
                state={state}
            />
        </>
    );
};

const UpdaterControls : React.FunctionComponent<{ state: UpdaterState}> = ({
    state,
}) => {
    return (
        <Grid container justifyContent="flex-end" direction="row" style={{paddingTop: "16px", paddingBottom:"16px"}}>
            <Grid item>
                {
                    (
                        state.__class === "ValetudoUpdaterIdleState" ||
                        state.__class === "ValetudoUpdaterErrorState"
                    ) &&
                        <StartUpdateControls/>
                }
                {
                    (
                        state.__class === "ValetudoUpdaterApprovalPendingState"
                    ) &&
                    <DownloadUpdateControls/>
                }
                {
                    (
                        state.__class === "ValetudoUpdaterApplyPendingState"
                    ) &&
                    <ApplyUpdateControls/>
                }
            </Grid>
        </Grid>
    );
};

const StartUpdateControls: FunctionComponent = () => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const {mutate: sendCommand, isLoading: commandExecuting} = useUpdaterCommandMutation();

    const {
        refetch: refetchUpdaterState,
    } = useUpdaterStateQuery();


    return (
        <>
            <LoadingButton loading={commandExecuting} variant="outlined" onClick={() => {
                setDialogOpen(true);
            }} sx={{mt: 1, mb: 1}}>Start Update</LoadingButton>
            <ConfirmationDialog title="Start Update?"
                text="Do you want to look for a new version of Valetudo?"
                open={dialogOpen} onClose={() => {
                    setDialogOpen(false);
                }} onAccept={() => {
                    sendCommand("start");
                    setTimeout(() => {
                        refetchUpdaterState().then();
                    }, 2000); //TODO: this could be better
                }}/>
        </>
    );
};

const DownloadUpdateControls: FunctionComponent = () => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const {mutate: sendCommand, isLoading: commandExecuting} = useUpdaterCommandMutation();

    const {
        refetch: refetchUpdaterState,
    } = useUpdaterStateQuery();


    return (
        <>
            <LoadingButton loading={commandExecuting} variant="outlined" onClick={() => {
                setDialogOpen(true);
            }} sx={{mt: 1, mb: 1}}>Download Update</LoadingButton>
            <ConfirmationDialog title="Download Update?"
                text="Do you want to download the displayed Valetudo update? Please make sure to fully read the provided changelog as it may contain breaking changes as well as other relevant information."
                open={dialogOpen} onClose={() => {
                    setDialogOpen(false);
                }} onAccept={() => {
                    sendCommand("download");
                    setTimeout(() => {
                        refetchUpdaterState().then();
                    }, 100); //TODO: this could be better
                }}/>
        </>
    );
};

const ApplyUpdateControls: FunctionComponent = () => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const {mutate: sendCommand, isLoading: commandExecuting} = useUpdaterCommandMutation();


    return (
        <>
            <LoadingButton loading={commandExecuting} variant="outlined" onClick={() => {
                setDialogOpen(true);
            }} sx={{mt: 1, mb: 1}}>Apply Update</LoadingButton>
            <ConfirmationDialog title="Apply Update?"
                text="Do you want to apply the downloaded update? The robot will reboot during this procedure."
                open={dialogOpen} onClose={() => {
                    setDialogOpen(false);
                }} onAccept={() => {
                    sendCommand("apply");
                }}/>
        </>
    );
};




export default Updater;
