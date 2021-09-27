import React, {FunctionComponent} from "react";
import {Slider, Stack, Typography} from "@material-ui/core";
import {
    Capability,
    useSpeakerTestTriggerTriggerMutation,
    useSpeakerVolumeMutation,
    useSpeakerVolumeStateQuery
} from "../../api";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import {VolumeDown as VolumeDownIcon, VolumeUp as VolumeUpIcon,} from "@material-ui/icons";
import {LoadingButton} from "@material-ui/lab";
import {useCommittingSlider} from "../../hooks/useCommittingSlider";
import CapabilityItem from "./CapabilityItem";

const SpeakerControl: FunctionComponent = () => {
    const {
        data: speakerVolume,
        isFetching: speakerVolumeLoading,
        isError: speakerVolumeError,
    } = useSpeakerVolumeStateQuery();

    const {mutate: changeSpeakerVolume, isLoading: speakerVolumeChanging} = useSpeakerVolumeMutation();
    const {mutate: testSpeaker, isLoading: speakerTesting} = useSpeakerTestTriggerTriggerMutation();

    const [sliderValue, onChange, onCommit] = useCommittingSlider(speakerVolume?.volume || 0, changeSpeakerVolume);

    const speakerVolumeContent = React.useMemo(() => {
        if (speakerVolumeError) {
            return (
                <Typography color="error">
                    Error loading speaker state.
                </Typography>
            );
        }

        return (
            <>
                <Stack spacing={2} direction="row" sx={{mb: 1}} alignItems="center">
                    <VolumeDownIcon/>
                    <Slider min={0} max={100} value={sliderValue}
                        disabled={speakerVolumeLoading}
                        onChange={onChange}
                        onChangeCommitted={onCommit}
                        valueLabelDisplay="auto"/>
                    <VolumeUpIcon/>
                </Stack>
                <LoadingButton loading={speakerTesting} variant="outlined" color="success" onClick={() => {
                    return testSpeaker();
                }}>Test sound volume</LoadingButton>
            </>
        );
    }, [onChange, onCommit, sliderValue, speakerTesting, speakerVolumeError, speakerVolumeLoading, testSpeaker]);


    const loading = speakerVolumeChanging || speakerVolumeLoading || !speakerVolume;
    return (
        <CapabilityItem title={"Speaker"} loading={loading}>
            {speakerVolumeContent}
        </CapabilityItem>
    );
};

const Speaker: FunctionComponent = () => {
    const [speakerVolumeControl, speakerTest] = useCapabilitiesSupported(Capability.SpeakerVolumeControl, Capability.SpeakerTest);
    if (!speakerVolumeControl || !speakerTest) {
        // These only make sense together.
        return null;
    }

    return <SpeakerControl/>;
};

export default Speaker;
