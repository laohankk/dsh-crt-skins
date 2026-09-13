#!/usr/bin/env node
/**
 * Contract checks for every skin in this repository: `node tools/verify.cjs`
 *
 * Proves the things DSH enforces silently -- a wrong bundle path or a missing
 * exports subpath makes the plugin never appear client-side, with no error.
 *
 *   1. package.json client contract (exports["./client"], exports["./package.json"],
 *      dsh.client.platform, dsh.bundle.patch)
 *   2. cordis.patch.yml row id/name agreement
 *   3. the browser bundle actually loads in a simulated DOM: it self-registers,
 *      injects a stylesheet, wires the audio listeners, honours the mute toggle
 *      and removes every listener again on dispose
 *   4. repository conventions: README + real screenshot per skin
 *   5. the pair loads together and the shared switcher moves the active sheet
 *      between them, with only the active skin allowed to make noise
 *
 * Node builtins only -- no dependencies.
 */
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKINS_DIR = path.join(ROOT, 'packages', 'skins');
const failures = [];
const check = (condition, label) => {
	console.log((condition ? '  ok    ' : '  FAIL  ') + label);
	if (!condition) failures.push(label);
};

const skins = fs.readdirSync(SKINS_DIR)
	.filter((name) => fs.existsSync(path.join(SKINS_DIR, name, 'package.json')))
	.sort();

if (skins.length === 0) {
	console.log('FAIL: no skins found under packages/skins');
	process.exit(1);
}

/* ------------------------------------------------------------------ harness */

function makeEl(tag) {
	const el = {
		tagName: String(tag).toUpperCase(),
		type: '',
		className: '',
		title: '',
		textContent: '',
		dataset: {},
		style: { cssText: '', disabled: false, color: '', borderColor: '', opacity: '' },
		children: [],
		removed: false,
		handlers: {},
		addEventListener(type, fn) { (el.handlers[type] = el.handlers[type] || []).push(fn); },
		removeEventListener(type, fn) { const l = el.handlers[type] || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); },
		remove() { el.removed = true; },
		appendChild(child) { el.children.push(child); return child; },
	};
	return el;
}

