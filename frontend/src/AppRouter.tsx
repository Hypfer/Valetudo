import { BrowserRouter, Link, Redirect, Route, Switch } from 'react-router-dom';
import MapPage from './map';
import ControlsBody from './controls';
import {
  Toolbar,
  AppBar,
  makeStyles,
  IconButton,
  useMediaQuery,
  useTheme,
  Grid,
  Divider,
  Box,
  Button,
} from '@material-ui/core';
import {
  Settings as SettingsIcon,
  Info as AboutIcon,
  Home as HomeIcon,
} from '@material-ui/icons';
import Div100vh from 'react-div-100vh';
import ControlsBottomSheet from './controls/ControlsBottomSheet';

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

const useHomeStyles = makeStyles(() => ({
  root: {
    height: '100%',
    flexWrap: 'nowrap',
  },
  scrollable: {
    overflow: 'auto',
  },
}));

const HomePage = (): JSX.Element => {
  const classes = useHomeStyles();
  const theme = useTheme();
  const largeView = useMediaQuery(theme.breakpoints.up('sm'), {
    noSsr: true,
  });

  if (largeView) {
    return (
      <Grid
        container
        direction="row"
        justify="space-evenly"
        className={classes.root}
      >
        <Grid item sm md lg xl>
          <MapPage />
        </Grid>
        <Divider orientation="vertical" />
        <Grid item sm={4} md={4} lg={4} xl={3} className={classes.scrollable}>
          <Box m={1}>
            <ControlsBody />
          </Box>
        </Grid>
      </Grid>
    );
  }

  return (
    // Padding set to height of the header of the bottom controls sheet
    <Box paddingBottom="52px" width={1} height={1}>
      <MapPage />
      <ControlsBottomSheet />
    </Box>
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
