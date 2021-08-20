import {
  Backdrop,
  Button,
  CircularProgress,
  makeStyles,
  Typography,
} from '@material-ui/core';
import { SnackbarKey, useSnackbar } from 'notistack';
import React from 'react';
import { Capability, useCapabilitiesQuery } from './api';

const useStyles = makeStyles((theme) => ({
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: '#fff',
    display: 'flex',
    flexFlow: 'column',
  },
}));

const Context = React.createContext<Capability[]>([]);

const CapabilitiesProvider = (props: {
  children: JSX.Element;
}): JSX.Element => {
  const { children } = props;
  const classes = useStyles();
  const { isError, isLoading, data, refetch } = useCapabilitiesQuery();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const snackbarKey = React.useRef<SnackbarKey>();

  React.useEffect(() => {
    if (isError || snackbarKey.current === undefined) {
      return;
    }

    closeSnackbar(snackbarKey.current);
  }, [closeSnackbar, isError]);

  React.useEffect(() => {
    if (!isError) {
      return;
    }

    const SnackbarAction = () => (
      <Button
        onClick={() => {
          refetch({ throwOnError: true }).then(() =>
            enqueueSnackbar('Succesfully loaded capabilities!', {
              variant: 'success',
            })
          );
        }}
      >
        Retry
      </Button>
    );

    if (snackbarKey.current) {
      closeSnackbar(snackbarKey.current);
    }

    snackbarKey.current = enqueueSnackbar('Error while loading capabilities', {
      variant: 'error',
      action: SnackbarAction,
      persist: true,
    });
  }, [closeSnackbar, enqueueSnackbar, isError, refetch]);

  return (
    <Context.Provider value={data ?? []}>
      <Backdrop
        open={isLoading}
        className={classes.backdrop}
        style={{
          transitionDelay: isLoading ? '800ms' : '0ms',
        }}
        unmountOnExit
      >
        <CircularProgress />
        <Typography variant="caption">Loading capabilities...</Typography>
      </Backdrop>
      {children}
    </Context.Provider>
  );
};

export const useCapabilitiesSupported = (
  ...capabilities: Capability[]
): boolean[] => {
  const supportedCapabilities = React.useContext(Context);

  return capabilities.map((capability) =>
    supportedCapabilities.includes(capability)
  );
};

export default CapabilitiesProvider;
