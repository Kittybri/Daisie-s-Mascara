import { datasetSummary } from './dataset-summary.js';

const number = new Intl.NumberFormat('en-US');
const percent = new Intl.NumberFormat('en-US', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
const setText = (id, text) => { document.getElementById(id).textContent = String(text); };
const data = datasetSummary;
const missingCount = data.columns.reduce((total, column) => total + column.missingValues, 0);

setText('record-count', number.format(data.recordCount));
setText('column-count', number.format(data.columns.length));
setText('phishing-share', percent.format(data.classCounts.phishing / data.recordCount));
setText('phishing-count', `${number.format(data.classCounts.phishing)} records`);
setText('missing-count', number.format(missingCount));
setText('phishing-total', number.format(data.classCounts.phishing));
setText('legitimate-total', number.format(data.classCounts.legitimate));
setText('url-duplicates', number.format(data.identifiers.URL_ID.duplicateOccurrencesAfterFirst));
setText('domain-duplicates', number.format(data.identifiers.Domain_ID.duplicateOccurrencesAfterFirst));
setText('title-duplicates', number.format(data.identifiers.Title_ID.duplicateOccurrencesAfterFirst));
setText('https-phishing-share', percent.format(data.phishingWithHttps / data.classCounts.phishing));
setText('password-phishing-share', percent.format(data.conditions.find(condition => condition.key === 'password_field').phishingShare));
setText('source-name', data.source.fileName);
setText('source-sheet', data.source.sheet);
setText('profile-date', data.source.profileDate);

const signalRows = document.getElementById('signal-rows');
for (const condition of data.conditions) {
  const row = document.createElement('tr');
  const nameCell = document.createElement('td');
  nameCell.textContent = condition.name;
  const code = document.createElement('code');
  code.className = 'condition-code';
  code.textContent = condition.expression;
  nameCell.append(code);
  row.append(nameCell);
  for (const text of [number.format(condition.matchingRecords), number.format(condition.phishingRecords), percent.format(condition.phishingShare), percent.format(condition.phishingCoverage)]) {
    const cell = document.createElement('td');
    cell.className = 'numeric';
    cell.textContent = text;
    row.append(cell);
  }
  signalRows.append(row);
}

const search = document.getElementById('column-search');
const group = document.getElementById('column-group');
const columnRows = document.getElementById('column-rows');
const groups = [...new Set(data.columns.map(column => column.group))].sort();
for (const name of groups) {
  const option = document.createElement('option');
  option.value = name;
  option.textContent = name;
  group.append(option);
}

function renderColumns() {
  const query = search.value.trim().toLocaleLowerCase('en-US');
  const selected = group.value;
  const columns = data.columns.filter(column => (!query || column.name.toLocaleLowerCase('en-US').includes(query)) && (!selected || column.group === selected));
  const fragment = document.createDocumentFragment();
  for (const column of columns) {
    const row = document.createElement('tr');
    for (const [index, text] of [column.position, column.name, column.group, number.format(column.missingValues)].entries()) {
      const cell = document.createElement('td');
      cell.textContent = String(text);
      if (index === 3) cell.className = 'numeric';
      row.append(cell);
    }
    fragment.append(row);
  }
  columnRows.replaceChildren(fragment);
  setText('column-status', `${number.format(columns.length)} of ${number.format(data.columns.length)} columns`);
  document.getElementById('no-columns').hidden = columns.length > 0;
}

search.addEventListener('input', renderColumns);
group.addEventListener('change', renderColumns);
document.getElementById('reset-columns').addEventListener('click', () => {
  search.value = '';
  group.value = '';
  renderColumns();
  search.focus();
});
renderColumns();
