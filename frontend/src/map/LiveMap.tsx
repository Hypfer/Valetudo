import Map, {MapProps, MapState} from "./Map";
import {Capability} from "../api";
import GoToTargetClientStructure from "./structures/client_structures/GoToTargetClientStructure";
import LocateAction from "./actions/live_map_actions/LocateAction";
import {ActionsContainer} from "./Styled";
import SegmentActions from "./actions/live_map_actions/SegmentActions";
import SegmentLabelMapStructure from "./structures/map_structures/SegmentLabelMapStructure";
import ZoneActions from "./actions/live_map_actions/ZoneActions";
import ZoneClientStructure from "./structures/client_structures/ZoneClientStructure";
import GoToActions from "./actions/live_map_actions/GoToActions";

interface LiveMapProps extends MapProps {
    supportedCapabilities: {
        [Capability.MapSegmentation]: boolean,
        [Capability.ZoneCleaning]: boolean,
        [Capability.GoToLocation]: boolean,
        [Capability.Locate]: boolean
    }
}

interface LiveMapState extends MapState {
    zones: Array<ZoneClientStructure>,
    goToTarget: GoToTargetClientStructure | undefined
}

class LiveMap extends Map<LiveMapProps, LiveMapState> {
    constructor(props: LiveMapProps) {
        super(props);

        this.state = {
            selectedSegmentIds: [],
            zones: [],
            goToTarget: undefined
        };
    }

    protected updateState() : void {
        this.setState({
            selectedSegmentIds: this.structureManager.getMapStructures().filter(s => {
                if (s.type === SegmentLabelMapStructure.TYPE) {
                    const label = s as SegmentLabelMapStructure;

                    return label.selected;
                } else {
                    return false;
                }
            }).map(s => {
                const label = s as SegmentLabelMapStructure;

                return label.id;
            }),
            zones: this.structureManager.getClientStructures().filter(s => {
                return s.type === ZoneClientStructure.TYPE;
            }) as Array<ZoneClientStructure>,
            goToTarget: this.structureManager.getClientStructures().find(s => {
                return s.type === GoToTargetClientStructure.TYPE;
            }) as GoToTargetClientStructure | undefined
        });
    }


    //eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    protected onTap(evt: any): boolean | void {
        if (super.onTap(evt)) {
            return;
        }
        if (this.canvas === null || this.ctx === null) {
            return;
        }

        const {x, y} = Map.relativeCoordinates(evt.tappedCoordinates, this.canvas);
        const tappedPointInMapSpace = this.ctx.transformedPoint(x, y);


        if (this.props.supportedCapabilities[Capability.GoToLocation]) {
            this.structureManager.getClientStructures().forEach(s => {
                if (s.type === GoToTargetClientStructure.TYPE) {
                    this.structureManager.removeClientStructure(s);
                }
            });

            if (this.structureManager.getClientStructures().length === 0 && this.state.selectedSegmentIds.length === 0) {
                this.structureManager.addClientStructure(new GoToTargetClientStructure(tappedPointInMapSpace.x, tappedPointInMapSpace.y));

                this.updateState();
                this.draw();
            }
        }
    }

    protected renderAdditionalElements(): JSX.Element {
        return <>
            {
                this.props.supportedCapabilities[Capability.Locate] &&
                <LocateAction/>
            }

            <ActionsContainer>
                {
                    this.props.supportedCapabilities[Capability.MapSegmentation] &&
                    this.state.selectedSegmentIds.length > 0 &&
                    this.state.goToTarget === undefined &&

                    <SegmentActions
                        segments={this.state.selectedSegmentIds}
                        onClear={() => {
                            this.structureManager.getMapStructures().forEach(s => {
                                if (s.type === SegmentLabelMapStructure.TYPE) {
                                    const label = s as SegmentLabelMapStructure;

                                    label.selected = false;
                                }
                            });
                            this.updateState();

                            this.draw();
                        }}
                    />
                }
                {
                    this.props.supportedCapabilities[Capability.ZoneCleaning] &&
                    this.state.selectedSegmentIds.length === 0 &&
                    this.state.goToTarget === undefined &&

                    <ZoneActions
                        zones={this.state.zones}
                        convertPixelCoordinatesToCMSpace={(coordinates => {
                            return this.structureManager.convertPixelCoordinatesToCMSpace(coordinates);
                        })}
                        onClear={() => {
                            this.structureManager.getClientStructures().forEach(s => {
                                if (s.type === ZoneClientStructure.TYPE) {
                                    this.structureManager.removeClientStructure(s);
                                }
                            });

                            this.updateState();

                            this.draw();
                        }}
                        onAdd={() => {
                            //TODO: better placement
                            const p0 = this.structureManager.convertCMCoordinatesToPixelSpace({
                                x:(this.props.rawMap.size.x/2) -64,
                                y:(this.props.rawMap.size.y/2) -64
                            });
                            const p1 = this.structureManager.convertCMCoordinatesToPixelSpace({
                                x:(this.props.rawMap.size.x/2) +64,
                                y:(this.props.rawMap.size.y/2) +64
                            });

                            this.structureManager.addClientStructure(new ZoneClientStructure(
                                p0.x, p0.y,
                                p1.x, p1.y,
                                true
                            ));

                            this.updateState();

                            this.draw();
                        }}
                    />
                }
                {
                    this.props.supportedCapabilities[Capability.GoToLocation] &&
                    this.state.goToTarget !== undefined &&

                    <GoToActions
                        goToTarget={this.state.goToTarget}
                        convertPixelCoordinatesToCMSpace={(coordinates => {
                            return this.structureManager.convertPixelCoordinatesToCMSpace(coordinates);
                        })}
                        onClear={() => {
                            this.structureManager.getClientStructures().forEach(s => {
                                if (s.type === GoToTargetClientStructure.TYPE) {
                                    this.structureManager.removeClientStructure(s);
                                }
                            });
                            this.updateState();

                            this.draw();
                        }}
                    />
                }
            </ActionsContainer>
        </>;
    }
}

export default LiveMap;
