import { Box, Fab, styled } from '@material-ui/core';

export const LayerActionButton = styled(Fab)({
  pointerEvents: 'auto',
  backgroundColor: 'rgba(0,0,0,0.5)',
  border: '1px solid #fff',
  '&:hover,&:focus': {
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  '& 	.MuiFab-label': {
    color: '#fff',
  },
});

export const LayerActionsContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  pointerEvents: 'none',
  bottom: theme.spacing(2),
  left: theme.spacing(2),
  right: theme.spacing(2),
}));
