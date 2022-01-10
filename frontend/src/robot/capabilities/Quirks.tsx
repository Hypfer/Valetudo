import React, {FunctionComponent} from "react";
import {
    FormControl,
    MenuItem,
    Select, SelectChangeEvent,
    Typography
} from "@mui/material";
import {
    Quirk,
    useQuirksQuery,
    useSetQuirkValueMutation
} from "../../api";

import {CapabilityItem} from "./CapabilityLayout";


const QuirkControl: FunctionComponent<{ quirk: Quirk, style?: React.CSSProperties }> = (props) => {
    const {mutate: setQuirkValue, isLoading: quirkValueSetting} = useSetQuirkValueMutation();
    const handleChange = React.useCallback(
        (event: SelectChangeEvent<string>) => {
            setQuirkValue({
                id: props.quirk.id,
                value: event.target.value
            });
        },
        [props.quirk.id, setQuirkValue]
    );


    return (
        <FormControl
            variant="standard"
            style={props.style}
        >
            <Typography variant="body1" sx={{mb: 1}}>
                {props.quirk.title}
            </Typography>
            <Select
                id={props.quirk.id + "-select"}
                value={props.quirk.value}
                onChange={handleChange}
                disabled={quirkValueSetting}

            >
                {
                    props.quirk.options.map((o, i) => {
                        return (
                            <MenuItem
                                value={o}
                                key={`${o}_${i}`}
                            >
                                {o}
                            </MenuItem>
                        );
                    })
                }
            </Select>
            <Typography
                variant="body2"
                sx={{mb: 1}}
                style={{marginTop: "1rem"}}
            >
                {props.quirk.description}
            </Typography>
        </FormControl>
    );
};

const Quirks: FunctionComponent = () => {
    const {
        data: quirks,
        isFetching: quirksLoading,
        isError: quirksLoadingError,
    } = useQuirksQuery();

    const quirksContent = React.useMemo(() => {
        if (quirksLoadingError || !quirks) {
            return (
                <Typography color="error">
                    Error loading quirks.
                </Typography>
            );
        }

        quirks.sort((qA, qB) => {
            return qA.title.localeCompare(qB.title);
        });

        return (
            <>
                {
                    quirks.map((quirk, i) => {
                        return <QuirkControl
                            quirk={quirk}
                            key={quirk.id}
                            style={i === quirks.length -1 ? {} : {paddingBottom: "1.5rem"}}
                        />;
                    })
                }
            </>
        );
    }, [quirksLoadingError, quirks]);

    return (
        <CapabilityItem title={"Quirks"} loading={quirksLoading}>
            {quirksContent}
        </CapabilityItem>
    );

};

export default Quirks;
