import { useState } from "react";

export function useSavedState<T> (key: string, initialValue: T): [T, ((newValue: T) => void)] {
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

    function saveState (newState: T|((oldState: T) => T)) {
        if (newState instanceof Function) {
            newState = newState(state);
        }

        setState(newState);

        localStorage.setItem(key, JSON.stringify(newState));
    }

    return [state, saveState];
}