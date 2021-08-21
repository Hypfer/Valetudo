import {Route, Switch} from 'react-router';
import {useRouteMatch} from 'react-router-dom';
import About from './About';

const SettingsRouter = (): JSX.Element => {
    const {path} = useRouteMatch();

    return (
        <Switch>
            <Route exact path={`${path}`}>
                <About/>
            </Route>
            <Route path="*">
                <h3>Unknown route</h3>
            </Route>
        </Switch>
    );
};

export default SettingsRouter;
