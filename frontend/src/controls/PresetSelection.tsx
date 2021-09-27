import {
    Box,
    CircularProgress,
    Grid,
    Mark,
    Paper,
    Slider,
    sliderClasses,
    styled,
    Typography,
} from "@mui/material";
import React from "react";
import {
    Capability,
    capabilityToPresetType,
    PresetSelectionState,
    RobotAttributeClass,
    usePresetSelectionMutation,
    usePresetSelectionsQuery,
    useRobotAttributeQuery,
} from "../api";
import LoadingFade from "../components/LoadingFade";
import {useCommittingSlider} from "../hooks/useCommittingSlider";

const DiscreteSlider = styled(Slider)(({ theme }) => {
    return {
        [`& .${sliderClasses.track}`]: {
            height: 2,
        },
        [`& .${sliderClasses.rail}`]: {
            opacity: 0.5,
            color: theme.palette.grey[400],
        },
        [`& .${sliderClasses.mark}`]: {
            color: theme.palette.grey[600],
            height: 8,
            width: 1,
            margintop: -3,
        },
        [`& .${sliderClasses.markActive}`]: {
            opacity: 1,
            backgroundColor: "currentcolor",
        },
    };
});

const order = ["off", "min", "low", "medium", "high", "max", "turbo"];
const sortPresets = (presets: PresetSelectionState["value"][]) => {
    return [...presets].sort((a, b) => {
        return order.indexOf(a) - order.indexOf(b);
    });
};

export interface PresetSelectionProps {
    capability: Capability.FanSpeedControl | Capability.WaterUsageControl;
    label: string;
    icon: JSX.Element;
}

const PresetSelectionControl = (props: PresetSelectionProps): JSX.Element => {
    const { capability, label, icon } = props;
    const { data: preset } = useRobotAttributeQuery(
        RobotAttributeClass.PresetSelectionState,
        (attributes) => {
            return attributes.filter((attribute) => {
                return attribute.type === capabilityToPresetType[capability];
            })[0];
        }
    );
    const {
        isLoading: presetsLoading,
        isError: presetLoadError,
        data: presets,
    } = usePresetSelectionsQuery(capability);

    const {
        mutate: selectPreset,
        isLoading: selectPresetIsLoading
    } = usePresetSelectionMutation(capability);

    const filteredPresets = React.useMemo(() => {
        return sortPresets(
            presets?.filter(
                (x): x is Exclude<PresetSelectionState["value"], "custom"> => {
                    return x !== "custom";
                }
            ) ?? []
        );
    }, [presets]);

    const presetSliderValue = filteredPresets.indexOf(preset?.value || filteredPresets[0]);
    const [sliderValue, onChange, onCommit] = useCommittingSlider(presetSliderValue !== -1 ? presetSliderValue : 0, (value) => {
        const level = filteredPresets[value];
        if (level !== preset?.value) {
            selectPreset(level);
        }
    });

    const marks = React.useMemo<Mark[]>(() => {
        return filteredPresets.map((preset, index) => {
            return {
                value: index,
                label: preset,
            };
        });
    }, [filteredPresets]);

    const body = React.useMemo(() => {
        if (presetsLoading) {
            return (
                <Grid item>
                    <CircularProgress size={20} />
                </Grid>
            );
        }

        if (presetLoadError || preset === undefined) {
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
                        onChange={onChange}
                        onChangeCommitted={onCommit}
                        min={0}
                        max={marks.length - 1}
                        marks={marks}
                    />
                </Box>
            </Grid>
        );
    }, [
        capability,
        onChange,
        onCommit,
        preset,
        presetLoadError,
        presetsLoading,
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
                            <LoadingFade in={selectPresetIsLoading}
                                transitionDelay={selectPresetIsLoading ? "500ms" : "0ms"}
                                size={20}/>
                        </Grid>
                    </Grid>
                    {body}
                </Box>
            </Grid>
        </Paper>
    );
};

export default PresetSelectionControl;
