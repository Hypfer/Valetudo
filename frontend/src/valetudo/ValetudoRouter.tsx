import {Route, Switch} from "react-router";
import {useRouteMatch} from "react-router-dom";
import SystemInformation from "./SystemInformation";
import Timers from "./timers";
import Log from "./Log";
import Updater from "./Updater";
import About from "./About";
import Help from "./Help";

const ValetudoRouter = (): JSX.Element => {
    const {path} = useRouteMatch();

    return (
        <Switch>
            <Route exact path={path + "/about"}>
                <About/>
            </Route>
            <Route exact path={path + "/system_information"}>
                <SystemInformation/>
            </Route>
            <Route exact path={path + "/log"}>
                <Log/>
            </Route>
            <Route exact path={path + "/timers"}>
                <Timers/>
            </Route>
            <Route exact path={path + "/updater"}>
                <Updater/>
            </Route>
            <Route exact path={path + "/help"}>
                <Help/>
            </Route>
            <Route path="*">
                <h3>Unknown route</h3>
            </Route>
        </Switch>
    );
};

export default ValetudoRouter;
