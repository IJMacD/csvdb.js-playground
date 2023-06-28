import { useSavedState } from "./useSavedState";

type SelectObject = { [alias: string]: string };

export function useQueryBuilder (key: string) {
    const [query, setQuery] = useSavedState(key, {
        select: {} as SelectObject,
        where: "",
        group: "",
        order: "",
        limit: "",
        isDistinct: false,
        joins: [] as string[],
    });

    function setSelect (stateSetter: (oldValue: SelectObject) => SelectObject) {
        setQuery(oldQuery => {
            return { ...oldQuery, select: stateSetter(oldQuery.select) };
        });
    }

    function setWhere (where: string) {
        setQuery(oldQuery => {
            return { ...oldQuery, where };
        });
    }

    function setGroup (group: string) {
        setQuery(oldQuery => {
            return { ...oldQuery, group };
        });
    }

    function setOrder (order: string) {
        setQuery(oldQuery => {
            return { ...oldQuery, order };
        });
    }

    function setLimit (limitSetter: string|((oldLimit: string) => string)) {
        setQuery(oldQuery => {
            return { ...oldQuery, limit: typeof limitSetter === "string" ? limitSetter: limitSetter(oldQuery.limit) };
        });
    }

    function setIsDistinct (isDistinct: boolean) {
        setQuery(oldQuery => {
            return { ...oldQuery, isDistinct };
        });
    }

    function setJoins (stateSetter: (oldValue: string[]) => string[]) {
        setQuery(oldQuery => {
            return { ...oldQuery, joins: stateSetter(oldQuery.joins) };
        });
    }

    return {
        query,
        setSelect,
        setWhere,
        setGroup,
        setOrder,
        setLimit,
        setIsDistinct,
        setJoins
    };
}