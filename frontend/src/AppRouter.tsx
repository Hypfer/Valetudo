import {HashRouter, Redirect, Route, Switch} from "react-router-dom";
import Div100vh from "react-div-100vh";
import HomePage from "./HomePage";
import SettingsRouter from "./settings";
import {Box, styled} from "@material-ui/core";
import RobotRouter from "./robot";
import ValetudoAppBar from "./components/ValetudoAppBar";
import React from "react";

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

const AppRouter = (): JSX.Element => {
    return (
        <HashRouter>
            <Root>
                <Content>
                    <ValetudoAppBar/>
                    <Switch>
                        <Route exact path="/">
                            <HomePage/>
                        </Route>
                        <Route path="/robot">
                            <RobotRouter/>
                        </Route>
                        <Route path="/settings">
                            <Box pt={2}/>
                            <SettingsRouter/>
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
