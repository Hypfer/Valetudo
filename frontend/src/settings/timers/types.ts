export interface TimerActionControlProps {
    disabled: boolean;
    params: Record<string, unknown>;
    setParams(newParams: Record<string, unknown>): void;
}
