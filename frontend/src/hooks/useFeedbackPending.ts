import React from "react";
import {useGetter} from "../utils";

export const useFeedbackPending = (value: any, maxWait: number): [
    boolean,
    (value: boolean) => void,
] => {
    const [pending, setPending] = React.useState(false);
    const [resetTimeout, setResetTimeout] = React.useState<any>();
    const getResetTimeout = useGetter(resetTimeout);

    const setFeedbackPending = (value: boolean) => {
        if (value) {
            setResetTimeout(setTimeout(() => {
                setPending(false);
            }, maxWait));
        } else {
            clearTimeout(getResetTimeout());
        }

        setPending(value);
    };

    React.useEffect(() => {
        clearTimeout(getResetTimeout());

        setPending(false);
    }, [value, getResetTimeout]);



    return [pending, setFeedbackPending];
};
