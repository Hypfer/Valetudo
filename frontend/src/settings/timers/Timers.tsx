import {
    Box,
    Container,
    Fab,
    Grid,
    styled,
    Typography,
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
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
            <Grid container spacing={2}>
                {timerCards}
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
        </Container>
    );
};

export default Timers;
