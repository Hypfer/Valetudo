import React, {FunctionComponent} from "react";
import {Button, Slider, Stack, Typography} from "@mui/material";
import {
    Capability,
    useSpeakerTestTriggerTriggerMutation,
    useSpeakerVolumeMutation,
    useSpeakerVolumeStateQuery
} from "../../api";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import {VolumeDown as VolumeDownIcon, VolumeUp as VolumeUpIcon,} from "@mui/icons-material";
import {useCommittingSlider} from "../../hooks/useCommittingSlider";
import {CapabilityItem} from "./CapabilityLayout";

const SpeakerControl: FunctionComponent = () => {
    const {
        data: speakerVolume,
        isFetching: speakerVolumeLoading,
        isError: speakerVolumeError,
    } = useSpeakerVolumeStateQuery();

    const {mutate: changeSpeakerVolume, isPending: speakerVolumeChanging} = useSpeakerVolumeMutation();
    const {mutate: testSpeaker, isPending: speakerTesting} = useSpeakerTestTriggerTriggerMutation();

    const [
        sliderValue,
        onChange,
        onCommit
    ] = useCommittingSlider(speakerVolume?.volume || 0, changeSpeakerVolume, 5_000);

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
                <Button loading={speakerTesting} variant="outlined" color="success" onClick={() => {
                    return testSpeaker();
                }}>Test sound volume</Button>
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
