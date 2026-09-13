window.__ModuleLoader__.load({
	id: "dsh-pipboy-terminal",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/index.ts
		/** Cordis row name; matches the `id` used in cordis.patch.yml. */
		const name = "pipboy-terminal";
		/** localStorage key holding the sound preference ("on" / "off"). */
		const SOUND_KEY = "dsh-pipboy-terminal:sound";
		/**
		* Pip-Boy green phosphor styling (Fallout 3000 Mk IV look).
		*
		* Differences from the sibling amber CRT theme in this repository:
		*   - the Pip-Boy's classic green ramp instead of the warm amber one
		*   - no scanlines and no flicker: a Pip-Boy screen is stable, the
		*     treatment here is glass sheen plus a bezel hairline
		*   - success holds its own yellow-green, warnings stay amber, errors stay red
		*
		* IMPORTANT: this is a JS template literal. A backtick or a dollar-brace
		* sequence anywhere below would terminate it early and make the whole
		* bundle unparseable, so the browser would silently drop the plugin.
		*/
		const css = `
/* ===================== 1. PALETTE ===================== */
:root { color-scheme: dark !important; }
body {
  /* surfaces */
  --dsw-alias-bg-base: #06130a !important;
  --dsw-alias-bg-layer-1: #0a1a0f !important;
  --dsw-alias-bg-layer-2: #0e2213 !important;
  --dsw-alias-bg-overlay: #050f08 !important;
  --dsw-alias-markdown-code-block: #040a06 !important;
  --dsw-specific-sidebar-fill: #091508 !important;
  --dsw-specific-input-major: #0a1a0f !important;
  --dsw-specific-selector: #12291a !important;
  /* rules */
  --dsw-alias-border-l1: #1c4a2a !important;
  --dsw-alias-border-l2: #39ff88 !important;
  --dsw-alias-border-l2-darkmode-thin: #2c6b3f !important;
  --dsw-alias-border-l3: #39ff88 !important;
  /* ink */
  --dsw-alias-brand-primary: #39ff88 !important;
  --dsw-alias-label-primary: #a7ffb6 !important;
  --dsw-alias-label-primary-dimmed: #8ce8a8 !important;
  --dsw-alias-label-secondary: #5fd483 !important;
  --dsw-alias-label-tertiary: #3f9a5f !important;
  --dsw-alias-label-caption: #2f7a49 !important;
  --dsw-alias-label-primary-bluish: #a7ffb6 !important;
  /* accents: in dark mode the platform routes every info / link / active /
     business accent through DeepSeek blue, which is why the send button,
     the folder icon and links come out blue without these pins. */
  --dsw-static-deepseek-200: #a7ffb6 !important;
  --dsw-static-deepseek-400: #39ff88 !important;
  --dsw-static-deepseek-450: #39ff88 !important;
  --dsw-static-deepseek-500: #2fd97a !important;
  --dsw-alias-link: #4dffa0 !important;
  --dsw-alias-button-info-fill: #39ff88 !important;
  --dsw-alias-button-info-hover: #6bffa4 !important;
  --dsw-alias-state-business-primary: #39ff88 !important;
  --dsw-alias-state-business-tertiary: #12291a !important;
  --dsw-alias-brand-primary-new-colorprimary-new-color: #39ff88 !important;
  /* buttons */
  --dsw-alias-button-elevated-fill: #0e2213 !important;
  --dsw-alias-button-floating-fill: #0a1a0f !important;
  --dsw-alias-button-floating-hover: #12291a !important;
  --dsw-alias-interactive-bg-hover: #12291a !important;
  --dsw-alias-interactive-bg-hover-solid: #16321f !important;
  --dsw-alias-interactive-bg-hover-danger: #3a1a12 !important;
  /* states: success keeps the Pip-Boy green, errors stay red -- an alert that
     is also amber carries no signal on an amber screen */
  --dsw-alias-state-error-primary: #ff5c46 !important;
  --dsw-alias-state-success-primary: #7fd14a !important;
  --dsw-alias-state-warn-primary: #ffd166 !important;
  /* chrome */
  --dsw-alias-scrollbar-bg-l2: #1c4a2a !important;
  --dsw-alias-scrollbar-hover-l2: #39ff88 !important;
  --dsh-scrollbar-thumb: #1c4a2a !important;
  --dsh-scrollbar-thumb-hover: #39ff88 !important;
  --dsw-shadow-lv2: 0 0 0 1px rgba(57,255,136,.16), 0 10px 30px rgba(0,0,0,.6) !important;

  background: #06130a !important;
  color: #a7ffb6 !important;
  font-family: "Lucida Console", "Courier New", "Consolas", "Menlo", "IBM Plex Mono", monospace !important;
  -webkit-font-smoothing: none;
  font-smooth: never;
}
img, canvas, video, svg { image-rendering: pixelated; }

/* ===================== 2. PHOSPHOR BLOOM ===================== */
/* Controls and headings bloom hard; body copy keeps a light glow so it stays
   legible -- a global heavy bloom makes long text mushy. */
body :where(p, span, div, a, button, input, textarea, h1, h2, h3, h4, h5, h6, li, label, td, th, strong, em, blockquote, small) { text-shadow: 0 0 1px rgba(160,255,200,.45), 0 0 5px rgba(57,255,136,.28), 0 0 12px rgba(77,255,143,.12); }
body :where(h1, h2, h3, h4, h5, h6, button, strong, th) { text-shadow: 0 0 1px rgba(200,255,220,.6), 0 0 6px rgba(57,255,136,.46), 0 0 16px rgba(77,255,143,.24); }
body code, body pre { text-shadow: none; }
body pre { background: #040a06; border: 1px solid #1c4a2a; }

/* ===================== 3. SQUARE CORNERS ===================== */
/* The hashed classes are DSH CSS-module names; the aria-label selectors are
   the stable, locale-tolerant fallback for the "new session" button. */
[data-composer-card], .hHd-Xa_newSession, .pXSMma_previewBadge,
button[aria-label="新建会话"], button[aria-label="New session"] { border-radius: 3px !important; }
.uV2eYG_add { border-radius: 5px !important; }
/* The send/stop disc is a bright green button but the core CSS hardcodes
   color:#fff for its currentColor glyph, so the glyph must be forced dark. */
.uV2eYG_primary { color: #04180c !important; }

/* ===================== 4. BOXED PANELS + SELECTION ===================== */
/* Pip-Boy bezels: a bright green rule with corner brackets, the way the
   in-game device frames its panels. */
[data-composer-card] { border: 1px solid #39ff88; background: #0a1a0f; box-shadow: 0 0 0 1px rgba(57,255,136,.18), 0 0 22px rgba(77,255,143,.12), inset 0 0 30px rgba(57,255,136,.04); }
[data-composer-card]::before, [data-composer-card]::after { content: ""; position: absolute; width: 16px; height: 16px; pointer-events: none; z-index: 1; }
[data-composer-card]::before { top: -1px; left: -1px; border-top: 2px solid #6bffa4; border-left: 2px solid #6bffa4; }
[data-composer-card]::after { bottom: -1px; right: -1px; border-bottom: 2px solid #6bffa4; border-right: 2px solid #6bffa4; }
/* No CSS in DSH targets these data-* attributes, and none of the elements
   occupy ::before/::after, so the brackets cannot collide with anything.
   position:relative is un-!important and low-specificity on purpose: it only
   applies when a panel declares no position of its own. */
body :where([data-sidebar-right-panel], [data-cordis-panel], [data-queue-dock]) { position: relative; border-radius: 4px !important; box-shadow: inset 0 0 0 1px rgba(57,255,136,.36), 0 0 20px rgba(0,0,0,.5) !important; }
body :where([data-sidebar-right-panel], [data-cordis-panel], [data-queue-dock])::before,
body :where([data-sidebar-right-panel], [data-cordis-panel], [data-queue-dock])::after { content: ""; position: absolute; width: 14px; height: 14px; pointer-events: none; z-index: 2; }
body :where([data-sidebar-right-panel], [data-cordis-panel], [data-queue-dock])::before { top: -1px; left: -1px; border-top: 2px solid #6bffa4; border-left: 2px solid #6bffa4; }
body :where([data-sidebar-right-panel], [data-cordis-panel], [data-queue-dock])::after { bottom: -1px; right: -1px; border-bottom: 2px solid #6bffa4; border-right: 2px solid #6bffa4; }
/* Item-list selection: a bright box around the active row. */
body :where([data-files-row], [data-files-entry], [data-trajectory-row-key]):hover { box-shadow: inset 0 0 0 1px rgba(77,255,160,.5) !important; }
body :where([data-files-row], [data-files-entry], [data-trajectory-row-key])[data-selected] { background: rgba(57,255,136,.08) !important; box-shadow: inset 0 0 0 1px #4dffa0 !important; }

/* ===================== 5. PIP-BOY GLASS ===================== */
/* No scanlines and no flicker on purpose -- the sibling green CRT theme owns
   that treatment. This one is a stable green screen behind thick glass:
   a soft vignette, a warm top sheen and a hairline bezel.
   farthest-corner puts the vignette's 100% stop exactly on the corner, so the
   corners really darken; a percentage size pushes the stop off-screen. */
body::before {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 2147483399;
  box-shadow: inset 0 0 0 1px rgba(57,255,136,.10), inset 0 0 70px rgba(0,255,120,.05);
}
body::after {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 2147483400;
  background:
    radial-gradient(farthest-corner at 50% 50%, transparent 62%, rgba(0,40,10,.20) 82%, rgba(0,0,0,.46) 100%),
    linear-gradient(180deg, rgba(77,255,160,.06) 0%, transparent 13%, transparent 100%),
    linear-gradient(rgba(57,255,136,.018), rgba(57,255,136,.018));
}
`;
		//#region audio
		/**
		* Terminal audio cues, synthesized on the fly with the Web Audio API.
		*
		* This is an independent implementation: three cues (select, hover tick,
		* keystroke) built from enveloped oscillators and one band-passed noise
		* burst. There are no audio files and nothing is fetched over the network.
		*
		* The AudioContext is created lazily on the first cue, which also satisfies
		* the browser autoplay rule -- audio cannot start before a user gesture.
		*/
		let audio = null;
		let noiseFrame = null;
		let soundOn = true;
		try {
			soundOn = window.localStorage.getItem(SOUND_KEY) !== "off";
		} catch (error) {
			soundOn = true;
		}
		/**
		* Read (and lazily create) the shared AudioContext.
		* @returns the context, or null when the browser has no Web Audio.
		*/
		function audioContext() {
			const Ctor = window.AudioContext || window.webkitAudioContext;
			if (Ctor === void 0) return null;
			if (audio === null) audio = new Ctor();
			if (audio.state === "suspended") void audio.resume();
			return audio;
		}
		/**
		* A short decaying noise buffer, reused across every keystroke.
		* @param ctx - the audio context that owns the buffer.
		* @returns the cached buffer.
		*/
		function noiseBuffer(ctx) {
			if (noiseFrame !== null) return noiseFrame;
			const frames = Math.max(1, Math.floor(ctx.sampleRate * 0.05));
			const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
			const samples = buffer.getChannelData(0);
			for (let i = 0; i < frames; i += 1) samples[i] = (Math.random() * 2 - 1) * (1 - i / frames);
			noiseFrame = buffer;
			return buffer;
		}
		/**
		* One enveloped oscillator burst.
		* @param ctx - the audio context.
		* @param hz - oscillator frequency.
		* @param seconds - burst length.
		* @param gain - peak gain.
		* @param delay - offset from now.
		* @param type - oscillator waveform.
		*/
		function tone(ctx, hz, seconds, gain, delay, type) {
			const start = ctx.currentTime + delay + 0.02;
			const osc = ctx.createOscillator();
			const amp = ctx.createGain();
			osc.type = type;
			osc.frequency.setValueAtTime(hz, start);
			amp.gain.setValueAtTime(0.0001, start);
			amp.gain.exponentialRampToValueAtTime(gain, start + 0.006);
			amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
			osc.connect(amp);
			amp.connect(ctx.destination);
			osc.start(start);
			osc.stop(start + seconds + 0.03);
		}
		/**
		* One band-passed noise burst: the mechanical half of a keypress.
		* @param ctx - the audio context.
		* @param hz - band centre frequency.
		* @param seconds - burst length.
		* @param gain - peak gain.
		* @param q - filter resonance.
		*/
		function clatter(ctx, hz, seconds, gain, q) {
			const start = ctx.currentTime + 0.012;
			const source = ctx.createBufferSource();
			source.buffer = noiseBuffer(ctx);
			const band = ctx.createBiquadFilter();
			band.type = "bandpass";
			band.frequency.setValueAtTime(hz, start);
			band.Q.setValueAtTime(q, start);
			const amp = ctx.createGain();
			amp.gain.setValueAtTime(0.0001, start);
			amp.gain.exponentialRampToValueAtTime(gain, start + 0.004);
			amp.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
			source.connect(band);
			band.connect(amp);
			amp.connect(ctx.destination);
			source.start(start);
		}
		/** Rising two-tone confirmation: a control was activated. */
		function cueSelect() {
			const ctx = audioContext();
			if (ctx === null) return;
			tone(ctx, 620, 0.05, 0.03, 0, "square");
			tone(ctx, 930, 0.055, 0.026, 0.05, "square");
		}
		/** Single very short tick: the pointer moved onto a control. */
		function cueHover() {
			const ctx = audioContext();
			if (ctx === null) return;
			tone(ctx, 520, 0.016, 0.011, 0, "square");
		}
		/**
		* Keystroke, in three weights.
		* @param kind - "type" for a character, "enter" for submission, "back" for deletion.
		*/
		function cueKey(kind) {
			const ctx = audioContext();
			if (ctx === null) return;
			if (kind === "enter") {
				clatter(ctx, 780 + Math.random() * 160, 0.055, 0.075, 0.9);
				tone(ctx, 132, 0.04, 0.03, 0.002, "triangle");
				return;
			}
			if (kind === "back") {
				clatter(ctx, 2400 + Math.random() * 480, 0.035, 0.055, 1.1);
				return;
			}
			clatter(ctx, 1850 + Math.random() * 650, 0.03, 0.05, 1.2);
			tone(ctx, 165 + Math.random() * 36, 0.028, 0.022, 0.002, "triangle");
		}
		/**
		* Turn the cues on or off and remember the choice.
		* @param on - the new preference.
		*/
		function setSound(on) {
			soundOn = on === true;
			try {
				window.localStorage.setItem(SOUND_KEY, soundOn ? "on" : "off");
			} catch (error) {
				/* storage unavailable (private mode): the preference stays in memory */
			}
			if (soundOn) cueSelect();
		}
		/** @returns whether the cues are currently enabled. */
		function isSoundOn() {
			return soundOn;
		}
		/** Controls worth a tick or a confirm sound. */
		const CONTROL_SELECTOR = "button,[role=\"button\"],a[href],summary,label[for]";
		/**
		* The interactive control an event target belongs to.
		* @param node - the event target.
		* @returns the control, or null when the target is not inside one.
		*/
		function controlOf(node) {
			if (node === null || node === void 0 || typeof node.closest !== "function") return null;
			return node.closest(CONTROL_SELECTOR);
		}
		//#endregion
		//#region skin coordination
		/**
		* Both skins in this repository are meant to be installed together, but only
		* one may be active at a time: they pin the same design tokens with
		* !important, so two enabled sheets produce last-one-wins flicker instead of
		* a blend. The pair coordinates through one shared localStorage key and a
		* registry on window, and either bundle can drive the switcher.
		*/
		const ACTIVE_KEY = "dsh-crt-skins:active";
		/** This skin's identity, as shown by the shared switcher. */
		const SKIN = { id: "pipboy-terminal", label: "Pip-Boy 绿", short: "PIP", accent: "#39ff88" };
		/**
		* The shared registry. Whichever skin loads first creates it and the other
		* reuses the very same object, which is what makes the pair switchable.
		* @returns the registry.
		*/
		function registry() {
			if (window.__dshCrtSkins !== void 0) return window.__dshCrtSkins;
			const skins = {};
			const order = [];
			const api = {
				skins,
				order,
				button: null,
				/** Show the next registered skin. */
				toggle() {
					if (order.length < 2) return;
					const at = order.indexOf(api.active());
					api.setActive(order[(at + 1) % order.length]);
				},
				/** @returns the id of the skin that should be showing. */
				active() {
					let id = "";
					try {
						id = window.localStorage.getItem(ACTIVE_KEY) || "";
					} catch (error) {
						id = "";
					}
					return skins[id] === void 0 ? order[0] || "" : id;
				},
				/**
				* @param id - the skin to show.
				*/
				setActive(id) {
					if (skins[id] === void 0) return;
					try {
						window.localStorage.setItem(ACTIVE_KEY, id);
					} catch (error) {
						/* storage unavailable: the choice lasts for this page only */
					}
					api.paint();
					for (const key of order) skins[key].onActive(id);
				},
				/** Enable exactly one sheet, then refresh the switcher chrome. */
				paint() {
					const id = api.active();
					for (const key of order) {
						const entry = skins[key];
						entry.active = key === id;
						entry.style.disabled = !entry.active;
					}
					api.render();
				},
				/** Repaint the floating switcher. */
				render() {
					if (api.button === null) return;
					const entry = skins[api.active()];
					if (entry === void 0) return;
					api.button.textContent = "⇄ " + entry.short;
					api.button.title = "皮肤：" + entry.label + "（点击切换，Alt+Shift+S）";
					api.button.style.color = entry.accent;
					api.button.style.borderColor = entry.accent;
				},
				/** Mount the floating switcher, once per page and only when it can do something. */
				mount() {
					if (api.button !== null || order.length < 2) return;
					if (document.body === void 0 || document.body === null) return;
					const b = document.createElement("button");
					b.type = "button";
					b.className = "dsh-crt-skins-switch";
					b.style.cssText = "position:fixed;right:14px;bottom:14px;z-index:2147483500;padding:4px 10px;border-radius:3px;border:1px solid;background:rgba(0,0,0,.75);font:12px/1.6 \'Lucida Console\',\'Courier New\',monospace;letter-spacing:.5px;cursor:pointer;opacity:.5";
					b.addEventListener("pointerenter", () => {
						b.style.opacity = "1";
					});
					b.addEventListener("pointerleave", () => {
						b.style.opacity = ".5";
					});
					b.addEventListener("click", (event) => {
						event.preventDefault();
						event.stopPropagation();
						api.toggle();
						announce();
					});
					document.body.appendChild(b);
					api.button = b;
					api.render();
				},
				/**
				* @param entry - {id, label, short, accent, style, onActive}
				*/
				register(entry) {
					skins[entry.id] = entry;
					if (!order.includes(entry.id)) order.push(entry.id);
					api.paint();
					api.mount();
				},
				/**
				* @param id - the skin being unloaded.
				*/
				unregister(id) {
					delete skins[id];
					const at = order.indexOf(id);
					if (at >= 0) order.splice(at, 1);
					if (order.length === 0) api.teardown();
					else api.paint();
				},
				/** Last skin gone: drop the switcher with it. */
				teardown() {
					if (api.button !== null) {
						api.button.remove();
						api.button = null;
					}
				}
			};
			window.__dshCrtSkins = api;
			return api;
		}
		/** Two-tone blip when the pair is switched, so the change is audible too. */
		function announce() {
			const ctx = audioContext();
			if (ctx === null || !soundOn) return;
			tone(ctx, 380, 0.04, 0.03, 0, "square");
			tone(ctx, 560, 0.05, 0.026, 0.045, "square");
		}
		//#endregion
		/**
		* Mount the stylesheet, the switcher entry and the audio cues as one
		* disposable effect, so unloading the plugin removes the style tag, the
		* switcher entry and every listener again.
		* @param ctx - client plugin context.
		*/
		function apply(ctx) {
			ctx.effect(() => {
				const style = document.createElement("style");
				style.dataset.plugin = "pipboy-terminal";
				style.dataset.skin = "pipboy-terminal";
				style.textContent = css;
				document.head.appendChild(style);
				const reg = registry();
				/** Only the active skin may make noise. */
				const mine = () => reg.active() === SKIN.id;
				reg.register({
					id: SKIN.id,
					label: SKIN.label,
					short: SKIN.short,
					accent: SKIN.accent,
					style,
					onActive: () => {}
				});
				let hovered = null;
				let lastTick = 0;
				const onPointerOver = (event) => {
					if (!soundOn || !mine()) return;

					const control = controlOf(event.target);
					if (control === null) {
						hovered = null;
						return;
					}
					if (control === hovered) return;
					hovered = control;
					const now = Date.now();
					if (now - lastTick < 60) return;
					lastTick = now;
					cueHover();
				};
				const onPointerDown = (event) => {
					if (soundOn && mine() && controlOf(event.target) !== null) cueSelect();
				};
				const onKeyDown = (event) => {
					if (event.altKey && event.shiftKey) {
						const combo = event.key.toLowerCase();
						if (combo === "s") {
							event.preventDefault();
							/* Both installed bundles see this keypress. Only the first one may
							   drive the pair, or the two toggles cancel each other out. */
							if (reg.order[0] === SKIN.id) {
								reg.toggle();
								announce();
							}
							return;
						}
						if (combo === "m") {
							event.preventDefault();
							setSound(!soundOn);
							return;
						}
					}
					if (!soundOn || !mine() || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
					if (event.key === "Enter") {
						cueKey("enter");
						return;
					}
					if (event.key === "Backspace") {
						cueKey("back");
						return;
					}
					if (event.key.length === 1) cueKey("type");
				};
				document.addEventListener("pointerover", onPointerOver, true);
				document.addEventListener("pointerdown", onPointerDown, true);
				document.addEventListener("keydown", onKeyDown, true);
				return () => {
					style.remove();
					reg.unregister(SKIN.id);
					document.removeEventListener("pointerover", onPointerOver, true);
					document.removeEventListener("pointerdown", onPointerDown, true);
					document.removeEventListener("keydown", onKeyDown, true);
				};
			});
		}
		//#endregion
		exports.apply = apply;
		exports.name = name;
		exports.sound = { set: setSound, isOn: isSoundOn };
		/** Console handle: window.__dshCrtSkins.toggle() switches the pair. */
		window.dshPipboyTerminal = { sound: { set: setSound, isOn: isSoundOn }, skin: SKIN, registry };
		return module.exports;
	}
});
