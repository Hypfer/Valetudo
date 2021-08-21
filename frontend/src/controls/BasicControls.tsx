import {Box, Button, Grid, Icon, Paper, styled, Typography,} from '@material-ui/core';
import {
  BasicControlCommand,
  Capability,
  StatusState,
  useBasicControlMutation,
  useLocateMutation,
  useRobotStatusQuery,
} from '../api';
import {
  Home as HomeIcon,
  NotListedLocation as LocateIcon,
  Pause as PauseIcon,
  PlayArrow as StartIcon,
  Stop as StopIcon,
  SvgIconComponent,
} from '@material-ui/icons';
import {useCapabilitiesSupported} from '../CapabilitiesProvider';

const StyledIcon = styled(Icon)(({theme}) => {return {
    marginRight: theme.spacing(1),
    marginLeft: -theme.spacing(1),
}});

const StartStates: StatusState['value'][] = ['idle', 'docked', 'paused'];
const PauseStates: StatusState['value'][] = ['cleaning', 'returning', 'moving'];

interface CommandButton {
    command: BasicControlCommand | 'locate';
    enabled: boolean;
    label: string;
    Icon: SvgIconComponent;
}

const BasicControls = (): JSX.Element => {
    const {data: status} = useRobotStatusQuery();
    const {
        mutate,
        isLoading: isBasicControlLoading,
    } = useBasicControlMutation();
    const [locateSupported] = useCapabilitiesSupported(Capability.Locate);
    const {mutate: locate, isLoading: isLocateLoading} = useLocateMutation();
    const isLoading = isBasicControlLoading || isLocateLoading;

    const sendCommand = (command: BasicControlCommand | 'locate') => {return () => {
        if (command === 'locate') {
            locate();
            return;
        }
        mutate(command);
    }};

    if (status === undefined) {
        return (
            <Paper>
                <Box p={1}>
                    <Typography color="error">Error loading basic controls</Typography>
                </Box>
            </Paper>
        );
    }

    const {flag, value: state} = status;

    const buttons: CommandButton[] = [
        {
            command: 'start',
            enabled: StartStates.includes(state),
            label: flag === 'resumable' ? 'Resume' : 'Start',
            Icon: StartIcon,
        },
        {
            command: 'pause',
            enabled: PauseStates.includes(state),
            Icon: PauseIcon,
            label: 'Pause',
        },
        {
            command: 'stop',
            enabled: flag === 'resumable' || (state !== 'idle' && state !== 'docked'),
            Icon: StopIcon,
            label: 'Stop',
        },
        {
            command: 'home',
            enabled: state === 'idle',
            Icon: HomeIcon,
            label: 'Dock',
        },
    ];

    if (locateSupported) {
        buttons.push({
            command: 'locate',
            enabled: true,
            label: 'Locate',
            Icon: LocateIcon,
        })
    }

    return (
        <Paper>
            <Box p={1}>
                <Grid container spacing={1} justifyContent="space-evenly">
                    {buttons.map(({label, command, enabled, Icon}) => {return (
                        <Grid item key={command}>
                            <Button
                                variant="outlined"
                                size="medium"
                                disabled={!enabled || isLoading}
                                onClick={sendCommand(command)}
                                color="inherit"
                            >
                                <StyledIcon as={Icon}/> {label}
                            </Button>
                        </Grid>
                    )})}
                </Grid>
            </Box>
        </Paper>
    );
};

export default BasicControls;
