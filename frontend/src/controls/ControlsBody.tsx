import {Grid} from "@mui/material";
import {Opacity as WaterUsageIcon,} from "@mui/icons-material";
import {Capability, useRobotInformationQuery} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import BasicControls from "./BasicControls";
import PresetSelectionControl from "./PresetSelection";
import RobotStatus from "./RobotStatus";
import Dock from "./Dock";
import CurrentStatistics from "./CurrentStatistics";
import Attachments from "./Attachments";
import {FanSpeedIcon} from "../components/CustomIcons";
import React from "react";


const ControlsBody = (): JSX.Element => {
    const [
        basicControls,
        fanSpeed,
        waterControl,
        triggerEmptySupported,
        currentStatistics,
    ] = useCapabilitiesSupported(
        Capability.BasicControl,
        Capability.FanSpeedControl,
        Capability.WaterUsageControl,
        Capability.AutoEmptyDockManualTrigger,
        Capability.CurrentStatistics
    );

    const {
        data: robotInformation,
    } = useRobotInformationQuery();


    return (
        <Grid container spacing={2} direction="column" sx={{userSelect: "none"}}>
            {basicControls && <BasicControls />}

            <RobotStatus />

            {fanSpeed && (
                <PresetSelectionControl
                    capability={Capability.FanSpeedControl}
                    label="Fan speed"
                    icon={
                        <FanSpeedIcon
                            fontSize="small"
                        />
                    }
                />
            )}
            {waterControl && (
                <PresetSelectionControl
                    capability={Capability.WaterUsageControl}
                    label="Water usage"
                    icon={<WaterUsageIcon fontSize="small" />}
                />
            )}

            {triggerEmptySupported && <Dock/>}

            {
                robotInformation &&
                robotInformation.modelDetails.supportedAttachments.length > 0 &&

                <Attachments/>
            }

            {currentStatistics && <CurrentStatistics/>}
        </Grid>
    );
};

export default ControlsBody;
