import React from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
    Avatar,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Link,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Typography,
} from "@mui/material";
import {
    Videocam as CameraIcon,
} from "@mui/icons-material";
import {
    useDuststreamingConfigurationMutation,
    useDuststreamingConfigurationQuery,
    useDuststreamingPropertiesQuery,
    useSystemRuntimeInfoQuery,
} from "../../api";
import ConfirmationDialog from "../ConfirmationDialog";
import {DuststreamingLecture, DuststreamingInstallInstructions} from "./res/Duststreaming";
import style from "./DuststreamingListMenuItem.module.css";

const CONFIRMATION_COOLDOWN_SECONDS = 60;
const SKIP_COOLDOWN_CODE = "skip";

const markdownComponents: React.ComponentProps<typeof ReactMarkdown>["components"] = {
    a: ({node, ...props}) => <a target="_blank" rel="noopener noreferrer" {...props}/>
};

const DuststreamingEnableDialog: React.FunctionComponent<{
    open: boolean,
    onClose: () => void,
    onConfirm: () => void,
    loading: boolean,
}> = ({
    open,
    onClose,
    onConfirm,
    loading,
}): React.ReactElement => {
    const [secondsRemaining, setSecondsRemaining] = React.useState(CONFIRMATION_COOLDOWN_SECONDS);

    React.useEffect(() => {
        if (!open) {
            setSecondsRemaining(CONFIRMATION_COOLDOWN_SECONDS);

            return;
        }

        let timer: ReturnType<typeof setInterval> | null = null;

        const tick = () => {
            setSecondsRemaining((prev) => {
                if (prev <= 1) {
                    if (timer !== null) {
                        clearInterval(timer);
                        timer = null;
                    }

                    return 0;
                }

                return prev - 1;
            });
        };

        const onFocus = () => {
            if (timer === null) {
                timer = setInterval(tick, 1000);
            }
        };

        const onBlur = () => {
            if (timer !== null) {
                clearInterval(timer);
                timer = null;
            }
        };

        if (document.hasFocus()) {
            onFocus();
        }

        window.addEventListener("focus", onFocus);
        window.addEventListener("blur", onBlur);

        return () => {
            window.removeEventListener("focus", onFocus);
            window.removeEventListener("blur", onBlur);
            if (timer !== null) {
                clearInterval(timer);
            }
        };
    }, [open]);

    const bufferRef = React.useRef("");

    React.useEffect(() => {
        if (!open) {
            bufferRef.current = "";
            return;
        }

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key.length === 1) {
                bufferRef.current = (bufferRef.current + e.key).slice(-SKIP_COOLDOWN_CODE.length);

                if (bufferRef.current === SKIP_COOLDOWN_CODE) {
                    setSecondsRemaining(0);
                    bufferRef.current = "";
                }
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                Are you sure you want to enable camera streaming?
            </DialogTitle>
            <DialogContent>
                <div className={style.reactMarkDown}>
                    <ReactMarkdown
                        remarkPlugins={[gfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                    >
                        {DuststreamingLecture}
                    </ReactMarkdown>
                </div>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={onConfirm}
                    disabled={secondsRemaining > 0 || loading}
                    autoFocus
                >
                    {secondsRemaining > 0 ? `I understand (${secondsRemaining}s)` : "I understand"}
                </Button>
                <Button onClick={onClose} color="inherit" disabled={loading}>
                    Cancel
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const DuststreamingInstructionsDialog: React.FunctionComponent<{
    open: boolean,
    onClose: () => void,
    binaryPath?: string,
}> = ({
    open,
    onClose,
    binaryPath,
}): React.ReactElement => {
    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                You&apos;re not done yet!
            </DialogTitle>
            <DialogContent>
                <div className={style.reactMarkDown}>
                    <ReactMarkdown
                        remarkPlugins={[gfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={markdownComponents}
                    >
                        {DuststreamingInstallInstructions(binaryPath ?? "undefined")}
                    </ReactMarkdown>
                </div>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} autoFocus>
                    Understood
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export const DuststreamingListMenuItem = (): React.ReactElement => {
    const {
        data: properties,
        isPending: propertiesPending,
        isError: propertiesError,
    } = useDuststreamingPropertiesQuery();

    const {
        data: configuration,
        isPending: configurationPending,
        isError: configurationError,
    } = useDuststreamingConfigurationQuery();

    const {data: runtimeInfo} = useSystemRuntimeInfoQuery();

    const {mutate: updateConfiguration, isPending: configurationUpdating} = useDuststreamingConfigurationMutation();

    const [enableDialogOpen, setEnableDialogOpen] = React.useState(false);
    const [disableDialogOpen, setDisableDialogOpen] = React.useState(false);
    const [instructionsDialogOpen, setInstructionsDialogOpen] = React.useState(false);

    const capabilitySupported = properties !== undefined;
    const enabled = configuration?.enabled === true;
    const duststreamerInstalled = properties?.duststreamerInstalled === true;
    const duststreamerPath = runtimeInfo?.execPath ? (() => {
        const separator = runtimeInfo.execPath.includes("/") ? "/" : "\\";
        const dir = runtimeInfo.execPath.slice(0, runtimeInfo.execPath.lastIndexOf(separator) + 1);
        return dir + "duststreamer";
    })() : undefined;

    let secondaryLabel: React.ReactNode | undefined;
    if (enabled) {
        if (duststreamerInstalled) {
            secondaryLabel = "Rockwell - Somebody's Watching Me ♫";
        } else {
            secondaryLabel = (
                <Link
                    component="button"
                    type="button"
                    color="inherit"
                    onClick={() => {
                        setInstructionsDialogOpen(true);
                    }}
                >
                    Setup incomplete
                </Link>
            );
        }
    }

    const toggleDisabled = !capabilitySupported || configurationPending || configurationUpdating;

    const handleEnableConfirm = () => {
        setEnableDialogOpen(false);
        updateConfiguration({enabled: true});

        if (!duststreamerInstalled) {
            setInstructionsDialogOpen(true);
        }
    };

    const handleDisableConfirm = () => {
        setDisableDialogOpen(false);
        updateConfiguration({enabled: false});
    };

    return (
        <>
            <ListItem
                style={{
                    userSelect: "none"
                }}
            >
                <ListItemAvatar>
                    <Avatar>
                        <CameraIcon/>
                    </Avatar>
                </ListItemAvatar>
                <ListItemText
                    primary="Camera Streaming"
                    secondary={secondaryLabel}
                    style={{marginRight: "2rem"}}
                />
                {(propertiesError || configurationError) ? (
                    <Typography variant="body2" color="error">Error</Typography>
                ) : (
                    <Button
                        variant="outlined"
                        disabled={toggleDisabled || propertiesPending}
                        onClick={() => {
                            if (enabled) {
                                setDisableDialogOpen(true);
                            } else {
                                setEnableDialogOpen(true);
                            }
                        }}
                        sx={{
                            mt: 1,
                            mb: 1,
                            minWidth: 0,
                        }}
                    >
                        {enabled ? "Disable" : "Enable"}
                    </Button>
                )}
            </ListItem>
            <DuststreamingEnableDialog
                open={enableDialogOpen}
                onClose={() => {
                    setEnableDialogOpen(false);
                }}
                onConfirm={handleEnableConfirm}
                loading={configurationUpdating}
            />
            <ConfirmationDialog
                title="Disable camera streaming?"
                text="This will also delete the duststreamer, so that it cannot be re-enabled with HTTP access alone."
                open={disableDialogOpen}
                onClose={() => {
                    setDisableDialogOpen(false);
                }}
                onAccept={handleDisableConfirm}
            />
            <DuststreamingInstructionsDialog
                open={instructionsDialogOpen}
                onClose={() => {
                    setInstructionsDialogOpen(false);
                }}
                binaryPath={duststreamerPath}
            />
        </>
    );
};
