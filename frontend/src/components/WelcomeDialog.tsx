import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Link,
    Paper,
    Typography
} from "@mui/material";
import React, {FunctionComponent} from "react";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {Capability, useBasicControlMutation, useDismissWelcomeDialogMutation} from "../api";
import {MappingPassButtonItem, PersistentMapSwitchListItem} from "../options/MapManagement";
import {ButtonListMenuItem} from "./list_menu/ButtonListMenuItem";
import {
    Layers as MappingPassIcon
} from "@mui/icons-material";

const FullCleanupButtonItem = (): React.ReactElement => {
    const {
        mutate: executeBasicControlCommand,
        isPending: basicControlIsExecuting
    } = useBasicControlMutation();

    return (
        <ButtonListMenuItem
            primaryLabel="Full Cleanup"
            secondaryLabel="Create a new map"
            icon={<MappingPassIcon/>}
            buttonLabel="Go"
            confirmationDialog={{
                title: "Start full cleanup?",
                body: "The robot needs to return to the dock on its own to save the newly created map. Do not interfere with the cleanup or else it won't be saved."
            }}
            action={() => {
                executeBasicControlCommand("start");
            }}
            actionLoading={basicControlIsExecuting}
        />
    );
};

const WelcomeDialog: FunctionComponent<{open: boolean, hide: () => void}> = ({
    open,
    hide
}): React.ReactElement => {
    const [
        basicControlSupported,
        persistentMapControlSupported,
        mappingPassSupported
    ] = useCapabilitiesSupported(
        Capability.BasicControl,
        Capability.PersistentMapControl,
        Capability.MappingPass
    );
    const {
        mutate: dismissWelcomeDialog,
    } = useDismissWelcomeDialogMutation();

    return (
        <Dialog
            open={open}
        >
            <DialogTitle>
                Welcome to Valetudo
            </DialogTitle>
            <DialogContent>
                <DialogContentText
                    style={{
                        whiteSpace: "pre-wrap"
                    }}
                    component="span"
                >
                    <Typography>
                        It looks like it might be the first time that you&apos;re using Valetudo on this robot.
                    </Typography>
                    <br/>
                    <Typography>
                        The first step is usually to let the robot create a new map of your home.
                        Depending on your firmware, the map will allow you to clean specific rooms, add virtual walls and more.
                        <br/><br/>
                        There are some variations in the map creation process based on the model of robot.
                        For example, some robots might require you to enable map persistence first, whereas others might offer a dedicated Mapping Pass.
                    </Typography>
                    <br/>
                    <Typography component="span">
                        For the initial mapping, please ensure that:
                        <ul>
                            <li>the robot is docked</li>
                            <li>all relevant doors are open</li>
                            <li>there are no loose cables lying around</li>
                            <li>all areas you don&apos;t want it to go are blocked off</li>
                        </ul>
                        With that done, here&apos;s what you&apos;ll need to let your robot create a new map:
                    </Typography>
                    {
                        persistentMapControlSupported &&
                        (
                            <Paper
                                elevation={2}
                                sx={{marginTop: "1rem"}}
                            >
                                <PersistentMapSwitchListItem/>
                            </Paper>
                        )
                    }
                    {
                        mappingPassSupported &&
                        (
                            <Paper
                                elevation={2}
                                sx={{marginTop: "1rem"}}
                            >
                                <MappingPassButtonItem/>
                            </Paper>
                        )
                    }
                    {
                        basicControlSupported &&
                        !mappingPassSupported &&
                        (
                            <Paper
                                elevation={2}
                                sx={{marginTop: "1rem"}}
                            >
                                <FullCleanupButtonItem/>
                            </Paper>
                        )
                    }
                    <br/>
                    <Typography>
                        While watching your robot zip around, you might want to <Link href="https://github.com/sponsors/Hypfer" target="_blank" rel="noopener">consider donating</Link>.
                        If you&apos;d rather decide later, the donation link can also be found hiding unobtrusively at the bottom of the sidebar menu.
                        <br/><br/>
                        Now, please enjoy your cloud-free robot :)
                    </Typography>
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => {
                    hide();
                }}>
                    Hide
                </Button>
                <Button onClick={() => {
                    dismissWelcomeDialog();
                }}>
                    Do not show again
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default WelcomeDialog;
