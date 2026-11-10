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
    <!-- DESK — Zone Ops wood, subtle grain + edge wear; no front-panel lettering -->
    <g id="desk">
      <path d="M28 268 H372 L352 302 H48 Z" fill="url(#deskGrad)" stroke="#5a5348" stroke-width="1.6"/>
      <path d="M48 302 V328 H78 V302 M322 302 V328 H352 V302" fill="#241e18" stroke="#4a443c"/>
      <!-- Front lip edge wear -->
      <path d="M48 302 H352" stroke="#1a1610" stroke-width="1.2" opacity="0.55"/>
      <path d="M52 303.5 H348" stroke="#6b7355" stroke-width="0.55" opacity="0.28"/>
      <path d="M36 268 H364" stroke="#6b7355" stroke-width="1.2" opacity="0.5"/>
      <path d="M70 288 H330" stroke="#3a342c" stroke-width="6" opacity="0.55"/>
      <!-- Subtle grain (Zone Ops olive/charcoal, low opacity) -->
      <g id="desk-grain" fill="none" stroke-linecap="butt" opacity="0.22">
        <path d="M44 272 H360" stroke="#2a261e" stroke-width="0.45"/>
        <path d="M50 277 H354" stroke="#3a342c" stroke-width="0.35"/>
        <path d="M56 282 H348" stroke="#1c1812" stroke-width="0.4"/>
        <path d="M62 287 H342" stroke="#2e2a22" stroke-width="0.35"/>
        <path d="M68 292 H336" stroke="#3a342c" stroke-width="0.3"/>
        <path d="M74 297 H328" stroke="#1a1610" stroke-width="0.35"/>
      </g>
      <!-- Crack + edge scuffs -->
      <g id="desk-wear" fill="none" stroke-linecap="round">
        <path d="M96 276 Q118 278 132 274 Q148 271 168 277" stroke="#1a1610" stroke-width="1.1" opacity="0.55"/>
        <path d="M118 275 L124 279" stroke="#0c0a08" stroke-width="0.7" opacity="0.45"/>
        <path d="M250 272 Q268 276 286 273" stroke="#2a241c" stroke-width="0.9" opacity="0.4"/>
        <path d="M300 280 L318 284" stroke="#1c1812" stroke-width="0.8" opacity="0.35"/>
        <path d="M78 292 Q90 294 102 291" stroke="#181410" stroke-width="0.7" opacity="0.3"/>
        <path d="M40 270 L46 274" stroke="#0c0a08" stroke-width="0.6" opacity="0.35"/>
        <path d="M358 271 L350 276" stroke="#0c0a08" stroke-width="0.55" opacity="0.3"/>
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

    <!-- RECTANGULAR Nordic KB on desk — charcoal/black theme (no beige/olive). Thin border. -->
    <g id="prop-keyboard">
      <rect x="56" y="268" width="192" height="28" rx="2.2" fill="#0a0a0a" stroke="#4a4a4a" stroke-width="0.65"/>
      <rect x="59" y="270.5" width="186" height="23" rx="1.4" fill="#121212"/>
      <!-- Toward him (top): Z-row + SPC -->
      <g class="kb-row" fill="#1c1c1c" stroke="#3a3a3a" stroke-width="0.45">
        <rect class="kb-deco" x="62" y="271.5" width="7" height="5" rx="0.6" fill="#161616"/>
        <g id="kb-s22" class="kb-key" data-slot="22"><rect x="70.5" y="271.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-b" x="76" y="274" font-size="3.5" dx="0.2" dy="-0.1">Z</text></g>
        <g id="kb-s23" class="kb-key" data-slot="23"><rect x="82.5" y="271.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-a" x="88" y="274" font-size="3.5">X</text></g>
        <g id="kb-s24" class="kb-key" data-slot="24"><rect x="94.5" y="271.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-c" x="100" y="274" font-size="3.5" dx="-0.2">C</text></g>
        <g id="kb-s25" class="kb-key" data-slot="25"><rect x="106.5" y="271.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-d" x="112" y="274" font-size="3.5">V</text></g>
        <g id="kb-s26" class="kb-key" data-slot="26"><rect x="118.5" y="271.5" width="48" height="5" rx="0.6"/><text class="kb-label wear-e" x="142.5" y="274" font-size="3" dx="0.3">SPC</text></g>
        <g id="kb-s27" class="kb-key" data-slot="27"><rect x="167.5" y="271.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-a" x="173" y="274" font-size="3.5">B</text></g>
        <g id="kb-s28" class="kb-key" data-slot="28"><rect x="179.5" y="271.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-c" x="185" y="274" font-size="3.5" dy="0.15">N</text></g>
        <g id="kb-s29" class="kb-key" data-slot="29"><rect x="191.5" y="271.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-b" x="197" y="274" font-size="3.5">M</text></g>
        <rect class="kb-deco" x="203.5" y="271.5" width="28" height="5" rx="0.6" fill="#161616"/>
      </g>
      <text class="kb-deco-label" x="65.5" y="274" fill="#6a6a6a" font-family="ui-monospace, Consolas, monospace" font-size="2.8" text-anchor="middle" dominant-baseline="central">&lt;</text>
      <!-- A…LÖÄ -->
      <g class="kb-row" fill="#222222" stroke="#404040" stroke-width="0.5">
        <g id="kb-s11" class="kb-key" data-slot="11"><rect x="64" y="277.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-a" x="70.5" y="279.8" font-size="3.6">A</text></g>
        <g id="kb-s12" class="kb-key" data-slot="12"><rect x="78" y="277.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-d" x="84.5" y="279.8" font-size="3.6" dx="-0.15">S</text></g>
        <g id="kb-s13" class="kb-key" data-slot="13"><rect x="92" y="277.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-b" x="98.5" y="279.8" font-size="3.6">D</text></g>
        <g id="kb-s14" class="kb-key" data-slot="14"><rect x="106" y="277.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-c" x="112.5" y="279.8" font-size="3.6" dy="0.1">F</text></g>
        <g id="kb-s15" class="kb-key" data-slot="15"><rect x="120" y="277.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-e" x="126.5" y="279.8" font-size="3.6">G</text></g>
        <g id="kb-s16" class="kb-key" data-slot="16"><rect x="134" y="277.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-a" x="140.5" y="279.8" font-size="3.6" dx="0.2">H</text></g>
        <g id="kb-s17" class="kb-key" data-slot="17"><rect x="148" y="277.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-b" x="154.5" y="279.8" font-size="3.6">J</text></g>
        <g id="kb-s18" class="kb-key" data-slot="18"><rect x="162" y="277.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-d" x="168.5" y="279.8" font-size="3.6">K</text></g>
        <g id="kb-s19" class="kb-key" data-slot="19"><rect x="176" y="277.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-c" x="182.5" y="279.8" font-size="3.6" dx="-0.1">L</text></g>
        <g id="kb-s20" class="kb-key" data-slot="20"><rect x="190" y="277.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-e" x="196.5" y="279.8" font-size="3.6">Ö</text></g>
        <g id="kb-s21" class="kb-key" data-slot="21"><rect x="204" y="277.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-a" x="210.5" y="279.8" font-size="3.6" dy="-0.15">Ä</text></g>
      </g>
      <!-- Q…PÅ -->
      <g class="kb-row" fill="#2a2a2a" stroke="#4a4a4a" stroke-width="0.5">
        <g id="kb-s0" class="kb-key" data-slot="0"><rect x="62" y="283" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-d" x="68.25" y="285.5" font-size="3.5" dx="0.1">Q</text></g>
        <g id="kb-s1" class="kb-key" data-slot="1"><rect x="75.5" y="283" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-a" x="81.75" y="285.5" font-size="3.5">W</text></g>
        <g id="kb-s2" class="kb-key" data-slot="2"><rect x="89" y="283" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-c" x="95.25" y="285.5" font-size="3.5" dy="-0.1">E</text></g>
        <g id="kb-s3" class="kb-key" data-slot="3"><rect x="102.5" y="283" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-b" x="108.75" y="285.5" font-size="3.5">R</text></g>
        <g id="kb-s4" class="kb-key" data-slot="4"><rect x="116" y="283" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-e" x="122.25" y="285.5" font-size="3.5" dx="-0.15">T</text></g>
        <g id="kb-s5" class="kb-key" data-slot="5"><rect x="129.5" y="283" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-a" x="135.75" y="285.5" font-size="3.5">Y</text></g>
        <g id="kb-s6" class="kb-key" data-slot="6"><rect x="143" y="283" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-d" x="149.25" y="285.5" font-size="3.5">U</text></g>
        <g id="kb-s7" class="kb-key" data-slot="7"><rect x="156.5" y="283" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-c" x="162.75" y="285.5" font-size="3.5" dx="0.15">I</text></g>
        <g id="kb-s8" class="kb-key" data-slot="8"><rect x="170" y="283" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-b" x="176.25" y="285.5" font-size="3.5">O</text></g>
        <g id="kb-s9" class="kb-key" data-slot="9"><rect x="183.5" y="283" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-e" x="189.75" y="285.5" font-size="3.5" dy="0.1">P</text></g>
        <g id="kb-s10" class="kb-key" data-slot="10"><rect x="197" y="283" width="13" height="5" rx="0.6"/><text class="kb-label wear-a" x="203.5" y="285.5" font-size="3.5">Å</text></g>
      </g>
      <!-- Toward viewer (bottom): number row -->
      <g class="kb-row kb-num" fill="#181818" stroke="#333333" stroke-width="0.4">
        <rect x="62" y="288.8" width="12" height="3.8" rx="0.5"/><rect x="75" y="288.8" width="12" height="3.8" rx="0.5"/>
        <rect x="88" y="288.8" width="12" height="3.8" rx="0.5"/><rect x="101" y="288.8" width="12" height="3.8" rx="0.5"/>
        <rect x="114" y="288.8" width="12" height="3.8" rx="0.5"/><rect x="127" y="288.8" width="12" height="3.8" rx="0.5"/>
        <rect x="140" y="288.8" width="12" height="3.8" rx="0.5"/><rect x="153" y="288.8" width="12" height="3.8" rx="0.5"/>
        <rect x="166" y="288.8" width="12" height="3.8" rx="0.5"/><rect x="179" y="288.8" width="12" height="3.8" rx="0.5"/>
        <rect x="192" y="288.8" width="12" height="3.8" rx="0.5"/><rect x="205" y="288.8" width="13" height="3.8" rx="0.5"/>
      </g>
      <g class="kb-labels-num" fill="#6a6a6a" font-family="ui-monospace, Consolas, monospace" font-size="3.2" text-anchor="middle" dominant-baseline="central">
        <text x="68" y="290.7">1</text><text x="81" y="290.7">2</text><text x="94" y="290.7">3</text>
        <text x="107" y="290.7">4</text><text x="120" y="290.7">5</text><text x="133" y="290.7">6</text>
        <text x="146" y="290.7">7</text><text x="159" y="290.7">8</text><text x="172" y="290.7">9</text>
        <text x="185" y="290.7">0</text><text x="198" y="290.7">+</text><text x="211.5" y="290.7">´</text>
      </g>
    </g>

    <!-- Black rectangular mousepad on desk, then charcoal mouse -->
    <g id="prop-mousepad">
      <rect x="288" y="270" width="56" height="26" rx="2" fill="#0a0a0a" stroke="#1a1a1a" stroke-width="0.55" opacity="0.94"/>
      <rect x="291" y="272.5" width="50" height="21" rx="1.2" fill="#050505" opacity="0.5"/>
    </g>
    <g id="prop-mouse">
      <path d="M300 274 Q316 270 330 275 L328 290 Q315 295 302 290 Z" fill="#121212" stroke="#4a4a4a" stroke-width="0.85"/>
      <path id="mouse-lmb" class="mouse-btn mouse-lmb" d="M302 275 Q309 272 314.5 274 L314.2 285 Q308.5 287.5 302.5 285.5 Z" fill="#1a1a1a"/>
      <path id="mouse-rmb" class="mouse-btn mouse-rmb" d="M315.5 274 Q321.5 272 328 276 L326.5 286 Q321 288.5 315.5 285.5 Z" fill="#1a1a1a"/>
      <g id="mouse-wheel" transform-origin="315px 280px">
        <ellipse cx="315" cy="280" rx="2.1" ry="3.4" fill="#2a2a2a" stroke="#5a5a5a" stroke-width="0.55"/>
        <path d="M315 277 V283" stroke="#8a8a8a" stroke-width="0.55" opacity="0.85"/>
        <path d="M313.4 280 H316.6" stroke="#5a5a5a" stroke-width="0.45" opacity="0.8"/>
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
