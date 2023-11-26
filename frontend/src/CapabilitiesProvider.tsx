import {Backdrop, Button, styled, Typography,} from "@mui/material";
import {SnackbarKey, useSnackbar} from "notistack";
import React from "react";
import {Capability, useCapabilitiesQuery} from "./api";
import ValetudoSplash from "./components/ValetudoSplash";

const StyledBackdrop = styled(Backdrop)(({theme}) => {
    return {
        zIndex: theme.zIndex.drawer + 1,
        color: "#fff",
        display: "flex",
        flexFlow: "column",
    };
});

const Context = React.createContext<Capability[]>([]);

const CapabilitiesProvider = (props: {
    children: React.ReactElement;
}): React.ReactElement => {
    const {children} = props;
    const {
        isError: capabilitiesLoadError,
        isPending: capabilitiesPending,
        data: capabilities,
        refetch: refetchCapabilities
    } = useCapabilitiesQuery();
    const {enqueueSnackbar, closeSnackbar} = useSnackbar();
    const snackbarKey = React.useRef<SnackbarKey>();

    React.useEffect(() => {
        if (capabilitiesLoadError || snackbarKey.current === undefined) {
            return;
        }

        closeSnackbar(snackbarKey.current);
    }, [closeSnackbar, capabilitiesLoadError]);

    React.useEffect(() => {
        if (!capabilitiesLoadError) {
            return;
        }

        const SnackbarAction = () => {
            return (
                <Button
                    onClick={() => {
                        refetchCapabilities({throwOnError: true}).then(() => {
                            return enqueueSnackbar("Successfully loaded capabilities!", {
                                variant: "success",
                            });
                        }
                        );
                    }}
                >
                Retry
                </Button>
            );
        };

        if (snackbarKey.current) {
            closeSnackbar(snackbarKey.current);
        }

        snackbarKey.current = enqueueSnackbar("Error while loading capabilities", {
            variant: "error",
            action: SnackbarAction,
            persist: true,
        });
    }, [closeSnackbar, enqueueSnackbar, capabilitiesLoadError, refetchCapabilities]);

    return (
        <Context.Provider value={capabilities ?? []}>
            <StyledBackdrop
                open={capabilitiesPending}
                style={{
                    transitionDelay: capabilitiesPending ? "800ms" : "0ms",
                }}
                unmountOnExit
            >
                <ValetudoSplash/>
                <Typography variant="caption">Loading capabilities...</Typography>
            </StyledBackdrop>
            {
                capabilities &&
                children
            }
        </Context.Provider>
    );
};

export const useCapabilitiesSupported = (
    ...capabilities: Capability[]
): boolean[] => {
    const supportedCapabilities = React.useContext(Context);

    return capabilities.map((capability) => {
        return supportedCapabilities.includes(capability);
    }
    );
};

export default CapabilitiesProvider;
