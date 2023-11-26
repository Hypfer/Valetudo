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
}): React.ReactElement => {
    const {
        data: valetudoInformation,
        isPending: valetudoInformationPending
    } = useValetudoInformationQuery();
    const [hideWelcomeDialog, setHideWelcomeDialog] = React.useState(false);

    if (valetudoInformationPending || !valetudoInformation) {
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
