import { useState } from 'react'
import { CSVDB, RowObject } from 'csvdb.js';
import './App.css'
import { useSavedState } from './useSavedState';

function App() {
  const [csvText, setCSVText] = useSavedState("csvdb-js-playground.csv", "");

  const [selectFields, setSelectFields] = useSavedState("csvdb-js-playground.select", [] as string[]);
  const [newSelectField, setNewSelectField] = useState("");

  const [whereText, setWhereText] = useSavedState("csvdb-js-playground.where", "");

  const [groupText, setGroupText] = useSavedState("csvdb-js-playground.group", "");

  const [orderText, setOrderText] = useSavedState("csvdb-js-playground.order", "");

  const [limitText, setLimitText] = useSavedState("csvdb-js-playground.limit", "");

  const [isDistinct, setIsDistinct] = useSavedState("csvdb-js-playground.distinct", false);

  const [joinTexts, setJoinTexts] = useSavedState("csvdb-js-playground.join", [] as string[]);
  const [newJoinText, setNewJoinText] = useState("");

  const db = new CSVDB(csvText);

  const query = db.query();

  if (selectFields.length > 0) {
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
    setSelectFields(f => [...f, newSelectField]);
    setNewSelectField("");
  }

  function removeSelectItem (index: number) {
    setSelectFields(fields => [ ...fields.slice(0, index), ...fields.slice(index + 1)]);
  }


  function handleJoinSubmit () {
    setJoinTexts(f => [...f, newJoinText]);
    setNewJoinText("");
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
              <button style={{fontSize:"x-small"}}>Add</button>
            </form>
            )
          </label>
          <ul style={{margin:0,paddingLeft:"1em"}}>
          {
            selectFields.map((value,i) => <li key={i} onClick={() => removeSelectItem(i)} style={{cursor:"pointer"}}>{value}: {value}</li>)
          }
          </ul>
        </div>
        <div className="clause">
          <label>WHERE <code>function (row) {'{'}</code>
            <textarea
              value={whereText}
              onChange={e => setWhereText(e.target.value)}
              style={{display:"block",marginLeft: "2em"}}
              placeholder="return true;"
            />
            <code>{'}'}</code>
          </label>
        </div>
        <div className="clause">
          <label>GROUP BY <code>function (row) {'{'}</code>
            <textarea
              value={groupText}
              onChange={e => setGroupText(e.target.value)}
              style={{display:"block",marginLeft: "2em"}}
              placeholder="return null;"
            />
            <code>{'}'}</code>
          </label>
        </div>
        <div className="clause">
          <label>ORDER BY <code>function (rowA, rowB) {'{'}</code>
            <textarea
              value={orderText}
              onChange={e => setOrderText(e.target.value)}
              style={{display:"block",marginLeft: "2em"}}
              placeholder="return 0;"
            />
            <code>{'}'}</code>
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
        <div className="clause" style={{flexDirection:"column"}}>
          <label>JOIN <code>function (row) {'{'}</code>
            <textarea
              value={newJoinText}
              onChange={e => setNewJoinText(e.target.value)}
              style={{display:"block",marginLeft: "2em"}}
              placeholder="return [row];"
            />
            <code>{'}'}</code>
            <button style={{fontSize:"x-small"}} onClick={handleJoinSubmit}>Add</button>
          </label>
          <ul style={{margin:0,paddingLeft:"1em"}}>
          {
            joinTexts.map((value,i) => <li key={i} onClick={() => removeJoin(i)} style={{cursor:"pointer"}}>row =&gt; {'{'}{value}{'}'}</li>)
          }
          </ul>
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
