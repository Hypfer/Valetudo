import {useMediaQuery, useTheme} from '@material-ui/core';

export const useIsMobileView = (): boolean => {
    const theme = useTheme();
    const largeView = useMediaQuery(theme.breakpoints.up('sm'), {
        noSsr: true,
    });
    return !largeView;
};
