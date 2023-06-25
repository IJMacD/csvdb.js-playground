import { useState } from "react";

type StateSetter<T> = T|((oldState: T) => T);

export function useSavedState<T> (key: string, initialValue: T): [T, ((newValue: StateSetter<T>) => void)] {
    const [state, setState] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved) {
                return JSON.parse(saved);
            }
        }
        catch (e) {}
        return initialValue;
    });

    function saveState (setter: StateSetter<T>) {
        const newState = (setter instanceof Function) ?
            setter(state) :
            setter;

        setState(newState);

        localStorage.setItem(key, JSON.stringify(newState));
    }

    return [state, saveState];
}