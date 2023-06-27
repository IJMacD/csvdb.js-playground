import { useState } from 'react'
import { CSVDB, RowObject } from 'csvdb.js';
import './App.css'
import { useSavedState } from './useSavedState';

type SelectObject = { [alias: string]: string };

function App() {
  const [csvText, setCSVText] = useSavedState("csvdb-js-playground.csv", "");

  const [selectFields, setSelectFields] = useSavedState("csvdb-js-playground.select", {} as SelectObject);
  const [newSelectField, setNewSelectField] = useState("");

  const [whereText, setWhereText] = useSavedState("csvdb-js-playground.where", "");

  const [groupText, setGroupText] = useSavedState("csvdb-js-playground.group", "");

  const [orderText, setOrderText] = useSavedState("csvdb-js-playground.order", "");

  const [limitText, setLimitText] = useSavedState("csvdb-js-playground.limit", "");

  const [isDistinct, setIsDistinct] = useSavedState("csvdb-js-playground.distinct", false);

  const [joinTexts, setJoinTexts] = useSavedState("csvdb-js-playground.join", [] as string[]);
  const [newJoinText, setNewJoinText] = useState("");

  const [havingText, setHavingText] = useSavedState("csvdb-js-playground.having", "");

  const [sortText, setSortText] = useSavedState("csvdb-js-playground.sort", "");

  const db = new CSVDB(csvText);

  const query = db.query();

  if (Object.keys(selectFields).length > 0) {
    query.select(selectFields);
  }

  if (whereText.length > 0) {
    try {
      const f = new Function("row", whereText) as (row: RowObject) => boolean;
      query.where(f);
    }
    catch (e) {}
  }

  if (groupText.length > 0) {
    try {
      const f = new Function("row", groupText) as (row: RowObject) => any;
      query.groupBy(f);
    }
    catch (e) {}
  }

  if (orderText.length > 0) {
    try {
      const f = new Function("rowA", "rowB", orderText) as (rowA: RowObject, rowB: RowObject) => number;
      query.orderBy(f);
    }
    catch (e) {}
  }

  for (const join of joinTexts) {
    try {
      const f = new Function("row", join) as (row: RowObject) => RowObject[];
      query.join(f);
    }
    catch (e) {}
  }

  if (limitText.length > 0) {
    query.fetchFirst(+limitText);
  }

  if (isDistinct) {
    query.distinct(isDistinct);
  }

  let results = [] as RowObject[];

  try {
    results = [...query];
  }
  catch (e) {}
  const columns = results.length > 0 ? Object.keys(results[0]) : [];

  if (havingText.length > 0) {
    try {
      const f = new Function("row", havingText) as (row: RowObject) => boolean;
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
      setSelectFields(o => ({ ...o, [newSelectField]: newSelectField }));
      setNewSelectField("");
    }
  }

  function removeSelectItem (alias: string) {
    setSelectFields(({ [alias]: _, ...selectObject }) => selectObject);
  }

  function handleAliasChange (oldAlias: string) {
    const newAlias = prompt("Enter new alias:", oldAlias);
    if (newAlias) {
      setSelectFields(selectFields =>
        Object.fromEntries(
          Object.entries(selectFields).map(([alias, value]) =>
            [(alias === oldAlias) ? newAlias : alias, value]
          )
        )
      );
    }
  }

  function handleJoinSubmit () {
    if (newJoinText.length > 0) {
      setJoinTexts(f => [...f, newJoinText]);
      setNewJoinText("");
    }
  }

  function removeJoin (index: number) {
    setJoinTexts(texts => [ ...texts.slice(0, index), ...texts.slice(index + 1)]);
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
            Object.entries(selectFields).map(([alias,value],i) => <li key={i} onClick={() => handleAliasChange(alias)} style={{cursor:"pointer"}}>{alias}: {value} <button onClick={e => { e.stopPropagation(); removeSelectItem(alias); }} className="btn-xs">❌︎</button></li>)
          }
          </ul>
        </div>
        <div className="clause">
          <label>WHERE
            <code>{'function (row) {'}
              <textarea
                value={whereText}
                onChange={e => setWhereText(e.target.value)}
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
            joinTexts.map((value,i) => <li key={i} onClick={() => removeJoin(i)} style={{cursor:"pointer"}}>row =&gt; {'{'}{value}{'}'}</li>)
          }
          </ul>
        </div>
        <div className="clause">
          <label>GROUP BY
            <code>{'function (row) {'}
              <textarea
                value={groupText}
                onChange={e => setGroupText(e.target.value)}
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
                value={orderText}
                onChange={e => setOrderText(e.target.value)}
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
              value={limitText}
              onChange={e => setLimitText(e.target.value)}
              style={{margin: "0 1em", width: 60}}
            />
            ROWS ONLY
          </label>
        </div>
        <div className="clause">
          <label>DISTINCT
            <input
              type="checkbox"
              checked={isDistinct}
              onChange={e => setIsDistinct(e.target.checked)}
            />
          </label>
        </div>
        <div className="clause">
          <label>HAVING
            <code>{'function (row) {'}
              <textarea
                value={havingText}
                onChange={e => setHavingText(e.target.value)}
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
      <h2>Results</h2>
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
      <p>Row Count: {results.length}</p>
    </>
  )
}

export default App