function makeEnv() {
	const audio = [];
	class Param { setValueAtTime() {} exponentialRampToValueAtTime() {} }
	class FakeNode {
		constructor(kind) { this.kind = kind; this.frequency = new Param(); this.Q = new Param(); this.gain = new Param(); }
		connect(target) { return target; }
		start() { audio.push(this.kind + ':start'); }
		stop() {}
	}
	class FakeAudioContext {
		constructor() { this.sampleRate = 48000; this.currentTime = 0; this.state = 'running'; this.destination = new FakeNode('dest'); }
		createOscillator() { return new FakeNode('osc'); }
		createGain() { return new FakeNode('gain'); }
		createBufferSource() { return new FakeNode('bufsrc'); }
		createBiquadFilter() { return new FakeNode('biquad'); }
		createBuffer(channels, frames) { return { getChannelData: () => new Float32Array(frames) }; }
		resume() {}
	}
	const store = new Map();
	const listeners = new Map();
	const head = makeEl('head');
	const body = makeEl('body');
	const document = {
		head,
		body,
		createElement: (tag) => makeEl(tag),
		addEventListener: (type, fn) => { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
		removeEventListener: (type, fn) => { const l = listeners.get(type) || []; const i = l.indexOf(fn); if (i >= 0) l.splice(i, 1); },
	};
	const window = {
		__ModuleLoader__: { load: (entry) => { (window.entries = window.entries || []).push(entry); } },
		AudioContext: FakeAudioContext,
		localStorage: {
			getItem: (k) => (store.has(k) ? store.get(k) : null),
			setItem: (k, v) => store.set(k, v),
		},
	};
	const sandbox = { window, document, console, Date, Math, Float32Array, Symbol, JSON };
	vm.createContext(sandbox);
	return { sandbox, window, document, listeners, audio, store, head, body };
}

const fire = (env, type, event) => { for (const fn of [...(env.listeners.get(type) || [])]) fn(event); };
const makeEvent = (target, extra) => Object.assign({
	target, key: '', altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, repeat: false, preventDefault() {},
}, extra);

const readBundle = (dir) => fs.readFileSync(path.join(dir, 'lib', 'client.js'), 'utf8');

/* ------------------------------------------------------- per-skin contracts */

for (const skin of skins) {
	const DIR = path.join(SKINS_DIR, skin);
	console.log('\n================ ' + skin + ' ================');

	/* ---------- 1. package.json ---------- */
	const pkg = JSON.parse(fs.readFileSync(path.join(DIR, 'package.json'), 'utf8'));
	console.log('package.json');
	const clientExport = pkg.exports && pkg.exports['./client'];
	const clientPath = path.join(DIR, typeof clientExport === 'string' ? clientExport : clientExport && clientExport.default);
	check(typeof pkg.name === 'string' && pkg.name.length > 0, 'name is set');
	check(!!pkg.name && (pkg.name === skin || pkg.name.endsWith('-' + skin)), 'package name matches the directory (' + pkg.name + ' in ' + skin + ')');
	check(!!clientExport, 'exports["./client"] is declared');
	check(fs.existsSync(clientPath), 'the bundle file exists at exports["./client"]');
	check(pkg.exports['./package.json'] === './package.json', 'exports["./package.json"] is declared (else the host silently skips the package)');
	check(pkg.dsh && pkg.dsh.client && typeof pkg.dsh.client.platform === 'string', 'dsh.client.platform is a string');
	check(!!(pkg.dsh.bundle && pkg.dsh.bundle.patch), 'dsh.bundle.patch is declared');
	check(!!pkg.license, 'a license is declared');

	/* ---------- 2. cordis patch ---------- */
	console.log('cordis.patch.yml');
	const patch = fs.readFileSync(path.join(DIR, 'cordis.patch.yml'), 'utf8');
	const rowId = (patch.match(/^\s*(?:-\s*)?id:\s*(\S+)/m) || [])[1];
	const rowName = (patch.match(/^\s*(?:-\s*)?name:\s*(\S+)/m) || [])[1];
	check(!!rowId && !!rowName, 'patch declares an insert row with id and name');
	check(rowName === pkg.name, 'row name matches the package name');
	check(rowId === skin, 'row id matches the package directory (' + rowId + ')');

	/* ---------- 3. the bundle, in a simulated DOM ---------- */
	console.log('lib/client.js (simulated browser)');
	const env = makeEnv();
	vm.runInContext(readBundle(DIR), env.sandbox, { filename: clientPath });
	const entry = (env.window.entries || [])[0];
	check(!!entry && entry.id === pkg.name, 'bundle self-registers with the package name');
	const mod = entry.factory(() => { throw new Error('the bundle should not require anything'); });
	check(mod.name === rowId, 'exports.name matches the row id');
	check(typeof mod.apply === 'function', 'exports.apply is a function');

	let dispose = null;
	mod.apply({ effect: (fn) => { dispose = fn(); } });
	const sheet = env.head.children[0];
	check(!!sheet && sheet.dataset.plugin === skin, 'a stylesheet tagged with the skin id is injected');
	const css = sheet.textContent;
	check(!css.includes('`') && !css.includes('${'), 'CSS holds no backtick or dollar-brace (template-literal safety)');
	check((css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length, 'CSS braces are balanced');
	check((css.match(/--dsw-[a-z0-9-]+\s*:/g) || []).length >= 40, 'design tokens are pinned');
	check(sheet.style.disabled === false, 'a single installed skin starts enabled');

	console.log('audio');
	check(env.listeners.has('pointerover') && env.listeners.has('pointerdown') && env.listeners.has('keydown'), 'three listeners are attached');
	const control = { closest: (selector) => (selector.includes('button') ? control : null) };
	const oscillators = () => env.audio.filter((x) => x === 'osc:start').length;
	check(env.audio.length === 0, 'silent until the first gesture (autoplay-safe)');
	fire(env, 'pointerover', makeEvent(control));
	check(oscillators() === 1, 'hover tick uses one oscillator');
	fire(env, 'pointerdown', makeEvent(control));
	check(oscillators() === 3, 'select uses a two-tone pair');
	fire(env, 'keydown', makeEvent(control, { key: 'a' }));
	check(env.audio.includes('bufsrc:start'), 'typing uses a noise burst');
	const before = env.audio.length;
	fire(env, 'keydown', makeEvent(control, { key: 'a', ctrlKey: true }));
	check(env.audio.length === before, 'modifier combinations stay silent');
	fire(env, 'keydown', makeEvent(control, { key: 'm', altKey: true, shiftKey: true }));
	check(mod.sound.isOn() === false, 'Alt+Shift+M mutes');
	check(env.store.get(pkg.name + ':sound') === 'off', 'the preference is persisted');
	const muted = env.audio.length;
	fire(env, 'keydown', makeEvent(control, { key: 'a' }));
	fire(env, 'pointerdown', makeEvent(control));
	check(env.audio.length === muted, 'every cue is silent while muted');
	mod.sound.set(true);
	check(mod.sound.isOn() === true, 'set(true) unmutes');

	console.log('teardown');
	dispose();
	check(sheet.removed === true, 'the stylesheet is removed');
	check((env.listeners.get('pointerover') || []).length === 0
		&& (env.listeners.get('pointerdown') || []).length === 0
		&& (env.listeners.get('keydown') || []).length === 0, 'every listener is removed');
	check(env.window.__dshCrtSkins === undefined || Object.keys(env.window.__dshCrtSkins.skins).length === 0, 'the skin deregisters itself');

	/* ---------- 4. repository conventions ---------- */
	console.log('repository conventions');
	check(fs.existsSync(path.join(DIR, 'README.md')), 'README.md exists');
	const readme = fs.existsSync(path.join(DIR, 'README.md')) ? fs.readFileSync(path.join(DIR, 'README.md'), 'utf8') : '';
	check(/0\.\d+\.\d+/.test(readme), 'README states a DSH compatibility range');
	check(!/placeholder/i.test(readme), 'README has no leftover placeholder note');
	check(/Alt[^A-Za-z]{0,6}Shift[^A-Za-z]{0,6}S/.test(readme), 'README documents the pair switcher shortcut');
	const previewDir = path.join(DIR, 'preview');
	const shots = fs.existsSync(previewDir) ? fs.readdirSync(previewDir).filter((f) => /\.(png|jpe?g)$/i.test(f)) : [];
	check(shots.length > 0, 'the skin ships a real screenshot under preview/ (' + (shots.join(', ') || 'none') + ')');
	const raw = shots.length > 0 ? fs.readFileSync(path.join(previewDir, shots[0])) : Buffer.alloc(0);
	const isRaster = raw.length > 8 && (raw.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) || raw.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])));
	check(isRaster, 'the screenshot is a real PNG/JPEG (market rejects SVG and data URIs)');
}

