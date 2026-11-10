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
      <!-- Slight table wear: crack + scuffs -->
      <g id="desk-wear" fill="none" stroke-linecap="round">
        <path d="M96 276 Q118 278 132 274 Q148 271 168 277" stroke="#1a1610" stroke-width="1.1" opacity="0.55"/>
        <path d="M118 275 L124 279" stroke="#0c0a08" stroke-width="0.7" opacity="0.45"/>
        <path d="M250 272 Q268 276 286 273" stroke="#2a241c" stroke-width="0.9" opacity="0.4"/>
        <path d="M300 280 L318 284" stroke="#1c1812" stroke-width="0.8" opacity="0.35"/>
        <path d="M78 292 Q90 294 102 291" stroke="#181410" stroke-width="0.7" opacity="0.3"/>
      </g>
    </g>

    <!-- TORSO: slim seated body only under vest — NO cloak/cape/wing behind arms -->
    <g id="layer-torso">
      <path d="M124 152 L140 138 L200 132 L260 138 L276 152 L282 216 L118 216 Z" fill="url(#suitDark)" stroke="#050505" stroke-width="1.5"/>
      <!-- Thick black sleeves (stroke arms) — Killa track vibe; draw BEFORE vest so vest overlaps shoulders -->
      <path id="sleeve-left-fill" d="M108 170 Q78 202 96 238" fill="none" stroke="#0e0e0e" stroke-width="38" stroke-linecap="round"/>
      <path id="sleeve-right-fill" d="M292 170 Q318 198 308 230" fill="none" stroke="#0e0e0e" stroke-width="32" stroke-linecap="butt"/>
      <!-- THREE white Adidas-style track stripes ON black arms — locked to loved placement (do not shift with desk work) -->
      <g id="sleeve-stripes-left" fill="none" stroke="#f5f5f3" stroke-linecap="butt" stroke-width="2.8">
        <path d="M108 170 Q78 202 96 238" transform="translate(3 0)"/>
        <path d="M108 170 Q78 202 96 238" transform="translate(8 0)"/>
        <path d="M108 170 Q78 202 96 238" transform="translate(13 0)"/>
      </g>
      <g id="sleeve-stripes-right" fill="none" stroke="#f5f5f3" stroke-linecap="butt" stroke-width="2.6">
        <path d="M292 170 Q318 198 308 230" transform="translate(-3 0)"/>
        <path d="M292 170 Q318 198 308 230" transform="translate(-8 0)"/>
        <path d="M292 170 Q318 198 308 230" transform="translate(-13 0)"/>
      </g>
      <!-- Slim near-black vest (vibe only — no logos). Do not touch helm/vest redesign. -->
      <path d="M120 148 L138 136 L200 130 L262 136 L280 148 L286 214 L114 214 Z" fill="url(#armorOlive)" stroke="#050505" stroke-width="1.4"/>
      <path d="M158 132 Q200 144 242 132 L238 152 Q200 160 162 152 Z" fill="#1a1a1a" stroke="#050505" stroke-width="1"/>
      <g id="shoulder-left" class="shoulder">
        <rect x="78" y="144" width="52" height="30" rx="7" fill="#141414" stroke="#050505" stroke-width="1.2"/>
        <rect x="84" y="152" width="40" height="7" rx="1.5" fill="#0a0a0a" opacity="0.65"/>
      </g>
      <g id="shoulder-right" class="shoulder">
        <rect x="270" y="144" width="52" height="30" rx="7" fill="#141414" stroke="#050505" stroke-width="1.2"/>
        <rect x="276" y="152" width="40" height="7" rx="1.5" fill="#0a0a0a" opacity="0.65"/>
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
      <!-- Subtle helmet wear — scratches/scuffs only; no redesign -->
      <g id="helm-wear" fill="none" stroke-linecap="round">
        <path d="M152 96 L168 102" stroke="#efe6d2" stroke-width="0.55" opacity="0.22"/>
        <path d="M230 98 Q238 104 246 101" stroke="#c8c2b0" stroke-width="0.5" opacity="0.2"/>
        <path d="M148 148 L162 156" stroke="#9a9590" stroke-width="0.45" opacity="0.28"/>
        <path d="M238 150 L252 158" stroke="#efe6d2" stroke-width="0.5" opacity="0.18"/>
        <path d="M190 90 L198 94" stroke="#b0aaa0" stroke-width="0.4" opacity="0.25"/>
        <path d="M128 108 Q132 118 130 128" stroke="#6a6860" stroke-width="0.55" opacity="0.3"/>
        <path d="M270 110 Q268 120 272 130" stroke="#5a5850" stroke-width="0.5" opacity="0.28"/>
      </g>

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

    <!-- Nordic KB on desk plane (same taper as table). Thin outline. Rectangular keys per row. -->
    <g id="prop-keyboard">
      <!-- Desk-plane shell: far (toward him) wider, near (viewer) narrower — matches desk edges -->
      <path d="M58 266 L246 266 L236 294 L68 294 Z" fill="#0c0e0a" stroke="#c4b59a" stroke-width="0.7" stroke-linejoin="round"/>
      <path d="M62 268.5 L242 268.5 L233 291.5 L71 291.5 Z" fill="#161a14"/>
      <!-- Toward him (far): Z-row + SPC -->
      <g class="kb-row" fill="#2e362a" stroke="#6b7355" stroke-width="0.45">
        <rect class="kb-deco" x="66" y="269.5" width="7" height="5.2" rx="0.7" fill="#252a22"/>
        <g id="kb-s22" class="kb-key" data-slot="22"><rect x="74.5" y="269.5" width="11" height="5.2" rx="0.7"/><text class="kb-label wear-b" x="80" y="272.1" font-size="3.6" dx="0.2" dy="-0.1">Z</text></g>
        <g id="kb-s23" class="kb-key" data-slot="23"><rect x="86.5" y="269.5" width="11" height="5.2" rx="0.7"/><text class="kb-label wear-a" x="92" y="272.1" font-size="3.6">X</text></g>
        <g id="kb-s24" class="kb-key" data-slot="24"><rect x="98.5" y="269.5" width="11" height="5.2" rx="0.7"/><text class="kb-label wear-c" x="104" y="272.1" font-size="3.6" dx="-0.2">C</text></g>
        <g id="kb-s25" class="kb-key" data-slot="25"><rect x="110.5" y="269.5" width="11" height="5.2" rx="0.7"/><text class="kb-label wear-d" x="116" y="272.1" font-size="3.6">V</text></g>
        <g id="kb-s26" class="kb-key" data-slot="26"><rect x="122.5" y="269.5" width="48" height="5.2" rx="0.7"/><text class="kb-label wear-e" x="146.5" y="272.1" font-size="3.1" dx="0.3">SPC</text></g>
        <g id="kb-s27" class="kb-key" data-slot="27"><rect x="171.5" y="269.5" width="11" height="5.2" rx="0.7"/><text class="kb-label wear-a" x="177" y="272.1" font-size="3.6">B</text></g>
        <g id="kb-s28" class="kb-key" data-slot="28"><rect x="183.5" y="269.5" width="11" height="5.2" rx="0.7"/><text class="kb-label wear-c" x="189" y="272.1" font-size="3.6" dy="0.15">N</text></g>
        <g id="kb-s29" class="kb-key" data-slot="29"><rect x="195.5" y="269.5" width="11" height="5.2" rx="0.7"/><text class="kb-label wear-b" x="201" y="272.1" font-size="3.6">M</text></g>
        <rect class="kb-deco" x="207.5" y="269.5" width="28" height="5.2" rx="0.7" fill="#252a22"/>
      </g>
      <text class="kb-deco-label" x="69.5" y="272.1" fill="#6b7355" font-family="ui-monospace, Consolas, monospace" font-size="2.9" text-anchor="middle" dominant-baseline="central">&lt;</text>
      <!-- A…LÖÄ -->
      <g class="kb-row" fill="#323a2e" stroke="#8a8070" stroke-width="0.5">
        <g id="kb-s11" class="kb-key" data-slot="11"><rect x="68" y="275.5" width="12.5" height="5.4" rx="0.7"/><text class="kb-label wear-a" x="74.25" y="278.2" font-size="3.7">A</text></g>
        <g id="kb-s12" class="kb-key" data-slot="12"><rect x="81.5" y="275.5" width="12.5" height="5.4" rx="0.7"/><text class="kb-label wear-d" x="87.75" y="278.2" font-size="3.7" dx="-0.15">S</text></g>
        <g id="kb-s13" class="kb-key" data-slot="13"><rect x="95" y="275.5" width="12.5" height="5.4" rx="0.7"/><text class="kb-label wear-b" x="101.25" y="278.2" font-size="3.7">D</text></g>
        <g id="kb-s14" class="kb-key" data-slot="14"><rect x="108.5" y="275.5" width="12.5" height="5.4" rx="0.7"/><text class="kb-label wear-c" x="114.75" y="278.2" font-size="3.7" dy="0.1">F</text></g>
        <g id="kb-s15" class="kb-key" data-slot="15"><rect x="122" y="275.5" width="12.5" height="5.4" rx="0.7"/><text class="kb-label wear-e" x="128.25" y="278.2" font-size="3.7">G</text></g>
        <g id="kb-s16" class="kb-key" data-slot="16"><rect x="135.5" y="275.5" width="12.5" height="5.4" rx="0.7"/><text class="kb-label wear-a" x="141.75" y="278.2" font-size="3.7" dx="0.2">H</text></g>
        <g id="kb-s17" class="kb-key" data-slot="17"><rect x="149" y="275.5" width="12.5" height="5.4" rx="0.7"/><text class="kb-label wear-b" x="155.25" y="278.2" font-size="3.7">J</text></g>
        <g id="kb-s18" class="kb-key" data-slot="18"><rect x="162.5" y="275.5" width="12.5" height="5.4" rx="0.7"/><text class="kb-label wear-d" x="168.75" y="278.2" font-size="3.7">K</text></g>
        <g id="kb-s19" class="kb-key" data-slot="19"><rect x="176" y="275.5" width="12.5" height="5.4" rx="0.7"/><text class="kb-label wear-c" x="182.25" y="278.2" font-size="3.7" dx="-0.1">L</text></g>
        <g id="kb-s20" class="kb-key" data-slot="20"><rect x="189.5" y="275.5" width="12.5" height="5.4" rx="0.7"/><text class="kb-label wear-e" x="195.75" y="278.2" font-size="3.7">Ö</text></g>
        <g id="kb-s21" class="kb-key" data-slot="21"><rect x="203" y="275.5" width="12.5" height="5.4" rx="0.7"/><text class="kb-label wear-a" x="209.25" y="278.2" font-size="3.7" dy="-0.15">Ä</text></g>
      </g>
      <!-- Q…PÅ -->
      <g class="kb-row" fill="#3a4434" stroke="#9a8f78" stroke-width="0.5">
        <g id="kb-s0" class="kb-key" data-slot="0"><rect x="70" y="281.5" width="12" height="5.2" rx="0.7"/><text class="kb-label wear-d" x="76" y="284.1" font-size="3.6" dx="0.1">Q</text></g>
        <g id="kb-s1" class="kb-key" data-slot="1"><rect x="83" y="281.5" width="12" height="5.2" rx="0.7"/><text class="kb-label wear-a" x="89" y="284.1" font-size="3.6">W</text></g>
        <g id="kb-s2" class="kb-key" data-slot="2"><rect x="96" y="281.5" width="12" height="5.2" rx="0.7"/><text class="kb-label wear-c" x="102" y="284.1" font-size="3.6" dy="-0.1">E</text></g>
        <g id="kb-s3" class="kb-key" data-slot="3"><rect x="109" y="281.5" width="12" height="5.2" rx="0.7"/><text class="kb-label wear-b" x="115" y="284.1" font-size="3.6">R</text></g>
        <g id="kb-s4" class="kb-key" data-slot="4"><rect x="122" y="281.5" width="12" height="5.2" rx="0.7"/><text class="kb-label wear-e" x="128" y="284.1" font-size="3.6" dx="-0.15">T</text></g>
        <g id="kb-s5" class="kb-key" data-slot="5"><rect x="135" y="281.5" width="12" height="5.2" rx="0.7"/><text class="kb-label wear-a" x="141" y="284.1" font-size="3.6">Y</text></g>
        <g id="kb-s6" class="kb-key" data-slot="6"><rect x="148" y="281.5" width="12" height="5.2" rx="0.7"/><text class="kb-label wear-d" x="154" y="284.1" font-size="3.6">U</text></g>
        <g id="kb-s7" class="kb-key" data-slot="7"><rect x="161" y="281.5" width="12" height="5.2" rx="0.7"/><text class="kb-label wear-c" x="167" y="284.1" font-size="3.6" dx="0.15">I</text></g>
        <g id="kb-s8" class="kb-key" data-slot="8"><rect x="174" y="281.5" width="12" height="5.2" rx="0.7"/><text class="kb-label wear-b" x="180" y="284.1" font-size="3.6">O</text></g>
        <g id="kb-s9" class="kb-key" data-slot="9"><rect x="187" y="281.5" width="12" height="5.2" rx="0.7"/><text class="kb-label wear-e" x="193" y="284.1" font-size="3.6" dy="0.1">P</text></g>
        <g id="kb-s10" class="kb-key" data-slot="10"><rect x="200" y="281.5" width="12.5" height="5.2" rx="0.7"/><text class="kb-label wear-a" x="206.25" y="284.1" font-size="3.6">Å</text></g>
      </g>
      <!-- Toward viewer (near): number row — slightly inset with desk taper -->
      <g class="kb-row kb-num" fill="#2a3228" stroke="#6b7355" stroke-width="0.4">
        <rect x="72" y="287.5" width="11" height="4.2" rx="0.6"/><rect x="84" y="287.5" width="11" height="4.2" rx="0.6"/>
        <rect x="96" y="287.5" width="11" height="4.2" rx="0.6"/><rect x="108" y="287.5" width="11" height="4.2" rx="0.6"/>
        <rect x="120" y="287.5" width="11" height="4.2" rx="0.6"/><rect x="132" y="287.5" width="11" height="4.2" rx="0.6"/>
        <rect x="144" y="287.5" width="11" height="4.2" rx="0.6"/><rect x="156" y="287.5" width="11" height="4.2" rx="0.6"/>
        <rect x="168" y="287.5" width="11" height="4.2" rx="0.6"/><rect x="180" y="287.5" width="11" height="4.2" rx="0.6"/>
        <rect x="192" y="287.5" width="11" height="4.2" rx="0.6"/><rect x="204" y="287.5" width="12" height="4.2" rx="0.6"/>
      </g>
      <g class="kb-labels-num" fill="#6b7355" font-family="ui-monospace, Consolas, monospace" font-size="3.3" text-anchor="middle" dominant-baseline="central">
        <text x="77.5" y="289.6">1</text><text x="89.5" y="289.6">2</text><text x="101.5" y="289.6">3</text>
        <text x="113.5" y="289.6">4</text><text x="125.5" y="289.6">5</text><text x="137.5" y="289.6">6</text>
        <text x="149.5" y="289.6">7</text><text x="161.5" y="289.6">8</text><text x="173.5" y="289.6">9</text>
        <text x="185.5" y="289.6">0</text><text x="197.5" y="289.6">+</text><text x="210" y="289.6">´</text>
      </g>
    </g>

    <!-- Black mousepad on desk plane, then mouse (same taper) -->
    <g id="prop-mousepad">
      <path d="M286 268 L348 268 L342 296 L292 296 Z" fill="#0a0a0a" stroke="#1a1a1a" stroke-width="0.6" opacity="0.92"/>
      <path d="M290 270 L344 270 L339 293.5 L295 293.5 Z" fill="#050505" opacity="0.55"/>
    </g>
    <g id="prop-mouse">
      <!-- Body foreshortened on desk: far edge wider, near edge shorter -->
      <path d="M300 272 Q316 268 330 273 L328 290 Q315 296 302 290 Z" fill="#161a14" stroke="#9a8f78" stroke-width="0.85"/>
      <path id="mouse-lmb" class="mouse-btn mouse-lmb" d="M302 273.5 Q309 270.5 314.5 272.5 L314.2 284 Q308.5 286.5 302.5 284.5 Z" fill="#1a1c16"/>
      <path id="mouse-rmb" class="mouse-btn mouse-rmb" d="M315.5 272.5 Q321.5 270.5 328 274 L326.5 285 Q321 287.5 315.5 284.5 Z" fill="#1a1c16"/>
      <g id="mouse-wheel" transform-origin="315px 279px">
        <ellipse cx="315" cy="279" rx="2.1" ry="3.4" fill="#2a2e24" stroke="#9a8f78" stroke-width="0.55"/>
        <path d="M315 276 V282" stroke="#c4b59a" stroke-width="0.55" opacity="0.85"/>
        <path d="M313.4 279 H316.6" stroke="#6b7355" stroke-width="0.45" opacity="0.8"/>
      </g>
    </g>

    <!-- Left hand ON KEYBOARD (desk plane) -->
    <g id="hand-left">
      <path d="M112 262 L148 260 L151 272 L116 275 Z" fill="#4a463c" stroke="#1a1810" stroke-width="1"/>
      <rect x="118" y="272" width="4.5" height="12" rx="1.8" fill="#4a463c" stroke="#1a1810" stroke-width="0.55"/>
      <rect x="127" y="271" width="4.5" height="13" rx="1.8" fill="#4a463c" stroke="#1a1810" stroke-width="0.55"/>
      <rect x="136" y="272" width="4.5" height="12" rx="1.8" fill="#4a463c" stroke="#1a1810" stroke-width="0.55"/>
      <rect x="145" y="273" width="4.5" height="11" rx="1.8" fill="#4a463c" stroke="#1a1810" stroke-width="0.55"/>
      <path d="M112 266 L104 262" stroke="#4a463c" stroke-width="3.5" stroke-linecap="round"/>
    </g>

    <!-- Right hand on mouse -->
    <g id="hand-right">
      <path d="M302 258 L326 260 L324 272 L304 270 Z" fill="#4a463c" stroke="#1a1810" stroke-width="1" opacity="0.92"/>
      <rect id="finger-lmb" x="306" y="266" width="4.2" height="11" rx="1.4" fill="#3a3630"/>
      <rect id="finger-rmb" x="315" y="267" width="4.2" height="10.5" rx="1.4" fill="#3a3630"/>
    </g>
  </g>
  </g>
</svg>
`.trim();
