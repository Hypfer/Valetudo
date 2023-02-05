import React from "react";
import {
    RestartAlt as ConfigRestoreIcon,
    SystemUpdateAlt as UpdaterIcon,
    Badge as FriendlyNameIcon,
} from "@mui/icons-material";
import {ListMenu} from "../components/list_menu/ListMenu";
import PaperContainer from "../components/PaperContainer";
import {
    UpdaterConfiguration,
    useRestoreDefaultConfigurationMutation,
    useUpdaterConfigurationMutation,
    useUpdaterConfigurationQuery,
    useValetudoCustomizationsMutation,
    useValetudoCustomizationsQuery
} from "../api";
import {ButtonListMenuItem} from "../components/list_menu/ButtonListMenuItem";
import {SelectListMenuItem, SelectListMenuItemOption} from "../components/list_menu/SelectListMenuItem";
import {SpacerListMenuItem} from "../components/list_menu/SpacerListMenuItem";
import { TextEditModalListMenuItem } from "../components/list_menu/TextEditModalListMenuItem";


const ConfigRestoreButtonListMenuItem = (): JSX.Element => {
    const {
        mutate: restoreDefaultConfiguration,
        isLoading: restoreDefaultConfigurationIsExecuting
    } = useRestoreDefaultConfigurationMutation();

    return (
        <ButtonListMenuItem
            primaryLabel="Restore Default Configuration"
            secondaryLabel="This will only affect Valetudo"
            icon={<ConfigRestoreIcon/>}
            buttonLabel="Go"
            buttonColor={"error"}
            confirmationDialog={{
                title: "Restore default Valetudo configuration?",
                body: "Are you sure that you want to restore the default configuration? This will not affect Wi-Fi settings, Map data etc."
            }}
            action={() => {
                restoreDefaultConfiguration();
            }}
            actionLoading={restoreDefaultConfigurationIsExecuting}
        />
    );
};

const FriendlyNameEditModalListMenuItem = (): JSX.Element => {
    const {
        data: valetudoCustomizations,
        isLoading: valetudoCustomizationsLoading,
    } = useValetudoCustomizationsQuery();
    const {
        mutate: updateValetudoCustomizations,
        isLoading: valetudoCustomizationsUpdating
    } = useValetudoCustomizationsMutation();

    const description = "Set a custom friendly name for Network Advertisement, MQTT etc.";
    let secondaryLabel = description;

    if (valetudoCustomizations && valetudoCustomizations.friendlyName !== "") {
        secondaryLabel = valetudoCustomizations.friendlyName;
    }

    return (
        <TextEditModalListMenuItem
            isLoading={valetudoCustomizationsLoading || valetudoCustomizationsUpdating}
            value={valetudoCustomizations?.friendlyName ?? ""}

            dialog={{
                title: "Custom Friendly Name",
                description: description,

                validatingTransformer: (newValue: string) => {
                    return newValue.replace(/[^a-zA-Z0-9 -]/g, "").slice(0,24);
                },
                onSave: (newValue: string) => {
                    updateValetudoCustomizations({
                        friendlyName: newValue
                    });
                }
            }}

            icon={<FriendlyNameIcon/>}
            primaryLabel={"Custom Friendly Name"}
            secondaryLabel={secondaryLabel}
        />
    );
};

const updateProviders : Array<SelectListMenuItemOption> = [
    {
        value: "github",
        label: "Release"
    },
    {
        value: "github_nightly",
        label: "Nightly"
    }
];

const UpdateProviderSelectListMenuItem = (): JSX.Element => {
    const {
        data: storedConfiguration,
        isLoading: configurationLoading,
        isError: configurationError,
    } = useUpdaterConfigurationQuery();

    const {mutate: updateConfiguration, isLoading: configurationUpdating} = useUpdaterConfigurationMutation();

    const disabled = configurationLoading || configurationUpdating || configurationError;

    const currentValue = updateProviders.find(provider => provider.value === storedConfiguration?.updateProvider) ?? {value: "", label: ""};

    return (
        <SelectListMenuItem
            options={updateProviders}
            currentValue={currentValue}
            setValue={(e) => {
                updateConfiguration({
                    updateProvider: e.value
                } as UpdaterConfiguration);
            }}
            disabled={disabled}
            loadError={configurationError}
            primaryLabel="Update Channel"
            secondaryLabel="Select the channel used by the inbuilt updater"
            icon={<UpdaterIcon/>}
        />
    );
};

const ValetudoOptions = (): JSX.Element => {
    const listItems = React.useMemo(() => {
        return [
            <ConfigRestoreButtonListMenuItem key={"configRestoreAction"}/>,
            <SpacerListMenuItem key={"spacer0"}/>,
            <FriendlyNameEditModalListMenuItem key={"friendlyName"}/>,
            <UpdateProviderSelectListMenuItem key={"updateProviderSelect"}/>,
        ];
    }, []);

    return (
        <PaperContainer>
            <ListMenu
                primaryHeader={"Valetudo Options"}
                secondaryHeader={"Tunables and actions provided by Valetudo"}
                listItems={listItems}
            />
        </PaperContainer>
    );
};

export default ValetudoOptions;
