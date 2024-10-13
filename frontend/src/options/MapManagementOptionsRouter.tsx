import {Route} from "react-router";
import {Navigate, Routes} from "react-router-dom";
import MapManagement from "./MapManagement";
import EditMapPage from "../map/EditMapPage";
import {useCapabilitiesSupported} from "../CapabilitiesProvider";
import {Capability} from "../api";
import React from "react";
import RobotCoverageMapPage from "../map/RobotCoverageMapPage";

const OptionsRouter = (): React.ReactElement => {
    const [
        combinedVirtualRestrictionsCapabilitySupported,

        mapSegmentEditCapabilitySupported,
        mapSegmentRenameCapabilitySupported
    ] = useCapabilitiesSupported(
        Capability.CombinedVirtualRestrictions,

        Capability.MapSegmentEdit,
        Capability.MapSegmentRename
    );

    return (
        <Routes>
            <Route path={""} element={<MapManagement />}/>

            {
                (mapSegmentEditCapabilitySupported || mapSegmentRenameCapabilitySupported) &&
                <Route
                    path={"segments"}
                    element={
                        <EditMapPage
                            mode={"segments"}
                        />
                    }
                />
            }
            {
                combinedVirtualRestrictionsCapabilitySupported &&
                <Route
                    path={"virtual_restrictions"}
                    element={
                        <EditMapPage
                            mode={"virtual_restrictions"}
                        />
                    }
                />
            }

            <Route path={"robot_coverage"} element={<RobotCoverageMapPage/>}/>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default OptionsRouter;
