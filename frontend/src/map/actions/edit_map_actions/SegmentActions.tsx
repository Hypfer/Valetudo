import {
    Capability,
    StatusState,
    useJoinSegmentsMutation,
    useRenameSegmentMutation,
    useSplitSegmentMutation
} from "../../../api";
import React from "react";
import {
    Button,
    CircularProgress,
    Dialog, DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Grid,
    TextField,
    Typography
} from "@mui/material";
import {ActionButton} from "../../Styled";
import CuttingLineClientStructure from "../../structures/client_structures/CuttingLineClientStructure";
import {PointCoordinates} from "../../utils/types";

interface SegmentActionsProperties {
    robotStatus: StatusState,
    selectedSegmentIds: string[];
    segmentNames: Record<string, string>;
    cuttingLine: CuttingLineClientStructure | undefined,

    convertPixelCoordinatesToCMSpace(coordinates: PointCoordinates) : PointCoordinates

    supportedCapabilities: {
        [Capability.MapSegmentEdit]: boolean,
        [Capability.MapSegmentRename]: boolean
    }

    onAddCuttingLine(): void,

    onClear(): void;
}

const SegmentActions = (
    props: SegmentActionsProperties
): JSX.Element => {
    const {
        selectedSegmentIds,
        segmentNames,
        cuttingLine,
        convertPixelCoordinatesToCMSpace,
        supportedCapabilities,
        onAddCuttingLine,
        onClear} = props;

    const [newSegmentName, setNewSegmentName] = React.useState("");
    const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);


    const {
        mutate: joinSegments,
        isLoading: joinSegmentsExecuting
    } = useJoinSegmentsMutation({
        onSuccess: onClear,
    });
    const {
        mutate: splitSegment,
        isLoading: splitSegmentExecuting
    } = useSplitSegmentMutation({
        onSuccess: onClear,
    });
    const {
        mutate: renameSegment,
        isLoading: renameSegmentExecuting
    } = useRenameSegmentMutation({
        onSuccess: onClear,
    });

    const canEdit = props.robotStatus.value === "docked";

    const handleSplitClick = React.useCallback(() => {
        if (!canEdit || !cuttingLine || selectedSegmentIds.length !== 1) {
            return;
        }

        splitSegment({
            segment_id: selectedSegmentIds[0],
            pA: convertPixelCoordinatesToCMSpace({
                x: cuttingLine.x0,
                y: cuttingLine.y0
            }),
            pB: convertPixelCoordinatesToCMSpace({
                x: cuttingLine.x1,
                y: cuttingLine.y1
            })
        });
    }, [canEdit, splitSegment, selectedSegmentIds, cuttingLine, convertPixelCoordinatesToCMSpace]);

    const handleJoinClick = React.useCallback(() => {
        if (!canEdit || selectedSegmentIds.length !== 2) {
            return;
        }

        joinSegments({
            segment_a_id: selectedSegmentIds[0],
            segment_b_id: selectedSegmentIds[1],
        });
    }, [canEdit, joinSegments, selectedSegmentIds]);

    const handleRenameClick = React.useCallback(() => {
        if (!canEdit || selectedSegmentIds.length !== 1) {
            return;
        }

        renameSegment({
            segment_id: selectedSegmentIds[0],
            name: newSegmentName.trim()
        });
    }, [canEdit, selectedSegmentIds, newSegmentName, renameSegment]);


    return (
        <Grid container spacing={1} direction="row-reverse" flexWrap="wrap-reverse">
            {
                supportedCapabilities[Capability.MapSegmentEdit] &&
                (selectedSegmentIds.length === 1 || selectedSegmentIds.length === 2) &&
                cuttingLine === undefined &&

                <Grid item>
                    <ActionButton
                        disabled={joinSegmentsExecuting || !canEdit}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={handleJoinClick}
                    >
                        Join {segmentNames[selectedSegmentIds[0]]} and {selectedSegmentIds.length === 2 ? segmentNames[selectedSegmentIds[1]] : "?"}
                        {joinSegmentsExecuting && (
                            <CircularProgress
                                color="inherit"
                                size={18}
                                style={{marginLeft: 10}}
                            />
                        )}
                    </ActionButton>
                </Grid>
            }
            {
                supportedCapabilities[Capability.MapSegmentEdit] &&
                selectedSegmentIds.length === 1 &&
                cuttingLine !== undefined &&

                <Grid item>
                    <ActionButton
                        disabled={splitSegmentExecuting || !canEdit}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={handleSplitClick}
                    >
                        Split {segmentNames[selectedSegmentIds[0]]}
                        {splitSegmentExecuting && (
                            <CircularProgress
                                color="inherit"
                                size={18}
                                style={{marginLeft: 10}}
                            />
                        )}
                    </ActionButton>
                </Grid>
            }
            {
                supportedCapabilities[Capability.MapSegmentRename] &&
                selectedSegmentIds.length === 1 &&
                cuttingLine === undefined &&

                <Grid item>
                    <ActionButton
                        disabled={renameSegmentExecuting || !canEdit}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={() => {
                            setNewSegmentName(segmentNames[selectedSegmentIds[0]] ?? selectedSegmentIds[0]);
                            setRenameDialogOpen(true);
                        }}
                    >
                        Rename
                    </ActionButton>
                </Grid>
            }
            {
                supportedCapabilities[Capability.MapSegmentEdit] &&
                selectedSegmentIds.length === 1 &&
                cuttingLine === undefined &&

                <Grid item>
                    <ActionButton
                        disabled={joinSegmentsExecuting || !canEdit}
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onAddCuttingLine}
                    >
                        Add Cutting Line
                    </ActionButton>
                </Grid>
            }
            {
                (
                    selectedSegmentIds.length > 0 ||
                    cuttingLine !== undefined
                ) &&

                <Grid item>
                    <ActionButton
                        color="inherit"
                        size="medium"
                        variant="extended"
                        onClick={onClear}
                    >
                        Clear
                    </ActionButton>
                </Grid>
            }
            {
                !canEdit &&
                <Grid item>
                    <Typography variant="caption" color="textSecondary">
                        Editing segments requires the robot to be docked
                    </Typography>
                </Grid>
            }
            {
                canEdit &&
                selectedSegmentIds.length === 0 &&
                <Grid item>
                    <Typography variant="caption" color="textSecondary" style={{fontSize: "1em"}}>
                        Please select a segment to start editing
                    </Typography>
                </Grid>
            }
            {
                supportedCapabilities[Capability.MapSegmentRename] &&
                <Dialog open={renameDialogOpen} onClose={() => {
                    setRenameDialogOpen(false);
                }}>
                    <DialogTitle>Rename Segment</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            How should the Segment with the ID {selectedSegmentIds[0]} be called?
                        </DialogContentText>
                        <TextField
                            autoFocus
                            margin="dense"
                            variant="standard"
                            label="Segment name"
                            fullWidth
                            value={newSegmentName}
                            onChange={(e) => {
                                setNewSegmentName(e.target.value);
                            }}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            setRenameDialogOpen(false);
                        }}>Cancel</Button>
                        <Button
                            onClick={() => {
                                setRenameDialogOpen(false);
                                handleRenameClick();
                            }}>
                            Rename
                        </Button>
                    </DialogActions>
                </Dialog>
            }
        </Grid>
    );
};

export default SegmentActions;
