import React from "react";
import {Avatar, ListItem, ListItemAvatar, ListItemText, MenuItem, Select, Typography} from "@mui/material";
import LoadingFade from "../LoadingFade";

export type SelectListMenuItemOption = {
    value: string,
    label: string
}

export const SelectListMenuItem: React.FunctionComponent<{
    options: Array<SelectListMenuItemOption>
    currentValue: SelectListMenuItemOption,
    setValue: (newValue: SelectListMenuItemOption) => void,
    disabled: boolean,
    loadingOptions: boolean,
    loadError: boolean,
    primaryLabel: string,
    secondaryLabel: string,
    icon: React.ReactElement
}> = ({
    options,
    currentValue,
    setValue,
    disabled,
    loadingOptions,
    loadError,
    primaryLabel,
    secondaryLabel,
    icon
}): React.ReactElement => {
    let select;

    if (loadingOptions) {
        select = <LoadingFade/>;
    } else if (loadError) {
        select = <Typography variant="body2" color="error">Error</Typography>;
    } else {
        select = (
            <Select
                disabled={disabled}
                value={currentValue.value}
                onChange={(e) => {
                    const selectedOption = options.find(option => option.value === e.target.value);

                    if (selectedOption) {
                        setValue(selectedOption);
                    }
                }}
            >
                {
                    options.map((o, i) => {
                        return (
                            <MenuItem
                                value={o.value}
                                key={`${o}_${i}`}
                            >
                                {o.label}
                            </MenuItem>
                        );
                    })
                }
            </Select>
        );
    }


    return (
        <ListItem
            style={{
                userSelect: "none"
            }}
        >
            <ListItemAvatar>
                <Avatar>
                    {icon}
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                primary={primaryLabel}
                secondary={secondaryLabel}
                style={{marginRight: "2rem"}}
            />
            {select}
        </ListItem>
    );
};
