import PaperContainer from "../components/PaperContainer";
import {Box, Divider, Grid, Typography} from "@mui/material";
import {Info as AboutIcon} from "@mui/icons-material";
import React from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import style from "./About.module.css";
import {AboutText} from "./res/AboutText";
import {ReactComponent as Logo} from "../assets/icons/valetudo_logo_with_name.svg";

const About = (): JSX.Element => {
    return (
        <PaperContainer>
            <Grid container direction="row">
                <Box style={{width: "100%"}}>
                    <Grid item container alignItems="center" spacing={1} justifyContent="space-between">
                        <Grid item style={{display:"flex"}}>
                            <Grid item style={{paddingRight: "8px"}}>
                                <AboutIcon/>
                            </Grid>
                            <Grid item>
                                <Typography>About</Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Divider sx={{mt: 1}}/>
                    <Grid
                        item
                        style={{
                            padding: "1rem",
                            width: "80%",
                            marginLeft: "auto",
                            marginRight: "auto",
                            marginTop: "1rem",
                            textAlign: "center"
                        }}
                    >
                        <Logo
                            style={{
                                width: "100%"
                            }}
                        />
                    </Grid>

                    <ReactMarkdown
                        remarkPlugins={[gfm]}
                        rehypePlugins={[rehypeRaw]}
                        className={style.reactMarkDown}
                    >
                        {AboutText}
                    </ReactMarkdown>
                </Box>
            </Grid>
        </PaperContainer>
    );
};

export default About;
