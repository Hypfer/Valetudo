import React, {FunctionComponent} from "react";
import {Collapse, LinearProgress, TextField, Typography} from "@material-ui/core";
import {
    Capability,
    useVoicePackManagementMutation,
    useVoicePackManagementStateQuery,
    VoicePackManagementCommand
} from "../../api";
import {useCapabilitiesSupported} from "../../CapabilitiesProvider";
import {LoadingButton} from "@material-ui/lab";
import CapabilityItem from "./CapabilityItem";

const VoicePackControl: FunctionComponent = () => {
    const {
        data: voicePack,
        isFetching: voicePackFetching,
        isError: voicePackError,
        refetch: voicePackRefetch,
    } = useVoicePackManagementStateQuery();

    const [url, setUrl] = React.useState("");
    const [languageCode, setLanguageCode] = React.useState("");
    const [hash, setHash] = React.useState("");

    const {mutate: sendVoicePackCommand, isLoading: voicePackMutating} = useVoicePackManagementMutation();

    const intervalRef = React.useRef<any>();
    React.useEffect(() => {
        const operationType = voicePack?.operationStatus.type;
        if (operationType === "downloading" || operationType === "installing") {
            intervalRef.current = setInterval(() => {
                return voicePackRefetch();
            }, 1000);
            return () => {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
            };
        }
    }, [voicePack, voicePackRefetch]);

    const voicePackContent = React.useMemo(() => {
        if (voicePackError) {
            return (
                <Typography color="error">
                    Error loading voice pack management state.
                </Typography>
            );
        }

        const statusType = voicePack?.operationStatus.type;
        const isError = statusType === "error";
        const isDownloading = statusType === "downloading";
        const isInstalling = statusType === "installing";
        const isWorking = isDownloading || isInstalling;
        const commandDisabled = !voicePack || isDownloading || isInstalling;
        const progressValue = voicePack?.operationStatus.progress;
        const progressVariant = progressValue ? "determinate" : "indeterminate";

        return (
            <>
                <Typography variant="body1" sx={{mb: 1}}>
                    Current language: {voicePack?.currentLanguage}
                </Typography>
                {isError && (
                    <Typography color="error">
                        Error installing voice pack. Check the log for details.
                    </Typography>
                )}
                <Collapse in={isWorking}>
                    <Typography variant="subtitle1">
                        {isDownloading ? "Downloading..." : "Installing..."}
                    </Typography>
                    <LinearProgress color={isDownloading ? "success" : "secondary"} variant={progressVariant} value={progressValue} sx={{mb: 1}}/>
                </Collapse>

                <TextField label="URL" value={url} onChange={(e) => {
                    setUrl(e.target.value);
                }} variant="standard" placeholder="https://" disabled={commandDisabled} fullWidth sx={{mb: 0.3}}/>
                <TextField label="Language code" value={languageCode} onChange={(e) => {
                    setLanguageCode(e.target.value);
                }} variant="standard" placeholder="VA" disabled={commandDisabled} fullWidth sx={{mb: 0.3}}/>
                <TextField label="Hash" value={hash} onChange={(e) => {
                    setHash(e.target.value);
                }} variant="standard" disabled={commandDisabled} fullWidth sx={{mb: 1}}/>

                <LoadingButton loading={voicePackMutating || commandDisabled}
                    loadingPosition="center"
                    variant="outlined"
                    onClick={() => {
                        const command: VoicePackManagementCommand = {
                            action: "download",
                            url: url,
                            hash: hash,
                            language: languageCode
                        };
                        sendVoicePackCommand(command);
                    }}>
                    Set voice pack
                </LoadingButton>
            </>
        );
    }, [sendVoicePackCommand, voicePack, voicePackError, voicePackMutating, hash, languageCode, url]);

    const loading = voicePackFetching || voicePackMutating || !voicePack;
    return (
        <CapabilityItem title="Voice pack management" loading={loading}>
            {voicePackContent}
        </CapabilityItem>
    );
};

const VoicePackManagement: FunctionComponent = () => {
    const [voicePackManagement] = useCapabilitiesSupported(Capability.VoicePackManagement);
    if (!voicePackManagement) {
        return null;
    }

    return <VoicePackControl/>;
};

export default VoicePackManagement;
