import React from "react";
import PaperContainer from "../components/PaperContainer";
import {ListMenu} from "../components/list_menu/ListMenu";
import {
    ConsumableMeta,
    ConsumableState,
    useConsumablePropertiesQuery,
    useConsumableResetMutation,
    useConsumableStateQuery
} from "../api";
import {LinearProgress, Skeleton} from "@mui/material";
import {ButtonListMenuItem} from "../components/list_menu/ButtonListMenuItem";
import {convertSecondsToHumans, getConsumableName} from "../utils";
import {ConsumablesHelp} from "./res/ConsumablesHelp";

const ConsumableButtonListMenuItem: React.FunctionComponent<{
    consumable: ConsumableMeta,
    state?: ConsumableState
}> = ({
    consumable,
    state
}): React.ReactElement => {
    const {
        mutate: resetConsumable,
        isPending: resetConsumableIsExecuting
    } = useConsumableResetMutation();

    let secondaryLabel = "";
    let buttonColor : "warning" | "error" | undefined;
    let secondaryLabelElement : React.ReactElement | undefined;

    if (state) {
        secondaryLabel = "Remaining: ";
        secondaryLabel += state.remaining.unit === "minutes" ? convertSecondsToHumans(60 * state.remaining.value, false) : `${state.remaining.value} %`;

        if (state.remaining.value <= 0) {
            buttonColor = "warning";
            secondaryLabel = "Depleted";
        }


        let percentRemaining;

        if (consumable.unit === "percent") {
            percentRemaining = state.remaining.value / 100;
        } else if (consumable.maxValue !== undefined) {
            percentRemaining = state.remaining.value / consumable.maxValue;
        }

        if (percentRemaining !== undefined) {
            percentRemaining = percentRemaining * 100;
            percentRemaining = Math.round(percentRemaining);
            percentRemaining = Math.max(percentRemaining, 0);
            percentRemaining = Math.min(percentRemaining, 100);

            secondaryLabelElement = (
                <>
                    <LinearProgress
                        variant="determinate"
                        value={percentRemaining}
                        style={{marginTop: "0.5rem", marginBottom: "0.5rem"}}
                    />
                    <span>{secondaryLabel}</span>
                </>
            );
        }
    }



    return (
        <ButtonListMenuItem
            primaryLabel={getConsumableName(consumable.type, consumable.subType)}
            secondaryLabel={secondaryLabelElement ?? secondaryLabel}
            buttonLabel="Reset"
            buttonColor={buttonColor}
            confirmationDialog={{
                title: "Reset consumable?",
                body: `Do you really want to reset the ${getConsumableName(consumable.type, consumable.subType)} consumable?`
            }}
            action={() => {
                resetConsumable(consumable);
            }}
            actionLoading={resetConsumableIsExecuting}
        />
    );
};

const Consumables = (): React.ReactElement => {
    const {
        data: consumableProperties,
        isPending: consumablePropertiesPending,
    } = useConsumablePropertiesQuery();

    const {
        data: consumablesData,
        isPending: consumablesDataPending
    } = useConsumableStateQuery();



    const listItems = React.useMemo(() => {
        if (consumableProperties && consumablesData) {
            return consumableProperties.availableConsumables.map((consumable) => {
                return (
                    <ConsumableButtonListMenuItem
                        consumable={consumable}
                        state={consumablesData.find((e) => e.type === consumable.type && e.subType === consumable.subType)}
                        key={`${consumable.type}_${consumable.subType}`
                        }/>
                );
            });
        } else {
            return [];
        }
    }, [consumableProperties, consumablesData]);

    return (
        <PaperContainer>
            <ListMenu
                primaryHeader={"Consumables"}
                secondaryHeader={"Monitor and reset consumable states"}
                listItems={listItems}
                helpText={ConsumablesHelp}
            />
            {
                (consumablePropertiesPending || consumablesDataPending) &&
                <div style={{display: "flex", justifyContent: "center"}}>
                    <Skeleton height={"24rem"} width={"100%"}/>
                </div>

            }
        </PaperContainer>
    );
};

export default Consumables;
