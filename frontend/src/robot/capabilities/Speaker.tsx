import React, {FunctionComponent} from "react";
import {Card, CardContent, Divider, Slider, Stack, Typography} from "@material-ui/core";
import {
    Capability,
    useSpeakerTestTriggerTriggerMutation,
    useSpeakerVolumeMutation,
    useSpeakerVolumeStateQuery
} from "../../api";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import LoadingFade from "../../components/LoadingFade";
import {VolumeDown as VolumeDownIcon, VolumeUp as VolumeUpIcon,} from "@material-ui/icons";
import {LoadingButton} from "@material-ui/lab";

const Speaker: FunctionComponent = () => {
    const [speakerVolumeControl, speakerTest] = useCapabilitiesSupported(Capability.SpeakerVolumeControl, Capability.SpeakerTest);
    const [sliderValue, setSliderValue] = React.useState<number | null>(null);

    const {
        data: speakerVolume,
        isFetching: speakerVolumeLoading,
        isError: speakerVolumeError,
    } = useSpeakerVolumeStateQuery();

    const {mutate: changeSpeakerVolume, isLoading: speakerVolumeChanging} = useSpeakerVolumeMutation();
    const {mutate: testSpeaker, isLoading: speakerTesting} = useSpeakerTestTriggerTriggerMutation();

    React.useEffect(() => {
        if (speakerVolume && sliderValue === null) {
            setSliderValue(speakerVolume.volume);
        }
    }, [speakerVolume, sliderValue]);

    const handleSliderChange = React.useCallback(
        (_event: unknown, value: number | number[]) => {
            if (typeof value !== "number") {
                return;
            }

            setSliderValue(value);
        },
        []
    );
    const handleSliderCommitted = React.useCallback(
        (_event: unknown, value: number | number[]) => {
            if (typeof value !== "number") {
                return;
            }
            setSliderValue(value);
            changeSpeakerVolume(value);
        },
        [changeSpeakerVolume]
    );

    if (!speakerVolumeControl || !speakerTest) {
        // These only make sense together.
        return null;
    }

    if (speakerVolumeError) {
        return (
            <Typography color="error">
                Error loading speaker state.
            </Typography>
        );
    }

    const disabled = speakerVolumeChanging || speakerVolumeLoading || !speakerVolume;

    return (
        <Card>
            <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="h6" gutterBottom>
                        Speaker
                    </Typography>
                    <LoadingFade in={disabled} size={20}/>
                </Stack>
                <Divider/>
                <Stack spacing={2} direction="row" sx={{mb: 1}} alignItems="center">
                    <VolumeDownIcon/>
                    <Slider min={0} max={100} value={sliderValue ?? 0} disabled={speakerVolumeLoading}
                        onChange={handleSliderChange}
                        onChangeCommitted={handleSliderCommitted}
                        valueLabelDisplay="auto"/>
                    <VolumeUpIcon/>
                </Stack>
                <LoadingButton loading={speakerTesting} variant="outlined" color="success" onClick={() => {
                    return testSpeaker();
                }}>Test sound volume</LoadingButton>
            </CardContent>
        </Card>
    );
};

export default Speaker;
