import {HashRouter, Redirect, Route, Switch} from "react-router-dom";
import Div100vh from "react-div-100vh";
import HomePage from "./HomePage";
import OptionsRouter from "./options";
import {PaletteMode, styled} from "@mui/material";
import RobotRouter from "./robot";
import ValetudoAppBar from "./components/ValetudoAppBar";
import React from "react";
import ValetudoRouter from "./valetudo";

const Root = styled(Div100vh)({
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
});

const Content = styled("main")({
    flex: "1",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    overflow: "auto",
});

const AppRouter: React.FunctionComponent<{ paletteMode: PaletteMode, setPaletteMode: (newMode: PaletteMode) => void }> = ({
    paletteMode,
    setPaletteMode
}): React.ReactElement => {
    return (
        <HashRouter>
            <Root>
                <Content>
                    <ValetudoAppBar paletteMode={paletteMode} setPaletteMode={setPaletteMode}/>
                    <Switch>
                        <Route exact path="/">
                            <HomePage/>
                        </Route>
                        <Route path="/robot">
                            <RobotRouter/>
                        </Route>
                        <Route path="/options">
                            <OptionsRouter/>
                        </Route>
                        <Route path="/valetudo">
                            <ValetudoRouter/>
                        </Route>
                        <Route path="*">
                            <Redirect to="/"/>
                        </Route>
                    </Switch>
                </Content>
            </Root>
        </HashRouter>
    );
};

export default AppRouter;
