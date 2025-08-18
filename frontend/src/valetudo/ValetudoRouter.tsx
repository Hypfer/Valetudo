import {Route, } from "react-router";
import {Navigate, Routes} from "react-router-dom";
import SystemInformation from "./SystemInformation";
import Timers from "./timers";
import Log from "./Log";
import Updater from "./Updater";
import About from "./About";
import Help from "./Help";
import ValetudoAI from "./ValetudoAI";
import React from "react";

const ValetudoRouter = (): React.ReactElement => {
    return (
        <Routes>
            <Route path={"about"} element={<About/>}/>
            <Route path={"system_information"} element={<SystemInformation/>}/>
            <Route path={"log"} element={<Log/>}/>
            <Route path={"timers"} element={<Timers/>}/>
            <Route path={"updater"} element={<Updater/>}/>
            <Route path={"ai"} element={<ValetudoAI/>}/>
            <Route path={"help"} element={<Help/>}/>

            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default ValetudoRouter;
