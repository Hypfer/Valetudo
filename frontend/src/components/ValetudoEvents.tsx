import React from "react";
import {Badge, Button, Divider, IconButton, Popover, Stack, Typography} from "@mui/material";
import {Notifications as NotificationsIcon} from "@mui/icons-material";
import {useValetudoEventsInteraction, useValetudoEventsQuery} from "../api";
import {eventControls} from "./ValetudoEventControls";
import ReloadableCard from "./ReloadableCard";
import styles from "./ValetudoEvents.module.css";

const ValetudoEvents = (): React.ReactElement => {
    const {
        data: eventData,
        isFetching: eventDataFetching,
        isPending: eventDataPending,
        error: eventDataError,
        refetch: eventDataRefetch,
    } = useValetudoEventsQuery();
    const {mutate: interactWithEvent} = useValetudoEventsInteraction();

    const [anchorElement, setAnchorElement] = React.useState<null | HTMLElement>(null);
    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElement(event.currentTarget);
    };
    const handleClose = () => {
        setAnchorElement(null);
    };

    const icon = React.useMemo(() => {
        const icon = <NotificationsIcon/>;
        const unprocessedEventCount = eventData && eventData.length ? eventData.reduce((i, event) => {
            return i + Number(!event.processed);
        }, 0) : 0;

        if (!eventDataPending) {
            if (eventDataError) {
                return (
                    <Badge badgeContent={"!"} color="error">
                        {icon}
                    </Badge>
                );
            } else if (unprocessedEventCount > 0) {
                return (
                    <Badge badgeContent={unprocessedEventCount} color="error">
                        {icon}
                    </Badge>
                );
            }
        }
        return icon;
    }, [eventData, eventDataError, eventDataPending]);

    const popoverContent = React.useMemo(() => {
        const events = eventData && eventData.length ? eventData.map((event, i) => {
            const EventControl = eventControls[event.__class] || eventControls.Default;
            return (
                <React.Fragment key={event.id}>
                    { i > 0 && <Divider/> }
                    <EventControl event={event} interact={(interaction) => {
                        interactWithEvent({
                            id: event.id,
                            interaction: interaction
                        });
                    }}/>
                </React.Fragment>
            );
        }) : (
            <Typography color="textSecondary" variant={"subtitle1"}>
                No events
            </Typography>
        );

        return (
            <ReloadableCard
                divider={false}
                title="Events"
                loading={eventDataFetching}
                onReload={() => {
                    return eventDataRefetch();
                }}
            >
                <Divider style={{marginBottom: "1rem"}}/>
                <div className={styles.eventContainer}>
                    <Stack>
                        {events}
                    </Stack>
                </div>
                <Divider style={{marginTop: "1rem"}}/>
                <Button
                    style={{
                        marginLeft: "auto",
                        display: "flex",
                        marginTop: "0.5rem",
                        marginBottom: "-0.5rem" //eww :(
                    }}
                    onClick={() => {
                        handleClose();
                    }}
                >
                    Close
                </Button>
            </ReloadableCard>
        );
    }, [eventData, eventDataFetching, eventDataRefetch, interactWithEvent]);

    return (
        <>
            <IconButton
                size="large"
                aria-label="Events"
                onClick={handleMenu}
                color="inherit"
                title="Events and Notifications"
            >
                {icon}
            </IconButton>

            <Popover
                open={Boolean(anchorElement)}
                anchorEl={anchorElement}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "right",
                }}
            >
                {popoverContent}
            </Popover>
        </>
    );
};

export default ValetudoEvents;
