import PaperContainer from "../components/PaperContainer";
import {Box, Divider, Grid, Typography} from "@mui/material";
import {Help as HelpIcon} from "@mui/icons-material";
import React from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import style from "./Help.module.css";
import {HelpText} from "./res/HelpText";

const Help = (): JSX.Element => {
    return (
        <PaperContainer>
            <Grid container direction="row">
                <Box style={{width: "100%"}}>
                    <Grid item container alignItems="center" spacing={1} justifyContent="space-between">
                        <Grid item style={{display:"flex"}}>
                            <Grid item style={{paddingRight: "8px"}}>
                                <HelpIcon/>
                            </Grid>
                            <Grid item>
                                <Typography>General Help</Typography>
                            </Grid>
                        </Grid>
                    </Grid>
                    <Divider sx={{mt: 1}}/>


                    <ReactMarkdown
                        remarkPlugins={[gfm]}
                        rehypePlugins={[rehypeRaw]}
                        className={style.reactMarkDown}
                    >
                        {HelpText}
                    </ReactMarkdown>
                </Box>
            </Grid>
        </PaperContainer>
    );
};

export default Help;
