import {analyzePage, collectPageSignals} from '../extension/engine.js';
document.getElementById('demo-form').addEventListener('submit', event => event.preventDefault());
document.getElementById('misleading-link').addEventListener('click', event => event.preventDefault());
function run() {
  const result = analyzePage(collectPageSignals());
  document.getElementById('result-title').textContent = {high:'High concern',medium:'Review suggested',low:'No strong warning signs'}[result.level];
  document.getElementById('result-signals').replaceChildren(...result.signals.map(signal => {
    const item = document.createElement('li');
    const title = document.createElement('strong'); title.textContent = signal.title;
    const text = document.createElement('p'); text.textContent = signal.detail;
    item.append(title, text); return item;
  }));
}
document.getElementById('rescan').addEventListener('click', run);
run();
