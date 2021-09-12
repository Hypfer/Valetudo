import {RawMapData} from "../../api";

export interface MapLayersProps {
    data: RawMapData;
    padding?: number;

    onDone(): void;
}
