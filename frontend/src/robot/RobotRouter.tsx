import {Route, Switch} from "react-router";
import {useRouteMatch} from "react-router-dom";
import Consumables from "./Consumables";

const RobotRouter = (): JSX.Element => {
    const {path} = useRouteMatch();

    return (
        <Switch>
            <Route exact path={path + "/consumables"}>
                <Consumables/>
            </Route>
            <Route exact path={path + "/settings"}>
                <p>TODO</p>
            </Route>
            <Route path="*">
                <h3>Unknown route</h3>
            </Route>
        </Switch>
    );
};

export default RobotRouter;
