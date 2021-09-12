import "@material-ui/core/styles";

declare module "@material-ui/core/styles" {
    interface Theme {
        map: {
            floor: NonNullable<React.CSSProperties["color"]>;
            wall: NonNullable<React.CSSProperties["color"]>;
            segment: NonNullable<React.CSSProperties["color"]>[];
            path: NonNullable<React.CSSProperties["color"]>;
            noGo: {
                stroke: NonNullable<React.CSSProperties["color"]>;
                fill: NonNullable<React.CSSProperties["color"]>;
            };
            noMop: {
                stroke: NonNullable<React.CSSProperties["color"]>;
                fill: NonNullable<React.CSSProperties["color"]>;
            };
            active: {
                stroke: NonNullable<React.CSSProperties["color"]>;
                fill: NonNullable<React.CSSProperties["color"]>;
            };
        };
    }

    interface ThemeOptions {
        map: {
            floor: NonNullable<React.CSSProperties["color"]>;
            wall: NonNullable<React.CSSProperties["color"]>;
            segment: NonNullable<React.CSSProperties["color"]>[];
            path: NonNullable<React.CSSProperties["color"]>;
            noGo: {
                stroke: NonNullable<React.CSSProperties["color"]>;
                fill: NonNullable<React.CSSProperties["color"]>;
            };
            noMop: {
                stroke: NonNullable<React.CSSProperties["color"]>;
                fill: NonNullable<React.CSSProperties["color"]>;
            };
            active: {
                stroke: NonNullable<React.CSSProperties["color"]>;
                fill: NonNullable<React.CSSProperties["color"]>;
            };
        };
    }
}
