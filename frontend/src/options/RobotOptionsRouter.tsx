import {Route} from "react-router";
import {Navigate, Routes} from "react-router-dom";
import React from "react";
import RobotOptions from "../robot/RobotOptions";
import SystemRobotOptions from "../robot/capabilities/SystemRobotOptions";
import Quirks from "../robot/capabilities/Quirks";

const OptionsRouter = (): React.ReactElement => {
    return (
        <Routes>
            <Route path={""} element={<RobotOptions />} />
            <Route path={"system"} element={<SystemRobotOptions />} />
            <Route path={"quirks"} element={<Quirks />} />

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default OptionsRouter;
