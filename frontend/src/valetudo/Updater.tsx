import {
    UpdaterState,
    useUpdaterCommandMutation,
    useUpdaterStateQuery
} from "../api";
import {
    SystemUpdateAlt as UpdaterIcon,
    Warning as ErrorIcon,
    Download as DownloadIcon,
    PendingActions as ApprovalPendingIcon,
    Info as IdleIcon,
    RestartAlt as ApplyPendingIcon,
    ExpandMore as ExpandMoreIcon,
    UpdateDisabled as UpdaterDisabledIcon,
    CheckCircle as NoUpdateRequiredIcon,
    HourglassTop as BusyIcon,
} from "@mui/icons-material";
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Divider,
    Grid2,
    LinearProgress,
    Skeleton,
    Typography
} from "@mui/material";
import React from "react";
import {LoadingButton} from "@mui/lab";
import ConfirmationDialog from "../components/ConfirmationDialog";

import style from "./Updater.module.css";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import PaperContainer from "../components/PaperContainer";
import {UpdaterHelp} from "./res/UpdaterHelp";
import DetailPageHeaderRow from "../components/DetailPageHeaderRow";

const Updater = (): React.ReactElement => {
    const {
        data: updaterState,
        isPending: updaterStatePending,
        isFetching: updaterStateFetching,
        isError: updaterStateError,
        refetch: refetchUpdaterState,
    } = useUpdaterStateQuery();

    return (
        <PaperContainer>
            <Grid2 container direction="row">
                <Box style={{width: "100%"}}>
                    <DetailPageHeaderRow
                        title="Updater"
                        icon={<UpdaterIcon/>}
                        helpText={UpdaterHelp}
                        onRefreshClick={() => {
                            refetchUpdaterState().catch(() => {
                                /* intentional */
                            });
                        }}
                        isRefreshing={updaterStateFetching}
                    />

                    <UpdaterStateComponent
                        state={updaterState}
                        stateLoading={updaterStatePending}
                        stateError={updaterStateError}
                    />
                </Box>
            </Grid2>
        </PaperContainer>
    );
};

const UpdaterStateComponent : React.FunctionComponent<{ state: UpdaterState | undefined, stateLoading: boolean, stateError: boolean }> = ({
    state,
    stateLoading,
    stateError
}) => {
    if (stateLoading || !state) {
        return (
            <Skeleton height={"12rem"}/>
        );
    }

    if (stateError) {
        return <Typography color="error">Error loading Updater state</Typography>;
    }

    const getIconForState = () : React.ReactElement => {
        if (state.busy && state.__class !== "ValetudoUpdaterDownloadingState") {
            return <BusyIcon sx={{ fontSize: "3rem" }}/>;
        } else {
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
                case "ValetudoUpdaterNoUpdateRequiredState":
                    return <NoUpdateRequiredIcon sx={{ fontSize: "3rem" }}/>;
            }
        }
    };

    const getContentForState = () : React.ReactElement | undefined => {
        if (state.busy && state.__class !== "ValetudoUpdaterDownloadingState") {
            return (
                <Typography>The Updater is currently busy</Typography>
            );
        } else {
            switch (state.__class) {
                case "ValetudoUpdaterErrorState":
                    return (
                        <Typography color="red">{state.message}</Typography>
                    );
                case "ValetudoUpdaterDownloadingState":
                    return (
                        <>
                            <Typography>
                                The Updater is currently downloading version
                                <br/>
                                <span
                                    style={{
                                        fontFamily: "\"JetBrains Mono\",monospace",
                                        fontWeight: 200,
                                        marginTop: "1rem"
                                    }}
                                >
                                    {state.version}
                                </span>
                            </Typography>
                            <br/>
                            <LinearProgress
                                variant={state.metaData?.progress !== undefined ? "determinate" : "indeterminate"}
                                value={state.metaData?.progress}
                            />
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
                                <Box style={{width:"100%", paddingLeft: "1rem", paddingRight:"1rem"}}>
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
                        <Typography>
                            You are currently running Valetudo {state.currentVersion}.<br/>
                            There may be newer versions of Valetudo available.
                        </Typography>
                    );
                case "ValetudoUpdaterApplyPendingState":
                    return (
                        <Typography>Successfully downloaded {state.version}</Typography>
                    );
                case "ValetudoUpdaterDisabledState":
                    return (
                        <Typography>The Updater was disabled in the Valetudo config.</Typography>
                    );
                case "ValetudoUpdaterNoUpdateRequiredState":
                    return (
                        <>
                            <Typography
                                sx={{textAlign:"center", paddingBottom: "2rem"}}
                            >
                                You are already running the latest version of Valetudo ({state.currentVersion})
                            </Typography>
                            {
                                state.changelog &&
                                <Accordion
                                    defaultExpanded={false}
                                >
                                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                                        <Typography>Changelog for Valetudo {state.currentVersion}</Typography>
                                    </AccordionSummary>
                                    <AccordionDetails>
                                        <Box style={{width:"100%", paddingLeft: "1rem", paddingRight:"1rem"}}>
                                            <ReactMarkdown
                                                remarkPlugins={[gfm]}
                                                rehypePlugins={[rehypeRaw]}
                                                className={style.reactMarkDown}
                                            >
                                                {state.changelog}
                                            </ReactMarkdown>
                                        </Box>
                                    </AccordionDetails>
                                </Accordion>
                            }
                        </>
                    );
            }
        }
    };


    return (
        <>
            <Grid2 container alignItems="center" direction="column" style={{paddingBottom:"1rem"}}>
                <Grid2 style={{marginTop:"1rem"}}>
                    {getIconForState()}
                </Grid2>
                <Grid2
                    sx={{
                        maxWidth: "100% !important", //Why, MUI? Why?
                        wordWrap: "break-word"
                    }}
                >
                    {getContentForState()}
                </Grid2>
                {
                    state.__class === "ValetudoUpdaterApplyPendingState" && !state.busy &&
                    <Typography color="red" style={{marginTop:"1rem", width: "80%"}}>
                        Please keep in mind that each update can require troubleshooting post-update.<br/>
                        Make sure that you&apos;ve thoroughly read the changelog to be aware of possible breaking changes.
                    </Typography>
                }
            </Grid2>
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
        <Grid2 container justifyContent="flex-end" direction="row" style={{paddingTop: "1rem", paddingBottom:"1rem"}}>
            <Grid2>
                {
                    (
                        state.__class === "ValetudoUpdaterIdleState" ||
                        state.__class === "ValetudoUpdaterErrorState" ||
                        state.__class === "ValetudoUpdaterNoUpdateRequiredState"
                    ) &&
                        <StartUpdateControls busyState={state.busy}/>
                }
                {
                    (
                        state.__class === "ValetudoUpdaterApprovalPendingState"
                    ) &&
                    <DownloadUpdateControls busyState={state.busy}/>
                }
                {
                    (
                        state.__class === "ValetudoUpdaterApplyPendingState"
                    ) &&
                    <ApplyUpdateControls busyState={state.busy}/>
                }
            </Grid2>
        </Grid2>
    );
};

