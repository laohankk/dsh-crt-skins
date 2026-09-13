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
	const document = {
		createElement: () => ({ dataset: {}, textContent: '', removed: false, remove() { this.removed = true; } }),
		head: { appendChild(el) { document._style = el; } },
		addEventListener: (type, fn) => { if (!listeners.has(type)) listeners.set(type, []); listeners.get(type).push(fn); },
		removeEventListener: (type, fn) => { const list = listeners.get(type) || []; const i = list.indexOf(fn); if (i >= 0) list.splice(i, 1); },
	};
	const window = {
		__ModuleLoader__: { load: (entry) => { window._entry = entry; } },
		AudioContext: FakeAudioContext,
		localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, v) },
	};
	const sandbox = { window, document, console, Date, Math, Float32Array, Symbol };
	vm.createContext(sandbox);
	vm.runInContext(fs.readFileSync(clientPath, 'utf8'), sandbox, { filename: clientPath });

	const entry = window._entry;
	check(!!entry && entry.id === pkg.name, 'bundle self-registers with the package name');
	const mod = entry.factory(() => { throw new Error('the bundle should not require anything'); });
	check(mod.name === rowId, 'exports.name matches the row id');
	check(typeof mod.apply === 'function', 'exports.apply is a function');

	let dispose = null;
	mod.apply({ effect: (fn) => { dispose = fn(); } });
	const css = document._style.textContent;
	check(!css.includes('`') && !css.includes('${'), 'CSS holds no backtick or dollar-brace (template-literal safety)');
	check((css.match(/\{/g) || []).length === (css.match(/\}/g) || []).length, 'CSS braces are balanced');
	check((css.match(/--dsw-[a-z0-9-]+\s*:/g) || []).length >= 40, 'design tokens are pinned');

	console.log('audio');
	check(listeners.has('pointerover') && listeners.has('pointerdown') && listeners.has('keydown'), 'three listeners are attached');
	const fire = (type, event) => { for (const fn of [...(listeners.get(type) || [])]) fn(event); };
	const control = { closest: (selector) => (selector.includes('button') ? control : null) };
	const event = (extra) => Object.assign({ target: control, key: '', altKey: false, ctrlKey: false, metaKey: false, shiftKey: false, repeat: false, preventDefault() {} }, extra);
	const oscillators = () => audio.filter((x) => x === 'osc:start').length;
	check(audio.length === 0, 'silent until the first gesture (autoplay-safe)');
	fire('pointerover', event());
	check(oscillators() === 1, 'hover tick uses one oscillator');
	fire('pointerdown', event());
	check(oscillators() === 3, 'select uses a two-tone pair');
	fire('keydown', event({ key: 'a' }));
	check(audio.includes('bufsrc:start'), 'typing uses a noise burst');
	const before = audio.length;
	fire('keydown', event({ key: 'a', ctrlKey: true }));
	check(audio.length === before, 'modifier combinations stay silent');
	fire('keydown', event({ key: 'm', altKey: true, shiftKey: true }));
	check(mod.sound.isOn() === false, 'Alt+Shift+M mutes');
	check(store.get(pkg.name + ':sound') === 'off', 'the preference is persisted');
	const muted = audio.length;
	fire('keydown', event({ key: 'a' }));
	fire('pointerdown', event());
	check(audio.length === muted, 'every cue is silent while muted');
	mod.sound.set(true);
	check(mod.sound.isOn() === true, 'set(true) unmutes');

	console.log('teardown');
	dispose();
	check(document._style.removed === true, 'the stylesheet is removed');
	check((listeners.get('pointerover') || []).length === 0
		&& (listeners.get('pointerdown') || []).length === 0
		&& (listeners.get('keydown') || []).length === 0, 'every listener is removed');

	/* ---------- 4. repository conventions ---------- */
	console.log('repository conventions');
	const readmePath = path.join(DIR, 'README.md');
	check(fs.existsSync(readmePath), 'README.md exists');
	const readme = fs.existsSync(readmePath) ? fs.readFileSync(readmePath, 'utf8') : '';
	check(/0\.\d+\.\d+/.test(readme), 'README states a DSH compatibility range');
	check(!/placeholder/i.test(readme), 'README has no leftover placeholder note');
	const previewDir = path.join(DIR, 'preview');
	const shots = fs.existsSync(previewDir)
		? fs.readdirSync(previewDir).filter((f) => /\.(png|jpe?g)$/i.test(f))
		: [];
	check(shots.length > 0, 'the skin ships a real screenshot under preview/ (' + (shots.join(', ') || 'none') + ')');
	const rawShot = shots.length > 0 ? fs.readFileSync(path.join(previewDir, shots[0])) : Buffer.alloc(0);
	const isRaster = rawShot.length > 8 && (rawShot.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) || rawShot.slice(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])));
	check(isRaster, 'the screenshot is a real PNG/JPEG (market rejects SVG and data URIs)');
}

console.log('');
if (failures.length > 0) {
	console.log(failures.length + ' FAILED: ' + failures.join('; '));
	process.exit(1);
}
console.log('all checks passed for ' + skins.length + ' skin(s): ' + skins.join(', '));
