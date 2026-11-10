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
    <!-- Thick sleeve ribbons — clip keeps stripes on fabric only -->
    <clipPath id="clip-sleeve-left">
      <path d="M118 152 Q70 175 58 210 Q55 235 88 248 L108 242 Q85 225 82 205 Q90 180 122 160 Z"/>
    </clipPath>
    <clipPath id="clip-sleeve-right">
      <path d="M282 152 Q320 170 336 200 Q342 222 318 236 L300 230 Q318 215 320 198 Q312 175 278 160 Z"/>
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
      <!-- Thick black sleeves; stripes inset toward torso + clipped to sleeve fill -->
      <path id="sleeve-left-fill" d="M118 152 Q70 175 58 210 Q55 235 88 248 L108 242 Q85 225 82 205 Q90 180 122 160 Z" fill="#181818" stroke="#050505" stroke-width="1.2"/>
      <path id="sleeve-right-fill" d="M282 152 Q320 170 336 200 Q342 222 318 236 L300 230 Q318 215 320 198 Q312 175 278 160 Z" fill="#181818" stroke="#050505" stroke-width="1.2"/>
      <path d="M82 228 Q92 238 104 244" fill="none" stroke="#222222" stroke-width="11" stroke-linecap="round"/>
      <path d="M312 220 Q308 230 300 236" fill="none" stroke="#222222" stroke-width="10" stroke-linecap="butt"/>
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
      <!-- Track stripes ON sleeves (after shoulders so they read on fabric) -->
      <g id="sleeve-stripes-left" clip-path="url(#clip-sleeve-left)" fill="none" stroke="#f2f2f0" stroke-linecap="butt" stroke-width="2.4">
        <path d="M96 176 Q78 205 94 236"/>
        <path d="M101 174 Q83 204 99 234"/>
        <path d="M106 172 Q88 203 104 232"/>
      </g>
      <g id="sleeve-stripes-right" clip-path="url(#clip-sleeve-right)" fill="none" stroke="#f2f2f0" stroke-linecap="butt" stroke-width="2.2">
        <path d="M304 176 Q318 200 308 228"/>
        <path d="M299 174 Q313 199 303 226"/>
        <path d="M294 172 Q308 198 298 224"/>
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

    <!-- Nordic field KB facing operator — keys fill trapezoid board; id=kb-sN = slots -->
    <g id="prop-keyboard">
      <path d="M68 238 L232 238 L258 288 L42 288 Z" fill="#0c0e0a" stroke="#c4b59a" stroke-width="1.8" stroke-linejoin="round"/>
      <path d="M72 241 L228 241 L252 284 L48 284 Z" fill="#161a14"/>
      <!-- Number row (visual) fills top of board -->
      <g class="kb-row kb-num" fill="#2a3228" stroke="#6b7355" stroke-width="0.5">
        <rect x="74" y="243" width="11.8" height="7" rx="0.9"/><rect x="86.8" y="243" width="11.8" height="7" rx="0.9"/>
        <rect x="99.6" y="243" width="11.8" height="7" rx="0.9"/><rect x="112.4" y="243" width="11.8" height="7" rx="0.9"/>
        <rect x="125.2" y="243" width="11.8" height="7" rx="0.9"/><rect x="138" y="243" width="11.8" height="7" rx="0.9"/>
        <rect x="150.8" y="243" width="11.8" height="7" rx="0.9"/><rect x="163.6" y="243" width="11.8" height="7" rx="0.9"/>
        <rect x="176.4" y="243" width="11.8" height="7" rx="0.9"/><rect x="189.2" y="243" width="11.8" height="7" rx="0.9"/>
        <rect x="202" y="243" width="11.8" height="7" rx="0.9"/><rect x="214.8" y="243" width="11.8" height="7" rx="0.9"/>
      </g>
      <g class="kb-labels-num" fill="#6b7355" font-family="ui-monospace, Consolas, monospace" font-size="4.4" text-anchor="middle" dominant-baseline="central">
        <text x="79.9" y="246.5">1</text><text x="92.7" y="246.5">2</text><text x="105.5" y="246.5">3</text>
        <text x="118.3" y="246.5">4</text><text x="131.1" y="246.5">5</text><text x="143.9" y="246.5">6</text>
        <text x="156.7" y="246.5">7</text><text x="169.5" y="246.5">8</text><text x="182.3" y="246.5">9</text>
        <text x="195.1" y="246.5">0</text><text x="207.9" y="246.5">+</text><text x="220.7" y="246.5">´</text>
      </g>
      <!-- Q…PÅ -->
      <g class="kb-row" fill="#3a4434" stroke="#9a8f78" stroke-width="0.65">
        <g id="kb-s0" class="kb-key" data-slot="0"><rect x="74" y="252" width="13.2" height="8.2" rx="1"/><text class="kb-label" x="80.6" y="256.1">Q</text></g>
        <g id="kb-s1" class="kb-key" data-slot="1"><rect x="88.2" y="252" width="13.2" height="8.2" rx="1"/><text class="kb-label" x="94.8" y="256.1">W</text></g>
        <g id="kb-s2" class="kb-key" data-slot="2"><rect x="102.4" y="252" width="13.2" height="8.2" rx="1"/><text class="kb-label" x="109" y="256.1">E</text></g>
        <g id="kb-s3" class="kb-key" data-slot="3"><rect x="116.6" y="252" width="13.2" height="8.2" rx="1"/><text class="kb-label" x="123.2" y="256.1">R</text></g>
        <g id="kb-s4" class="kb-key" data-slot="4"><rect x="130.8" y="252" width="13.2" height="8.2" rx="1"/><text class="kb-label" x="137.4" y="256.1">T</text></g>
        <g id="kb-s5" class="kb-key" data-slot="5"><rect x="145" y="252" width="13.2" height="8.2" rx="1"/><text class="kb-label" x="151.6" y="256.1">Y</text></g>
        <g id="kb-s6" class="kb-key" data-slot="6"><rect x="159.2" y="252" width="13.2" height="8.2" rx="1"/><text class="kb-label" x="165.8" y="256.1">U</text></g>
        <g id="kb-s7" class="kb-key" data-slot="7"><rect x="173.4" y="252" width="13.2" height="8.2" rx="1"/><text class="kb-label" x="180" y="256.1">I</text></g>
        <g id="kb-s8" class="kb-key" data-slot="8"><rect x="187.6" y="252" width="13.2" height="8.2" rx="1"/><text class="kb-label" x="194.2" y="256.1">O</text></g>
        <g id="kb-s9" class="kb-key" data-slot="9"><rect x="201.8" y="252" width="13.2" height="8.2" rx="1"/><text class="kb-label" x="208.4" y="256.1">P</text></g>
        <g id="kb-s10" class="kb-key" data-slot="10"><rect x="216" y="252" width="13.2" height="8.2" rx="1"/><text class="kb-label" x="222.6" y="256.1">Å</text></g>
      </g>
      <!-- A…LÖÄ -->
      <g class="kb-row" fill="#323a2e" stroke="#8a8070" stroke-width="0.65">
        <g id="kb-s11" class="kb-key" data-slot="11"><rect x="78" y="262.2" width="13.6" height="8.4" rx="1"/><text class="kb-label" x="84.8" y="266.4">A</text></g>
        <g id="kb-s12" class="kb-key" data-slot="12"><rect x="92.6" y="262.2" width="13.6" height="8.4" rx="1"/><text class="kb-label" x="99.4" y="266.4">S</text></g>
        <g id="kb-s13" class="kb-key" data-slot="13"><rect x="107.2" y="262.2" width="13.6" height="8.4" rx="1"/><text class="kb-label" x="114" y="266.4">D</text></g>
        <g id="kb-s14" class="kb-key" data-slot="14"><rect x="121.8" y="262.2" width="13.6" height="8.4" rx="1"/><text class="kb-label" x="128.6" y="266.4">F</text></g>
        <g id="kb-s15" class="kb-key" data-slot="15"><rect x="136.4" y="262.2" width="13.6" height="8.4" rx="1"/><text class="kb-label" x="143.2" y="266.4">G</text></g>
        <g id="kb-s16" class="kb-key" data-slot="16"><rect x="151" y="262.2" width="13.6" height="8.4" rx="1"/><text class="kb-label" x="157.8" y="266.4">H</text></g>
        <g id="kb-s17" class="kb-key" data-slot="17"><rect x="165.6" y="262.2" width="13.6" height="8.4" rx="1"/><text class="kb-label" x="172.4" y="266.4">J</text></g>
        <g id="kb-s18" class="kb-key" data-slot="18"><rect x="180.2" y="262.2" width="13.6" height="8.4" rx="1"/><text class="kb-label" x="187" y="266.4">K</text></g>
        <g id="kb-s19" class="kb-key" data-slot="19"><rect x="194.8" y="262.2" width="13.6" height="8.4" rx="1"/><text class="kb-label" x="201.6" y="266.4">L</text></g>
        <g id="kb-s20" class="kb-key" data-slot="20"><rect x="209.4" y="262.2" width="13.6" height="8.4" rx="1"/><text class="kb-label" x="216.2" y="266.4">Ö</text></g>
        <g id="kb-s21" class="kb-key" data-slot="21"><rect x="224" y="262.2" width="13.6" height="8.4" rx="1"/><text class="kb-label" x="230.8" y="266.4">Ä</text></g>
      </g>
      <!-- &lt; Z X C V [SPC] B N M — fills near edge -->
      <g class="kb-row" fill="#2e362a" stroke="#6b7355" stroke-width="0.6">
        <rect class="kb-deco" x="52" y="272.8" width="10" height="8.6" rx="1" fill="#252a22"/>
        <g id="kb-s22" class="kb-key" data-slot="22"><rect x="63.5" y="272.8" width="13.8" height="8.6" rx="1"/><text class="kb-label" x="70.4" y="277.1">Z</text></g>
        <g id="kb-s23" class="kb-key" data-slot="23"><rect x="78.3" y="272.8" width="13.8" height="8.6" rx="1"/><text class="kb-label" x="85.2" y="277.1">X</text></g>
        <g id="kb-s24" class="kb-key" data-slot="24"><rect x="93.1" y="272.8" width="13.8" height="8.6" rx="1"/><text class="kb-label" x="100" y="277.1">C</text></g>
        <g id="kb-s25" class="kb-key" data-slot="25"><rect x="107.9" y="272.8" width="13.8" height="8.6" rx="1"/><text class="kb-label" x="114.8" y="277.1">V</text></g>
        <g id="kb-s26" class="kb-key" data-slot="26"><rect x="122.7" y="272.8" width="58" height="8.6" rx="1"/><text class="kb-label" x="151.7" y="277.1" font-size="3.9">SPC</text></g>
        <g id="kb-s27" class="kb-key" data-slot="27"><rect x="181.7" y="272.8" width="13.8" height="8.6" rx="1"/><text class="kb-label" x="188.6" y="277.1">B</text></g>
        <g id="kb-s28" class="kb-key" data-slot="28"><rect x="196.5" y="272.8" width="13.8" height="8.6" rx="1"/><text class="kb-label" x="203.4" y="277.1">N</text></g>
        <g id="kb-s29" class="kb-key" data-slot="29"><rect x="211.3" y="272.8" width="13.8" height="8.6" rx="1"/><text class="kb-label" x="218.2" y="277.1">M</text></g>
        <rect class="kb-deco" x="226.1" y="272.8" width="20" height="8.6" rx="1" fill="#252a22"/>
      </g>
      <text class="kb-deco-label" x="57" y="277.1" fill="#6b7355" font-family="ui-monospace, Consolas, monospace" font-size="4" text-anchor="middle" dominant-baseline="central">&lt;</text>
      <text class="kb-deco-label" x="236.1" y="277.1" fill="#6b7355" font-family="ui-monospace, Consolas, monospace" font-size="3.6" text-anchor="middle" dominant-baseline="central">↵</text>
      <path d="M56 285.5 L244 285.5" stroke="#c7923a" stroke-width="2" opacity="0.55"/>
    </g>

    <!-- ONE mouse — amber LMB / RMB pads (press → dark via CSS) -->
    <g id="prop-mouse">
      <path d="M298 248 Q313 243 328 250 L327 270 Q313 277 299 270 Z" fill="#161a14" stroke="#9a8f78" stroke-width="1.2"/>
      <path id="mouse-lmb" class="mouse-btn mouse-lmb" d="M301 250 Q307 247 313 249 L313 268 Q307 271 301 268 Z" fill="#1a1c16"/>
      <path id="mouse-rmb" class="mouse-btn mouse-rmb" d="M313 249 Q319 247 325 251 L325 269 Q319 272 313 268 Z" fill="#1a1c16"/>
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
