import {Grid} from "@mui/material";
import {Celebration as FanSpeedIcon, Opacity as WaterUsageIcon,} from "@mui/icons-material";
import {Capability} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import BasicControls from "./BasicControls";
import GoToLocationPresets from "./GoToPresets";
import PresetSelectionControl from "./PresetSelection";
import RobotStatus from "./RobotStatus";
import Segments from "./Segments";
import ZonePresets from "./ZonePresets";
import Dock from "./Dock";

const ControlsBody = (): JSX.Element => {
    const [
        basicControls,
        fanSpeed,
        waterControl,
        goToLocation,
        zoneCleaning,
        segmentCleaning,
        segmentNaming,
        triggerEmptySupported,
    ] = useCapabilitiesSupported(
        Capability.BasicControl,
        Capability.FanSpeedControl,
        Capability.WaterUsageControl,
        Capability.GoToLocation,
        Capability.ZoneCleaning,
        Capability.MapSegmentation,
        Capability.MapSegmentRename,
        Capability.AutoEmptyDockManualTrigger
    );

    return (
        <Grid container spacing={2} direction="column">
            {basicControls && (
                <Grid item>
                    <BasicControls />
                </Grid>
            )}
            <Grid item>
                <RobotStatus />
            </Grid>
            {fanSpeed && (
                <Grid item>
                    <PresetSelectionControl
                        capability={Capability.FanSpeedControl}
                        label="Fan speed"
                        icon={
                            <FanSpeedIcon
                                fontSize="small"
                                style={{ transform: "rotate(180deg)" }}
                            />
                        }
                    />
                </Grid>
            )}
            {waterControl && (
                <Grid item>
                    <PresetSelectionControl
                        capability={Capability.WaterUsageControl}
                        label="Water usage"
                        icon={<WaterUsageIcon fontSize="small" />}
                    />
                </Grid>
            )}
            {triggerEmptySupported && (
                <Grid item>
                    <Dock/>
                </Grid>
            )}
            {goToLocation && (
                <Grid item>
                    <GoToLocationPresets />
                </Grid>
            )}
            {zoneCleaning && (
                <Grid item>
                    <ZonePresets />
                </Grid>
            )}
            {segmentCleaning && segmentNaming && (
                <Grid item>
                    <Segments />
                </Grid>
            )}
        </Grid>
    );
};

export default ControlsBody;
