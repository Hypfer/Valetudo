import React from 'react';

export const useHTMLElement = <E extends HTMLElement, T>(
    defaultValue: T,
    mapper: (element: E) => T
): [React.MutableRefObject<E | null>, T] => {
    const [value, setValue] = React.useState<T>(defaultValue);
    const nodeRef = React.useRef<E>(null);

    React.useEffect(() => {
        if (nodeRef.current) {
            let cancel = false;
            const update = () => {
                if (!cancel && nodeRef.current) {
                    setValue(mapper(nodeRef.current));
                }
            };

            window.requestAnimationFrame(update);
            window.addEventListener('resize', update);

            return () => {
                window.removeEventListener('resize', update);
                cancel = true;
            };
        }
    }, [mapper]);

    return [nodeRef, value];
};
