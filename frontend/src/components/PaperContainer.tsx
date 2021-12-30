import React from "react";
import {Container, Paper} from "@mui/material";
import styles from "./PaperContainer.module.css";

const PaperContainer = (props: {
    containerStyle?: React.CSSProperties,
    paperStyle?: React.CSSProperties,
    paperBoxShadow?: number,
    children?: React.ReactNode
}): JSX.Element => {
    return (
        <Container
            className={styles.paperContainerContainer}
            style={props.containerStyle}
        >
            <Paper
                className={styles.paperContainerPaper}
                style={props.paperStyle}
                sx={{ boxShadow: props.paperBoxShadow }}
            >
                {props.children}
            </Paper>
        </Container>
    );
};

export default PaperContainer;
