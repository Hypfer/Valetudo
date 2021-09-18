import React, {FunctionComponent} from "react";
import {Refresh as RefreshIcon, Undo as UndoIcon} from "@material-ui/icons";
import {Box, Container, Grid, IconButton, Stack, Typography, useTheme} from "@material-ui/core";
import {Capability, ConsumableId, ConsumableState, useConsumableResetMutation, useConsumableStateQuery} from "../api";
import {convertSecondsToHumans, getConsumableName} from "../utils";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import LoadingFade from "../compontents/LoadingFade";
import ConfirmationDialog from "../compontents/ConfirmationDialog";

const strokeWidth = 2;
const highlightFill = "#ffaa00";

interface ConsumableVisualizerProps {
    consumables: Array<ConsumableState>,
    selectedConsumable: ConsumableId | null
}

const hasConsumable = (consumables: Array<ConsumableState>, type: string, subType?: string) => {
    return Boolean(consumables.find(c => {
        return c.type === type && c.subType === subType;
    }));
};

const useConsumable = (consumables: Array<ConsumableState>, selectedConsumable: ConsumableId | null, type: string, subType?: string): [boolean, boolean] => {
    const selectedType = selectedConsumable?.type;
    const selectedSubType = selectedConsumable?.subType;

    return React.useMemo(() => {
        return [hasConsumable(consumables, type, subType), selectedType === type && selectedSubType === subType];
    }, [consumables, selectedType, selectedSubType, type, subType]);
};

const RestConsumable: FunctionComponent<{ consumable: ConsumableId }> = ({consumable}): JSX.Element => {
    const {mutate: resetConsumable} = useConsumableResetMutation();
    const [dialogOpen, setDialogOpen] = React.useState(false);

    return (
        <>
            <IconButton color="warning" size="small" onClick={() => {
                setDialogOpen(true);
            }}>
                <UndoIcon/>
            </IconButton>
            <ConfirmationDialog title="Reset consumable?" text="Do you really want to reset this consumable?"
                open={dialogOpen} onClose={() => {
                    setDialogOpen(false);
                }} onAccept={() => {
                    resetConsumable(consumable);
                }}/>
        </>
    );
};

const BottomConsumables: FunctionComponent<ConsumableVisualizerProps> = ({
    consumables,
    selectedConsumable
}): JSX.Element => {
    const theme = useTheme();
    const strokeColor = theme.palette.text.primary;
    const bodyColor = theme.palette.mode === "dark" ? "#363636" : "#ccc";

    const [hasMop, highlightMop] = useConsumable(consumables, selectedConsumable, "mop", "main");
    const [hasMainBrush, highlightMainBrush] = useConsumable(consumables, selectedConsumable, "brush", "main");
    const [hasLeftSideBrush, highlightLeftSideBrush] = useConsumable(consumables, selectedConsumable, "brush", "side_left");
    const [hasRightSideBrush, highlightRightSideBrush] = useConsumable(consumables, selectedConsumable, "brush", "side_right");

    const mopFill = hasMop ? (highlightMop ? highlightFill : "#959595") : bodyColor;
    const mainBrushFill = highlightMainBrush ? highlightFill : "#d45500";
    const leftSideBrushFill = highlightLeftSideBrush ? highlightFill : "#808080";
    const rightSideBrushFill = highlightRightSideBrush ? highlightFill : "#808080";

    return (
        <svg viewBox="0 0 512 512" width="100%">
            <g strokeWidth={strokeWidth}>
                <path
                    d="m470.719 325.714c-14.683 0-42.887 0-42.887 0v35.096h-343.67v-35.096s-28.166 0-42.887 0c29.256 90.479 114.324 155.932 214.724 155.932s185.467-65.453 214.723-155.932z"
                    fill={mopFill} stroke={strokeColor}/>
                <path
                    d="m255.995 31.398c-124.593 0-225.598 100.791-225.598 225.122 0 24.142 3.825 47.39 10.874 69.19h42.887v35.096h343.67v-35.096h42.887c7.049-21.8 10.874-45.048 10.874-69.19 0-124.331-101.004-225.122-225.598-225.122z"
                    fill={bodyColor} stroke={strokeColor}/>
                {hasMainBrush && <g fill={mainBrushFill} stroke="#000">
                    <path d="m142.822 251.987h226.346v24.605h-226.346z"/>
                    <path d="m142.822 235.118h226.346v16.873h-226.346z"/>
                    <path d="m142.822 276.592h226.346v16.873h-226.346z"/>
                </g>}
                {hasRightSideBrush &&
                <path d="m192.394 167.584-80.905-36.676-79.709 39.2 72.284-51.582 5.829-88.485 8.626 88.258z"
                    fill={rightSideBrushFill} stroke={strokeColor}/>}
                {hasLeftSideBrush &&
                <path d="m480.255 167.584-80.908-36.676-79.709 39.2 72.284-51.582 5.833-88.485 8.622 88.258z"
                    fill={leftSideBrushFill} stroke={strokeColor}/>}
                <path
                    d="m285.137 77.587c0 7.713-3.07 15.109-8.536 20.563-5.465 5.453-12.877 8.517-20.606 8.517s-15.141-3.064-20.607-8.517c-5.465-5.454-8.535-12.85-8.535-20.563s3.07-15.11 8.535-20.563c5.466-5.454 12.878-8.518 20.607-8.518s15.141 3.064 20.606 8.518c5.466 5.454 8.536 12.85 8.536 20.563z"
                    fill="#777"/>
                <path
                    d="m247.548 53.149s-2.484.083-2.594 9.956c-.11 9.877 2.594 9.96 2.594 9.96h5.314 6.27 5.313s2.484-.083 2.595-9.96c.11-9.877-2.595-9.956-2.595-9.956h-5.313-6.27z"/>
                <path d="m90.691 201.872h37.182v112.309h-37.182z" stroke="#ccc"/>
                <path d="m384.12 201.872h37.183v112.309h-37.183z" stroke="#ccc"/>
            </g>
        </svg>
    );
};

