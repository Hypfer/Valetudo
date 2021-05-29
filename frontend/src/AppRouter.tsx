import { BrowserRouter, Link, Redirect, Route, Switch } from 'react-router-dom';
import {
  Toolbar,
  AppBar,
  makeStyles,
  IconButton,
  Button,
} from '@material-ui/core';
import {
  Settings as SettingsIcon,
  Info as AboutIcon,
  Home as HomeIcon,
} from '@material-ui/icons';
import Div100vh from 'react-div-100vh';
import HomePage from './HomePage';

const useTopNavStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
  toolbar: theme.mixins.toolbar,
}));

const TopNav = (): JSX.Element => {
  const classes = useTopNavStyles();

  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
          <Button
            variant="text"
            color="inherit"
            component={Link}
            to="/"
            startIcon={<HomeIcon />}
            size="large"
          >
            Valetudo
          </Button>
          <div className={classes.grow} />
          <IconButton color="inherit" component={Link} to="/settings">
            <SettingsIcon />
          </IconButton>
          <IconButton color="inherit" component={Link} to="/about">
            <AboutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <div className={classes.toolbar} />
    </>
  );
};

const useAppStyles = makeStyles(() => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
  },
  content: {
    flex: '1',
    display: 'flex',
    overflow: 'auto',
  },
}));

const AppRouter = (): JSX.Element => {
  const classes = useAppStyles();

  return (
    <BrowserRouter>
      <Div100vh className={classes.container}>
        <TopNav />
        <main className={classes.content}>
          <Switch>
            <Route exact path="/">
              <HomePage />
            </Route>
            <Route exact path="/settings">
              <span>Settings</span>
            </Route>
            <Route exact path="/about">
              <span>About</span>
            </Route>
            <Route path="*">
              <Redirect to="/" />
            </Route>
          </Switch>
        </main>
      </Div100vh>
    </BrowserRouter>
  );
};

export default AppRouter;
