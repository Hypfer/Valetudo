import { Grid } from '@material-ui/core';
import {
  Opacity as WaterUsageIcon,
  Toys as FanSpeedIcon,
} from '@material-ui/icons';
import { Capability } from '../api';
import { useCapabilitiesSupported } from '../CapabilitiesProvider';
import BasicControls from './BasicControls';
import GoToLocationPresets from './GoToPresets';
import PresetSelectionControl from './PresetSelection';
import RobotStatus from './RobotStatus';
import Segments from './Segments';
import ZonePresets from './ZonePresets';

const ControlsBody = (): JSX.Element => {
  const [
    basicControls,
    fanSpeed,
    waterControl,
    goToLocation,
    zoneCleaning,
    segmentCleaning,
    segmentNaming,
  ] = useCapabilitiesSupported(
    Capability.BasicControl,
    Capability.FanSpeedControl,
    Capability.WaterUsageControl,
    Capability.GoToLocation,
    Capability.ZoneCleaning,
    Capability.MapSegmentation,
    Capability.MapSegmentRename
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
            icon={<FanSpeedIcon fontSize="small" />}
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
