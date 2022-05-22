import RestrictedZoneClientStructure from "./RestrictedZoneClientStructure";

class NoGoAreaClientStructure extends RestrictedZoneClientStructure {
    public static TYPE = "NoGoAreaClientStructure";

    protected activeStyle : { stroke: string, fill: string } = {
        stroke: "rgb(255, 0, 0)",
        fill: "rgba(255, 0, 0, 0)"
    };

    protected style : { stroke: string, fill: string } = {
        stroke: "rgb(255, 0, 0)",
        fill: "rgba(255, 0, 0, 0.4)"
    };

    getType(): string {
        return NoGoAreaClientStructure.TYPE;
    }
}

export default NoGoAreaClientStructure;
