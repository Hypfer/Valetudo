import {Route, Switch} from "react-router";
import {useRouteMatch} from "react-router-dom";
import Consumables from "./Consumables";
import ManualControl from "./ManualControl";
import TotalStatistics from "./TotalStatistics";

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
            <Route exact path={path + "/total_statistics"}>
                <TotalStatistics/>
            </Route>
            <Route path="*">
                <h3>Unknown route</h3>
            </Route>
        </Switch>
    );
};

export default RobotRouter;
