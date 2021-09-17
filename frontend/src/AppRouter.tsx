import {HashRouter, Redirect, Route, Switch} from "react-router-dom";
import Div100vh from "react-div-100vh";
import HomePage from "./HomePage";
import SettingsRouter from "./settings";
import {styled} from "@material-ui/core";
import ValetudoAppBar from "./compontents/ValetudoAppBar";
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
                        <Route path="/settings">
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
