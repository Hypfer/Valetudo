import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  Fade,
  Grid,
  Link,
  makeStyles,
  Typography,
} from '@material-ui/core';
import { Refresh as RefreshIcon } from '@material-ui/icons';
import React from 'react';
import {
  useLatestGitHubReleaseLazyQuery,
  useRobotInformationQuery,
  useValetudoVersionQuery,
} from '../api';

const useStyles = makeStyles((theme) => ({
  topRightIcon: {
    marginTop: -theme.spacing(1),
  },
}));

const About = (): JSX.Element => {
  const classes = useStyles();
  const {
    data: information,
    isLoading: infoLoading,
  } = useRobotInformationQuery();
  const {
    data: version,
    isLoading: versionLoading,
  } = useValetudoVersionQuery();
  const {
    data: release,
    isLoading: releaseLoading,
    refetch: fetchLatestRelease,
  } = useLatestGitHubReleaseLazyQuery();
  const systemLoading = infoLoading || versionLoading;
  const isNewerRelease =
    (release?.tag_name ?? '0.0.0') > (version?.release ?? 'a');

  const systemInformation = React.useMemo(() => {
    if (systemLoading) {
      return (
        <Fade
          in
          style={{
            transitionDelay: '500ms',
          }}
          unmountOnExit
        >
          <CircularProgress color="secondary" />
        </Fade>
      );
    }

    if (!information || !version) {
      return <Typography color="error">No robot information</Typography>;
    }

    const items: Array<[header: string, body: string]> = [
      ['Manufacturer', information.manufacturer],
      ['Model', information.modelName],
      ['Valetudo Implementation', information.implementation],
      ['Release', version.release],
      ['Commit', version.commit],
    ];

    return (
      <Grid container spacing={2}>
        {items.map(([header, body]) => (
          <Grid item key={header}>
            <Typography variant="caption" color="textSecondary">
              {header}
            </Typography>
            <Typography variant="body2">{body}</Typography>
          </Grid>
        ))}
      </Grid>
    );
  }, [information, systemLoading, version]);

  const releaseInformation = React.useMemo(() => {
    if (releaseLoading) {
      return (
        <Fade
          in
          style={{
            transitionDelay: '500ms',
          }}
          unmountOnExit
        >
          <CircularProgress color="secondary" />
        </Fade>
      );
    }
    if (!release) {
      return (
        <Typography color="textSecondary">No release information</Typography>
      );
    }

    return (
      <Grid container spacing={2}>
        <Grid item>
          <Typography variant="caption" color="textSecondary">
            Version
          </Typography>
          <Typography variant="body2">{release.tag_name}</Typography>
        </Grid>
        <Grid item>
          <Typography variant="caption" color="textSecondary">
            Date
          </Typography>
          <Typography variant="body2">
            {new Date(Date.parse(release.published_at)).toLocaleString()}
          </Typography>
        </Grid>
        <Grid item>
          <Typography variant="caption" color="textSecondary">
            Changelog
          </Typography>
          <Typography variant="body2">
            <Link
              rel="noreferrer"
              target="_blank"
              color="inherit"
              href={release.html_url}
            >
              View
            </Link>
          </Typography>
        </Grid>
      </Grid>
    );
  }, [release, releaseLoading]);

  return (
    <Container>
      <Box pt={2} />
      <Grid container spacing={2}>
        <Grid item>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System
              </Typography>
              <Divider />
              {systemInformation}
            </CardContent>
          </Card>
        </Grid>
        <Grid item>
          <Card>
            <CardContent>
              <Grid
                container
                spacing={4}
                alignItems="center"
                justify="space-between"
              >
                <Grid item>
                  <Typography variant="h6" gutterBottom>
                    Latest release
                  </Typography>
                </Grid>
                <Grid item>
                  {isNewerRelease ? (
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                      NEW!
                    </Typography>
                  ) : (
                    <Button
                      className={classes.topRightIcon}
                      disabled={releaseLoading}
                      color="secondary"
                      onClick={() => fetchLatestRelease()}
                    >
                      <RefreshIcon />
                    </Button>
                  )}
                </Grid>
              </Grid>
              <Divider />
              {releaseInformation}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default About;
