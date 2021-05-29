import { makeStyles, Box, Divider, Grid } from '@material-ui/core';
import ControlsBody from './controls';
import ControlsBottomSheet from './controls/ControlsBottomSheet';
import { useIsMobileView } from './hooks';
import MapPage from './map';

const useStyles = makeStyles(() => ({
  root: {
    height: '100%',
    flexWrap: 'nowrap',
  },
  scrollable: {
    overflow: 'auto',
  },
}));

const HomePage = (): JSX.Element => {
  const classes = useStyles();
  const mobileView = useIsMobileView();

  if (mobileView) {
    return (
      // Padding set to height of the header of the bottom controls sheet
      <Box paddingBottom="52px" width={1} height={1}>
        <MapPage />
        <ControlsBottomSheet />
      </Box>
    );
  }

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
};

export default HomePage;
