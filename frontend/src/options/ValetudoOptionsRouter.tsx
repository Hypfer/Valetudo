import { Route } from "react-router";
import { Navigate, Routes } from "react-router-dom";
import React from "react";
import ValetudoOptions from "./ValetudoOptions";
import Analytics from "../valetudo/Analytics";

const ValetudoOptionsRouter = (): React.ReactElement => {
    return (
        <Routes>
            <Route index element={<ValetudoOptions />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="*" element={<Navigate to="/options/valetudo" />} />
        </Routes>
    );
};

export default ValetudoOptionsRouter;
