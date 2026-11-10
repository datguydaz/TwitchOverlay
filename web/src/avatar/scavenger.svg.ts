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
      <!-- THREE white Adidas-style track stripes ON sleeve fabric (inset toward torso, not outside) -->
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

    <!-- Nordic KB on-desk 3/4 (same plane as desk). Keys stay rectangular; mild foreshorten only. -->
    <g id="prop-keyboard" transform="translate(150 268) matrix(1.04,0.06,0,0.72,0,0) translate(-150 -262)">
      <rect x="52" y="240" width="196" height="44" rx="3.5" fill="#0c0e0a" stroke="#c4b59a" stroke-width="1.8"/>
      <rect x="56" y="244" width="188" height="36" rx="2" fill="#161a14"/>
      <!-- Toward him (top): Z-row + space -->
      <g class="kb-row" fill="#2e362a" stroke="#6b7355" stroke-width="0.6">
        <rect class="kb-deco" x="58" y="246" width="8" height="7" rx="1" fill="#252a22"/>
        <g id="kb-s22" class="kb-key" data-slot="22"><rect x="67.5" y="246" width="12" height="7" rx="1"/><text class="kb-label wear-b" x="73.5" y="249.5" font-size="4.2" dx="0.2" dy="-0.15">Z</text></g>
        <g id="kb-s23" class="kb-key" data-slot="23"><rect x="80.5" y="246" width="12" height="7" rx="1"/><text class="kb-label wear-a" x="86.5" y="249.5" font-size="4.2">X</text></g>
        <g id="kb-s24" class="kb-key" data-slot="24"><rect x="93.5" y="246" width="12" height="7" rx="1"/><text class="kb-label wear-c" x="99.5" y="249.5" font-size="4.2" dx="-0.25">C</text></g>
        <g id="kb-s25" class="kb-key" data-slot="25"><rect x="106.5" y="246" width="12" height="7" rx="1"/><text class="kb-label wear-d" x="112.5" y="249.5" font-size="4.2">V</text></g>
        <g id="kb-s26" class="kb-key" data-slot="26"><rect x="119.5" y="246" width="52" height="7" rx="1"/><text class="kb-label wear-e" x="145.5" y="249.5" font-size="3.6" dx="0.35">SPC</text></g>
        <g id="kb-s27" class="kb-key" data-slot="27"><rect x="172.5" y="246" width="12" height="7" rx="1"/><text class="kb-label wear-a" x="178.5" y="249.5" font-size="4.2">B</text></g>
        <g id="kb-s28" class="kb-key" data-slot="28"><rect x="185.5" y="246" width="12" height="7" rx="1"/><text class="kb-label wear-c" x="191.5" y="249.5" font-size="4.2" dy="0.2">N</text></g>
        <g id="kb-s29" class="kb-key" data-slot="29"><rect x="198.5" y="246" width="12" height="7" rx="1"/><text class="kb-label wear-b" x="204.5" y="249.5" font-size="4.2">M</text></g>
        <rect class="kb-deco" x="211.5" y="246" width="28.5" height="7" rx="1" fill="#252a22"/>
      </g>
      <text class="kb-deco-label" x="62" y="249.5" fill="#6b7355" font-family="ui-monospace, Consolas, monospace" font-size="3.4" text-anchor="middle" dominant-baseline="central">&lt;</text>
      <!-- A…LÖÄ -->
      <g class="kb-row" fill="#323a2e" stroke="#8a8070" stroke-width="0.65">
        <g id="kb-s11" class="kb-key" data-slot="11"><rect x="62" y="255" width="14" height="7.5" rx="1"/><text class="kb-label wear-a" x="69" y="258.75">A</text></g>
        <g id="kb-s12" class="kb-key" data-slot="12"><rect x="77" y="255" width="14" height="7.5" rx="1"/><text class="kb-label wear-d" x="84" y="258.75" dx="-0.2">S</text></g>
        <g id="kb-s13" class="kb-key" data-slot="13"><rect x="92" y="255" width="14" height="7.5" rx="1"/><text class="kb-label wear-b" x="99" y="258.75">D</text></g>
        <g id="kb-s14" class="kb-key" data-slot="14"><rect x="107" y="255" width="14" height="7.5" rx="1"/><text class="kb-label wear-c" x="114" y="258.75" dy="0.15">F</text></g>
        <g id="kb-s15" class="kb-key" data-slot="15"><rect x="122" y="255" width="14" height="7.5" rx="1"/><text class="kb-label wear-e" x="129" y="258.75">G</text></g>
        <g id="kb-s16" class="kb-key" data-slot="16"><rect x="137" y="255" width="14" height="7.5" rx="1"/><text class="kb-label wear-a" x="144" y="258.75" dx="0.25">H</text></g>
        <g id="kb-s17" class="kb-key" data-slot="17"><rect x="152" y="255" width="14" height="7.5" rx="1"/><text class="kb-label wear-b" x="159" y="258.75">J</text></g>
        <g id="kb-s18" class="kb-key" data-slot="18"><rect x="167" y="255" width="14" height="7.5" rx="1"/><text class="kb-label wear-d" x="174" y="258.75">K</text></g>
        <g id="kb-s19" class="kb-key" data-slot="19"><rect x="182" y="255" width="14" height="7.5" rx="1"/><text class="kb-label wear-c" x="189" y="258.75" dx="-0.15">L</text></g>
        <g id="kb-s20" class="kb-key" data-slot="20"><rect x="197" y="255" width="14" height="7.5" rx="1"/><text class="kb-label wear-e" x="204" y="258.75">Ö</text></g>
        <g id="kb-s21" class="kb-key" data-slot="21"><rect x="212" y="255" width="14" height="7.5" rx="1"/><text class="kb-label wear-a" x="219" y="258.75" dy="-0.2">Ä</text></g>
      </g>
      <!-- Q…PÅ -->
      <g class="kb-row" fill="#3a4434" stroke="#9a8f78" stroke-width="0.65">
        <g id="kb-s0" class="kb-key" data-slot="0"><rect x="58" y="264.5" width="14.5" height="7.5" rx="1"/><text class="kb-label wear-d" x="65.25" y="268.25" dx="0.15">Q</text></g>
        <g id="kb-s1" class="kb-key" data-slot="1"><rect x="73.5" y="264.5" width="14.5" height="7.5" rx="1"/><text class="kb-label wear-a" x="80.75" y="268.25">W</text></g>
        <g id="kb-s2" class="kb-key" data-slot="2"><rect x="89" y="264.5" width="14.5" height="7.5" rx="1"/><text class="kb-label wear-c" x="96.25" y="268.25" dy="-0.15">E</text></g>
        <g id="kb-s3" class="kb-key" data-slot="3"><rect x="104.5" y="264.5" width="14.5" height="7.5" rx="1"/><text class="kb-label wear-b" x="111.75" y="268.25">R</text></g>
        <g id="kb-s4" class="kb-key" data-slot="4"><rect x="120" y="264.5" width="14.5" height="7.5" rx="1"/><text class="kb-label wear-e" x="127.25" y="268.25" dx="-0.2">T</text></g>
        <g id="kb-s5" class="kb-key" data-slot="5"><rect x="135.5" y="264.5" width="14.5" height="7.5" rx="1"/><text class="kb-label wear-a" x="142.75" y="268.25">Y</text></g>
        <g id="kb-s6" class="kb-key" data-slot="6"><rect x="151" y="264.5" width="14.5" height="7.5" rx="1"/><text class="kb-label wear-d" x="158.25" y="268.25">U</text></g>
        <g id="kb-s7" class="kb-key" data-slot="7"><rect x="166.5" y="264.5" width="14.5" height="7.5" rx="1"/><text class="kb-label wear-c" x="173.75" y="268.25" dx="0.2">I</text></g>
        <g id="kb-s8" class="kb-key" data-slot="8"><rect x="182" y="264.5" width="14.5" height="7.5" rx="1"/><text class="kb-label wear-b" x="189.25" y="268.25">O</text></g>
        <g id="kb-s9" class="kb-key" data-slot="9"><rect x="197.5" y="264.5" width="14.5" height="7.5" rx="1"/><text class="kb-label wear-e" x="204.75" y="268.25" dy="0.15">P</text></g>
        <g id="kb-s10" class="kb-key" data-slot="10"><rect x="213" y="264.5" width="15" height="7.5" rx="1"/><text class="kb-label wear-a" x="220.5" y="268.25">Å</text></g>
      </g>
      <!-- Toward viewer (bottom): number row fills board -->
      <g class="kb-row kb-num" fill="#2a3228" stroke="#6b7355" stroke-width="0.5">
        <rect x="58" y="274" width="13.5" height="6" rx="0.9"/><rect x="72.5" y="274" width="13.5" height="6" rx="0.9"/>
        <rect x="87" y="274" width="13.5" height="6" rx="0.9"/><rect x="101.5" y="274" width="13.5" height="6" rx="0.9"/>
        <rect x="116" y="274" width="13.5" height="6" rx="0.9"/><rect x="130.5" y="274" width="13.5" height="6" rx="0.9"/>
        <rect x="145" y="274" width="13.5" height="6" rx="0.9"/><rect x="159.5" y="274" width="13.5" height="6" rx="0.9"/>
        <rect x="174" y="274" width="13.5" height="6" rx="0.9"/><rect x="188.5" y="274" width="13.5" height="6" rx="0.9"/>
        <rect x="203" y="274" width="13.5" height="6" rx="0.9"/><rect x="217.5" y="274" width="14.5" height="6" rx="0.9"/>
      </g>
      <g class="kb-labels-num" fill="#6b7355" font-family="ui-monospace, Consolas, monospace" font-size="4.2" text-anchor="middle" dominant-baseline="central">
        <text x="64.75" y="277">1</text><text x="79.25" y="277">2</text><text x="93.75" y="277">3</text>
        <text x="108.25" y="277">4</text><text x="122.75" y="277">5</text><text x="137.25" y="277">6</text>
        <text x="151.75" y="277">7</text><text x="166.25" y="277">8</text><text x="180.75" y="277">9</text>
        <text x="195.25" y="277">0</text><text x="209.75" y="277">+</text><text x="224.75" y="277">´</text>
      </g>
    </g>

    <!-- Mouse on same desk 3/4 plane — LMB/RMB/wheel ids unchanged -->
    <g id="prop-mouse" transform="translate(313 262) matrix(1.05,0.08,0,0.72,0,0) translate(-313 -260)">
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
