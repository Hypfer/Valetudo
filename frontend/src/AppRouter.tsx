import {BrowserRouter, Redirect, Route, Switch} from 'react-router-dom';
import Div100vh from 'react-div-100vh';
import HomePage from './HomePage';
import SettingsRouter from './settings';
import {styled} from '@material-ui/core';

const Root = styled(Div100vh)({
    display: 'flex',
    flexDirection: 'column',
});

const Content = styled('main')({
    flex: '1',
    display: 'flex',
    overflow: 'auto',
});


const AppRouter = (): JSX.Element => {
    return (
        <BrowserRouter //Unfortunately, it doesn't seem to be possible to have this fully dynamic.
            basename="/new_frontend/"  // Sorry, people using subfolder reverse proxies :(
        >
            <Root>
                <Content>
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
        </BrowserRouter>
    );
};

export default AppRouter;
