import {
  Box,
  Button,
  CircularProgress,
  Container,
  makeStyles,
  Typography,
  useTheme,
} from '@material-ui/core';
import { useRobotMapQuery } from '../api';
import MapLayers from './layers';

const useStyles = makeStyles(() => ({
  container: {
    flex: '1',
    height: '100%',
    display: 'flex',
    flexFlow: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
}));

const MapPage = (): JSX.Element => {
  const { data, isLoading, isError, refetch } = useRobotMapQuery();
  const classes = useStyles();
  const theme = useTheme();

  if (isError) {
    return (
      <Container className={classes.container}>
        <Typography color="error">Error loading map data</Typography>
        <Box m={1} />
        <Button color="primary" variant="contained" onClick={() => refetch()}>
          Retry
        </Button>
      </Container>
    );
  }

  if (!data && isLoading) {
    return (
      <Container className={classes.container}>
        <CircularProgress />
      </Container>
    );
  }

  if (!data) {
    return (
      <Container className={classes.container}>
        <Typography align="center">No map data</Typography>;
      </Container>
    );
  }

  return <MapLayers data={data} padding={theme.spacing(4)} />;
};

export default MapPage;
