import {
    Box,
    Container,
    Fab,
    Grid,
    IconButton,
    styled,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import React from "react";
import {
    Timer,
    TimerInformation,
    TimerProperties,
    useTimerCreationMutation,
    useTimerDeletionMutation,
    useTimerInfoQuery,
    useTimerModificationMutation,
    useTimerPropertiesQuery,
} from "../../api";
import TimerCard from "./TimerCard";
import TimerEditDialog from "./TimerEditDialog";
import { deepCopy } from "../../utils";
import LoadingFade from "../../components/LoadingFade";
import {Help as HelpIcon} from "@mui/icons-material";
import HelpDialog from "../../components/HelpDialog";
import {TimersHelp} from "./res/TimersHelp";

const FabBox = styled(Box)(({ theme }) => {
    return {
        position: "fixed",
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    };
});

const timerTemplate: Timer = {
    id: "",
    enabled: true,
    dow: [1, 2, 3, 4, 5],
    hour: 6,
    minute: 0,
    action: {
        type: "full_cleanup",
        params: {},
    },
};

const Timers = (): JSX.Element => {
    const {
        data: timerData,
        isLoading: timerDataLoading,
        isError: timerDataError,
    } = useTimerInfoQuery();

    const {
        data: timerPropertiesData,
        isLoading: timerPropertiesLoading,
        isError: timerPropertiesError,
    } = useTimerPropertiesQuery();

    const { mutate: createTimer } = useTimerCreationMutation();
    const { mutate: modifyTimer } = useTimerModificationMutation();
    const { mutate: deleteTimer } = useTimerDeletionMutation();

    const [addTimerDialogOpen, setAddTimerDialogOpen] = React.useState(false);
    const [helpDialogOpen, setHelpDialogOpen] = React.useState(false);
    const [addTimerData, setAddTimerData] =
        React.useState<Timer>(timerTemplate);

    const timerCards = React.useMemo(() => {
        if (!timerPropertiesData || !timerData) {
            return null;
        }
        return Object.values(timerData as TimerInformation).map((timer) => {
            const id = timer.id;
            const onDelete = () => {
                deleteTimer(id);
            };
            const onSave = (timer: Timer) => {
                modifyTimer(timer);
            };

            return (
                <Grid item key={id}>
                    <TimerCard
                        onDelete={onDelete}
                        onSave={onSave}
                        timerProperties={timerPropertiesData as TimerProperties}
                        timer={timer}
                    />
                </Grid>
            );
        });
    }, [modifyTimer, deleteTimer, timerPropertiesData, timerData]);

    const addTimer = React.useCallback(() => {
        if (!timerPropertiesData) {
            return;
        }
        setAddTimerData(deepCopy(timerTemplate));
        setAddTimerDialogOpen(true);
    }, [timerPropertiesData]);

    if (timerDataLoading || timerPropertiesLoading) {
        return (
            <LoadingFade/>
        );
    }

    if (timerDataError || timerPropertiesError || !timerPropertiesData) {
        return <Typography color="error">Error loading timers</Typography>;
    }

    return (
        <Container>
            <Grid container>
                <Grid item sx={{marginLeft: "auto", height: "4rem"}}>
                    <IconButton
                        onClick={() => {
                            return setHelpDialogOpen(true);
                        }}
                    >
                        <HelpIcon/>
                    </IconButton>
                </Grid>
                <Grid item container spacing={2} sx={{justifyContent: "center"}}>
                    {
                        timerCards && timerCards.length > 0 ?
                            timerCards :
                            <Typography
                                sx={{padding:"1rem", textAlign: "center", marginTop: "10vh"}}
                            >
                                You currently don&apos;t have any timers configured in Valetudo.
                            </Typography>
                    }
                </Grid>
            </Grid>

            <TimerEditDialog
                timer={addTimerData}
                timerProperties={timerPropertiesData}
                open={addTimerDialogOpen}
                onCancel={() => {
                    setAddTimerDialogOpen(false);
                }}
                onSave={(timer) => {
                    createTimer(timer);
                    setAddTimerDialogOpen(false);
                }}
            />
            <FabBox>
                <Fab color="primary" aria-label="add" onClick={addTimer}>
                    <AddIcon />
                </Fab>
            </FabBox>
            <HelpDialog
                dialogOpen={helpDialogOpen}
                setDialogOpen={(open: boolean) => {
                    setHelpDialogOpen(open);
                }}
                helpText={TimersHelp}
            />
        </Container>
    );
};

export default Timers;
