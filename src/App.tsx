import { useEffect, useMemo, useState } from 'react'
import { CSVDB, RowObject } from 'csvdb.js';
import './App.css'
import { useSavedState } from './useSavedState';
import { QuerySpec, useQueryBuilder } from './useQueryBuilder.js';
import { getResults } from './getResults.js';

function App() {
  const [csvText, setCSVText] = useSavedState("csvdb-js-playground.csv", "");

  const [newSelectField, setNewSelectField] = useState("");
  const [newJoinText, setNewJoinText] = useState("");

  const [sortText, setSortText] = useSavedState("csvdb-js-playground.sort", "");

  const [savedQueries, setSavedQueries] = useSavedState("csvdb-js-playground.saved-queries", [] as { name: string, query: QuerySpec }[]);
  const [newSaveName, setNewSaveName] = useState("");

  const {
    query: querySpec,
    setQuery,
    setSelect,
    resetQuery,
    setWhere,
    setGroup,
    setOrder,
    setLimit,
    setIsDistinct,
    setJoins,
    setHaving,
  } = useQueryBuilder("csvdb-js-playground.query");

  const db = useMemo(() => new CSVDB(csvText), [csvText]);

  useEffect(() => {
    if (db.rowCount > 1000) {
      setLimit(limitText => {
        const limit = +limitText;
        if (limitText.length > 0 && !isNaN(limit)) {
          return Math.min(1000, +limit).toString();
        }
        else {
          return "1000";
        }
      });
    }
  }, [db]);

  let results = getResults(db, querySpec);
  const columns = results.length > 0 ? Object.keys(results[0]) : [];

  if (querySpec.having.length > 0) {
    try {
      const f = new Function("row", querySpec.having) as (row: RowObject) => boolean;
      results = results.filter(f);
    }
    catch (e) {}
  }

  if (sortText.length > 0) {
    try {
      const f = new Function("rowA", "rowB", sortText) as (rowA: RowObject, rowB: RowObject) => number;
      results.sort(f);
    }
    catch (e) {}
  }

  async function handleFileChange (e: React.FormEvent<HTMLInputElement>) {
    const currentTarget = e.currentTarget;
    if (currentTarget.files && currentTarget.files.length > 0) {
      const file = currentTarget.files[0];
      const csv = await file.text();
      setCSVText(csv);
      currentTarget.value = "";
    }
  }

  function handleSelectSubmit (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (newSelectField.length > 0) {
      setSelect(o => ({ ...o, [newSelectField]: newSelectField }));
      setNewSelectField("");
    }
  }

  function removeSelectItem (alias: string) {
    setSelect(({ [alias]: _, ...selectObject }) => selectObject);
  }

  function handleAliasChange (oldAlias: string) {
    const newAlias = prompt("Enter new alias:", oldAlias);
    if (newAlias) {
      setSelect(selectFields =>
        Object.fromEntries(
          Object.entries(selectFields).map(([alias, value]) =>
            [(alias === oldAlias) ? newAlias : alias, value]
          )
        )
      );
    }
  }

  function handleColumnChange (alias: string) {
    const oldColumn = querySpec.select[alias];
    const newColumn = prompt("Enter new column definition:", oldColumn);
    if (newColumn) {
      setSelect(selectFields =>
        Object.fromEntries(
          Object.entries(selectFields).map(([a, value]) =>
            [a, (alias === a) ? newColumn : value]
          )
        )
      );
    }
  }

  function handleJoinSubmit () {
    if (newJoinText.length > 0) {
      setJoins(f => [...f, newJoinText]);
      setNewJoinText("");
    }
  }

  function removeJoin (index: number) {
    setJoins(texts => [ ...texts.slice(0, index), ...texts.slice(index + 1)]);
  }

  function handleSaveQuery () {
    if (newSaveName.length > 0) {
      setSavedQueries(queries => [ { name: newSaveName, query: querySpec }, ...queries ]);
      setNewSaveName("");
    }
  }

  function handleRemoveSavedQuery (index: number) {
    setSavedQueries(queries => [ ...queries.slice(0, index), ...queries.slice(index + 1) ]);
  }

  return (
    <>
      <h1>CSVDB.js Playground</h1>
      <textarea
        value={csvText}
        onChange={e => setCSVText(e.target.value)} style={{width: "95%", height: 200}}
        placeholder="Enter CSV"
      />
      <input type="file" onChange={handleFileChange} style={{margin: "0 1em"}} />
      <p>Row Count: {db.rowCount}</p>
      <div className="query-builder">
      <div style={{display:"flex",flexWrap:"wrap"}}>
        <div className="clause" style={{flexDirection:"column"}}>
          <label>SELECT(
            <form onSubmit={handleSelectSubmit} style={{display:"inline-block"}}>
              <input
                value={newSelectField}
                onChange={e => setNewSelectField(e.target.value)}
                placeholder="*"
                style={{width:80}}
              />{' '}
              <button className="btn-xs">Add</button>
            </form>
            )
          </label>
          <ul style={{margin:0,paddingLeft:"1em"}}>
          {
            Object.entries(querySpec.select).map(([alias,value],i) =>
              <li key={i}>
                <span onClick={() => handleAliasChange(alias)} className="select-edit">{alias}</span>: {' '}
                <span onClick={() => handleColumnChange(alias)} className="select-edit">{value}</span> {' '}
                <button onClick={e => { e.stopPropagation(); removeSelectItem(alias); }} className="btn-xs">❌︎</button>
              </li>
            )
          }
          </ul>
        </div>
        <div className="clause">
          <label>WHERE
            <code>{'function (row) {'}
              <textarea
                value={querySpec.where}
                onChange={e => setWhere(e.target.value)}
                style={{display:"block",marginLeft: "2em"}}
                placeholder="return true;"
              />
              {'}'}
            </code>
          </label>
        </div>
        <div className="clause" style={{flexDirection:"column"}}>
          <label>JOIN
            <code>{'function (row) {'}
              <textarea
                value={newJoinText}
                onChange={e => setNewJoinText(e.target.value)}
                style={{display:"block",marginLeft: "2em"}}
                placeholder="return [row];"
              />
              {'}'}
            </code>
            <button className="btn-xs" onClick={handleJoinSubmit}>Add</button>
          </label>
          <ul style={{margin:0,paddingLeft:"1em"}}>
          {
            querySpec.joins.map((value,i) => <li key={i} onClick={() => removeJoin(i)} style={{cursor:"pointer"}}>row =&gt; {'{'}{value}{'}'}</li>)
          }
          </ul>
        </div>
        <div className="clause">
          <label>GROUP BY
            <code>{'function (row) {'}
              <textarea
                value={querySpec.group}
                onChange={e => setGroup(e.target.value)}
                style={{display:"block",marginLeft: "2em"}}
                placeholder="return null;"
              />
              {'}'}
            </code>
          </label>
        </div>
        <div className="clause">
          <label>ORDER BY
            <code>{'function (rowA, rowB) {'}
              <textarea
                value={querySpec.order}
                onChange={e => setOrder(e.target.value)}
                style={{display:"block",marginLeft: "2em"}}
                placeholder="return 0;"
              />
              {'}'}
            </code>
          </label>
        </div>
        <div className="clause">
          <label>FETCH FIRST
            <input
              type="number"
              value={querySpec.limit}
              onChange={e => setLimit(e.target.value)}
              style={{margin: "0 1em", width: 60}}
            />
            ROWS ONLY
          </label>
        </div>
        <div className="clause">
          <label>DISTINCT
            <input
              type="checkbox"
              checked={querySpec.isDistinct}
              onChange={e => setIsDistinct(e.target.checked)}
            />
          </label>
        </div>
        <div className="clause">
          <label>HAVING
            <code>{'function (row) {'}
              <textarea
                  value={querySpec.having}
                  onChange={e => setHaving(e.target.value)}
                style={{display:"block",marginLeft: "2em"}}
                placeholder="return true;"
              />
              {'}'}
            </code>
          </label>
        </div>
        <div className="clause">
          <label>Sort
            <code>{'function (rowA, rowB) {'}
              <textarea
                value={sortText}
                onChange={e => setSortText(e.target.value)}
                style={{display:"block",marginLeft: "2em"}}
                placeholder="return 0;"
              />
              {'}'}
            </code>
          </label>
          </div>
        </div>
        <div className="saved-queries">
          <h3>Saved Queries</h3>
          <ul style={{listStyle:"none",padding:0}}>
            {
              savedQueries.map(({name,query}, i) =>
                <li key={i} style={{cursor:"pointer"}} onClick={() => setQuery(query)}>
                  {name}{' '}
                  <button className="btn-xs" onClick={() => handleRemoveSavedQuery(i)}>❌︎</button>
                </li>
              )
            }
          </ul>
          <form onSubmit={e => {e.preventDefault(); handleSaveQuery()}}>
            <input value={newSaveName} onChange={e => setNewSaveName(e.target.value)} />
            <button className="btn-sm">Save</button>
          </form>
          <button className="btn-sm" onClick={() => resetQuery()}>Clear Query</button>
        </div>
      </div>
      <h2>Results</h2>
      <p>Row Count: {results.length}</p>
      <table>
        <thead>
          <tr>
            {columns.map((col,i) => <th key={i}>{col}</th>)}
          </tr>
        </thead>
        <tbody>
          {
            results.map((row, i) => <tr key={i}>{columns.map((col,j) => <td key={j}>{row[col]}</td>)}</tr>)
          }
        </tbody>
      </table>
    </>
  )
}

export default App
