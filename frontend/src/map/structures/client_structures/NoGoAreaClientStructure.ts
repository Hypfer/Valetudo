import RestrictedZoneClientStructure from "./RestrictedZoneClientStructure";

class NoGoAreaClientStructure extends RestrictedZoneClientStructure {
    public static TYPE = "NoGoAreaClientStructure";

    protected activeStyle : { stroke: string, fill: string } = {
        stroke: "rgb(239, 68, 68)",
        fill: "rgba(239, 68, 68, 0)"
    };

    protected style : { stroke: string, fill: string } = {
        stroke: "rgb(239, 68, 68)",
        fill: "rgba(239, 68, 68, 0.4)"
    };

    getType(): string {
        return NoGoAreaClientStructure.TYPE;
    }
}

export default NoGoAreaClientStructure;