const StartUpdateControls: React.FunctionComponent<{
    busyState: boolean
}> = ({
    busyState
}) => {
    const {mutate: sendCommand, isPending: commandExecuting} = useUpdaterCommandMutation();

    return (
        <LoadingButton
            loading={commandExecuting}
            variant="outlined"
            disabled={busyState}
            onClick={() => {
                sendCommand("check");
            }}
            sx={{mt: 1, mb: 1}}
        >
            Check for Updates
        </LoadingButton>
    );
};

const DownloadUpdateControls: React.FunctionComponent<{
    busyState: boolean
}> = ({
    busyState
}) => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const {mutate: sendCommand, isPending: commandExecuting} = useUpdaterCommandMutation();

    return (
        <>
            <LoadingButton
                loading={commandExecuting}
                variant="outlined"
                disabled={busyState}
                onClick={() => {
                    setDialogOpen(true);
                }}
                sx={{mt: 1, mb: 1}}
            >
                Download Update
            </LoadingButton>
            <ConfirmationDialog
                title="Download Update?"
                text={(
                    <>
                        Do you want to download the displayed Valetudo update?<br/>
                        Please make sure to fully read the provided changelog as it may contain breaking changes as well as other relevant information.
                    </>
                )}
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                }}
                onAccept={() => {
                    sendCommand("download");
                }}
            />
        </>
    );
};

const ApplyUpdateControls: React.FunctionComponent<{
    busyState: boolean
}> = ({
    busyState
}) => {
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const {mutate: sendCommand, isPending: commandExecuting} = useUpdaterCommandMutation();


    return (
        <>
            <LoadingButton
                loading={commandExecuting}
                disabled={busyState}
                variant="outlined"
                onClick={() => {
                    setDialogOpen(true);
                }}
                sx={{mt: 1, mb: 1}}
            >
                Apply Update
            </LoadingButton>
            <ConfirmationDialog
                title="Apply Update?"
                text="Do you want to apply the downloaded update? The robot will reboot during this procedure."
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                }}
                onAccept={() => {
                    sendCommand("apply");
                }}
            />
        </>
    );
};




export default Updater;
