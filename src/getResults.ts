import { CSVDB, RowObject } from './csvdb.min.js';
import { QuerySpec } from './useQueryBuilder.js';

export function getResults(db: CSVDB, querySpec: QuerySpec) {
  const query = db.query();

  if (Object.keys(querySpec.select).length > 0) {
    const selectObject = Object.fromEntries(
      Object.entries(querySpec.select).map(([alias, value]) => {
        if (value.includes("=>")) {
          const idx = value.indexOf("=>");
          const args = value.substring(0, idx).replace(/^\s*\(|\)\s*$/g, "");
          const body = `return ${value.substring(idx + 2)}`;
          try {
            const f = new Function(args, body) as (row: RowObject) => any;
            return [alias, f];
          }
          catch (e) { }
        }
        return [alias, value];
      })
    );
    query.select(selectObject);
  }

  if (querySpec.where.length > 0) {
    try {
      const f = new Function("row", querySpec.where) as (row: RowObject) => boolean;
      query.where(f);
    }
    catch (e) { }
  }

  if (querySpec.group.length > 0) {
    try {
      const f = new Function("row", querySpec.group) as (row: RowObject) => any;
      query.groupBy(f);
    }
    catch (e) { }
  }

  if (querySpec.order.length > 0) {
    try {
      const f = new Function("rowA", "rowB", querySpec.order) as (rowA: RowObject, rowB: RowObject) => number;
      query.orderBy(f);
    }
    catch (e) { }
  }

  for (const join of querySpec.joins) {
    try {
      const f = new Function("row", join) as (row: RowObject) => RowObject[];
      query.join(f);
    }
    catch (e) { }
  }

  if (querySpec.limit.length > 0) {
    query.fetchFirst(+querySpec.limit);
  }
  else if (db.rowCount > 1000) {
    query.fetchFirst(1000);
  }

  if (querySpec.isDistinct) {
    query.distinct(querySpec.isDistinct);
  }

  let results = [] as RowObject[];

  try {
    results = [...query];
  }
  catch (e) { }
  return results;
}
