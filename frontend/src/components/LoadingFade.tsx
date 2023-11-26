import {CircularProgress, Fade} from "@mui/material";
import React, {FunctionComponent} from "react";

const LoadingFade: FunctionComponent<{ in?: boolean, transitionDelay?: string, size?: number }> = ({
    in: fadeIn = true,
    transitionDelay = "500ms",
    size
}): React.ReactElement => {
    return (
        <Fade
            in={fadeIn}
            style={{
                transitionDelay,
            }}
            unmountOnExit
        >
            <CircularProgress size={size}/>
        </Fade>
    );
};

export default LoadingFade;
