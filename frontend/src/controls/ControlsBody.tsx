import {createSvgIcon, Grid} from "@mui/material";
import {Opacity as WaterUsageIcon,} from "@mui/icons-material";
import {Capability} from "../api";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import BasicControls from "./BasicControls";
import GoToLocationPresets from "./GoToPresets";
import PresetSelectionControl from "./PresetSelection";
import RobotStatus from "./RobotStatus";
import ZonePresets from "./ZonePresets";
import Dock from "./Dock";
import CurrentStatistics from "./CurrentStatistics";

// Taken from https://github.com/Templarian/MaterialDesign/blob/master/svg/fan.svg
const FanSpeedIcon = createSvgIcon(
    <path d="M12,11A1,1 0 0,0 11,12A1,1 0 0,0 12,13A1,1 0 0,0 13,12A1,1 0 0,0 12,11M12.5,2C17,2 17.11,5.57 14.75,6.75C13.76,7.24 13.32,8.29 13.13,9.22C13.61,9.42 14.03,9.73 14.35,10.13C18.05,8.13 22.03,8.92 22.03,12.5C22.03,17 18.46,17.1 17.28,14.73C16.78,13.74 15.72,13.3 14.79,13.11C14.59,13.59 14.28,14 13.88,14.34C15.87,18.03 15.08,22 11.5,22C7,22 6.91,18.42 9.27,17.24C10.25,16.75 10.69,15.71 10.89,14.79C10.4,14.59 9.97,14.27 9.65,13.87C5.96,15.85 2,15.07 2,11.5C2,7 5.56,6.89 6.74,9.26C7.24,10.25 8.29,10.68 9.22,10.87C9.41,10.39 9.73,9.97 10.14,9.65C8.15,5.96 8.94,2 12.5,2Z" />,
    "fanSpeed"
);


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
        Capability.CurrentStatisticsCapability
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
