import {Grid} from "@mui/material";
import {Opacity as WaterUsageIcon,} from "@mui/icons-material";
import {Capability} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import BasicControls from "./BasicControls";
import GoToLocationPresets from "./GoToLocationPresets";
import PresetSelectionControl from "./PresetSelection";
import RobotStatus from "./RobotStatus";
import ZonePresets from "./ZonePresets";
import Dock from "./Dock";
import CurrentStatistics from "./CurrentStatistics";
import Attachments from "./Attachments";
import {FanSpeedIcon} from "../components/CustomIcons";


const ControlsBody = (): JSX.Element => {
    const [
        basicControls,
        fanSpeed,
        waterControl,
        goToLocation,
        zoneCleaning,
        triggerEmptySupported,
        currentStatistics,
    ] = useCapabilitiesSupported(
        Capability.BasicControl,
        Capability.FanSpeedControl,
        Capability.WaterUsageControl,
        Capability.GoToLocation,
        Capability.ZoneCleaning,
        Capability.AutoEmptyDockManualTrigger,
        Capability.CurrentStatistics
    );

    return (
        <Grid container spacing={2} direction="column" sx={{userSelect: "none"}}>
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
            <Grid item>
                <Attachments/>
            </Grid>
            {
                currentStatistics && (
                    <Grid item>
                        <CurrentStatistics/>
                    </Grid>
                )
            }
        </Grid>
    );
};

export default ControlsBody;
