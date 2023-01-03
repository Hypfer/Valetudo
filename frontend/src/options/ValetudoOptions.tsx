import React from "react";
import {
    RestartAlt as ConfigRestoreIcon,
    SystemUpdateAlt as UpdaterIcon,
} from "@mui/icons-material";
import {ListMenu} from "../components/list_menu/ListMenu";
import PaperContainer from "../components/PaperContainer";
import {
    UpdaterConfiguration,
    useRestoreDefaultConfigurationMutation,
    useUpdaterConfigurationMutation,
    useUpdaterConfigurationQuery
} from "../api";
import {ButtonListMenuItem} from "../components/list_menu/ButtonListMenuItem";
import {SelectListMenuItem, SelectListMenuItemOption} from "../components/list_menu/SelectListMenuItem";
import {SpacerListMenuItem} from "../components/list_menu/SpacerListMenuItem";


const ConfigRestoreButtonListMenuItem = (): JSX.Element => {
    const {
        mutate: restoreDefaultConfiguration,
        isLoading: restoreDefaultConfigurationIsExecuting
    } = useRestoreDefaultConfigurationMutation();

    return (
        <ButtonListMenuItem
            primaryLabel="Restore default configuration"
            secondaryLabel="This will only affect Valetudo"
            icon={<ConfigRestoreIcon/>}
            buttonLabel="Go"
            buttonIsDangerous={true}
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
            primaryLabel="Update Provider"
            secondaryLabel="Select the provider used by the inbuilt updater"
            icon={<UpdaterIcon/>}
        />
    );
};

const ValetudoOptions = (): JSX.Element => {
    const listItems = React.useMemo(() => {
        const items = [];

        items.push(
            <ConfigRestoreButtonListMenuItem key={"configRestoreAction"}/>
        );

        items.push(<SpacerListMenuItem key={"spacer0"}/>);

        items.push(
            <UpdateProviderSelectListMenuItem key={"updateProviderSelect"}/>
        );

        return items;
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
