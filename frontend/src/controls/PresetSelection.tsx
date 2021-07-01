import {
  Box,
  CircularProgress,
  Fade,
  Grid,
  Mark,
  Paper,
  Slider,
  Typography,
  withStyles,
} from '@material-ui/core';
import React from 'react';
import {
  Capability,
  capabilityToPresetType,
  PresetSelectionState,
  RobotAttributeClass,
  usePresetSelectionMutation,
  usePresetSelectionsQuery,
  useRobotAttributeQuery,
} from '../api';

const DiscreteSlider = withStyles((theme) => ({
  track: {
    height: 2,
  },
  rail: {
    height: 2,
    opacity: 0.5,
    backgroundColor: theme.palette.grey[400],
  },
  mark: {
    backgroundColor: theme.palette.grey[400],
    height: 8,
    width: 1,
    marginTop: -3,
  },
  markActive: {
    opacity: 1,
    backgroundColor: 'currentColor',
  },
}))(Slider);

const order = ['off', 'min', 'low', 'medium', 'high', 'max', 'turbo'];
const sortPresets = (presets: PresetSelectionState['value'][]) =>
  [...presets].sort((a, b) => order.indexOf(a) - order.indexOf(b));

export interface PresetSelectionProps {
  capability: Capability.FanSpeedControl | Capability.WaterUsageControl;
  label: string;
  icon: JSX.Element;
}

const PresetSelectionControl = (props: PresetSelectionProps): JSX.Element => {
  const { capability, label, icon } = props;
  const { data: preset } = useRobotAttributeQuery(
    RobotAttributeClass.PresetSelectionState,
    (attributes) =>
      attributes.filter(
        (attribute) => attribute.type === capabilityToPresetType[capability]
      )[0]
  );
  const { isLoading, isError, data: presets } = usePresetSelectionsQuery(
    capability
  );
  const { mutate, isLoading: isUpdating } = usePresetSelectionMutation(
    capability
  );
  const filteredPresets = React.useMemo(
    () =>
      sortPresets(
        presets?.filter(
          (x): x is Exclude<PresetSelectionState['value'], 'custom'> =>
            x !== 'custom'
        ) ?? []
      ),
    [presets]
  );
  const [sliderValue, setSliderValue] = React.useState(0);

  React.useEffect(() => {
    if (preset === undefined) {
      return;
    }

    const index = filteredPresets?.indexOf(preset.value) ?? -1;

    setSliderValue(index !== -1 ? index : 0);
  }, [preset, filteredPresets]);

  const marks = React.useMemo<Mark[]>(() => {
    if (filteredPresets === undefined) {
      return [];
    }

    return filteredPresets.map((preset, index) => ({
      value: index,
      label: preset,
    }));
  }, [filteredPresets]);

  const handleSliderChange = React.useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      if (typeof value !== 'number') {
        return;
      }

      setSliderValue(value);
    },
    []
  );
  const handleSliderCommitted = React.useCallback(
    (_event: React.ChangeEvent<unknown>, value: number | number[]) => {
      if (typeof value !== 'number' || filteredPresets === undefined) {
        return;
      }
      setSliderValue(value);
      const level = filteredPresets[value];
      mutate(level);
    },
    [mutate, filteredPresets]
  );

  const body = React.useMemo(() => {
    if (isLoading) {
      return (
        <Grid item>
          <CircularProgress size={20} />
        </Grid>
      );
    }

    if (isError || preset === undefined || filteredPresets === undefined) {
      return (
        <Grid item>
          <Typography color="error">Error loading {capability}</Typography>
        </Grid>
      );
    }

    return (
      <Grid item>
        <Box px={1}>
          <DiscreteSlider
            aria-labelledby={`${capability}-slider-label`}
            step={null}
            value={sliderValue}
            valueLabelDisplay="off"
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderCommitted}
            min={0}
            max={marks.length - 1}
            marks={marks}
            color="secondary"
          />
        </Box>
      </Grid>
    );
  }, [
    capability,
    filteredPresets,
    handleSliderChange,
    handleSliderCommitted,
    preset,
    isError,
    isLoading,
    marks,
    sliderValue,
  ]);

  return (
    <Paper>
      <Grid container direction="column">
        <Box px={2} pt={1}>
          <Grid item container alignItems="center" spacing={1}>
            <Grid item>{icon}</Grid>
            <Grid item>
              <Typography variant="subtitle1" id={`${capability}-slider-label`}>
                {label}
              </Typography>
            </Grid>
            <Grid item>
              <Fade
                in={isUpdating}
                style={{
                  transitionDelay: isUpdating ? '500ms' : '0ms',
                }}
                unmountOnExit
              >
                <CircularProgress size={20} color="secondary" />
              </Fade>
            </Grid>
          </Grid>
          {body}
        </Box>
      </Grid>
    </Paper>
  );
};

export default PresetSelectionControl;
