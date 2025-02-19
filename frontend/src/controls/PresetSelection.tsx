import {
    Box,
    Grid2,
    Icon,
    Paper,
    Skeleton,
    Slider,
    sliderClasses,
    styled,
    Typography,
} from "@mui/material";
import {Mark} from "@mui/base";
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
import {ExpandLess as CloseIcon, ExpandMore as OpenIcon} from "@mui/icons-material";
import LoadingFade from "../components/LoadingFade";
import {useCommittingSlider} from "../hooks/useCommittingSlider";
import {getPresetIconOrLabel, presetFriendlyNames, sortPresets} from "../presetUtils";

const StyledIcon = styled(Icon)(({theme}) => {
    return {
    };
});

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

export interface PresetSelectionProps {
    capability: Capability.FanSpeedControl | Capability.WaterUsageControl | Capability.OperationModeControl;
    label: string;
    icon: React.ReactElement;
}

const PresetSelectionControl = (props: PresetSelectionProps): React.ReactElement => {
    const [presetSelectionSliderOpen, setPresetSelectionSliderOpen] = React.useState(false);

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
        isPending: presetsPending,
        isError: presetLoadError,
        data: presets,
    } = usePresetSelectionsQuery(capability);

    const {
        mutate: selectPreset,
        isPending: selectPresetIsPending
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
    const [
        sliderValue,
        onChange,
        onCommit,
        sliderPending
    ] = useCommittingSlider(
        presetSliderValue !== -1 ? presetSliderValue : 0,
        (value) => {
            const level = filteredPresets[value];
            if (level !== preset?.value) {
                selectPreset(level);
            }
        },
        5_000
    );

    const marks = React.useMemo<Mark[]>(() => {
        return filteredPresets.map((preset, index) => {
            return {
                value: index,
                label: getPresetIconOrLabel(props.capability, preset, {height: "20px", width: "auto"})
            };
        });
    }, [filteredPresets, props.capability]);

    const pending = selectPresetIsPending || sliderPending;

    const body = React.useMemo(() => {
        if (presetsPending) {
            return (
                <Grid2>
                    <Skeleton height={"3rem"} />
                </Grid2>
            );
        }

        if (presetLoadError || preset === undefined) {
            return (
                <Grid2>
                    <Typography color="error">Error loading {capability}</Typography>
                </Grid2>
            );
        }

        return (
            <Box px={2.5}>
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
                    track={capability !== Capability.OperationModeControl ? "normal" : false}
                />
            </Box>
        );
    }, [
        capability,
        onChange,
        onCommit,
        preset,
        presetLoadError,
        presetsPending,
        marks,
        sliderValue,
    ]);

    return (
        <Grid2>
            <Paper sx={{minHeight: "2.5em"}}>
                <Grid2 container direction="column">
                    <Box px={1.5} pt={1}>
                        <Grid2
                            container
                            alignItems="center"
                            spacing={1}
                            onClick={() => {
                                setPresetSelectionSliderOpen(!presetSelectionSliderOpen);
                            }}
                            style={{cursor: "pointer"}}
                        >
                            <Grid2>{icon}</Grid2>
                            <Grid2 sx={{marginTop: "-8px" /* ugh */}}>
                                <Typography variant="subtitle1" id={`${capability}-slider-label`}>
                                    {label}
                                </Typography>
                            </Grid2>
                            <Grid2>
                                <LoadingFade in={pending}
                                    transitionDelay={pending ? "500ms" : "0ms"}
                                    size={20}/>
                            </Grid2>
                            <Grid2
                                sx={{
                                    marginLeft: "auto"
                                }}
                            >
                                <Grid2 container>
                                    {
                                        !pending &&
                                        <Grid2 sx={{marginTop: "-2px" /* ugh */}}>
                                            <Typography variant="subtitle1" sx={{paddingRight: "8px"}}>
                                                {preset?.value ? presetFriendlyNames[preset.value] : ""}
                                            </Typography>
                                        </Grid2>
                                    }

                                    <Grid2
                                        sx={{
                                            marginLeft: "auto"
                                        }}
                                    >
                                        <StyledIcon as={presetSelectionSliderOpen ? CloseIcon : OpenIcon}/>
                                    </Grid2>

                                </Grid2>
                            </Grid2>
                        </Grid2>
                        <Grid2 sx={{
                            display: presetSelectionSliderOpen ? "inherit" : "none",
                            minHeight: "3.75rem"
                        }}>
                            {body}
                        </Grid2>
                    </Box>
                </Grid2>
            </Paper>
        </Grid2>
    );
};

export default PresetSelectionControl;
