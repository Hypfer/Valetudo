import Map, {MapProps, MapState} from "./Map";
import HelpDialog from "../components/HelpDialog";
import HelpAction from "./actions/edit_map_actions/HelpAction";
import {PathDrawer} from "./PathDrawer";
import {RawMapEntityType} from "../api";
import SegmentLabelMapStructure from "./structures/map_structures/SegmentLabelMapStructure";


interface CleanupCoverageMapProps extends MapProps {
    helpText: string
}

interface CleanupCoverageMapState extends MapState {
    helpDialogOpen: boolean
}

class RobotCoverageMap extends Map<CleanupCoverageMapProps, CleanupCoverageMapState> {
    constructor(props: MapProps) {
        super(props);

        this.state = {
            selectedSegmentIds: [],
            helpDialogOpen: false
        };
    }

    protected renderAdditionalElements(): JSX.Element {
        return <>
            <HelpAction
                helpDialogOpen={this.state.helpDialogOpen}
                setHelpDialogOpen={(open) => {
                    this.setState({helpDialogOpen: open});
                }}
            />

            <HelpDialog
                dialogOpen={this.state.helpDialogOpen}
                setDialogOpen={(open: boolean) => {
                    this.setState({helpDialogOpen: open});
                }}
                helpText={this.props.helpText}
            />
        </>;
    }

    protected updateDrawableComponents(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            this.drawableComponentsMutex.take(async () => {
                this.drawableComponents = [];

                await this.mapLayerRenderer.draw(this.props.rawMap, this.props.theme);
                this.drawableComponents.push(this.mapLayerRenderer.getCanvas());

                const coveragePathImage = await PathDrawer.drawPaths( {
                    paths: this.props.rawMap.entities.filter(e => {
                        return e.type === RawMapEntityType.Path;
                    }),
                    mapWidth: this.props.rawMap.size.x,
                    mapHeight: this.props.rawMap.size.y,
                    pixelSize: this.props.rawMap.pixelSize,
                    paletteMode: this.props.theme.palette.mode === "dark" ? "light" : "dark",
                    width: 5
                });

                this.drawableComponents.push(coveragePathImage);

                const pathsImage = await PathDrawer.drawPaths( {
                    paths: this.props.rawMap.entities.filter(e => {
                        return e.type === RawMapEntityType.Path || e.type === RawMapEntityType.PredictedPath;
                    }),
                    mapWidth: this.props.rawMap.size.x,
                    mapHeight: this.props.rawMap.size.y,
                    pixelSize: this.props.rawMap.pixelSize,
                    paletteMode: this.props.theme.palette.mode,
                });

                this.drawableComponents.push(pathsImage);

                this.structureManager.updateMapStructuresFromMapData(this.props.rawMap);

                // remove all segment labels
                this.structureManager.getMapStructures().forEach(s => {
                    if (s.type === SegmentLabelMapStructure.TYPE) {
                        this.structureManager.removeMapStructure(s);
                    }
                });


                this.updateState();

                this.drawableComponentsMutex.leave();

                resolve();
            });
        });
    }

    //eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    protected onTap(evt: any): boolean | void {
        // Disable all interactions
        return;
    }
}

export default RobotCoverageMap;
