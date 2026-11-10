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
    <!-- Exclusion-zone field crate desk — charcoal with olive undertone (not warm brown) -->
    <linearGradient id="deskTopGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a3c36"/>
      <stop offset="40%" stop-color="#262822"/>
      <stop offset="100%" stop-color="#141612"/>
    </linearGradient>
    <linearGradient id="deskEdgeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2c26"/>
      <stop offset="100%" stop-color="#0a0c0a"/>
    </linearGradient>
    <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2e322c"/>
      <stop offset="100%" stop-color="#121410"/>
    </linearGradient>
    <clipPath id="visor-clip">
      <rect x="168" y="124" width="64" height="10" rx="1"/>
    </clipPath>
    <!-- Clip vest/core only — sleeves live outside so they aren't hard-stumped -->
    <clipPath id="torso-above-desk">
      <!-- Keep pouches + KILLA; cut belt that would pierce desk (local y) -->
      <rect x="40" y="100" width="320" height="128"/>
    </clipPath>
    <clipPath id="desk-led-clip">
      <rect x="58" y="293.5" width="284" height="2.2" rx="0.8"/>
    </clipPath>
  </defs>

  <ellipse cx="200" cy="318" rx="140" ry="14" fill="#000" opacity="0.45"/>

  <!-- Operator: torso/head FIRST, desk AFTER so body sits behind desk lip (no torso-through-table). -->
  <g id="operator">
    <!-- TORSO: sit offset + slight body scale to match head 0.86 (still bulky). -->
    <g id="layer-torso">
      <g id="torso-sit" transform="translate(0 38)">
      <g id="torso-scale" transform="translate(200 136) scale(0.895) translate(-200 -136)">
      <!-- Vest/core clipped at desk; sleeves drawn outside clip for continuous arms -->
      <g id="torso-core" clip-path="url(#torso-above-desk)">
      <path d="M124 152 L140 138 L200 132 L260 138 L276 152 L282 236 L118 236 Z" fill="url(#suitDark)" stroke="#050505" stroke-width="1.5"/>
      <!-- Slim near-black vest -->
      <path d="M120 148 L138 136 L200 130 L262 136 L280 148 L286 234 L114 234 Z" fill="url(#armorOlive)" stroke="#050505" stroke-width="1.4"/>
      <path d="M158 132 Q200 144 242 132 L238 152 Q200 160 162 152 Z" fill="#1a1a1a" stroke="#050505" stroke-width="1"/>
      <!-- Vest wear / fray / scuffs (under lettering + pouches) -->
      <g id="vest-wear" fill="none" stroke-linecap="round">
        <path d="M128 156 L148 162" stroke="#6a6a6a" stroke-width="0.55" opacity="0.35"/>
        <path d="M250 158 L272 164" stroke="#8a8a8a" stroke-width="0.5" opacity="0.28"/>
        <path d="M118 190 Q130 196 124 210" stroke="#3a3a3a" stroke-width="0.7" opacity="0.4"/>
        <path d="M280 188 Q270 200 276 214" stroke="#4a4a4a" stroke-width="0.65" opacity="0.35"/>
        <path d="M140 220 L160 226 L155 222" stroke="#5a5a5a" stroke-width="0.45" opacity="0.3"/>
        <path d="M240 222 L265 228" stroke="#6a6a6a" stroke-width="0.5" opacity="0.28"/>
        <path d="M110 170 L116 178" stroke="#2a2a2a" stroke-width="1.1" opacity="0.5"/>
        <path d="M288 172 L282 180" stroke="#2a2a2a" stroke-width="1" opacity="0.45"/>
      </g>
      <!-- KILLA UNDER pouches (drawn first; pouches paint on top) -->
      <g id="chest-killa" font-family="Arial Black, Impact, 'Arial Narrow', sans-serif" font-weight="800" text-anchor="middle" letter-spacing="3.4">
        <text x="200.8" y="224.2" fill="#050505" font-size="15.5" opacity="0.72" textLength="158" lengthAdjust="spacingAndGlyphs">KILLA</text>
        <text id="chest-killa-main" x="200" y="223.6" fill="#efe6d2" font-size="15.5" opacity="0.96" textLength="158" lengthAdjust="spacingAndGlyphs">KILLA</text>
        <g id="chest-killa-scratches" fill="none" stroke="#0a0a0a" stroke-linecap="round" opacity="0.65">
          <path d="M128 219 L142 226" stroke-width="0.85"/>
          <path d="M148 218 L162 225" stroke-width="0.65"/>
          <path d="M168 220 L188 223" stroke-width="0.75"/>
          <path d="M152 227 L198 217" stroke-width="0.55"/>
          <path d="M204 219 L228 224" stroke-width="0.7"/>
          <path d="M232 226 L262 219" stroke-width="0.6"/>
          <path d="M240 217 L270 223" stroke-width="0.5"/>
        </g>
      </g>
      <!-- Integrated STANAG rig: molle plate + stitch + pouch shadows (on TOP of KILLA) -->
      <g id="chest-rig">
        <rect id="molle-plate" x="128" y="164" width="144" height="48" rx="3" fill="#101010" stroke="#050505" stroke-width="1" opacity="0.92"/>
        <g id="molle-stitch" fill="none" stroke="#2a2a2a" stroke-width="0.55" opacity="0.7">
          <path d="M132 170 H268 M132 178 H268 M132 186 H268 M132 194 H268 M132 202 H268"/>
          <path d="M148 166 V208 M182 166 V208 M216 166 V208 M250 166 V208"/>
        </g>
        <!-- Centered 134 / 168 / 202 / 236 -->
        <g id="stanag-0" class="stanag-pouch" transform="translate(134 166)">
          <rect x="1" y="9" width="30" height="34" rx="1.5" fill="#050505" opacity="0.45"/>
          <rect x="0" y="7" width="30" height="34" rx="2" fill="url(#pouchGrad)" stroke="#0a0a0a" stroke-width="1.1"/>
          <path d="M1 7 H29 L26.5 1 H3.5 Z" fill="#181818" stroke="#050505" stroke-width="0.85"/>
          <rect x="5" y="12" width="20" height="2.8" rx="0.5" fill="#0a0a0a"/>
          <path d="M8 18 V36 M15 18 V36 M22 18 V36" stroke="#1a1a1a" stroke-width="1.15" opacity="0.85"/>
          <path d="M2 8 H28" stroke="#333" stroke-width="0.4" opacity="0.5"/>
        </g>
        <g id="stanag-1" class="stanag-pouch" transform="translate(168 166)">
          <rect x="1" y="9" width="30" height="34" rx="1.5" fill="#050505" opacity="0.45"/>
          <rect x="0" y="7" width="30" height="34" rx="2" fill="url(#pouchGrad)" stroke="#0a0a0a" stroke-width="1.1"/>
          <path d="M1 7 H29 L26.5 1 H3.5 Z" fill="#181818" stroke="#050505" stroke-width="0.85"/>
          <rect x="5" y="12" width="20" height="2.8" rx="0.5" fill="#0a0a0a"/>
          <path d="M8 18 V36 M15 18 V36 M22 18 V36" stroke="#1a1a1a" stroke-width="1.15" opacity="0.85"/>
          <path d="M2 8 H28" stroke="#333" stroke-width="0.4" opacity="0.5"/>
        </g>
        <g id="stanag-2" class="stanag-pouch" transform="translate(202 166)">
          <rect x="1" y="9" width="30" height="34" rx="1.5" fill="#050505" opacity="0.45"/>
          <rect x="0" y="7" width="30" height="34" rx="2" fill="url(#pouchGrad)" stroke="#0a0a0a" stroke-width="1.1"/>
          <path d="M1 7 H29 L26.5 1 H3.5 Z" fill="#181818" stroke="#050505" stroke-width="0.85"/>
          <rect x="5" y="12" width="20" height="2.8" rx="0.5" fill="#0a0a0a"/>
          <path d="M8 18 V36 M15 18 V36 M22 18 V36" stroke="#1a1a1a" stroke-width="1.15" opacity="0.85"/>
          <path d="M2 8 H28" stroke="#333" stroke-width="0.4" opacity="0.5"/>
        </g>
        <g id="stanag-3" class="stanag-pouch" transform="translate(236 166)">
          <rect x="1" y="9" width="30" height="34" rx="1.5" fill="#050505" opacity="0.45"/>
          <rect x="0" y="7" width="30" height="34" rx="2" fill="url(#pouchGrad)" stroke="#0a0a0a" stroke-width="1.1"/>
          <path d="M1 7 H29 L26.5 1 H3.5 Z" fill="#181818" stroke="#050505" stroke-width="0.85"/>
          <rect x="5" y="12" width="20" height="2.8" rx="0.5" fill="#0a0a0a"/>
          <path d="M8 18 V36 M15 18 V36 M22 18 V36" stroke="#1a1a1a" stroke-width="1.15" opacity="0.85"/>
          <path d="M2 8 H28" stroke="#333" stroke-width="0.4" opacity="0.5"/>
        </g>
      </g>
      <rect x="110" y="228" width="180" height="10" rx="1.5" fill="#0c0c0c" stroke="#222222"/>
      </g>
      </g>
      </g>
    </g>

    <!-- HEAD: sit offset inner — CSS head-idle/talk-nod animate outer only.
         Subtle scale-down (~6%) around helm center; still bulky Killa. -->
    <g id="layer-head">
      <g id="head-sit" transform="translate(0 38)">
      <g id="head-scale" transform="translate(200 120) scale(0.86) translate(-200 -120)">
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
      <!-- Helmet wear — denser scratches / scuffs / edge chips -->
      <g id="helm-wear" fill="none" stroke-linecap="round">
        <path d="M152 96 L168 102" stroke="#efe6d2" stroke-width="0.55" opacity="0.28"/>
        <path d="M230 98 Q238 104 246 101" stroke="#c8c2b0" stroke-width="0.55" opacity="0.26"/>
        <path d="M148 148 L162 156" stroke="#9a9590" stroke-width="0.55" opacity="0.35"/>
        <path d="M238 150 L252 158" stroke="#efe6d2" stroke-width="0.55" opacity="0.24"/>
        <path d="M190 90 L198 94" stroke="#b0aaa0" stroke-width="0.5" opacity="0.3"/>
        <path d="M128 108 Q132 118 130 128" stroke="#6a6860" stroke-width="0.6" opacity="0.38"/>
        <path d="M270 110 Q268 120 272 130" stroke="#5a5850" stroke-width="0.55" opacity="0.35"/>
        <path d="M160 110 L176 118" stroke="#c8c2b0" stroke-width="0.45" opacity="0.22"/>
        <path d="M220 112 L236 120" stroke="#9a9590" stroke-width="0.45" opacity="0.24"/>
        <path d="M150 170 L166 178" stroke="#efe6d2" stroke-width="0.4" opacity="0.2"/>
        <path d="M236 172 L250 180" stroke="#b0aaa0" stroke-width="0.4" opacity="0.22"/>
        <path d="M178 100 L184 108" stroke="#6a6860" stroke-width="0.7" opacity="0.3"/>
        <path d="M244 168 L238 176" stroke="#4a4a4a" stroke-width="0.8" opacity="0.4"/>
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
      </g>
    </g>

    <!--
      DESK after torso/head: body stays BEHIND the table.
      Real field-table feel — worn plywood top, thick front apron, olive/charcoal/dirty-beige.
      KB/mouse/hands paint AFTER this so they sit ON the surface (not through the lip).
    -->
    <g id="desk">
      <!-- Charcoal field-crate top (olive undertone only — not warm brown) -->
      <path id="desk-top" d="M22 256 H378 L362 290 H38 Z" fill="url(#deskTopGrad)" stroke="#4a5044" stroke-width="1.35"/>
      <path id="desk-apron" d="M38 290 H362 L352 316 H48 Z" fill="url(#deskEdgeGrad)" stroke="#1a1c18" stroke-width="1.2"/>
      <path d="M40 292 H360" stroke="#5a6355" stroke-width="1.1" opacity="0.4"/>
      <path d="M48 316 H352" stroke="#050605" stroke-width="1.3" opacity="0.6"/>
      <!-- Restrained Zone Ops desk LED strip — soft amber/olive chase under front lip -->
      <g id="desk-rgb" opacity="0.92">
        <rect x="56" y="293.5" width="288" height="2.2" rx="1.1" fill="#1a1408" stroke="#0a0a08" stroke-width="0.35"/>
        <g id="desk-led-strip" clip-path="url(#desk-led-clip)">
          <rect id="desk-led-core" class="desk-led-core" x="58" y="293.8" width="284" height="1.5" rx="0.75" fill="#c7923a" opacity="0.42"/>
          <g class="desk-led-chase">
            <rect x="58" y="293.8" width="48" height="1.5" rx="0.75" fill="#e0b050" opacity="0.85"/>
            <rect x="118" y="293.8" width="36" height="1.5" rx="0.75" fill="#6b7355" opacity="0.7"/>
            <rect x="168" y="293.8" width="48" height="1.5" rx="0.75" fill="#c7923a" opacity="0.8"/>
            <rect x="230" y="293.8" width="36" height="1.5" rx="0.75" fill="#8a9060" opacity="0.65"/>
            <rect x="280" y="293.8" width="48" height="1.5" rx="0.75" fill="#a87830" opacity="0.75"/>
            <!-- duplicate for seamless chase wrap -->
            <rect x="342" y="293.8" width="48" height="1.5" rx="0.75" fill="#e0b050" opacity="0.85"/>
            <rect x="402" y="293.8" width="36" height="1.5" rx="0.75" fill="#6b7355" opacity="0.7"/>
          </g>
        </g>
        <ellipse class="desk-led-glow" cx="200" cy="296" rx="120" ry="4.5" fill="#c7923a" opacity="0.14"/>
        <ellipse class="desk-led-glow-b" cx="160" cy="296" rx="55" ry="3.2" fill="#6b7355" opacity="0.1"/>
      </g>
      <path d="M52 316 V340 H78 V316 M322 316 V340 H348 V316" fill="#0c0e0c" stroke="#2a2e28"/>
      <!-- Zone Ops floor clutter — worn pizza boxes under / just beside the table -->
      <g id="floor-clutter">
        <g id="pizza-box-1" transform="translate(86 318) rotate(-6)">
          <rect x="0" y="0" width="52" height="38" rx="1.2" fill="#c4b896" stroke="#5a5348" stroke-width="0.9"/>
          <rect x="2" y="2" width="48" height="34" rx="0.8" fill="#a89870" opacity="0.55"/>
          <path d="M4 8 H48 M8 4 V34" stroke="#6b7355" stroke-width="0.45" opacity="0.35"/>
          <text x="26" y="22" text-anchor="middle" fill="#3a3228" font-family="Arial Black, Impact, sans-serif" font-size="6.5" opacity="0.55" letter-spacing="0.8">ZONE</text>
          <path d="M6 30 L18 34 M40 6 L48 14" stroke="#2a2a2a" stroke-width="0.55" opacity="0.4"/>
          <path d="M12 10 L22 8" stroke="#efe6d2" stroke-width="0.4" opacity="0.25"/>
        </g>
        <g id="pizza-box-2" transform="translate(128 328) rotate(8)">
          <rect x="0" y="0" width="46" height="34" rx="1" fill="#b8a882" stroke="#4a4438" stroke-width="0.85"/>
          <rect x="1.5" y="1.5" width="43" height="31" rx="0.6" fill="#9a8a62" opacity="0.5"/>
          <text x="23" y="20" text-anchor="middle" fill="#2a2418" font-family="Arial Black, Impact, sans-serif" font-size="5.8" opacity="0.5" letter-spacing="0.6">OPS</text>
          <path d="M4 28 Q14 32 24 28 Q34 24 42 30" stroke="#3a3228" stroke-width="0.7" opacity="0.45"/>
          <path d="M8 6 L16 12" stroke="#1a1a1a" stroke-width="0.5" opacity="0.35"/>
        </g>
        <g id="pizza-box-3" transform="translate(292 322) rotate(4)">
          <rect x="0" y="0" width="48" height="36" rx="1.1" fill="#cfc3a0" stroke="#5a5348" stroke-width="0.85"/>
          <rect x="2" y="2" width="44" height="32" rx="0.7" fill="#b0a078" opacity="0.48"/>
          <circle cx="24" cy="18" r="9" fill="none" stroke="#6b7355" stroke-width="0.65" opacity="0.4"/>
          <text x="24" y="20" text-anchor="middle" fill="#3a3228" font-family="Arial Black, Impact, sans-serif" font-size="5.2" opacity="0.45">12"</text>
          <path d="M5 8 L14 6 M36 28 L44 32" stroke="#2a2a2a" stroke-width="0.5" opacity="0.38"/>
          <path d="M10 30 L28 33" stroke="#8a7a58" stroke-width="1.1" opacity="0.35"/>
        </g>
      </g>
      <path d="M28 258 H372" stroke="#6b7355" stroke-width="1.05" opacity="0.35"/>
      <g id="desk-grain" fill="none" stroke-linecap="butt" opacity="0.32">
        <path d="M36 262 H368" stroke="#0e100e" stroke-width="0.55"/>
        <path d="M40 268 H364" stroke="#3a4238" stroke-width="0.4"/>
        <path d="M44 274 H360" stroke="#121410" stroke-width="0.45"/>
        <path d="M48 280 H356" stroke="#4a5346" stroke-width="0.35"/>
        <path d="M52 285 H352" stroke="#1a1c18" stroke-width="0.4"/>
      </g>
      <!-- Sparse dirty-beige / olive scuffs only (not a beige table) -->
      <g id="desk-patina" opacity="0.14">
        <ellipse cx="120" cy="270" rx="28" ry="6" fill="#6b7355"/>
        <ellipse cx="280" cy="276" rx="22" ry="5" fill="#c4b896"/>
      </g>
      <g id="desk-wear" fill="none" stroke-linecap="round">
        <path d="M96 268 Q118 272 132 266 Q148 263 168 270" stroke="#050605" stroke-width="1.25" opacity="0.7"/>
        <path d="M118 267 L126 274" stroke="#0a0c0a" stroke-width="0.85" opacity="0.55"/>
        <path d="M250 264 Q268 270 286 266" stroke="#1a1c18" stroke-width="1" opacity="0.5"/>
        <path d="M300 274 L322 282" stroke="#0e100e" stroke-width="0.85" opacity="0.45"/>
        <path d="M78 282 Q92 286 108 281" stroke="#121410" stroke-width="0.75" opacity="0.4"/>
        <path d="M34 260 L44 266" stroke="#050605" stroke-width="0.7" opacity="0.45"/>
        <path d="M366 260 L354 268" stroke="#050605" stroke-width="0.65" opacity="0.4"/>
      </g>
    </g>

    <!-- RECTANGULAR Nordic KB ON desk top (never trapezoid). Thin charcoal border. -->
    <g id="prop-keyboard">
      <rect x="56" y="262" width="192" height="28" rx="2.2" fill="#0a0a0a" stroke="#4a4a4a" stroke-width="0.65"/>
      <rect x="59" y="264.5" width="186" height="23" rx="1.4" fill="#121212"/>
      <!-- Toward him (top): Z-row + SPC -->
      <g class="kb-row" fill="#1c1c1c" stroke="#3a3a3a" stroke-width="0.45">
        <rect class="kb-deco" x="62" y="265.5" width="7" height="5" rx="0.6" fill="#161616"/>
        <g id="kb-s22" class="kb-key" data-slot="22"><rect x="70.5" y="265.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-b" x="76" y="268" font-size="3.5" dx="0.2" dy="-0.1">Z</text></g>
        <g id="kb-s23" class="kb-key" data-slot="23"><rect x="82.5" y="265.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-a" x="88" y="268" font-size="3.5">X</text></g>
        <g id="kb-s24" class="kb-key" data-slot="24"><rect x="94.5" y="265.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-c" x="100" y="268" font-size="3.5" dx="-0.2">C</text></g>
        <g id="kb-s25" class="kb-key" data-slot="25"><rect x="106.5" y="265.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-d" x="112" y="268" font-size="3.5">V</text></g>
        <g id="kb-s26" class="kb-key" data-slot="26"><rect x="118.5" y="265.5" width="48" height="5" rx="0.6"/><text class="kb-label wear-e" x="142.5" y="268" font-size="3" dx="0.3">SPC</text></g>
        <g id="kb-s27" class="kb-key" data-slot="27"><rect x="167.5" y="265.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-a" x="173" y="268" font-size="3.5">B</text></g>
        <g id="kb-s28" class="kb-key" data-slot="28"><rect x="179.5" y="265.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-c" x="185" y="268" font-size="3.5" dy="0.15">N</text></g>
        <g id="kb-s29" class="kb-key" data-slot="29"><rect x="191.5" y="265.5" width="11" height="5" rx="0.6"/><text class="kb-label wear-b" x="197" y="268" font-size="3.5">M</text></g>
        <rect class="kb-deco" x="203.5" y="265.5" width="28" height="5" rx="0.6" fill="#161616"/>
      </g>
      <text class="kb-deco-label" x="65.5" y="268" fill="#6a6a6a" font-family="ui-monospace, Consolas, monospace" font-size="2.8" text-anchor="middle" dominant-baseline="central">&lt;</text>
      <!-- A…LÖÄ -->
      <g class="kb-row" fill="#222222" stroke="#404040" stroke-width="0.5">
        <g id="kb-s11" class="kb-key" data-slot="11"><rect x="64" y="271.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-a" x="70.5" y="273.8" font-size="3.6">A</text></g>
        <g id="kb-s12" class="kb-key" data-slot="12"><rect x="78" y="271.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-d" x="84.5" y="273.8" font-size="3.6" dx="-0.15">S</text></g>
        <g id="kb-s13" class="kb-key" data-slot="13"><rect x="92" y="271.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-b" x="98.5" y="273.8" font-size="3.6">D</text></g>
        <g id="kb-s14" class="kb-key" data-slot="14"><rect x="106" y="271.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-c" x="112.5" y="273.8" font-size="3.6" dy="0.1">F</text></g>
        <g id="kb-s15" class="kb-key" data-slot="15"><rect x="120" y="271.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-e" x="126.5" y="273.8" font-size="3.6">G</text></g>
        <g id="kb-s16" class="kb-key" data-slot="16"><rect x="134" y="271.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-a" x="140.5" y="273.8" font-size="3.6" dx="0.2">H</text></g>
        <g id="kb-s17" class="kb-key" data-slot="17"><rect x="148" y="271.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-b" x="154.5" y="273.8" font-size="3.6">J</text></g>
        <g id="kb-s18" class="kb-key" data-slot="18"><rect x="162" y="271.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-d" x="168.5" y="273.8" font-size="3.6">K</text></g>
        <g id="kb-s19" class="kb-key" data-slot="19"><rect x="176" y="271.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-c" x="182.5" y="273.8" font-size="3.6" dx="-0.1">L</text></g>
        <g id="kb-s20" class="kb-key" data-slot="20"><rect x="190" y="271.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-e" x="196.5" y="273.8" font-size="3.6">Ö</text></g>
        <g id="kb-s21" class="kb-key" data-slot="21"><rect x="204" y="271.2" width="13" height="5.2" rx="0.6"/><text class="kb-label wear-a" x="210.5" y="273.8" font-size="3.6" dy="-0.15">Ä</text></g>
      </g>
      <!-- Q…PÅ -->
      <g class="kb-row" fill="#2a2a2a" stroke="#4a4a4a" stroke-width="0.5">
        <g id="kb-s0" class="kb-key" data-slot="0"><rect x="62" y="277" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-d" x="68.25" y="279.5" font-size="3.5" dx="0.1">Q</text></g>
        <g id="kb-s1" class="kb-key" data-slot="1"><rect x="75.5" y="277" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-a" x="81.75" y="279.5" font-size="3.5">W</text></g>
        <g id="kb-s2" class="kb-key" data-slot="2"><rect x="89" y="277" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-c" x="95.25" y="279.5" font-size="3.5" dy="-0.1">E</text></g>
        <g id="kb-s3" class="kb-key" data-slot="3"><rect x="102.5" y="277" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-b" x="108.75" y="279.5" font-size="3.5">R</text></g>
        <g id="kb-s4" class="kb-key" data-slot="4"><rect x="116" y="277" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-e" x="122.25" y="279.5" font-size="3.5" dx="-0.15">T</text></g>
        <g id="kb-s5" class="kb-key" data-slot="5"><rect x="129.5" y="277" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-a" x="135.75" y="279.5" font-size="3.5">Y</text></g>
        <g id="kb-s6" class="kb-key" data-slot="6"><rect x="143" y="277" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-d" x="149.25" y="279.5" font-size="3.5">U</text></g>
        <g id="kb-s7" class="kb-key" data-slot="7"><rect x="156.5" y="277" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-c" x="162.75" y="279.5" font-size="3.5" dx="0.15">I</text></g>
        <g id="kb-s8" class="kb-key" data-slot="8"><rect x="170" y="277" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-b" x="176.25" y="279.5" font-size="3.5">O</text></g>
        <g id="kb-s9" class="kb-key" data-slot="9"><rect x="183.5" y="277" width="12.5" height="5" rx="0.6"/><text class="kb-label wear-e" x="189.75" y="279.5" font-size="3.5" dy="0.1">P</text></g>
        <g id="kb-s10" class="kb-key" data-slot="10"><rect x="197" y="277" width="13" height="5" rx="0.6"/><text class="kb-label wear-a" x="203.5" y="279.5" font-size="3.5">Å</text></g>
      </g>
      <!-- Toward viewer (bottom): number row -->
      <g class="kb-row kb-num" fill="#181818" stroke="#333333" stroke-width="0.4">
        <rect x="62" y="282.8" width="12" height="3.8" rx="0.5"/><rect x="75" y="282.8" width="12" height="3.8" rx="0.5"/>
        <rect x="88" y="282.8" width="12" height="3.8" rx="0.5"/><rect x="101" y="282.8" width="12" height="3.8" rx="0.5"/>
        <rect x="114" y="282.8" width="12" height="3.8" rx="0.5"/><rect x="127" y="282.8" width="12" height="3.8" rx="0.5"/>
        <rect x="140" y="282.8" width="12" height="3.8" rx="0.5"/><rect x="153" y="282.8" width="12" height="3.8" rx="0.5"/>
        <rect x="166" y="282.8" width="12" height="3.8" rx="0.5"/><rect x="179" y="282.8" width="12" height="3.8" rx="0.5"/>
        <rect x="192" y="282.8" width="12" height="3.8" rx="0.5"/><rect x="205" y="282.8" width="13" height="3.8" rx="0.5"/>
      </g>
      <g class="kb-labels-num" fill="#6a6a6a" font-family="ui-monospace, Consolas, monospace" font-size="3.2" text-anchor="middle" dominant-baseline="central">
        <text x="68" y="284.7">1</text><text x="81" y="284.7">2</text><text x="94" y="284.7">3</text>
        <text x="107" y="284.7">4</text><text x="120" y="284.7">5</text><text x="133" y="284.7">6</text>
        <text x="146" y="284.7">7</text><text x="159" y="284.7">8</text><text x="172" y="284.7">9</text>
        <text x="185" y="284.7">0</text><text x="198" y="284.7">+</text><text x="211.5" y="284.7">´</text>
      </g>
    </g>

    <!-- Black rectangular mousepad ON desk top, charcoal mouse -->
    <g id="prop-mousepad">
      <rect x="288" y="264" width="56" height="26" rx="2" fill="#0a0a0a" stroke="#1a1a1a" stroke-width="0.55" opacity="0.94"/>
      <rect x="291" y="266.5" width="50" height="21" rx="1.2" fill="#050505" opacity="0.5"/>
    </g>
    <g id="prop-mouse">
      <path d="M300 268 Q316 264 330 269 L328 284 Q315 289 302 284 Z" fill="#121212" stroke="#4a4a4a" stroke-width="0.85"/>
      <path id="mouse-lmb" class="mouse-btn mouse-lmb" d="M302 269 Q309 266 314.5 268 L314.2 279 Q308.5 281.5 302.5 279.5 Z" fill="#1a1a1a"/>
      <path id="mouse-rmb" class="mouse-btn mouse-rmb" d="M315.5 268 Q321.5 266 328 270 L326.5 280 Q321 282.5 315.5 279.5 Z" fill="#1a1a1a"/>
      <g id="mouse-wheel" transform-origin="315px 274px">
        <ellipse cx="315" cy="274" rx="2.1" ry="3.4" fill="#2a2a2a" stroke="#5a5a5a" stroke-width="0.55"/>
        <path d="M315 271 V277" stroke="#8a8a8a" stroke-width="0.55" opacity="0.85"/>
        <path d="M313.4 274 H316.6" stroke="#5a5a5a" stroke-width="0.45" opacity="0.8"/>
      </g>
    </g>

    <!--
      ONE continuous arm per side inside #hand-* so key/mouse aim moves sleeve+hand together.
      Roots attach to vest side (world space ≈ scaled vest roots + sit). No separate shoulder pads.
      Outer #hand-* receives JS transforms (pivot at vest root).
    -->
    <!--
      Short relaxed sleeves rooted at mid-vest sides (world ≈ scaled vest + sit),
      NOT helm. Pivot at vest root; #hand-*-aim gets key/mouse transforms.
    -->
    <g id="hand-left">
      <g id="hand-left-pivot" transform="translate(128 220)">
        <g id="hand-left-aim">
          <!-- Anchor CSS transform-origin at vest root (0,0 in aim space) -->
          <circle cx="0" cy="0" r="0.5" fill="none" opacity="0"/>
          <g id="hand-left-sit" transform="translate(-128 -220)">
            <g id="arm-left" class="arm-continuous">
              <!-- Short chill sit: deep vest-side root → wrist (below helm) -->
              <path id="sleeve-left-fill" d="M128 220 L116 236 L110 250 L114 260 L118 268" fill="none" stroke="#0e0e0e" stroke-width="22" stroke-linecap="butt" stroke-linejoin="miter"/>
              <g id="sleeve-stripes-left" fill="none" stroke="#efe6d2" stroke-linecap="butt" stroke-linejoin="miter" stroke-width="2.1">
                <path d="M128 220 L116 236 L110 250 L114 260 L118 268" transform="translate(-4.0 0)"/>
                <path d="M128 220 L116 236 L110 250 L114 260 L118 268"/>
                <path d="M128 220 L116 236 L110 250 L114 260 L118 268" transform="translate(4.0 0)"/>
              </g>
              <g id="sleeve-wear-left" fill="none" stroke-linecap="round">
                <path d="M118 232 L110 238" stroke="#c8c2b0" stroke-width="0.55" opacity="0.35"/>
                <path d="M114 246 L108 252" stroke="#8a8a8a" stroke-width="0.45" opacity="0.4"/>
              </g>
              <ellipse cx="118" cy="268" rx="7.2" ry="4" fill="#1a1a1a" stroke="#050505" stroke-width="0.7"/>
            </g>
            <path d="M100 264 L138 262 L140 274 L103 276 Z" fill="#c4a07a" stroke="#6a4a32" stroke-width="1"/>
            <rect x="106" y="272" width="4.4" height="10" rx="1.6" fill="#b89068" stroke="#6a4a32" stroke-width="0.55"/>
            <rect x="115" y="271" width="4.4" height="11" rx="1.6" fill="#c4a07a" stroke="#6a4a32" stroke-width="0.55"/>
            <rect x="124" y="272" width="4.4" height="10" rx="1.6" fill="#b89068" stroke="#6a4a32" stroke-width="0.55"/>
            <rect x="133" y="273" width="4.4" height="9" rx="1.6" fill="#c4a07a" stroke="#6a4a32" stroke-width="0.55"/>
          </g>
        </g>
      </g>
    </g>

    <g id="hand-right">
      <g id="hand-right-pivot" transform="translate(272 220)">
        <g id="hand-right-aim">
          <g id="hand-right-sit" transform="translate(-272 -220)">
            <g id="arm-right" class="arm-continuous">
              <path id="sleeve-right-fill" d="M272 220 L286 236 L298 250 L306 260 L314 268" fill="none" stroke="#0e0e0e" stroke-width="18" stroke-linecap="butt" stroke-linejoin="miter"/>
              <g id="sleeve-stripes-right" fill="none" stroke="#efe6d2" stroke-linecap="butt" stroke-linejoin="miter" stroke-width="2.0">
                <path d="M272 220 L286 236 L298 250 L306 260 L314 268" transform="translate(-3.8 0)"/>
                <path d="M272 220 L286 236 L298 250 L306 260 L314 268"/>
                <path d="M272 220 L286 236 L298 250 L306 260 L314 268" transform="translate(3.8 0)"/>
              </g>
              <g id="sleeve-wear-right" fill="none" stroke-linecap="round">
                <path d="M282 232 L290 238" stroke="#c8c2b0" stroke-width="0.5" opacity="0.32"/>
                <path d="M294 246 L300 252" stroke="#7a7a7a" stroke-width="0.45" opacity="0.38"/>
              </g>
              <ellipse cx="314" cy="268" rx="6.8" ry="3.8" fill="#1a1a1a" stroke="#050505" stroke-width="0.7"/>
            </g>
            <path d="M302 264 L324 266 L322 278 L304 276 Z" fill="#c4a07a" stroke="#6a4a32" stroke-width="1" opacity="0.96"/>
            <rect id="finger-lmb" x="306" y="270" width="4.2" height="9.5" rx="1.4" fill="#b89068"/>
            <rect id="finger-rmb" x="314" y="271" width="4.2" height="9" rx="1.4" fill="#b89068"/>
          </g>
        </g>
      </g>
    </g>
  </g>
  </g>
</svg>
`.trim();
