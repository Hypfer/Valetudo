import Map from '../Map';
import {useMapEntities, useMapLabels, useMapLayers} from './hooks';
import {MapLayersProps} from './types';

const ViewLayer = (props: MapLayersProps): JSX.Element => {
    const {data, padding} = props;

    const entities = useMapEntities(data.entities);
    const labels = useMapLabels(data);
    const layers = useMapLayers(data);

    return (
        <Map
            layers={layers}
            entities={entities}
            labels={labels}
            padding={padding}
        />
    );
};

export default ViewLayer;
