import React from "react";
import {PaletteMode} from "@mui/material";
import AppRouter from "./AppRouter";
import WelcomeDialog from "./components/WelcomeDialog";
import {useValetudoInformationQuery} from "./api";
import ValetudoSplash from "./components/ValetudoSplash";

export const MainApp: React.FunctionComponent<{
    paletteMode: PaletteMode,
    setPaletteMode: (newMode: PaletteMode) => void
}> = ({
    paletteMode,
    setPaletteMode
}): JSX.Element => {
    const {
        data: valetudoInformation,
        isLoading: valetudoInformationLoading
    } = useValetudoInformationQuery();
    const [hideWelcomeDialog, setHideWelcomeDialog] = React.useState(false);

    if (valetudoInformationLoading || !valetudoInformation) {
        return <ValetudoSplash/>;
    }

    return (
        <>
            <AppRouter paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>
            {
                !valetudoInformation.welcomeDialogDismissed &&
                <WelcomeDialog
                    open={!(valetudoInformation.welcomeDialogDismissed || hideWelcomeDialog)}
                    hide={() => setHideWelcomeDialog(true)}
                />
            }
        </>
    );
};
