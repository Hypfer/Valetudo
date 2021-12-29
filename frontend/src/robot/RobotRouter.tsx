import {Route, Switch} from "react-router";
import {useRouteMatch} from "react-router-dom";
import Consumables from "./Consumables";
import Capabilities from "./capabilities";
import ManualControl from "./ManualControl";

const RobotRouter = (): JSX.Element => {
    const {path} = useRouteMatch();

    return (
        <Switch>
            <Route exact path={path + "/consumables"}>
                <Consumables/>
            </Route>
            <Route exact path={path + "/manual_control"}>
                <ManualControl/>
            </Route>
            <Route exact path={path + "/settings"}>
                <Capabilities/>
            </Route>
            <Route path="*">
                <h3>Unknown route</h3>
            </Route>
        </Switch>
    );
};

export default RobotRouter;
