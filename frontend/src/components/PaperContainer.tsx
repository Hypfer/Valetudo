import React from "react";
import {Container, Paper} from "@mui/material";
import styles from "./PaperContainer.module.css";

const PaperContainer = (props: {
    containerStyle?: React.CSSProperties,
    containerSx?: object,
    paperStyle?: React.CSSProperties,
    paperSx?: object,
    paperBoxShadow?: number,
    children?: React.ReactNode
}): React.ReactElement => {
    return (
        <Container
            className={styles.paperContainerContainer}
            style={props.containerStyle}
            sx={props.containerSx}
        >
            <Paper
                className={styles.paperContainerPaper}
                style={props.paperStyle}
                sx={{ boxShadow: props.paperBoxShadow, ...props.paperSx }}
            >
                {props.children}
            </Paper>
        </Container>
    );
};

export default PaperContainer;
