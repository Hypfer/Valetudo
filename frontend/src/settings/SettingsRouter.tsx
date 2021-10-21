import {Route, Switch} from "react-router";
import {useRouteMatch} from "react-router-dom";
import About from "./About";
import Timers from "./timers";
import Log from "./Log";
import Connectivity from "./connectivity";
import Updater from "./Updater";

const SettingsRouter = (): JSX.Element => {
    const {path} = useRouteMatch();

    return (
        <Switch>
            <Route exact path={path + "/about"}>
                <About/>
            </Route>
            <Route exact path={path + "/log"}>
                <Log/>
            </Route>
            <Route exact path={path + "/timers"}>
                <Timers/>
            </Route>
            <Route exact path={path + "/connectivity"}>
                <Connectivity/>
            </Route>
            <Route exact path={path + "/updater"}>
                <Updater/>
            </Route>
            <Route path="*">
                <h3>Unknown route</h3>
            </Route>
        </Switch>
    );
};

export default SettingsRouter;
