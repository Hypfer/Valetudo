import PaperContainer from "../PaperContainer";
import {Divider, List, ListItemText} from "@mui/material";
import React from "react";
import {SpacerListMenuItem} from "./SpacerListMenuItem";


export const ListMenu: React.FunctionComponent<{
    primaryHeader: string,
    secondaryHeader: string,
    listItems: Array<JSX.Element>
}> = ({
    primaryHeader,
    secondaryHeader,
    listItems
}): JSX.Element => {

    return (
        <PaperContainer>
            <List
                sx={{
                    width: "100%",
                }}
                subheader={
                    <ListItemText
                        style={{
                            paddingBottom: "1rem",
                            paddingLeft: "1rem",
                            paddingRight: "1rem",
                            userSelect: "none"
                        }}
                        primary={primaryHeader}
                        secondary={secondaryHeader}
                    />
                }
            >
                {listItems.map((item, idx) => {
                    const divider = (<Divider variant="middle" component="li" key={idx + "_divider"} />);
                    let elem = item;

                    if (elem.type === SpacerListMenuItem) {
                        elem = <br key={idx + "_spacer"}/>;
                    }

                    if (
                        idx > 0 &&
                        item.type !== SpacerListMenuItem &&
                        listItems[idx - 1].type !== SpacerListMenuItem
                    ) {
                        return [divider, elem];
                    } else {
                        return elem;
                    }
                })}
            </List>
        </PaperContainer>
    );
};
