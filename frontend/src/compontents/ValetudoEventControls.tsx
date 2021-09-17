import React, {FunctionComponent} from "react";
import {ValetudoEvent, ValetudoEventInteraction} from "../api";
import {Button, ButtonGroup, styled, Typography} from "@material-ui/core";

export interface ValetudoEventRenderProps {
    event: ValetudoEvent;

    interact(interaction: ValetudoEventInteraction): void;
}

const EventRow = styled("div")({
    flex: "1",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    overflow: "auto",
    marginTop: 2,
    marginBottom: 2,
});

const consumableTypeMapping: Record<string, string> = {
    "brush": "Brush",
    "filter": "Filter",
    "sensor": "Sensor cleaning",
    "mop": "Mop"
};

const consumableSubtypeMapping: Record<string, string> = {
    "main": "Main",
    "side_right": "Right",
    "side_left": "Left",
    "all": "",
    "none": ""
};

const getConsumableName = (type: string, subType: string) => {
    let ret = "";
    if (subType in consumableSubtypeMapping) {
        ret += consumableSubtypeMapping[subType] + " ";
    }
    if (type in consumableTypeMapping) {
        ret += consumableTypeMapping[type];
    }
    return ret.trim() || "Unknown consumable: " + type + ", " + subType;
};

const ConsumableDepletedEventControl: FunctionComponent<ValetudoEventRenderProps> =
    ({event, interact}) => {
        const color = event.processed ? "textSecondary" : "textPrimary";
        const textStyle = event.processed ? {textDecoration: "line-through"} : {};

        if (!event.type || !event.subType) {
            return (
                <Typography color={"error"}>
                    Consumable without type/subType depleted
                </Typography>
            );
        }

        return (
            <EventRow>
                <Typography color={color} style={textStyle} sx={{mr: 1}}>
                    The consumable <em>{getConsumableName(event.type, event.subType)}</em> is depleted
                </Typography>
                <Button
                    size="small"
                    variant={"contained"}
                    disabled={event.processed}
                    onClick={() => {
                        interact({
                            interaction: "reset"
                        });
                    }}
                    color="warning"
                >
                    Reset
                </Button>
            </EventRow>
        );
    };

const ErrorEventControl: FunctionComponent<ValetudoEventRenderProps> =
    ({event, interact}) => {
        const color = event.processed ? "textSecondary" : "error";
        const textStyle = event.processed ? {textDecoration: "line-through"} : {};

        return (
            <EventRow>
                <Typography color={color} style={textStyle} sx={{mr: 1}}>
                    An error occurred: {event.message || "Unknown error"}
                </Typography>
                <Button
                    size="small"
                    variant={"contained"}
                    disabled={event.processed}
                    onClick={() => {
                        interact({
                            interaction: "ok"
                        });
                    }}
                    color="error"
                >
                    Dismiss
                </Button>
            </EventRow>
        );
    };

const PendingMapChangeEventControl: FunctionComponent<ValetudoEventRenderProps> =
    ({event, interact}) => {
        const color = event.processed ? "textSecondary" : "textPrimary";
        const textStyle = event.processed ? {textDecoration: "line-through"} : {};

        return (
            <EventRow>
                <Typography color={color} style={textStyle} sx={{mr: 1}}>
                    A map change is pending. Do you want to accept the new map?
                </Typography>
                <ButtonGroup size="small" variant="contained">
                    <Button
                        disabled={event.processed}
                        onClick={() => {
                            interact({
                                interaction: "yes"
                            });
                        }}
                        color="success"
                    >
                        Yes
                    </Button>
                    <Button
                        disabled={event.processed}
                        onClick={() => {
                            interact({
                                interaction: "no"
                            });
                        }}
                        color="error"
                    >
                        No
                    </Button>
                </ButtonGroup>
            </EventRow>
        );
    };

const DustBinFullEventControl: FunctionComponent<ValetudoEventRenderProps> =
    ({event, interact}) => {
        const color = event.processed ? "textSecondary" : "textPrimary";
        const textStyle = event.processed ? {textDecoration: "line-through"} : {};

        return (
            <EventRow>
                <Typography color={color} style={textStyle} sx={{mr: 1}}>
                    The dust bin is full. Please empty it.
                </Typography>
                <Button
                    size="small"
                    variant={"contained"}
                    disabled={event.processed}
                    onClick={() => {
                        interact({
                            interaction: "ok"
                        });
                    }}
                    color="info"
                >
                    Dismiss
                </Button>
            </EventRow>
        );
    };

const UnknownEventControl: FunctionComponent<ValetudoEventRenderProps> =
    ({event}) => {
        return (
            <Typography color={"error"}>
                Unknown event type: ${event.__class}
            </Typography>
        );
    };

export const eventControls: Record<string, React.ComponentType<ValetudoEventRenderProps>> = {
    ConsumableDepletedValetudoEvent: ConsumableDepletedEventControl,
    ErrorStateValetudoEvent: ErrorEventControl,
    PendingMapChangeValetudoEvent: PendingMapChangeEventControl,
    DustBinFullValetudoEvent: DustBinFullEventControl,
    Default: UnknownEventControl,
};
