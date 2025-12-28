import React, {FunctionComponent} from "react";

/*
    This icon was adapted from the bootstrap icons repeat-1 icon found here:
    https://github.com/twbs/icons/blob/aa1ede051cd0cbc369be31ea097856e673e3573b/icons/repeat-1.svg
    
    This base icon is licensed under the MIT license
    Copyright (c) 2019-2021 The Bootstrap Authors
    https://github.com/twbs/icons/blob/aa1ede051cd0cbc369be31ea097856e673e3573b/LICENSE.md
 */

export const IterationsIcon: FunctionComponent<{ iterationCount: number }> = ({
    iterationCount
}): React.ReactElement => {
    return (
        <svg width="26" height="26" fill="currentColor" version="1.1" viewBox="0 0 16 16"
            xmlns="http://www.w3.org/2000/svg">
            <path
                d="M11 4v1.466a.25.25 0 0 0 .41.192l2.36-1.966a.25.25 0 0 0 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192V3H5a5 5 0 0 0-4.48 7.223.5.5 0 0 0 .896-.446A4 4 0 0 1 5 4h6Zm4.48 1.777a.5.5 0 0 0-.896.446A4 4 0 0 1 11 12H5.001v-1.466a.25.25 0 0 0-.41-.192l-2.36 1.966a.25.25 0 0 0 0 .384l2.36 1.966a.25.25 0 0 0 .41-.192V13h6a5 5 0 0 0 4.48-7.223Z"/>
            <text x="5.4662104" y="10.917282" fontFamily="IBM Plex Sans,Helvetica,sans-serif" fontSize="8.0142px" strokeWidth=".13641">
                {iterationCount}
            </text>
        </svg>
    );
};
