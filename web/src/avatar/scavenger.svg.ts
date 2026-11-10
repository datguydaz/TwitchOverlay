/**
 * Original bulky zone-ops operator (Killa/Maska-inspired vibe only).
 * Fat padded silhouette, dark Maska-style shell + stripe bars, triple sleeve
 * stripes (no brand marks), chest-rig mass, KB+mouse under animatable hands.
 * Layers: #layer-torso #layer-head #eyes #hand-left #hand-right #prop-mouse
 */
/** Hi-res vector base: 3× user-space (1200×1020) so OBS/browser scale stays sharp. */
export const scavengerSvg = `
<svg viewBox="0 0 1200 1020" width="1200" height="1020" xmlns="http://www.w3.org/2000/svg" aria-label="Zone scavenger avatar" role="img" shape-rendering="geometricPrecision">
  <g id="avatar-draw" transform="scale(3)">
  <defs>
    <!-- Near-black plate / tracksuit — no green channel bias -->
    <linearGradient id="armorOlive" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#222222"/>
      <stop offset="50%" stop-color="#121212"/>
      <stop offset="100%" stop-color="#070707"/>
    </linearGradient>
    <linearGradient id="suitDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#151515"/>
      <stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    <linearGradient id="pouchGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#262626"/>
      <stop offset="100%" stop-color="#0e0e0e"/>
    </linearGradient>
    <linearGradient id="helmDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a4034"/>
      <stop offset="100%" stop-color="#141812"/>
    </linearGradient>
    <linearGradient id="plateMetal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a4e44"/>
      <stop offset="50%" stop-color="#2e3228"/>
      <stop offset="100%" stop-color="#1a1c16"/>
    </linearGradient>
    <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a342c"/>
      <stop offset="100%" stop-color="#1c1812"/>
    </linearGradient>
    <clipPath id="visor-clip">
      <rect x="168" y="124" width="64" height="10" rx="1"/>
    </clipPath>
  </defs>

  <ellipse cx="200" cy="318" rx="140" ry="14" fill="#000" opacity="0.45"/>

  <!-- Operator -->
  <g id="operator">
    <!-- DESK — no front-panel lettering -->
    <g id="desk">
      <path d="M28 268 H372 L352 302 H48 Z" fill="url(#deskGrad)" stroke="#5a5348" stroke-width="1.6"/>
      <path d="M48 302 V328 H78 V302 M322 302 V328 H352 V302" fill="#241e18" stroke="#4a443c"/>
      <path d="M36 268 H364" stroke="#6b7355" stroke-width="1.2" opacity="0.5"/>
      <path d="M70 288 H330" stroke="#3a342c" stroke-width="6" opacity="0.55"/>
    </g>

    <!-- TORSO: near-black tracksuit + charcoal vest (no olive on body) -->
    <g id="layer-torso">
      <path d="M78 148 L118 132 L200 124 L282 132 L322 148 L338 236 L62 236 Z" fill="url(#suitDark)" stroke="#050505" stroke-width="1.5"/>
      <path d="M95 165 Q52 200 88 238" fill="none" stroke="#111111" stroke-width="42" stroke-linecap="round"/>
      <!-- Right arm ends ABOVE the hand — no round desk blob that reads as a 2nd mouse -->
      <path d="M305 165 Q328 192 314 222" fill="none" stroke="#111111" stroke-width="34" stroke-linecap="butt"/>
      <path d="M95 165 Q52 200 88 238" fill="none" stroke="#1c1c1c" stroke-width="32" stroke-linecap="round"/>
      <path d="M305 165 Q328 192 314 222" fill="none" stroke="#1c1c1c" stroke-width="26" stroke-linecap="butt"/>
      <path d="M64 185 Q50 210 74 232" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M74 183 Q60 210 84 230" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M84 185 Q72 210 94 228" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M328 185 Q334 200 320 216" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M320 183 Q326 200 314 216" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M312 185 Q318 200 308 216" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M70 218 Q82 230 94 236" fill="none" stroke="#2a2a2a" stroke-width="14" stroke-linecap="round"/>
      <path d="M318 212 Q314 222 310 230" fill="none" stroke="#2a2a2a" stroke-width="11" stroke-linecap="butt"/>
      <!-- Slim near-black vest (vibe only — no logos) -->
      <path d="M108 146 L132 134 L200 128 L268 134 L292 146 L300 220 L100 220 Z" fill="url(#armorOlive)" stroke="#050505" stroke-width="1.4"/>
      <path d="M158 132 Q200 144 242 132 L238 152 Q200 160 162 152 Z" fill="#1a1a1a" stroke="#050505" stroke-width="1"/>
      <g id="shoulder-left" class="shoulder">
        <rect x="72" y="142" width="58" height="32" rx="7" fill="#141414" stroke="#050505" stroke-width="1.2"/>
        <rect x="78" y="150" width="46" height="8" rx="1.5" fill="#0a0a0a" opacity="0.65"/>
      </g>
      <g id="shoulder-right" class="shoulder">
        <rect x="270" y="142" width="58" height="32" rx="7" fill="#141414" stroke="#050505" stroke-width="1.2"/>
        <rect x="276" y="150" width="46" height="8" rx="1.5" fill="#0a0a0a" opacity="0.65"/>
      </g>
      <!-- Slim pouches -->
      <g id="chest-rig">
        <rect x="132" y="176" width="16" height="30" rx="1.5" fill="url(#pouchGrad)" stroke="#050505" stroke-width="0.9"/>
        <rect x="154" y="176" width="16" height="30" rx="1.5" fill="url(#pouchGrad)" stroke="#050505" stroke-width="0.9"/>
        <rect x="230" y="176" width="16" height="30" rx="1.5" fill="url(#pouchGrad)" stroke="#050505" stroke-width="0.9"/>
        <rect x="252" y="176" width="16" height="30" rx="1.5" fill="url(#pouchGrad)" stroke="#050505" stroke-width="0.9"/>
        <path d="M135 181 H145 M157 181 H167 M233 181 H243 M255 181 H265" stroke="#333333" stroke-width="1.1"/>
      </g>
      <rect x="110" y="218" width="180" height="10" rx="1.5" fill="#0c0c0c" stroke="#222222"/>
    </g>

    <!-- HEAD -->
    <g id="layer-head">
      <ellipse cx="200" cy="108" rx="72" ry="58" fill="url(#helmDark)" stroke="#0a0c08" stroke-width="2"/>
      <path d="M188 58 Q200 48 212 58 L208 118 L192 118 Z" fill="#efe6d2"/>
      <path d="M170 64 Q180 52 186 66 L182 120 L168 118 Z" fill="#efe6d2" opacity="0.95"/>
      <path d="M214 66 Q220 52 230 64 L232 118 L218 120 Z" fill="#efe6d2" opacity="0.95"/>
      <rect x="118" y="100" width="32" height="48" rx="12" fill="#2a2e24" stroke="#0a0c08" stroke-width="1.5"/>
      <rect x="250" y="100" width="32" height="48" rx="12" fill="#2a2e24" stroke="#0a0c08" stroke-width="1.5"/>
      <circle cx="134" cy="124" r="7" fill="#121410" stroke="#5a5348"/>
      <circle cx="266" cy="124" r="7" fill="#121410" stroke="#5a5348"/>
      <rect x="144" y="88" width="112" height="92" rx="10" fill="url(#plateMetal)" stroke="#0a0c08" stroke-width="2.2"/>
      <rect x="156" y="94" width="11" height="28" rx="1.5" fill="#efe6d2"/>
      <rect x="174" y="94" width="11" height="28" rx="1.5" fill="#efe6d2"/>
      <rect x="215" y="94" width="11" height="28" rx="1.5" fill="#efe6d2"/>
      <rect x="233" y="94" width="11" height="28" rx="1.5" fill="#efe6d2"/>
      <rect x="156" y="136" width="11" height="38" rx="1.5" fill="#efe6d2"/>
      <rect x="174" y="136" width="11" height="38" rx="1.5" fill="#efe6d2"/>
      <rect x="215" y="136" width="11" height="38" rx="1.5" fill="#efe6d2"/>
      <rect x="233" y="136" width="11" height="38" rx="1.5" fill="#efe6d2"/>

      <!-- Eyes behind visor (clipped); look group moves with idle sway -->
      <g id="eyes" clip-path="url(#visor-clip)">
        <rect x="168" y="124" width="64" height="10" fill="#1a2218"/>
        <g id="eye-look">
          <ellipse class="eye-white" cx="186" cy="129" rx="7" ry="3.2" fill="#c8c2b0"/>
          <ellipse class="eye-white" cx="214" cy="129" rx="7" ry="3.2" fill="#c8c2b0"/>
          <circle class="pupil" cx="186" cy="129" r="2.1" fill="#121410"/>
          <circle class="pupil" cx="214" cy="129" r="2.1" fill="#121410"/>
          <circle cx="185.2" cy="128.2" r="0.55" fill="#efe6d2" opacity="0.7"/>
          <circle cx="213.2" cy="128.2" r="0.55" fill="#efe6d2" opacity="0.7"/>
        </g>
        <rect class="eyelid" x="168" y="124" width="64" height="10" fill="#1a1c16" opacity="0"/>
      </g>

      <rect x="162" y="122" width="76" height="14" rx="2" fill="#0a0c08" opacity="0.35"/>
      <rect id="visor-glow" class="eq-blink" x="168" y="125" width="64" height="8" rx="1" fill="#243020" opacity="0.45"/>

      <!-- Mouth / filter vent — reacts to mic -->
      <g id="mouth-vent">
        <ellipse cx="200" cy="168" rx="16" ry="10" fill="#1a1c16" stroke="#3a3830" stroke-width="1.2"/>
        <circle cx="200" cy="168" r="4" fill="#0a0c08"/>
        <path id="mouth-slats" d="M190 166 H210 M192 169 H208 M194 172 H206" stroke="#4a5240" stroke-width="1" opacity="0.75"/>
      </g>
    </g>

    <!-- Field keyboard — keycaps id=kb-sN match opaque companion slots -->
    <g id="prop-keyboard">
      <rect x="48" y="244" width="196" height="40" rx="3.5" fill="#0c0e0a" stroke="#c4b59a" stroke-width="1.8"/>
      <rect x="54" y="249" width="184" height="30" rx="2" fill="#161a14"/>
      <g class="kb-row" fill="#3a4434" stroke="#9a8f78" stroke-width="0.9">
        <rect id="kb-s0" class="kb-key" data-slot="0" x="60" y="252" width="15" height="11" rx="1.5"/>
        <rect id="kb-s1" class="kb-key" data-slot="1" x="78" y="252" width="15" height="11" rx="1.5"/>
        <rect id="kb-s2" class="kb-key" data-slot="2" x="96" y="252" width="15" height="11" rx="1.5"/>
        <rect id="kb-s3" class="kb-key" data-slot="3" x="114" y="252" width="15" height="11" rx="1.5"/>
        <rect id="kb-s4" class="kb-key" data-slot="4" x="132" y="252" width="15" height="11" rx="1.5"/>
        <rect id="kb-s5" class="kb-key" data-slot="5" x="150" y="252" width="15" height="11" rx="1.5"/>
        <rect id="kb-s6" class="kb-key" data-slot="6" x="168" y="252" width="15" height="11" rx="1.5"/>
        <rect id="kb-s7" class="kb-key" data-slot="7" x="186" y="252" width="15" height="11" rx="1.5"/>
        <rect id="kb-s8" class="kb-key" data-slot="8" x="204" y="252" width="15" height="11" rx="1.5"/>
        <rect id="kb-s9" class="kb-key" data-slot="9" x="222" y="252" width="12" height="11" rx="1.5"/>
      </g>
      <g class="kb-row" fill="#2e362a" stroke="#6b7355" stroke-width="0.8">
        <rect id="kb-s10" class="kb-key" data-slot="10" x="66" y="266" width="14" height="9" rx="1.2"/>
        <rect id="kb-s11" class="kb-key" data-slot="11" x="83" y="266" width="14" height="9" rx="1.2"/>
        <rect id="kb-s12" class="kb-key" data-slot="12" x="100" y="266" width="14" height="9" rx="1.2"/>
        <rect id="kb-s13" class="kb-key" data-slot="13" x="117" y="266" width="52" height="9" rx="1.2"/>
        <rect id="kb-s14" class="kb-key" data-slot="14" x="172" y="266" width="14" height="9" rx="1.2"/>
        <rect id="kb-s15" class="kb-key" data-slot="15" x="189" y="266" width="14" height="9" rx="1.2"/>
        <rect id="kb-s16" class="kb-key" data-slot="16" x="206" y="266" width="14" height="9" rx="1.2"/>
        <rect id="kb-s17" class="kb-key" data-slot="17" x="223" y="266" width="12" height="9" rx="1.2"/>
      </g>
      <rect x="58" y="278" width="176" height="2.5" fill="#c7923a" opacity="0.55"/>
    </g>

    <!-- ONE mouse — amber LMB / RMB pads (press → dark via CSS) -->
    <g id="prop-mouse">
      <path d="M298 248 Q313 243 328 250 L327 270 Q313 277 299 270 Z" fill="#161a14" stroke="#9a8f78" stroke-width="1.2"/>
      <path id="mouse-lmb" class="mouse-btn mouse-lmb" d="M301 250 Q307 247 313 249 L313 268 Q307 271 301 268 Z" fill="#c7923a"/>
      <path id="mouse-rmb" class="mouse-btn mouse-rmb" d="M313 249 Q319 247 325 251 L325 269 Q319 272 313 268 Z" fill="#c7923a"/>
      <path d="M313 248 V269" stroke="#1a1c16" stroke-width="1.4"/>
      <ellipse cx="313" cy="258" rx="2.2" ry="4" fill="#2a2e24" stroke="#6b7355" stroke-width="0.7"/>
    </g>

    <!-- Left hand ON KEYBOARD -->
    <g id="hand-left">
      <path d="M108 228 L148 226 L152 240 L112 244 Z" fill="#4a463c" stroke="#1a1810" stroke-width="1"/>
      <rect x="114" y="242" width="5" height="16" rx="2" fill="#4a463c" stroke="#1a1810" stroke-width="0.6"/>
      <rect x="124" y="240" width="5" height="18" rx="2" fill="#4a463c" stroke="#1a1810" stroke-width="0.6"/>
      <rect x="134" y="242" width="5" height="16" rx="2" fill="#4a463c" stroke="#1a1810" stroke-width="0.6"/>
      <rect x="144" y="244" width="5" height="14" rx="2" fill="#4a463c" stroke="#1a1810" stroke-width="0.6"/>
      <path d="M108 234 L100 230" stroke="#4a463c" stroke-width="4" stroke-linecap="round"/>
    </g>

    <!-- Right hand rests on mouse but leaves LMB/RMB pads readable -->
    <g id="hand-right">
      <path d="M300 232 L322 234 L320 248 L302 246 Z" fill="#4a463c" stroke="#1a1810" stroke-width="1" opacity="0.92"/>
      <rect x="306" y="240" width="4" height="10" rx="1.5" fill="#3a3630" opacity="0.85"/>
      <rect x="314" y="242" width="4" height="9" rx="1.5" fill="#3a3630" opacity="0.85"/>
    </g>
  </g>
  </g>
</svg>
`.trim();
