import React from "react";

interface SpacerListMenuItemProps {
    halfHeight?: boolean;
}

export const SpacerListMenuItem = ({
    halfHeight = false
}: SpacerListMenuItemProps): React.ReactElement => {
    return (
        <div style={{ height: halfHeight ? "0.5rem" : "1rem" }} />
    );
};
