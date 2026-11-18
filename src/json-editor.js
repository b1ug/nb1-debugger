import {EditorState, StateEffect} from '@codemirror/state';
import {EditorView, Decoration, WidgetType, ViewPlugin, keymap, lineNumbers} from '@codemirror/view';
import {bracketMatching, indentOnInput, indentUnit, syntaxHighlighting, HighlightStyle} from '@codemirror/language';
import {defaultKeymap, history, historyKeymap, isolateHistory} from '@codemirror/commands';
import {json} from '@codemirror/lang-json';
import {tags} from '@lezer/highlight';

// This editor decorates author text. Requests still use its unchanged text.
const mounted = new WeakMap();
const translate = text => window.nb1Locale?.translate(text) || text;
const colorRefresh = StateEffect.define();
const maxColorSamples = 2050;
const hex6 = /^#[0-9a-f]{6}$/;
function localHex(value) {
  if (typeof value !== 'string') return null;
  if (/^#[0-9a-fA-F]{6}$/.test(value)) return value.toLowerCase();
  if (/^#[0-9a-fA-F]{3}$/.test(value)) return '#' + [...value.slice(1)].map(c => c + c).join('').toLowerCase();
  return null;
}

function inspectJSON(text) {
  const diagnostics = [], colors = [], tokens = [], stop = {};
  let position = 0;
  const issue = (message, from, to = from + 1) => { if (diagnostics.length < 20) diagnostics.push({message, from, to: Math.min(to, text.length)}); };
  const fail = (message, from = position, to = from + 1) => { issue(message, from, to); throw stop; };
  const whitespace = () => { while (position < text.length && /[ \t\r\n]/.test(text[position])) position++; };
  const token = (type, from, value) => {
    if (tokens.length >= 100000) fail('This draft is too large for local JSON checks.', from, position);
    const item = {type, from, to: position, raw: text.slice(from, position), value}; tokens.push(item); return item;
  };
  function punctuation(char) {
    whitespace();
    if (text[position] !== char) fail(char === ':' ? "Expected ':' after the property name." : 'Unexpected JSON punctuation.');
    const from = position++; return token(char, from);
  }
  function string() {
    const from = position++;
    while (position < text.length) {
      const char = text[position++];
      if (char === '"') {
        const value = JSON.parse(text.slice(from, position));
        for (let i = 0; i < value.length; i++) {
          const code = value.charCodeAt(i);
          if (code >= 0xd800 && code <= 0xdbff) {
            const low = value.charCodeAt(++i);
            if (!(low >= 0xdc00 && low <= 0xdfff)) { issue('JSON strings need complete Unicode characters.', from, position); break; }
          } else if (code >= 0xdc00 && code <= 0xdfff) { issue('JSON strings need complete Unicode characters.', from, position); break; }
        }
        return token('string', from, value);
      }
      if (char === '\\') {
        const escaped = text[position++];
        if (escaped === 'u') {
          if (!/^[0-9a-fA-F]{4}$/.test(text.slice(position, position + 4))) fail('Invalid Unicode escape in JSON string.', position - 2, position + 4);
          position += 4;
        } else if (!escaped || !'"\\/bfnrt'.includes(escaped)) fail('Invalid escape in JSON string.', position - 2, position);
      } else if (char.charCodeAt(0) < 32) fail('Unescaped control character in JSON string.', position - 1, position);
    }
    fail('Unterminated JSON string.', from, text.length);
  }
  function value(depth) {
    whitespace();
    if (depth > 64) fail('JSON nesting exceeds 64 levels.');
    const char = text[position], from = position;
    if (char === '"') return string();
    if (char === '{') {
      punctuation('{'); whitespace(); const seen = new Set();
      if (text[position] === '}') { punctuation('}'); return {type: 'object', from, to: position}; }
      for (;;) {
        whitespace();
        if (text[position] !== '"') fail('Expected a property name in double quotes.');
        const name = string();
        if (seen.has(name.value)) issue('Duplicate property: ' + JSON.stringify(name.value) + '.', name.from, name.to);
        seen.add(name.value); punctuation(':'); const child = value(depth + 1);
        if (name.value === 'color' && colors.length <= maxColorSamples) colors.push({from: child.from, to: child.to, raw: child.raw === undefined ? text.slice(child.from, child.to) : child.raw, value: child.value});
        whitespace();
        if (text[position] === '}') { punctuation('}'); return {type: 'object', from, to: position}; }
        if (text[position] !== ',') fail("Expected ',' or '}'.");
        punctuation(',');
      }
    }
    if (char === '[') {
      punctuation('['); whitespace();
      if (text[position] === ']') { punctuation(']'); return {type: 'array', from, to: position}; }
      for (;;) {
        value(depth + 1); whitespace();
        if (text[position] === ']') { punctuation(']'); return {type: 'array', from, to: position}; }
        if (text[position] !== ',') fail("Expected ',' or ']'.");
        punctuation(',');
      }
    }
    const number = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/.exec(text.slice(position));
    if (number) { position += number[0].length; return token('number', from); }
    for (const literal of ['true', 'false', 'null']) if (text.startsWith(literal, position)) { position += literal.length; return token(literal, from); }
    fail('Expected a JSON value.');
  }
  if (text.length > 1048576) return {diagnostics: [{from: 0, to: 1, message: 'This draft is too large for local JSON checks.'}], colors, tokens};
  try {
    whitespace();
    if (position === text.length) fail('Enter a JSON object to begin.', 0, 0);
    const root = value(0); whitespace();
    if (position !== text.length) fail('Unexpected text after the JSON value.');
    if (root.type !== 'object') issue('Use one JSON object for a Sequence.', 0, Math.max(1, text.length));
  } catch (error) { if (error !== stop) throw error; }
  return {diagnostics: diagnostics.slice(0, 20), colors, tokens};
}

// Only whitespace between tokens changes. Number spelling, string escapes,
// property order and every authored token remain byte-for-byte intact.
function formatJSON(text, analysis = inspectJSON(text)) {
  if (analysis.diagnostics.length) return null;
  let output = '', depth = 0;
  for (let i = 0; i < analysis.tokens.length; i++) {
    const current = analysis.tokens[i], previous = analysis.tokens[i - 1], next = analysis.tokens[i + 1];
    if (current.type === '{' || current.type === '[') {
      output += current.raw; depth++;
      if (next?.type !== '}' && next?.type !== ']') output += '\n' + '  '.repeat(depth);
    } else if (current.type === '}' || current.type === ']') {
      depth--;
      if (previous?.type !== '{' && previous?.type !== '[') output += '\n' + '  '.repeat(depth);
      output += current.raw;
    } else if (current.type === ',') output += ',\n' + '  '.repeat(depth);
    else if (current.type === ':') output += ': ';
    else output += current.raw;
  }
  return output;
}

class ColorChip extends WidgetType {
  constructor(color, label) { super(); this.color = color; this.label = label; }
  eq(other) { return this.color === other.color && this.label === other.label; }
  toDOM() {
    const chip = document.createElement('span');
    chip.className = 'nb1-json-color-chip'; chip.style.backgroundColor = this.color;
    chip.title = this.label; chip.dataset.color = this.color; chip.setAttribute('aria-hidden', 'true'); return chip;
  }
  ignoreEvent() { return true; }
}

const highlight = HighlightStyle.define([
  {tag: tags.propertyName, class: 'nb1-json-key'},
  {tag: tags.string, class: 'nb1-json-string'},
  {tag: tags.number, class: 'nb1-json-number'},
  {tag: [tags.bool, tags.null], class: 'nb1-json-literal'},
  {tag: tags.punctuation, class: 'nb1-json-punctuation'}
]);

function mount(textarea, options = {}) {
  if (mounted.has(textarea)) return mounted.get(textarea);
  const shell = document.createElement('div'); shell.className = 'nb1-json-editor';
  const toolbar = document.createElement('div'); toolbar.className = 'nb1-json-toolbar';
  const format = document.createElement('button'); format.type = 'button'; format.className = 'text-button'; format.textContent = 'Format JSON';
  const toggle = document.createElement('button'); toggle.type = 'button'; toggle.className = 'text-button'; toggle.textContent = 'Plain text'; toggle.setAttribute('aria-pressed', 'false');
  toolbar.append(format, toggle);
  const host = document.createElement('div'); host.className = 'nb1-json-code'; host.dataset.i18nSkip = '';
  const footer = document.createElement('div'); footer.className = 'nb1-json-status'; footer.dataset.i18nSkip = '';
  const status = document.createElement('span'); status.id = textarea.id + '-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
  const goTo = document.createElement('button'); goTo.type = 'button'; goTo.className = 'text-button nb1-json-goto';
  footer.append(status, goTo);
  const help = document.createElement('p'); help.className = 'footnote nb1-json-help'; help.textContent = 'JSON syntax is checked in this browser. Color samples use local nb1. Preview validates the Sequence and device. Tab leaves the editor.';
  const colorStatus = document.createElement('p'); colorStatus.className = 'nb1-json-status nb1-json-color-status'; colorStatus.dataset.i18nSkip = ''; colorStatus.hidden = true;
  textarea.before(shell); shell.append(toolbar, host, textarea, footer, colorStatus, help);
  textarea.setAttribute('aria-describedby', status.id); textarea.dataset.i18nSkip = '';
  const label = document.querySelector('label[for="' + textarea.id + '"]');
  let view = null, plain = false, suppress = false, cachedText = null, cached = null, statusTimer = null;
  let colorTimer = null, colorGeneration = 0, colorRun = null, destroyed = false;
  const colorCache = new Map(), colorResults = new Map();
  const resolver = typeof options.resolveColor === 'function' ? options.resolveColor : null;
  const analysis = (text = textarea.value) => { if (cachedText !== text) { cachedText = text; cached = inspectJSON(cachedText); } return cached; };
  function showStatus() {
    clearTimeout(statusTimer);
    const current = analysis(), first = current.diagnostics[0];
    shell.dataset.valid = String(!first);
    format.disabled = Boolean(first);
    goTo.hidden = !first; goTo.textContent = translate('Go to error');
    let message;
    if (first) {
      const before = textarea.value.slice(0, first.from), line = before.split('\n').length, column = first.from - before.lastIndexOf('\n');
      message = translate('Line ' + line + ', column ' + column + ': ' + first.message);
    } else message = translate('JSON syntax is valid. Preview checks the Sequence rules.');
    if (status.textContent !== message) status.textContent = message;
    textarea.setAttribute('aria-invalid', String(Boolean(first)));
    view?.contentDOM.setAttribute('aria-invalid', String(Boolean(first)));
  }
  function colorEntry(raw) {
    const entry = colorResults.get(raw) || colorCache.get(raw);
    if (!entry || entry.expires <= Date.now()) return null;
    if (colorCache.has(raw)) { colorCache.delete(raw); colorCache.set(raw, entry); }
    return entry;
  }
  function remember(raw, entry) {
    colorResults.set(raw, entry); colorCache.delete(raw); colorCache.set(raw, entry);
    while (colorCache.size > 256) colorCache.delete(colorCache.keys().next().value);
  }
  function colorMessage(message) {
    colorStatus.hidden = !message; colorStatus.dataset.source = message;
    const rendered = translate(message);
    if (colorStatus.textContent !== rendered) colorStatus.textContent = rendered;
  }
  function cancelColors() {
    clearTimeout(colorTimer); colorTimer = null; colorGeneration++;
    if (colorRun) for (const controller of colorRun.controllers) controller.abort();
    colorRun = null;
  }
  function paintColors() {
    if (view && !destroyed) view.dispatch({effects: colorRefresh.of(colorGeneration)});
  }
  function resolveColors() {
    if (destroyed || !view || plain) return;
    const current = analysis();
    if (current.diagnostics.length) { colorMessage(''); return; }
    const unique = new Map();
    for (const color of current.colors) if (!localHex(color.value)) unique.set(color.raw, color);
    for (const raw of [...colorResults.keys()]) if (!unique.has(raw)) colorResults.delete(raw);
    if (!unique.size) { colorMessage(''); paintColors(); return; }
    if (current.colors.length > maxColorSamples) { colorMessage('This draft has too many color samples. Preview checks the color fields.'); return; }
    const pending = [...unique].filter(([raw]) => !colorEntry(raw));
    if (!pending.length) {
      colorMessage([...unique].some(([raw]) => !colorEntry(raw)?.color) ? 'Some color samples are unavailable. Preview checks the color fields.' : 'Color samples match the local nb1 resolver.');
      paintColors(); return;
    }
    if (!resolver) { colorMessage('Color samples need the local nb1 service.'); return; }
    const run = {generation: colorGeneration, queue: pending, active: 0, controllers: new Set()}; colorRun = run;
    colorMessage('Resolving color samples with local nb1…');
    function pump() {
      if (destroyed || colorRun !== run || run.generation !== colorGeneration) return;
      while (run.active < 4 && run.queue.length) {
        const [raw, candidate] = run.queue.shift(), controller = new AbortController();
        run.active++; run.controllers.add(controller);
        Promise.resolve().then(() => {
          if (new TextEncoder().encode(raw).length > 4096) throw Error('Color input exceeds the local resolver limit');
          return resolver(raw, controller.signal);
        }).then(color => {
          if (!hex6.test(color)) throw Error('Invalid color resolver response');
          if (colorRun === run && run.generation === colorGeneration) remember(raw, {color, expires: typeof candidate.value === 'string' && candidate.value.startsWith('@') ? Date.now() + 5000 : Infinity});
        }).catch(() => {
          if (!controller.signal.aborted && colorRun === run && run.generation === colorGeneration) remember(raw, {color: null, expires: Date.now() + 2000});
        }).finally(() => {
          run.active--; run.controllers.delete(controller);
          if (destroyed || colorRun !== run || run.generation !== colorGeneration) return;
          paintColors();
          if (!run.active && !run.queue.length) {
            colorMessage([...unique].some(([key]) => !colorEntry(key)?.color) ? 'Some color samples are unavailable. Preview checks the color fields.' : 'Color samples match the local nb1 resolver.');
          } else pump();
        });
      }
    }
    pump();
  }
  function scheduleColors() {
    cancelColors();
    colorTimer = setTimeout(resolveColors, 200);
  }
  function refreshColors() {
    for (const [raw, entry] of colorCache) if (entry.expires !== Infinity) colorCache.delete(raw);
    for (const [raw, entry] of colorResults) if (entry.expires !== Infinity) colorResults.delete(raw);
    scheduleColors(); paintColors();
  }
  function changed() {
    clearTimeout(statusTimer); statusTimer = setTimeout(showStatus, 120);
  }
  function markers(text) {
    const current = analysis(text), ranges = [];
    for (const candidate of current.colors) {
      const color = !current.diagnostics.length && (localHex(candidate.value) || colorEntry(candidate.raw)?.color);
      if (color) {
        const label = localHex(candidate.value) === color && typeof candidate.value === 'string' && candidate.value.toLowerCase() === color ? color : (typeof candidate.value === 'string' ? candidate.value : candidate.raw) + ' → ' + color;
        ranges.push(Decoration.widget({widget: new ColorChip(color, label), side: -1}).range(candidate.from));
      }
    }
    for (const diagnostic of current.diagnostics) {
      const from = Math.min(diagnostic.from, Math.max(0, text.length - 1)), to = Math.max(from + 1, diagnostic.to);
      if (text.length) ranges.push(Decoration.mark({class: 'nb1-json-error'}).range(from, Math.min(to, text.length)));
    }
    return Decoration.set(ranges, true);
  }
  const decorations = ViewPlugin.fromClass(class {
    constructor(view) { this.decorations = markers(view.state.doc.toString()); }
    update(update) {
      if (update.docChanged) scheduleColors();
      if (update.docChanged || update.transactions.some(transaction => transaction.effects.some(effect => effect.is(colorRefresh)))) this.decorations = markers(update.state.doc.toString());
    }
  }, {decorations: plugin => plugin.decorations});
  function notify() { textarea.dispatchEvent(new Event('input', {bubbles: true})); }
  function setValue(value, emit = true) {
    if (typeof value !== 'string') throw TypeError('JSON editor value must be text');
    textarea.value = value;
    if (view && view.state.doc.toString() !== value) {
      suppress = true;
      try { view.dispatch({changes: {from: 0, to: view.state.doc.length, insert: value}, annotations: isolateHistory.of('full')}); }
      finally { suppress = false; }
    }
    showStatus(); scheduleColors(); if (emit) notify();
  }
  function setPlainText(next) {
    if (!view) next = true;
    plain = next; host.hidden = plain; textarea.hidden = !plain; toggle.setAttribute('aria-pressed', String(plain));
    if (label) label.htmlFor = plain ? textarea.id : textarea.id + '-content';
    if (plain) textarea.focus();
    else { view?.requestMeasure(); view?.focus(); scheduleColors(); }
  }
  // Do not let native contenteditable events create a second author change.
  // The synchronized textarea event is the single existing integration path.
  host.addEventListener('input', event => event.stopPropagation());
  host.addEventListener('change', event => event.stopPropagation());
  textarea.addEventListener('input', () => {
    if (view && view.state.doc.toString() !== textarea.value) {
      suppress = true;
      try { view.dispatch({changes: {from: 0, to: view.state.doc.length, insert: textarea.value}}); }
      finally { suppress = false; }
    }
    changed();
  });
  try {
    const nonce = document.querySelector('meta[name="nb1-style-nonce"]')?.content;
    view = new EditorView({parent: host, state: EditorState.create({doc: textarea.value, extensions: [
      lineNumbers(), history(), json(), syntaxHighlighting(highlight), bracketMatching(), indentOnInput(), indentUnit.of('  '),
      keymap.of([...defaultKeymap, ...historyKeymap]), EditorView.lineWrapping,
      EditorView.contentAttributes.of({id: textarea.id + '-content', 'aria-label': translate('Sequence JSON editor'), 'aria-describedby': status.id, 'data-i18n-skip': ''}),
      ...(nonce && nonce !== '__NB1_STYLE_NONCE__' ? [EditorView.cspNonce.of(nonce)] : []), decorations,
      EditorView.updateListener.of(update => {
        if (!update.docChanged) return;
        textarea.value = update.state.doc.toString();
        changed(); if (!suppress) notify();
      })
    ]})});
    textarea.hidden = true;
    if (label) label.htmlFor = textarea.id + '-content';
  } catch (_) {
    view?.destroy(); view = null; host.hidden = true; textarea.hidden = false; plain = true; toggle.disabled = true; toggle.setAttribute('aria-pressed', 'true');
    const note = document.createElement('p'); note.className = 'footnote'; note.textContent = 'The enhanced editor could not start. Plain text remains available.'; toolbar.after(note);
  }
  format.addEventListener('click', () => {
    const formatted = formatJSON(textarea.value, analysis());
    if (formatted !== null && formatted !== textarea.value) setValue(formatted);
    if (plain) textarea.focus(); else view?.focus();
  });
  toggle.addEventListener('click', () => setPlainText(!plain));
  label?.addEventListener('click', event => { if (!plain && view) { event.preventDefault(); view.focus(); } });
  goTo.addEventListener('click', () => {
    const first = analysis().diagnostics[0]; if (!first) return;
    if (plain || !view) { textarea.focus(); textarea.setSelectionRange(first.from, first.to); }
    else { view.dispatch({selection: {anchor: first.from, head: first.to}, scrollIntoView: true}); view.focus(); }
  });
  function localeChanged() {
    colorMessage(colorStatus.dataset.source || '');
    if (view) view.contentDOM.setAttribute('aria-label', translate('Sequence JSON editor'));
    showStatus();
  }
  document.addEventListener('nb1-locale-change', localeChanged);
  host.addEventListener('focusin', scheduleColors);
  window.addEventListener('pagehide', cancelColors);
  showStatus(); scheduleColors();
  const api = Object.freeze({
    getValue: () => textarea.value, setValue, setPlainText, refreshColors,
    focus: () => plain ? textarea.focus() : view?.focus(),
    getDiagnostics: () => analysis().diagnostics.map(item => ({...item})),
    destroy: () => { destroyed = true; clearTimeout(statusTimer); cancelColors(); window.removeEventListener('pagehide', cancelColors); host.removeEventListener('focusin', scheduleColors); document.removeEventListener('nb1-locale-change', localeChanged); view?.destroy(); textarea.hidden = false; mounted.delete(textarea); }
  });
  mounted.set(textarea, api); return api;
}

window.NB1JSONEditor = Object.freeze({mount});
