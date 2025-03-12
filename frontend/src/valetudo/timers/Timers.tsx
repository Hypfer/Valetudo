import {
    Fab,
    Grid2,
    IconButton,
    Skeleton,
    Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import React from "react";
import {
    Timer,
    TimerInformation,
    TimerProperties,
    useTimerActionMutation,
    useTimerCreationMutation,
    useTimerDeletionMutation,
    useTimerInfoQuery,
    useTimerModificationMutation,
    useTimerPropertiesQuery,
    ValetudoTimerActionType,
} from "../../api";
import TimerCard from "./TimerCard";
import TimerEditDialog from "./TimerEditDialog";
import { deepCopy } from "../../utils";
import {Help as HelpIcon} from "@mui/icons-material";
import HelpDialog from "../../components/HelpDialog";
import {TimersHelp} from "./res/TimersHelp";
import PaperContainer from "../../components/PaperContainer";
import {convertTimer} from "./TimerUtils";

const timerTemplate: Timer = {
    id: "",
    enabled: true,
    dow: [1, 2, 3, 4, 5],
    hour: 6,
    minute: 0,
    action: {
        type: ValetudoTimerActionType.FULL_CLEANUP,
        params: {},
    },
};

const Timers = (): React.ReactElement => {
    const {
        data: timerData,
        isPending: timerDataPending,
        isError: timerDataError,
    } = useTimerInfoQuery();

    const {
        data: timerPropertiesData,
        isPending: timerPropertiesPending,
        isError: timerPropertiesError,
    } = useTimerPropertiesQuery();

    const { mutate: createTimer } = useTimerCreationMutation();
    const { mutate: modifyTimer } = useTimerModificationMutation();
    const { mutate: deleteTimer } = useTimerDeletionMutation();
    const { mutate: execTimerAction } = useTimerActionMutation();

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
                modifyTimer(convertTimer(timer, new Date().getTimezoneOffset()));
            };
            const onExecNow = () => {
                execTimerAction({timerId: id, timerAction: "execute_now"});
            };

            return (
                <Grid2 key={id}>
                    <TimerCard
                        onDelete={onDelete}
                        onSave={onSave}
                        onExecNow={onExecNow}
                        timerProperties={timerPropertiesData as TimerProperties}
                        timer={timer}
                    />
                </Grid2>
            );
        });
    }, [modifyTimer, deleteTimer, execTimerAction, timerPropertiesData, timerData]);

    const addTimer = React.useCallback(() => {
        if (!timerPropertiesData) {
            return;
        }
        setAddTimerData(deepCopy(timerTemplate));
        setAddTimerDialogOpen(true);
    }, [timerPropertiesData]);

    if (timerDataPending || timerPropertiesPending) {
        return (
            <PaperContainer>
                <Skeleton height={"16rem"}/>
            </PaperContainer>
        );
    }

    if (timerDataError || timerPropertiesError || !timerPropertiesData) {
        return <Typography color="error">Error loading timers</Typography>;
    }

    return (
        <PaperContainer>
            <Grid2 container direction="column">
                <Grid2 sx={{marginLeft: "auto", height: "4rem"}}>
                    <IconButton
                        onClick={() => {
                            return setHelpDialogOpen(true);
                        }}
                        title="Help"
                    >
                        <HelpIcon/>
                    </IconButton>
                </Grid2>
                <Grid2 container spacing={2} sx={{justifyContent: "center"}}>
                    {
                        timerCards && timerCards.length > 0 ?
                            timerCards :
                            <Typography
                                sx={{padding:"1rem", textAlign: "center", marginTop: "10vh", marginBottom: "5vh"}}
                            >
                                You currently don&apos;t have any timers configured in Valetudo.
                            </Typography>
                    }
                </Grid2>
            </Grid2>

            {
                addTimerDialogOpen &&
                <TimerEditDialog
                    timerInLocalTime={addTimerData}
                    timerProperties={timerPropertiesData}
                    onCancel={() => {
                        setAddTimerDialogOpen(false);
                    }}
                    onSave={(timer) => {
                        createTimer(convertTimer(timer, new Date().getTimezoneOffset()));
                        setAddTimerDialogOpen(false);
                    }}
                />
            }

            <Grid2
                container
                style={{
                    marginTop: "2rem"
                }}
            >
                <Grid2
                    style={{
                        marginLeft: "auto"
                    }}
                >
                    <Fab
                        color="primary"
                        aria-label="add"
                        onClick={addTimer}
                        title="Add new timer"
                    >
                        <AddIcon />
                    </Fab>
                </Grid2>
            </Grid2>
            <HelpDialog
                dialogOpen={helpDialogOpen}
                setDialogOpen={(open: boolean) => {
                    setHelpDialogOpen(open);
                }}
                helpText={TimersHelp}
            />
        </PaperContainer>
    );
};

export default Timers;
