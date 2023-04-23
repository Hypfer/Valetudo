export interface TimerActionControlProps {
    disabled: boolean;
    params: Record<string, unknown>;
    setParams(newParams: Record<string, unknown>): void;
}

export interface TimerPreActionControlProps {
    wasEnabled: boolean;
    params: Record<string, unknown>;
    setParams(valid: boolean, hasParams: boolean, newParams: Record<string, unknown>): void;
}
