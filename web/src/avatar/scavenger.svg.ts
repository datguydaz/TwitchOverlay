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
    <!-- Near-black plate / vest — neutral gray, no green channel -->
    <linearGradient id="armorOlive" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2a2a"/>
      <stop offset="50%" stop-color="#141414"/>
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
    <!-- Pure neutral gray/black helm — R=G=B, no olive channel -->
    <linearGradient id="helmDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#404040"/>
      <stop offset="45%" stop-color="#1f1f1f"/>
      <stop offset="100%" stop-color="#080808"/>
    </linearGradient>
    <linearGradient id="plateMetal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4c4c4c"/>
      <stop offset="50%" stop-color="#242424"/>
      <stop offset="100%" stop-color="#0c0c0c"/>
    </linearGradient>
    <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a342c"/>
      <stop offset="100%" stop-color="#1c1812"/>
    </linearGradient>
    <clipPath id="visor-clip">
      <rect x="168" y="124" width="64" height="10" rx="1"/>
    </clipPath>
    <!-- Canonical sleeve silhouettes (fill + clip share these) — compact so fabric reads vs bg -->
    <path id="sleeve-left-shape" d="M118 158 Q88 180 78 212 Q76 236 98 246 L114 238 Q96 220 96 200 Q102 178 122 164 Z"/>
    <path id="sleeve-right-shape" d="M282 158 Q308 176 318 204 Q322 226 306 238 L292 230 Q308 214 308 196 Q302 176 278 164 Z"/>
    <clipPath id="clip-sleeve-left" clipPathUnits="userSpaceOnUse">
      <use href="#sleeve-left-shape"/>
    </clipPath>
    <clipPath id="clip-sleeve-right" clipPathUnits="userSpaceOnUse">
      <use href="#sleeve-right-shape"/>
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
      <!-- Black sleeves from shared shapes; stripes clipped to same shapes -->
      <use id="sleeve-left-fill" href="#sleeve-left-shape" fill="#242424" stroke="#0a0a0a" stroke-width="1.4"/>
      <use id="sleeve-right-fill" href="#sleeve-right-shape" fill="#242424" stroke="#0a0a0a" stroke-width="1.4"/>
      <path d="M90 228 Q98 238 108 244" fill="none" stroke="#2e2e2e" stroke-width="9" stroke-linecap="round"/>
      <path d="M308 220 Q304 230 296 236" fill="none" stroke="#2e2e2e" stroke-width="8" stroke-linecap="butt"/>
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
      <!-- Three white track stripes inset on fabric (toward torso), clipped to sleeve shapes -->
      <g id="sleeve-stripes-left" clip-path="url(#clip-sleeve-left)" fill="none" stroke="#f5f5f5" stroke-linecap="round" stroke-width="2.8" opacity="0.95">
        <path d="M100 188 Q92 214 100 238"/>
        <path d="M106 186 Q98 213 106 236"/>
        <path d="M112 184 Q104 212 112 234"/>
      </g>
      <g id="sleeve-stripes-right" clip-path="url(#clip-sleeve-right)" fill="none" stroke="#f5f5f5" stroke-linecap="round" stroke-width="2.6" opacity="0.95">
        <path d="M300 188 Q308 210 300 234"/>
        <path d="M294 186 Q302 209 294 232"/>
        <path d="M288 184 Q296 208 288 230"/>
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
      <rect x="118" y="100" width="32" height="48" rx="12" fill="#242424" stroke="#0a0a0a" stroke-width="1.5"/>
      <rect x="250" y="100" width="32" height="48" rx="12" fill="#242424" stroke="#0a0a0a" stroke-width="1.5"/>
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
        <rect x="168" y="124" width="64" height="10" fill="#181818"/>
        <g id="eye-look">
          <ellipse class="eye-white" cx="186" cy="129" rx="7" ry="3.2" fill="#c8c2b0"/>
          <ellipse class="eye-white" cx="214" cy="129" rx="7" ry="3.2" fill="#c8c2b0"/>
          <circle class="pupil" cx="186" cy="129" r="2.1" fill="#101010"/>
          <circle class="pupil" cx="214" cy="129" r="2.1" fill="#101010"/>
          <circle cx="185.2" cy="128.2" r="0.55" fill="#efe6d2" opacity="0.7"/>
          <circle cx="213.2" cy="128.2" r="0.55" fill="#efe6d2" opacity="0.7"/>
        </g>
        <rect class="eyelid" x="168" y="124" width="64" height="10" fill="#141414" opacity="0"/>
      </g>

      <rect x="162" y="122" width="76" height="14" rx="2" fill="#0a0a0a" opacity="0.35"/>
      <rect id="visor-glow" class="eq-blink" x="168" y="125" width="64" height="8" rx="1" fill="#2a2a2a" opacity="0.45"/>

      <!-- Mouth / filter vent — reacts to mic -->
      <g id="mouth-vent">
        <ellipse cx="200" cy="168" rx="16" ry="10" fill="#161616" stroke="#3a3a3a" stroke-width="1.2"/>
        <circle cx="200" cy="168" r="4" fill="#0a0a0a"/>
        <path id="mouth-slats" d="M190 166 H210 M192 169 H208 M194 172 H206" stroke="#4a4a4a" stroke-width="1" opacity="0.75"/>
      </g>
    </g>

    <!-- Nordic KB facing HIM: spacebar at far edge (toward torso), numbers toward viewer -->
    <g id="prop-keyboard">
      <path d="M78 238 L222 238 L256 288 L44 288 Z" fill="#0c0e0a" stroke="#c4b59a" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M82 241 L218 241 L250 284 L50 284 Z" fill="#161a14"/>
      <!-- Far edge (toward him): &lt; Z X C V [SPC] B N M -->
      <g class="kb-row" fill="#2e362a" stroke="#6b7355" stroke-width="0.6">
        <rect class="kb-deco" x="84" y="243" width="8" height="7.5" rx="1" fill="#252a22"/>
        <g id="kb-s22" class="kb-key" data-slot="22"><rect x="93.5" y="243" width="11.5" height="7.5" rx="1"/><text class="kb-label" x="99.25" y="246.75" font-size="4.2">Z</text></g>
        <g id="kb-s23" class="kb-key" data-slot="23"><rect x="106" y="243" width="11.5" height="7.5" rx="1"/><text class="kb-label" x="111.75" y="246.75" font-size="4.2">X</text></g>
        <g id="kb-s24" class="kb-key" data-slot="24"><rect x="118.5" y="243" width="11.5" height="7.5" rx="1"/><text class="kb-label" x="124.25" y="246.75" font-size="4.2">C</text></g>
        <g id="kb-s25" class="kb-key" data-slot="25"><rect x="131" y="243" width="11.5" height="7.5" rx="1"/><text class="kb-label" x="136.75" y="246.75" font-size="4.2">V</text></g>
        <g id="kb-s26" class="kb-key" data-slot="26"><rect x="143.5" y="243" width="42" height="7.5" rx="1"/><text class="kb-label" x="164.5" y="246.75" font-size="3.6">SPC</text></g>
        <g id="kb-s27" class="kb-key" data-slot="27"><rect x="186.5" y="243" width="11.5" height="7.5" rx="1"/><text class="kb-label" x="192.25" y="246.75" font-size="4.2">B</text></g>
        <g id="kb-s28" class="kb-key" data-slot="28"><rect x="199" y="243" width="11.5" height="7.5" rx="1"/><text class="kb-label" x="204.75" y="246.75" font-size="4.2">N</text></g>
        <g id="kb-s29" class="kb-key" data-slot="29"><rect x="211.5" y="243" width="11.5" height="7.5" rx="1"/><text class="kb-label" x="217.25" y="246.75" font-size="4.2">M</text></g>
      </g>
      <text class="kb-deco-label" x="88" y="246.75" fill="#6b7355" font-family="ui-monospace, Consolas, monospace" font-size="3.4" text-anchor="middle" dominant-baseline="central">&lt;</text>
      <!-- A…LÖÄ -->
      <g class="kb-row" fill="#323a2e" stroke="#8a8070" stroke-width="0.65">
        <g id="kb-s11" class="kb-key" data-slot="11"><rect x="78" y="253" width="12.8" height="8" rx="1"/><text class="kb-label" x="84.4" y="257">A</text></g>
        <g id="kb-s12" class="kb-key" data-slot="12"><rect x="91.8" y="253" width="12.8" height="8" rx="1"/><text class="kb-label" x="98.2" y="257">S</text></g>
        <g id="kb-s13" class="kb-key" data-slot="13"><rect x="105.6" y="253" width="12.8" height="8" rx="1"/><text class="kb-label" x="112" y="257">D</text></g>
        <g id="kb-s14" class="kb-key" data-slot="14"><rect x="119.4" y="253" width="12.8" height="8" rx="1"/><text class="kb-label" x="125.8" y="257">F</text></g>
        <g id="kb-s15" class="kb-key" data-slot="15"><rect x="133.2" y="253" width="12.8" height="8" rx="1"/><text class="kb-label" x="139.6" y="257">G</text></g>
        <g id="kb-s16" class="kb-key" data-slot="16"><rect x="147" y="253" width="12.8" height="8" rx="1"/><text class="kb-label" x="153.4" y="257">H</text></g>
        <g id="kb-s17" class="kb-key" data-slot="17"><rect x="160.8" y="253" width="12.8" height="8" rx="1"/><text class="kb-label" x="167.2" y="257">J</text></g>
        <g id="kb-s18" class="kb-key" data-slot="18"><rect x="174.6" y="253" width="12.8" height="8" rx="1"/><text class="kb-label" x="181" y="257">K</text></g>
        <g id="kb-s19" class="kb-key" data-slot="19"><rect x="188.4" y="253" width="12.8" height="8" rx="1"/><text class="kb-label" x="194.8" y="257">L</text></g>
        <g id="kb-s20" class="kb-key" data-slot="20"><rect x="202.2" y="253" width="12.8" height="8" rx="1"/><text class="kb-label" x="208.6" y="257">Ö</text></g>
        <g id="kb-s21" class="kb-key" data-slot="21"><rect x="216" y="253" width="12.8" height="8" rx="1"/><text class="kb-label" x="222.4" y="257">Ä</text></g>
      </g>
      <!-- Q…PÅ -->
      <g class="kb-row" fill="#3a4434" stroke="#9a8f78" stroke-width="0.65">
        <g id="kb-s0" class="kb-key" data-slot="0"><rect x="68" y="263.5" width="13.5" height="8.2" rx="1"/><text class="kb-label" x="74.75" y="267.6">Q</text></g>
        <g id="kb-s1" class="kb-key" data-slot="1"><rect x="82.5" y="263.5" width="13.5" height="8.2" rx="1"/><text class="kb-label" x="89.25" y="267.6">W</text></g>
        <g id="kb-s2" class="kb-key" data-slot="2"><rect x="97" y="263.5" width="13.5" height="8.2" rx="1"/><text class="kb-label" x="103.75" y="267.6">E</text></g>
        <g id="kb-s3" class="kb-key" data-slot="3"><rect x="111.5" y="263.5" width="13.5" height="8.2" rx="1"/><text class="kb-label" x="118.25" y="267.6">R</text></g>
        <g id="kb-s4" class="kb-key" data-slot="4"><rect x="126" y="263.5" width="13.5" height="8.2" rx="1"/><text class="kb-label" x="132.75" y="267.6">T</text></g>
        <g id="kb-s5" class="kb-key" data-slot="5"><rect x="140.5" y="263.5" width="13.5" height="8.2" rx="1"/><text class="kb-label" x="147.25" y="267.6">Y</text></g>
        <g id="kb-s6" class="kb-key" data-slot="6"><rect x="155" y="263.5" width="13.5" height="8.2" rx="1"/><text class="kb-label" x="161.75" y="267.6">U</text></g>
        <g id="kb-s7" class="kb-key" data-slot="7"><rect x="169.5" y="263.5" width="13.5" height="8.2" rx="1"/><text class="kb-label" x="176.25" y="267.6">I</text></g>
        <g id="kb-s8" class="kb-key" data-slot="8"><rect x="184" y="263.5" width="13.5" height="8.2" rx="1"/><text class="kb-label" x="190.75" y="267.6">O</text></g>
        <g id="kb-s9" class="kb-key" data-slot="9"><rect x="198.5" y="263.5" width="13.5" height="8.2" rx="1"/><text class="kb-label" x="205.25" y="267.6">P</text></g>
        <g id="kb-s10" class="kb-key" data-slot="10"><rect x="213" y="263.5" width="13.5" height="8.2" rx="1"/><text class="kb-label" x="219.75" y="267.6">Å</text></g>
      </g>
      <!-- Near edge (toward viewer): number row fills wide board -->
      <g class="kb-row kb-num" fill="#2a3228" stroke="#6b7355" stroke-width="0.5">
        <rect x="56" y="274.5" width="14.2" height="7.2" rx="0.9"/><rect x="71.2" y="274.5" width="14.2" height="7.2" rx="0.9"/>
        <rect x="86.4" y="274.5" width="14.2" height="7.2" rx="0.9"/><rect x="101.6" y="274.5" width="14.2" height="7.2" rx="0.9"/>
        <rect x="116.8" y="274.5" width="14.2" height="7.2" rx="0.9"/><rect x="132" y="274.5" width="14.2" height="7.2" rx="0.9"/>
        <rect x="147.2" y="274.5" width="14.2" height="7.2" rx="0.9"/><rect x="162.4" y="274.5" width="14.2" height="7.2" rx="0.9"/>
        <rect x="177.6" y="274.5" width="14.2" height="7.2" rx="0.9"/><rect x="192.8" y="274.5" width="14.2" height="7.2" rx="0.9"/>
        <rect x="208" y="274.5" width="14.2" height="7.2" rx="0.9"/><rect x="223.2" y="274.5" width="14.2" height="7.2" rx="0.9"/>
      </g>
      <g class="kb-labels-num" fill="#6b7355" font-family="ui-monospace, Consolas, monospace" font-size="4.6" text-anchor="middle" dominant-baseline="central">
        <text x="63.1" y="278.1">1</text><text x="78.3" y="278.1">2</text><text x="93.5" y="278.1">3</text>
        <text x="108.7" y="278.1">4</text><text x="123.9" y="278.1">5</text><text x="139.1" y="278.1">6</text>
        <text x="154.3" y="278.1">7</text><text x="169.5" y="278.1">8</text><text x="184.7" y="278.1">9</text>
        <text x="199.9" y="278.1">0</text><text x="215.1" y="278.1">+</text><text x="230.3" y="278.1">´</text>
      </g>
      <path d="M60 283.5 L240 283.5" stroke="#c7923a" stroke-width="2" opacity="0.55"/>
    </g>

    <!-- Mouse with scroll wheel + LMB/RMB pads -->
    <g id="prop-mouse">
      <path d="M298 248 Q313 243 328 250 L327 270 Q313 277 299 270 Z" fill="#161a14" stroke="#9a8f78" stroke-width="1.2"/>
      <path id="mouse-lmb" class="mouse-btn mouse-lmb" d="M301 250 Q307 247 312.2 249 L312.2 262 Q307 264 301 262 Z" fill="#1a1c16"/>
      <path id="mouse-rmb" class="mouse-btn mouse-rmb" d="M313.8 249 Q319 247 325 251 L325 263 Q319 265 313.8 262 Z" fill="#1a1c16"/>
      <g id="mouse-wheel" transform-origin="313px 256px">
        <ellipse cx="313" cy="256" rx="2.4" ry="4.2" fill="#2a2e24" stroke="#9a8f78" stroke-width="0.7"/>
        <path d="M313 252.2 V259.8" stroke="#c4b59a" stroke-width="0.7" opacity="0.85"/>
        <path d="M311.2 256 H314.8" stroke="#6b7355" stroke-width="0.55" opacity="0.8"/>
      </g>
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

    <!-- Right hand on mouse — index over LMB, middle over RMB (CSS aims on press) -->
    <g id="hand-right">
      <path d="M298 230 L324 232 L322 247 L300 245 Z" fill="#4a463c" stroke="#1a1810" stroke-width="1" opacity="0.92"/>
      <rect id="finger-lmb" x="304" y="238" width="4.5" height="14" rx="1.5" fill="#3a3630"/>
      <rect id="finger-rmb" x="314" y="239" width="4.5" height="13" rx="1.5" fill="#3a3630"/>
    </g>
  </g>
  </g>
</svg>
`.trim();