const FrontConsumables: FunctionComponent<ConsumableVisualizerProps> = ({
    consumables,
    selectedConsumable
}): JSX.Element => {
    const theme = useTheme();
    const strokeColor = theme.palette.text.primary;
    const bodyColor = theme.palette.mode === "dark" ? "#363636" : "#ccc";

    const [hasSensor, highlightSensor] = useConsumable(consumables, selectedConsumable, "sensor", "all");
    const sensorFill = highlightSensor ? highlightFill : "#000";

    return (
        <svg height="200" viewBox="0 0 512 200" width="100%">
            <g strokeWidth={strokeWidth}>
                <path
                    d="m201.327 31.759h109.333c3.696 0 6.67 3.008 6.67 6.747v18.088c0 3.738-2.974 6.747-6.67 6.747h-109.333c-3.695 0-6.669-3.008-6.669-6.747v-18.088c0-3.738 2.974-6.747 6.669-6.747z"
                    fill="#c83737" stroke={strokeColor}/>
                <path d="m384.117 107.266h37.183v60.995h-37.183z" stroke={strokeColor}/>
                <path d="m90.688 107.266h37.182v60.995h-37.182z" stroke={strokeColor}/>
                <path d="m30.395 56.171h451.194v88.973h-451.194z" fill={bodyColor} stroke={strokeColor}/>
                {hasSensor && <g stroke={strokeColor} fill={sensorFill}>
                    <path
                        d="m212.266 89.554h87.456c3.263 0 5.887 2.259 5.887 5.064v12.079c0 2.805-2.624 5.064-5.887 5.064h-87.456c-3.263 0-5.887-2.259-5.887-5.064v-12.079c0-2.805 2.624-5.064 5.887-5.064z"/>
                    <path
                        d="m45.469 126.192v-51.064c0-1.906 1.74-3.439 3.897-3.439h9.29c2.157 0 3.897 1.533 3.897 3.439v51.065c0 1.905-1.74 3.438-3.897 3.438h-9.29c-2.157 0-3.897-1.533-3.897-3.438z"/>
                    <path
                        d="m449.435 126.192v-51.064c0-1.906 1.736-3.439 3.893-3.439h9.294c2.157 0 3.897 1.533 3.897 3.439v51.065c0 1.905-1.74 3.438-3.897 3.438h-9.294c-2.157 0-3.893-1.533-3.893-3.438z"/>
                </g>}
            </g>
        </svg>
    );
};

