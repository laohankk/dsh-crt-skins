window.__ModuleLoader__.load({
	id: "dsh-crt-terminal",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region src/client/index.ts
		/** Cordis row name; matches the `id` used in cordis.patch.yml. */
		const name = "crt-terminal";
		/** localStorage key holding the sound preference ("on" / "off"). */
		const SOUND_KEY = "dsh-crt-terminal:sound";
		/**
		* Amber phosphor CRT styling -- the warm half of this pair.
		*
		* Fallout's other classic screen colour, drawn the way a CRT terminal
		* shows it: scanlines, curved-screen vignette and a slow flicker.
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
  --dsw-alias-bg-base: #120b03 !important;
  --dsw-alias-bg-layer-1: #1a1105 !important;
  --dsw-alias-bg-layer-2: #241708 !important;
  --dsw-alias-bg-overlay: #0d0702 !important;
  --dsw-alias-markdown-code-block: #0b0602 !important;
  --dsw-specific-sidebar-fill: #150d04 !important;
  --dsw-specific-input-major: #1a1105 !important;
  --dsw-specific-selector: #2e1d09 !important;
  /* rules */
  --dsw-alias-border-l1: #4a2f0d !important;
  --dsw-alias-border-l2: #ffb648 !important;
  --dsw-alias-border-l2-darkmode-thin: #6b4415 !important;
  --dsw-alias-border-l3: #ffb648 !important;
  /* ink */
  --dsw-alias-brand-primary: #ffb648 !important;
  --dsw-alias-label-primary: #ffd08a !important;
  --dsw-alias-label-primary-dimmed: #e8b264 !important;
  --dsw-alias-label-secondary: #d99a3f !important;
  --dsw-alias-label-tertiary: #a8762c !important;
  --dsw-alias-label-caption: #8a5f21 !important;
  --dsw-alias-label-primary-bluish: #ffd08a !important;
  /* accents: in dark mode the platform routes every info / link / active /
     business accent through DeepSeek blue, which is why the send button,
     the folder icon and links come out blue without these pins. */
  --dsw-static-deepseek-200: #ffd08a !important;
  --dsw-static-deepseek-400: #ffb648 !important;
  --dsw-static-deepseek-450: #ffb648 !important;
  --dsw-static-deepseek-500: #ffb648 !important;
  --dsw-alias-link: #ffb648 !important;
  --dsw-alias-button-info-fill: #ffb648 !important;
  --dsw-alias-button-info-hover: #ffc76b !important;
  --dsw-alias-state-business-primary: #ffb648 !important;
  --dsw-alias-state-business-tertiary: #2e1d09 !important;
  --dsw-alias-brand-primary-new-colorprimary-new-color: #ffb648 !important;
  /* buttons */
  --dsw-alias-button-elevated-fill: #241708 !important;
  --dsw-alias-button-floating-fill: #1a1105 !important;
  --dsw-alias-button-floating-hover: #2e1d09 !important;
  --dsw-alias-interactive-bg-hover: #2e1d09 !important;
  --dsw-alias-interactive-bg-hover-solid: #3a260c !important;
  --dsw-alias-interactive-bg-hover-danger: #3a1a12 !important;
  /* states: warnings move off the amber ramp on purpose -- an alert that is
     also amber carries no signal on an amber screen */
  --dsw-alias-state-error-primary: #ff5c46 !important;
  --dsw-alias-state-success-primary: #7fd14a !important;
  --dsw-alias-state-warn-primary: #ffd166 !important;
  /* chrome */
  --dsw-alias-scrollbar-bg-l2: #4a2f0d !important;
  --dsw-alias-scrollbar-hover-l2: #ffb648 !important;
  --dsh-scrollbar-thumb: #4a2f0d !important;
  --dsh-scrollbar-thumb-hover: #ffb648 !important;
  --dsw-shadow-lv2: 0 0 0 1px rgba(255,182,72,.16), 0 10px 30px rgba(0,0,0,.55) !important;

  background: #120b03 !important;
  color: #ffd08a !important;
  font-family: "Courier New", "Lucida Console", "Consolas", "Menlo", "IBM Plex Mono", monospace !important;
  -webkit-font-smoothing: none;
  font-smooth: never;
}
img, canvas, video, svg { image-rendering: pixelated; }

/* ===================== 2. PHOSPHOR BLOOM ===================== */
/* Controls and headings bloom hard; body copy keeps a light glow so it stays
   legible -- a global heavy bloom makes long text mushy. */
body :where(p, span, div, a, button, input, textarea, h1, h2, h3, h4, h5, h6, li, label, td, th, strong, em, blockquote, small) { text-shadow: 0 0 1px rgba(255,225,170,.45), 0 0 5px rgba(255,200,120,.3), 0 0 12px rgba(255,182,72,.13); }
body :where(h1, h2, h3, h4, h5, h6, button, strong, th) { text-shadow: 0 0 1px rgba(255,240,205,.6), 0 0 6px rgba(255,200,120,.48), 0 0 16px rgba(255,182,72,.26); }
body code, body pre { text-shadow: none; }
body pre { background: #0b0602; border: 1px solid #4a2f0d; }

/* ===================== 3. SQUARE CORNERS ===================== */
/* The hashed classes are DSH CSS-module names; the aria-label selectors are
   the stable, locale-tolerant fallback for the "new session" button. */
[data-composer-card], .hHd-Xa_newSession, .pXSMma_previewBadge,
button[aria-label="新建会话"], button[aria-label="New session"] { border-radius: 3px !important; }
.uV2eYG_add { border-radius: 5px !important; }
/* The send/stop disc is a bright phosphor button but the core CSS hardcodes
   color:#fff for its currentColor glyph, so the glyph must be forced dark. */
.uV2eYG_primary { color: #180d02 !important; }

/* ===================== 4. BOXED PANELS + SELECTION ===================== */
[data-composer-card] { border: 1px solid #ffb648; background: #1a1105; box-shadow: 0 0 0 1px rgba(255,182,72,.18), 0 0 22px rgba(255,182,72,.12), inset 0 0 30px rgba(255,182,72,.04); }
[data-composer-card]::before, [data-composer-card]::after { content: ""; position: absolute; width: 16px; height: 16px; pointer-events: none; z-index: 1; }
[data-composer-card]::before { top: -1px; left: -1px; border-top: 2px solid #ffb648; border-left: 2px solid #ffb648; }
[data-composer-card]::after { bottom: -1px; right: -1px; border-bottom: 2px solid #ffb648; border-right: 2px solid #ffb648; }
/* No CSS in DSH targets these data-* attributes, and none of the elements
   occupy ::before/::after, so the brackets cannot collide with anything.
   position:relative is un-!important and low-specificity on purpose: it only
   applies when a panel declares no position of its own. */
body :where([data-sidebar-right-panel], [data-cordis-panel], [data-queue-dock]) { position: relative; border-radius: 4px !important; box-shadow: inset 0 0 0 1px rgba(255,182,72,.36), 0 0 20px rgba(0,0,0,.45) !important; }
body :where([data-sidebar-right-panel], [data-cordis-panel], [data-queue-dock])::before,
body :where([data-sidebar-right-panel], [data-cordis-panel], [data-queue-dock])::after { content: ""; position: absolute; width: 14px; height: 14px; pointer-events: none; z-index: 2; }
body :where([data-sidebar-right-panel], [data-cordis-panel], [data-queue-dock])::before { top: -1px; left: -1px; border-top: 2px solid #ffb648; border-left: 2px solid #ffb648; }
body :where([data-sidebar-right-panel], [data-cordis-panel], [data-queue-dock])::after { bottom: -1px; right: -1px; border-bottom: 2px solid #ffb648; border-right: 2px solid #ffb648; }
/* Item-list selection: a bright box around the active row. */
body :where([data-files-row], [data-files-entry], [data-trajectory-row-key]):hover { box-shadow: inset 0 0 0 1px rgba(255,190,90,.5) !important; }
body :where([data-files-row], [data-files-entry], [data-trajectory-row-key])[data-selected] { background: rgba(255,182,72,.08) !important; box-shadow: inset 0 0 0 1px #ffc163 !important; }

/* ===================== 5. CRT GLASS ===================== */
/* farthest-corner puts the vignette's 100% stop exactly on the corner, so the
   corners really darken. A percentage size (e.g. 120% 120%) pushes the stop
   off-screen and the vignette becomes almost invisible. */
body::after {
  content: ""; position: fixed; inset: 0; pointer-events: none; z-index: 2147483400;
  background:
    repeating-linear-gradient(0deg, rgba(0,0,0,.16) 0px, rgba(0,0,0,.16) 1px, transparent 1px, transparent 3px),
    radial-gradient(farthest-corner at 50% 50%, transparent 58%, rgba(0,0,0,.22) 80%, rgba(0,0,0,.48) 100%),
    linear-gradient(180deg, rgba(255,182,72,.035) 0%, transparent 10%, transparent 100%),
    linear-gradient(rgba(255,182,72,.022), rgba(255,182,72,.022));
  animation: crt-flicker 5s steps(1, end) infinite;
}
@keyframes crt-flicker { 0%,100%{opacity:1} 41%{opacity:1} 42%{opacity:.86} 43%{opacity:1} 71%{opacity:1} 72%{opacity:.93} 73%{opacity:1} }
@media (prefers-reduced-motion: reduce) { body::after { animation: none !important; } }
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
			tone(ctx, 880, 0.045, 0.03, 0, "square");
			tone(ctx, 1245, 0.05, 0.026, 0.045, "square");
		}
		/** Single very short tick: the pointer moved onto a control. */
		function cueHover() {
			const ctx = audioContext();
			if (ctx === null) return;
			tone(ctx, 660, 0.016, 0.011, 0, "square");
		}
		/**
		* Keystroke, in three weights.
		* @param kind - "type" for a character, "enter" for submission, "back" for deletion.
		*/
		function cueKey(kind) {
			const ctx = audioContext();
			if (ctx === null) return;
			if (kind === "enter") {
				clatter(ctx, 900 + Math.random() * 180, 0.05, 0.075, 0.9);
				tone(ctx, 150, 0.035, 0.03, 0.002, "triangle");
				return;
			}
			if (kind === "back") {
				clatter(ctx, 2700 + Math.random() * 500, 0.035, 0.055, 1.1);
				return;
			}
			clatter(ctx, 2050 + Math.random() * 700, 0.03, 0.05, 1.2);
			tone(ctx, 185 + Math.random() * 40, 0.025, 0.022, 0.002, "triangle");
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
		/**
		* Mount the stylesheet and the audio cues as one disposable effect, so
		* unloading the plugin removes the style tag and every listener again.
		* @param ctx - client plugin context.
		*/
		function apply(ctx) {
			ctx.effect(() => {
				const style = document.createElement("style");
				style.dataset.plugin = "crt-terminal";
				style.textContent = css;
				document.head.appendChild(style);
				let hovered = null;
				let lastTick = 0;
				const onPointerOver = (event) => {
					if (!soundOn) return;
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
					if (soundOn && controlOf(event.target) !== null) cueSelect();
				};
				const onKeyDown = (event) => {
					if (event.altKey && event.shiftKey && event.key.toLowerCase() === "m") {
						event.preventDefault();
						setSound(!soundOn);
						return;
					}
					if (!soundOn || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
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
		/** Console handle: window.dshCrtTerminal.sound.set(false) mutes the cues. */
		window.dshCrtTerminal = { sound: { set: setSound, isOn: isSoundOn } };
		return module.exports;
	}
});
