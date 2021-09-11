import {Route, Switch} from 'react-router';
import {useRouteMatch} from 'react-router-dom';
import About from './About';
import Timers from "./timers";

const SettingsRouter = (): JSX.Element => {
    const {path} = useRouteMatch();

    return (
        <Switch>
            <Route exact path={path + "/about"}>
                <About/>
            </Route>
            <Route exact path={path + "/timers"}>
                <Timers/>
            </Route>
            <Route path="*">
                <h3>Unknown route</h3>
            </Route>
        </Switch>
    );
};

export default SettingsRouter;
