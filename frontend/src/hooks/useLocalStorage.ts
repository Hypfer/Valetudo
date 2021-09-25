import {useState} from "react";

// Adapted from https://gist.github.com/jamesfulford/a7f1fcead386e76bfd9d36136e0da6da
export const useLocalStorage = <T>(key: string, initialValue: T): [T, (s: T) => void] => {
    const [storedValue, setStoredValue] = useState<T>(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            return initialValue;
        }
    });

    const setValue = (value: T) => {
        try {
            const valueToStore = value instanceof Function ? value(storedValue) : value;
            setStoredValue(valueToStore);
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
        } catch (error) {
            return;
        }
    };

    return [storedValue, setValue];
};