const DustbinConsumables: FunctionComponent<ConsumableVisualizerProps> = ({
    consumables,
    selectedConsumable
}): JSX.Element => {
    const theme = useTheme();
    const strokeColor = theme.palette.text.primary;

    const [hasMainFilter, highlightMainFilter] = useConsumable(consumables, selectedConsumable, "filter", "main");
    const mainFilterOpacity = highlightMainFilter ? 1.0 : 0.0;

    return (
        <svg viewBox="0 0 512 360" width="100%">
            <g stroke={strokeColor} strokeLinejoin="round" strokeWidth={strokeWidth}>
                <g fill="none">
                    <path
                        d="m481.481 195.862c-36.997-8.259-73.994-16.515-110.991-24.774-88.761 44.54-177.522 89.08-266.283 133.62"/>
                    <path d="m370.49 171.088c-24.563-46.856-49.126-93.712-73.689-140.569"/>
                    <path
                        d="m219.304 219.169c75.847-38.06 151.693-76.119 227.54-114.179v70.247c-75.847 38.059-151.693 76.119-227.54 114.179v-32.91z"/>
                    <path
                        d="m481.481 71.739c-61.56-13.739-123.12-27.48-184.68-41.22-88.76 44.54-177.521 89.08-266.282 133.619 24.563 46.857 49.126 93.713 73.688 140.57 36.998 8.257 73.995 16.516 110.992 24.773 88.761-44.54 177.521-89.08 266.282-133.619 0-41.374 0-82.749 0-124.123z"/>
                    <path d="m219.304 289.416 15.266 2.331v-69.171l227.54-114.179-15.266-3.407"/>
                    <path d="m234.57 222.576c-5.089-1.136-10.177-2.272-15.266-3.407"/>
                    <path d="m215.199 329.481c0-41.374 0-82.748 0-124.122"/>
                    <path d="m481.481 71.739-266.282 133.62-184.68-41.221"/>
                    <path d="m462.11 108.397v70.734"/>
                    <path d="m446.844 175.237 15.266 3.894s-152.017 74.718-227.54 112.615"/>
                    <path
                        d="m259.474 157.049c-5.265-10.042-10.53-20.085-15.794-30.127-34.048 17.085-68.096 34.17-102.145 51.255 5.265 10.043 10.529 20.086 15.794 30.128 34.048-17.085 68.096-34.17 102.145-51.256z"/>
                </g>
                {hasMainFilter && <path d="m234.57 222.576 227.54-114.179v70.734l-227.54 112.616z" fill={highlightFill}
                    fillOpacity={mainFilterOpacity}/>}
            </g>
        </svg>
    );
};

const Consumables = (): JSX.Element => {
    const [consumablesSupported] = useCapabilitiesSupported(Capability.ConsumableMonitoring);

    const {
        data: consumablesData,
        isLoading: consumablesLoading,
        isError: consumablesError,
        refetch: consumablesRefetch,
    } = useConsumableStateQuery();

    const [selectedConsumable, setSelectedConsumable] = React.useState<null | ConsumableId>(null);

    const consumables = React.useMemo(() => {
        if (consumablesLoading) {
            return (
                <LoadingFade/>
            );
        }

        if (!consumablesSupported) {
            return <Typography color="error">This robot does not support consumables.</Typography>;
        }

        if (consumablesError || !consumablesData) {
            return <Typography color="error">Error loading consumables</Typography>;
        }

        const consumablesItems: Array<[header: string, body: string, depleted: boolean, consumable: ConsumableId]> =
            consumablesData.map((c) => {
                const name = getConsumableName(c.type, c.subType);
                const remaining = c.remaining.unit === "minutes" ?
                    convertSecondsToHumans(60 * c.remaining.value, false) :
                    `${c.remaining.value} %`;
                return [name, remaining, c.remaining.value === 0, {
                    type: c.type,
                    subType: c.subType,
                }];
            });

        return (
            <>
                <Grid container spacing={4} sx={{mb: 2}}>
                    {consumablesItems.map(([header, body, depleted, consumable]) => {
                        return (
                            <Grid item key={header} onMouseOver={() => {
                                setSelectedConsumable(consumable);
                            }} onMouseOut={() => {
                                setSelectedConsumable(null);
                            }}>
                                <Stack direction="row" alignItems="flex-end">
                                    <Box>
                                        <Typography variant="caption" color="textSecondary">
                                            {header}
                                        </Typography>
                                        <Typography variant="body2"
                                            color={depleted ? "error" : "textPrimary"}>
                                            {body}
                                        </Typography>
                                    </Box>
                                    <RestConsumable consumable={consumable}/>
                                </Stack>
                            </Grid>
                        );
                    })}
                    <Grid item>
                        <IconButton
                            onClick={() => {
                                return consumablesRefetch();
                            }}
                        >
                            <RefreshIcon/>
                        </IconButton>
                    </Grid>
                </Grid>
                <Grid container
                    alignItems={"flex-start"}
                    columnSpacing={1}
                    rowSpacing={2}
                    columns={{xs: 4, sm: 12, md: 12}}
                    sx={{mb: 2}}>
                    <Grid item xs={4} sm={6} md={4}>
                        <Typography variant="caption">
                            Bottom
                        </Typography>
                        <BottomConsumables selectedConsumable={selectedConsumable} consumables={consumablesData}/>
                    </Grid>
                    <Grid item xs={4} sm={6} md={4}>
                        <Typography variant="caption">
                            Front
                        </Typography>
                        <FrontConsumables selectedConsumable={selectedConsumable} consumables={consumablesData}/>
                    </Grid>
                    <Grid item xs={4} sm={6} md={4}>
                        <Typography variant="caption">
                            Dustbin
                        </Typography>
                        <DustbinConsumables selectedConsumable={selectedConsumable} consumables={consumablesData}/>
                    </Grid>
                </Grid>
            </>
        );
    }, [consumablesSupported, consumablesData, consumablesLoading, consumablesError, consumablesRefetch, selectedConsumable]);

    return (
        <Container>
            {consumables}
        </Container>
    );
};

export default Consumables;
