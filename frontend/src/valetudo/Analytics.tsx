import {Box, Grid2, Typography, useTheme} from "@mui/material";
import React from "react";
import {darkPalette, lightPalette} from "../colors";
import PaperContainer from "../components/PaperContainer";
import DetailPageHeaderRow from "../components/DetailPageHeaderRow";
import {Equalizer as StatisticsIcon} from "@mui/icons-material";

const Venn1 = ({ colors, textColor, subTextColor }: { colors: any, textColor: string, subTextColor: string }) => {
    return (
        <svg viewBox="0 0 400 220" width="100%" height="220" style={{ maxWidth: "400px" }}>
            <circle cx="150" cy="100" r="80" fill={colors.blue} opacity="0.5" />
            <text x="130" y="105" textAnchor="middle" fontSize="16" fill={textColor} fontWeight="500">Developers</text>

            <circle cx="260" cy="100" r="80" fill={colors.yellow} opacity="0.5" />
            <text x="280" y="105" textAnchor="middle" fontSize="16" fill={textColor} fontWeight="500">Users</text>

            <g stroke={subTextColor} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7">
                <path d="M 140 195 L 90 195" />
                <path d="M 100 185 L 90 195 L 100 205" />

                <path d="M 270 195 L 320 195" />
                <path d="M 310 185 L 320 195 L 310 205" />
            </g>

            <text x="205" y="200" textAnchor="middle" fontSize="14" fill={subTextColor}>
                Trend
            </text>
        </svg>
    );
};

const Venn2 = ({ colors, textColor }: { colors: any, textColor: string }) => (
    <svg viewBox="0 0 200 200" width="100%" height="200" style={{ maxWidth: "200px" }}>
        <circle cx="100" cy="100" r="78" fill={colors.green} opacity="0.5" />

        <circle cx="100" cy="100" r="80" fill="none" stroke={colors.blue} strokeWidth="3" strokeDasharray="12 12" opacity="0.8" />

        <circle cx="100" cy="100" r="80" fill="none" stroke={colors.yellow} strokeWidth="3" strokeDasharray="12 12" strokeDashoffset="12" opacity="0.8" />

        <text x="100" y="105" textAnchor="middle" fontSize="16" fill={textColor} fontWeight="500">Cool people</text>
    </svg>
);


const LineUp = ({ colors, subTextColor }: { colors: any, subTextColor: string }) => (
    <svg viewBox="0 0 300 120" width="100%" height="120" style={{ maxWidth: "300px" }}>
        <polyline points="20,100 80,80 140,60 200,40 260,20" fill="none" stroke={colors.red} strokeWidth="3"/>
        <text x="150" y="110" textAnchor="middle" fontSize="12" fill={subTextColor}>line that goes up</text>
    </svg>
);

export const AnalyticsPage: React.FC = () => {
    const theme = useTheme();
    const isDark = theme.palette.mode === "dark";

    const activePalette = isDark ? darkPalette : lightPalette;
    const textColor = theme.palette.text.primary;
    const subTextColor = theme.palette.text.secondary;

    return (
        <PaperContainer>
            <Grid2 container direction="row">
                <Box style={{width: "100%"}}>
                    <DetailPageHeaderRow
                        title="Analytics"
                        icon={<StatisticsIcon/>}
                    />

                    <Typography variant="body1" sx={{ mt: 2, mb: 1 }}>
                        Software analytics allow teams to build better software and focus their resources on what matters,
                        when the Venn diagram of the team and the target demographic looks somewhat like this:
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                        <Venn1 colors={activePalette} textColor={textColor} subTextColor={subTextColor} />
                    </Box>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                        As a developer, analytics help you to fill in the gap between your own perception and your user&apos;s perception
                        - a gap that widens the further those two circles have drifted apart.
                    </Typography>


                    <Typography variant="body1" sx={{ mt: 6, mb: 1 }}>
                        Here&apos;s the desired state of that visualization for Valetudo:
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "center", my: 2 }}>
                        <Venn2 colors={activePalette} textColor={textColor} />
                    </Box>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                        As you can see, the gap there is zero.<br/>
                        The industry calls this (among other things) &quot;eating your own dog food&quot; - or &quot;dogfooding&quot; for short.<br/>
                        The hackers call this (among other things) &quot;scratching your own itch&quot; - or &quot;spaß am gerät&quot; for short.<br/>
                        <br/>
                        The beauty of that approach is that the &quot;analytics&quot; are collected by developers simply feeling the pain themselves,
                        which neatly bypasses the need to maintain cloud infrastructure to ingest usage metrics.<br/>
                        <br/>
                        Another interesting intuitive takeaway of this visualization is that pulling these circles apart
                        (e.g. by &quot;making things more approachable&quot;, or just plain &quot;growth&quot;) inevitably invites in the need to introduce measures that fill that widening gap.
                    </Typography>


                    <Typography variant="body1" sx={{ mt: 6, mb: 2 }}>
                        Back in the real world, however, analytics are rarely just implemented purely to fill that knowledge and perception gap.
                        Instead, they also often exist to cater to less factual and more emotionally resonant (or financially motivated) desires.
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 2 }}>
                        So for that, here&apos;s the final visualization to complete the trifecta:
                    </Typography>

                    <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
                        <LineUp colors={activePalette} subTextColor={subTextColor} />
                    </Box>
                </Box>
            </Grid2>
        </PaperContainer>
    );
};

export default AnalyticsPage;
