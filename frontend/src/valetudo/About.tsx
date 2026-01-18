import PaperContainer from "../components/PaperContainer";
import {Box, Grid2} from "@mui/material";
import {Info as AboutIcon} from "@mui/icons-material";
import React from "react";
import ReactMarkdown from "react-markdown";
import gfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import style from "./About.module.css";
import {AboutText} from "./res/AboutText";
import Logo from "../assets/icons/valetudo_logo_with_name.svg?react";
import DetailPageHeaderRow from "../components/DetailPageHeaderRow";

const About = (): React.ReactElement => {
    return (
        <PaperContainer>
            <Grid2 container direction="row">
                <Box style={{width: "100%"}}>
                    <DetailPageHeaderRow
                        title="About Valetudo"
                        icon={<AboutIcon/>}
                    />

                    <Grid2
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
                    </Grid2>

                    <div className={style.reactMarkDown}>
                        <ReactMarkdown
                            remarkPlugins={[gfm]}
                            rehypePlugins={[rehypeRaw]}
                        >
                            {AboutText}
                        </ReactMarkdown>
                    </div>
                </Box>
            </Grid2>
        </PaperContainer>
    );
};

export default About;
