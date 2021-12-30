import {
    useLocateMutation,
} from "../../../api";
import React from "react";
import {Box, styled} from "@mui/material";
import {ActionButton} from "../../Styled";
import {NotListedLocation} from "@mui/icons-material";

const LocateContainer = styled(Box)(({theme}) => {
    return {
        position: "absolute",
        pointerEvents: "none",
        top: theme.spacing(2),
        right: theme.spacing(2),
    };
});

const LocateAction = (
    props: Record<string, never>
): JSX.Element => {
    const {
        mutate: locate,
        isLoading: locateIsExecuting
    } = useLocateMutation();

    const handleClick = React.useCallback(() => {
        if (locateIsExecuting) {
            return;
        }

        locate();
    }, [locate, locateIsExecuting]);


    return (
        <LocateContainer>
            <ActionButton
                disabled={locateIsExecuting}
                color="inherit"
                size="medium"
                variant="extended"
                onClick={handleClick}
                title="Locate"
            >
                <NotListedLocation/>
            </ActionButton>
        </LocateContainer>
    );
};

export default LocateAction;
