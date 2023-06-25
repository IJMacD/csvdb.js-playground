import { useState } from 'react'
import { CSVDB, RowObject } from 'csvdb.js';
import './App.css'
import { useSavedState } from './useSavedState';

function App() {
  const [csvText, setCSVText] = useSavedState("csvdb-js-playground.csv", "");

  const [selectFields, setSelectFields] = useSavedState("csvdb-js-playground.select", [] as string[]);
  const [newSelectField, setNewSelectField] = useState("");

  const [whereText, setWhereText] = useSavedState("csvdb-js-playground.where", "");

  const db = new CSVDB(csvText);

  const query = db.query();

  if (selectFields.length > 0) {
    query.select(selectFields);
  }

  if (whereText.length > 0) {
    try {
      const f = new Function("row", whereText);
      query.where(f);
    }
    catch (e) {}
  }

  let results = [] as RowObject[];

  try {
    results = [...query];
  }
  catch (e) {}
  const columns = results.length > 0 ? Object.keys(results[0]) : [];

  function handleSelectSubmit (e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSelectFields(f => [...f, newSelectField]);
    setNewSelectField("");
  }

  function removeSelectItem (index: number) {
    setSelectFields(fields => [ ...fields.slice(0, index), ...fields.slice(index + 1)]);
  }

  return (
    <>
      <h1>CSVDB.js Playground</h1>
      <textarea
        value={csvText}
        onChange={e => setCSVText(e.target.value)} style={{width: 800, height: 200}}
        placeholder="Enter CSV"
      />
      <p>Row Count: {db.rowCount}</p>
      <p>SELECT(
        {
          selectFields.map((value,i) => <span key={i} onClick={() => removeSelectItem(i)} style={{cursor:"pointer"}}>{value}, </span>)
        }
        <form onSubmit={handleSelectSubmit} style={{display:"inline-block"}}>
          <input value={newSelectField} onChange={e => setNewSelectField(e.target.value)}/>{' '}
          <button>Add</button>
        </form>
        )
      </p>
      <p>
        WHERE <code>function (row) {'{'}</code><br/>
        <textarea
          value={whereText}
          onChange={e => setWhereText(e.target.value)}
          style={{marginLeft: "2em"}}
          placeholder="return true;"
        /><br/>
        <code>{'}'}</code>
      </p>
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
