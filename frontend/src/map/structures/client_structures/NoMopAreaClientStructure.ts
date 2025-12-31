import RestrictedZoneClientStructure from "./RestrictedZoneClientStructure";

class NoMopAreaClientStructure extends RestrictedZoneClientStructure {
    public static readonly TYPE = "NoMopAreaClientStructure";

    protected activeStyle : { stroke: string, fill: string } = {
        stroke: "rgb(217, 70, 239)",
        fill: "rgba(255, 0, 255, 0)"
    };

    protected style : { stroke: string, fill: string } = {
        stroke: "rgb(217, 70, 239)",
        fill: "rgba(217, 70, 239, 0.4)"
    };
}

export default NoMopAreaClientStructure;
