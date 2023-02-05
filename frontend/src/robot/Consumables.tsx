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
import {CircularProgress} from "@mui/material";
import {ButtonListMenuItem} from "../components/list_menu/ButtonListMenuItem";
import {convertSecondsToHumans, getConsumableName} from "../utils";
import {ConsumablesHelp} from "./res/ConsumablesHelp";

const ConsumableButtonListMenuItem: React.FunctionComponent<{
    consumable: ConsumableMeta,
    state?: ConsumableState
}> = ({
    consumable,
    state
}): JSX.Element => {
    const {
        mutate: resetConsumable,
        isLoading: resetConsumableIsExecuting
    } = useConsumableResetMutation();

    let secondaryLabel = "";
    let buttonColor : "warning" | "error" | undefined;
    if (state) {
        secondaryLabel = "Remaining: ";
        secondaryLabel += state.remaining.unit === "minutes" ? convertSecondsToHumans(60 * state.remaining.value, false) : `${state.remaining.value} %`;

        if (state.remaining.value <= 0) {
            buttonColor = "warning";
            secondaryLabel = "Depleted";
        }
    }

    return (
        <ButtonListMenuItem
            primaryLabel={getConsumableName(consumable.type, consumable.subType)}
            secondaryLabel={secondaryLabel}
            buttonLabel="Reset"
            buttonColor={buttonColor}
            confirmationDialog={{
                title: "Reset consumable?",
                body: "Do you really want to reset this consumable?"
            }}
            action={() => {
                resetConsumable(consumable);
            }}
            actionLoading={resetConsumableIsExecuting}
        />
    );
};

const Consumables = (): JSX.Element => {
    const {
        data: consumableProperties,
        isLoading: consumablePropertiesLoading,
    } = useConsumablePropertiesQuery();

    const {
        data: consumablesData,
        isLoading: consumablesDataLoading
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
                (consumablePropertiesLoading || consumablesDataLoading) &&
                <div style={{display: "flex", justifyContent: "center"}}>
                    <CircularProgress/>
                </div>

            }
        </PaperContainer>
    );
};

export default Consumables;
