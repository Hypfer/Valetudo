import RestrictedZoneClientStructure from "./RestrictedZoneClientStructure";

class NoMopAreaClientStructure extends RestrictedZoneClientStructure {
    public static TYPE = "NoMopAreaClientStructure";

    protected activeStyle : { stroke: string, fill: string } = {
        stroke: "rgb(200, 0, 255)",
        fill: "rgba(255, 0, 255, 0)"
    };

    protected style : { stroke: string, fill: string } = {
        stroke: "rgb(200, 0, 255)",
        fill: "rgba(200, 0, 255, 0.4)"
    };

    getType(): string {
        return NoMopAreaClientStructure.TYPE;
    }
}

export default NoMopAreaClientStructure;
