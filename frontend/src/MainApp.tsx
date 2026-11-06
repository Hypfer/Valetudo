import React from "react";
import {PaletteMode} from "@mui/material";
import AppRouter from "./AppRouter";
import WelcomeDialog from "./components/WelcomeDialog";
import {useValetudoInformationSuspenseQuery} from "./api";

const MainApp: React.FunctionComponent<{
    paletteMode: PaletteMode,
    setPaletteMode: (newMode: PaletteMode) => void
}> = ({
    paletteMode,
    setPaletteMode
}): React.ReactElement => {
    const {data: valetudoInformation} = useValetudoInformationSuspenseQuery();
    const [hideWelcomeDialog, setHideWelcomeDialog] = React.useState(false);

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

export default MainApp;
