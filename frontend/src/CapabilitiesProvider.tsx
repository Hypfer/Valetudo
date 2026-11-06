import React from "react";
import {Capability, useCapabilitiesSuspenseQuery} from "./api";

const Context = React.createContext<Capability[]>([]);

const CapabilitiesProvider = (props: {
    children: React.ReactElement;
}): React.ReactElement => {
    const {children} = props;
    const {data: capabilities} = useCapabilitiesSuspenseQuery();

    return (
        <Context.Provider value={capabilities}>
            {children}
        </Context.Provider>
    );
};

export const useCapabilitiesSupported = (
    ...capabilities: Capability[]
): boolean[] => {
    const supportedCapabilities = React.useContext(Context);

    return capabilities.map((capability) => {
        return supportedCapabilities.includes(capability);
    }
    );
};

export default CapabilitiesProvider;
