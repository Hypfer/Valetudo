import {RawMapData} from './RawMapData';

export interface RawRobotState {
    metaData: RawRobotStateMetaData;
    attributes: RobotAttribute[];
    map: RawMapData;
}

export interface RawRobotStateMetaData {
    version: number;
}

export enum RobotAttributeClass {
    PersistentMapSettingState = 'PersistentMapSettingStateAttribute',
    StatusState = 'StatusStateAttribute',
    BatteryState = 'BatteryStateAttribute',
    PresetSelectionState = 'PresetSelectionStateAttribute',
    AttachmentState = 'AttachmentStateAttribute',
    MovementModeState = 'MovementModeStateAttribute',
    OperationModeState = 'OperationModeStateAttribute',
    WaterUsageState = 'WaterUsageStateAttribute',
}

export interface StatusState {
    __class: RobotAttributeClass.StatusState;
    metaData: Record<string, never>;
    value:
        | 'error'
        | 'docked'
        | 'idle'
        | 'returning'
        | 'cleaning'
        | 'paused'
        | 'manual_control'
        | 'moving';
    flag: 'none' | 'zone' | 'segment' | 'spot' | 'target' | 'resumable';
}

export interface BatteryState {
    __class: RobotAttributeClass.BatteryState;
    metaData: Record<string, never>;
    level: number;
    flag: 'none' | 'charged' | 'charging' | 'discharging';
}

export interface PresetSelectionState {
    __class: RobotAttributeClass.PresetSelectionState;
    metaData: Record<string, never>;
    type: 'fan_speed' | 'water_grade';
    value: 'off' | 'min' | 'low' | 'medium' | 'high' | 'max' | 'turbo' | 'custom';
    customValue?: number;
}

export interface AttachmentState {
    __class: RobotAttributeClass.AttachmentState;
    type: 'dustbin' | 'watertank' | 'mop';
    attached: boolean;
}

export interface MovementModeState {
    __class: RobotAttributeClass.MovementModeState;
    value: 'regular' | 'mop' | 'outline';
}

export interface OperationModeState {
    __class: RobotAttributeClass.OperationModeState;
    value: 'vacuum' | 'mop' | 'vacuum_and_mop';
}

// export interface ConsumableState {
//   type: 'filter' | 'brush' | 'sensor' | 'mop';
//   subType: 'none' | 'all' | 'main' | 'side_left' | 'side_right';
//   remaining: {
//     value: number;
//     unit: 'minutes' | 'percent';
//   };
// }

export type RobotAttribute =
    | StatusState
    | BatteryState
    | PresetSelectionState
    | AttachmentState
    | MovementModeState
    | OperationModeState;