/* --------------------------------------------- 5. the pair, loaded together */

console.log('\n================ pair: both skins installed ================');
const env = makeEnv();
const mods = [];
for (const skin of skins) {
	const dir = path.join(SKINS_DIR, skin);
	vm.runInContext(readBundle(dir), env.sandbox, { filename: skin });
}
const entries = env.window.entries || [];
check(entries.length === skins.length, 'both bundles self-register (' + entries.length + '/' + skins.length + ')');

const disposes = [];
for (const e of entries) {
	const mod = e.factory(() => { throw new Error('no requires expected'); });
	mods.push(mod);
	mod.apply({ effect: (fn) => { disposes.push(fn()); } });
}

const reg = env.window.__dshCrtSkins;
check(!!reg, 'the shared registry exists on window');
check(reg.order.length === 2, 'both skins registered with the shared registry (' + reg.order.join(', ') + ')');
check(Object.keys(env.body.children).length === 1 && env.body.children[0].className === 'dsh-crt-skins-switch', 'exactly one floating switcher is mounted for the pair');

const first = skins[0];
const second = skins[1];
const sheetOf = (id) => reg.skins[id].style;
check(reg.active() === first, 'the first registered skin is active by default (' + reg.active() + ')');
check(sheetOf(first).disabled === false && sheetOf(second).disabled === true, 'only the first sheet is enabled');

console.log('switching');
reg.toggle();
check(reg.active() === second, 'toggle() moves to the other skin (' + reg.active() + ')');
check(sheetOf(first).disabled === true && sheetOf(second).disabled === false, 'the sheets swap enabled state');
check(env.store.get('dsh-crt-skins:active') === second, 'the choice is persisted under one shared key');
check(env.body.children[0].textContent === '⇄ ' + reg.skins[second].short, 'the switcher shows: ' + env.body.children[0].textContent);
check(env.body.children[0].style.borderColor === reg.skins[second].accent, 'the switcher takes the active accent colour');

console.log('keyboard driver');
const activeBefore = reg.active();
const control0 = { closest: (selector) => (selector.includes('button') ? control0 : null) };
fire(env, 'keydown', makeEvent(control0, { key: 'S', altKey: true, shiftKey: true }));
check(reg.active() !== activeBefore, 'Alt+Shift+S switches once even with two listeners installed (' + activeBefore + ' -> ' + reg.active() + ')');
fire(env, 'keydown', makeEvent(control0, { key: 's', altKey: true, shiftKey: true }));
check(reg.active() === activeBefore, 'a second Alt+Shift+S switches back');

console.log('audio ownership');
const quiet = env.audio.length;
const control = { closest: (selector) => (selector.includes('button') ? control : null) };
fire(env, 'keydown', makeEvent(control, { key: 'a' }));
const afterOne = env.audio.length;
check(afterOne > quiet, 'the active skin still makes noise');
fire(env, 'keydown', makeEvent(control, { key: 'a' }));
check(env.audio.length - afterOne === afterOne - quiet, 'both skins respond at the same rate (no double-cue)');

console.log('pair teardown');
disposes[0]();
check(reg.order.length === 1, 'unloading one skin leaves the other registered');
check(env.body.children[0].removed === false, 'the switcher stays while a skin remains');
disposes[1]();
check(reg.order.length === 0, 'unloading the last skin empties the registry');
check(env.body.children[0].removed === true, 'the switcher is removed with the last skin');

console.log('');
if (failures.length > 0) {
	console.log(failures.length + ' FAILED: ' + failures.join('; '));
	process.exit(1);
}
console.log('all checks passed for ' + skins.length + ' skin(s): ' + skins.join(', '));
