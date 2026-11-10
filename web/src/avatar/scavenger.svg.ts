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
    <linearGradient id="armorOlive" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6b7548"/>
      <stop offset="45%" stop-color="#4a5434"/>
      <stop offset="100%" stop-color="#2c3420"/>
    </linearGradient>
    <linearGradient id="suitDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2e28"/>
      <stop offset="100%" stop-color="#121410"/>
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
    <linearGradient id="pouchGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a3228"/>
      <stop offset="100%" stop-color="#1a1612"/>
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
      <path d="M110 300 H290" stroke="#6b7355" stroke-width="1" stroke-dasharray="5 3 2 3" opacity="0.45"/>
    </g>

    <!-- TORSO: imposing fat armored mass -->
    <g id="layer-torso">
      <path d="M78 148 L118 132 L200 124 L282 132 L322 148 L338 236 L62 236 Z" fill="url(#suitDark)" stroke="#0e100c" stroke-width="1.5"/>
      <path d="M95 165 Q52 200 88 238" fill="none" stroke="#1a1e18" stroke-width="42" stroke-linecap="round"/>
      <path d="M305 165 Q348 200 312 238" fill="none" stroke="#1a1e18" stroke-width="42" stroke-linecap="round"/>
      <path d="M95 165 Q52 200 88 238" fill="none" stroke="#2a2e28" stroke-width="32" stroke-linecap="round"/>
      <path d="M305 165 Q348 200 312 238" fill="none" stroke="#2a2e28" stroke-width="32" stroke-linecap="round"/>
      <path d="M64 185 Q50 210 74 232" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M74 183 Q60 210 84 230" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M84 185 Q72 210 94 228" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M336 185 Q350 210 326 232" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M326 183 Q340 210 316 230" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M316 185 Q328 210 306 228" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
      <path d="M70 218 Q82 230 94 236" fill="none" stroke="#3a4034" stroke-width="14" stroke-linecap="round"/>
      <path d="M330 218 Q318 230 306 236" fill="none" stroke="#3a4034" stroke-width="14" stroke-linecap="round"/>
      <path d="M96 142 L130 128 L200 122 L270 128 L304 142 L314 228 L86 228 Z" fill="url(#armorOlive)" stroke="#1a2014" stroke-width="2"/>
      <path d="M148 128 Q200 148 252 128 L246 158 Q200 172 154 158 Z" fill="#5a6440" stroke="#1a2014" stroke-width="1.4"/>
      <g id="shoulder-left" class="shoulder">
        <rect x="62" y="138" width="72" height="44" rx="10" fill="#5a6842" stroke="#1a2014" stroke-width="1.6"/>
        <rect x="70" y="148" width="56" height="12" rx="2" fill="#2a2e24" opacity="0.5"/>
      </g>
      <g id="shoulder-right" class="shoulder">
        <rect x="266" y="138" width="72" height="44" rx="10" fill="#5a6842" stroke="#1a2014" stroke-width="1.6"/>
        <rect x="274" y="148" width="56" height="12" rx="2" fill="#2a2e24" opacity="0.5"/>
      </g>
      <g id="chest-rig">
        <rect x="118" y="178" width="36" height="48" rx="3" fill="url(#pouchGrad)" stroke="#0e100c" stroke-width="1.3"/>
        <rect x="160" y="178" width="36" height="48" rx="3" fill="url(#pouchGrad)" stroke="#0e100c" stroke-width="1.3"/>
        <rect x="204" y="178" width="36" height="48" rx="3" fill="url(#pouchGrad)" stroke="#0e100c" stroke-width="1.3"/>
        <rect x="246" y="178" width="36" height="48" rx="3" fill="url(#pouchGrad)" stroke="#0e100c" stroke-width="1.3"/>
        <path d="M124 186 H148 M166 186 H190 M210 186 H234 M252 186 H276" stroke="#5a5348" stroke-width="2"/>
      </g>
      <rect x="94" y="224" width="212" height="14" rx="2" fill="#1a1c16" stroke="#3a4032"/>
      <rect x="104" y="227" width="48" height="8" rx="1" fill="#efe6d2" opacity="0.55"/>
      <rect x="248" y="227" width="48" height="8" rx="1" fill="#efe6d2" opacity="0.55"/>
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

    <!-- Field keyboard -->
    <g id="prop-keyboard">
      <rect x="48" y="244" width="196" height="40" rx="3.5" fill="#0c0e0a" stroke="#c4b59a" stroke-width="1.8"/>
      <rect x="54" y="249" width="184" height="30" rx="2" fill="#161a14"/>
      <g fill="#3a4434" stroke="#9a8f78" stroke-width="0.9">
        <rect x="60" y="252" width="15" height="11" rx="1.5"/>
        <rect x="78" y="252" width="15" height="11" rx="1.5"/>
        <rect x="96" y="252" width="15" height="11" rx="1.5"/>
        <rect x="114" y="252" width="15" height="11" rx="1.5"/>
        <rect x="132" y="252" width="15" height="11" rx="1.5"/>
        <rect x="150" y="252" width="15" height="11" rx="1.5"/>
        <rect x="168" y="252" width="15" height="11" rx="1.5"/>
        <rect x="186" y="252" width="15" height="11" rx="1.5"/>
        <rect x="204" y="252" width="15" height="11" rx="1.5"/>
        <rect x="222" y="252" width="12" height="11" rx="1.5"/>
      </g>
      <g fill="#2e362a" stroke="#6b7355" stroke-width="0.8">
        <rect x="66" y="266" width="14" height="9" rx="1.2"/>
        <rect x="83" y="266" width="14" height="9" rx="1.2"/>
        <rect x="100" y="266" width="14" height="9" rx="1.2"/>
        <rect x="117" y="266" width="52" height="9" rx="1.2"/>
        <rect x="172" y="266" width="14" height="9" rx="1.2"/>
        <rect x="189" y="266" width="14" height="9" rx="1.2"/>
        <rect x="206" y="266" width="14" height="9" rx="1.2"/>
        <rect x="223" y="266" width="12" height="9" rx="1.2"/>
      </g>
      <rect x="58" y="278" width="176" height="2.5" fill="#c7923a" opacity="0.55"/>
    </g>

    <!-- ONE mouse only — far right of keyboard, under right hand -->
    <g id="prop-mouse">
      <rect x="298" y="248" width="28" height="22" rx="8" fill="#161a14" stroke="#9a8f78" stroke-width="1.3"/>
      <path d="M312 250 V266" stroke="#6b7355" stroke-width="1.2"/>
      <rect x="302" y="268" width="20" height="4" rx="1.5" fill="#2a2e24"/>
    </g>

    <g id="desk-lights">
      <rect x="340" y="248" width="32" height="11" rx="1" fill="#121410" stroke="#4a5240"/>
      <circle class="eq-light" cx="348" cy="268" r="4" fill="#c7923a">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="1.15s" repeatCount="indefinite"/>
      </circle>
      <circle class="eq-light" cx="362" cy="268" r="4" fill="#c7923a" opacity="0.35"/>
    </g>

    <!-- Left hand ON KEYBOARD: palm over keybed, fingers on WASD/home row — no device under it -->
    <g id="hand-left">
      <path d="M108 228 L148 226 L152 240 L112 244 Z" fill="#4a463c" stroke="#1a1810" stroke-width="1"/>
      <rect x="114" y="242" width="5" height="16" rx="2" fill="#4a463c" stroke="#1a1810" stroke-width="0.6"/>
      <rect x="124" y="240" width="5" height="18" rx="2" fill="#4a463c" stroke="#1a1810" stroke-width="0.6"/>
      <rect x="134" y="242" width="5" height="16" rx="2" fill="#4a463c" stroke="#1a1810" stroke-width="0.6"/>
      <rect x="144" y="244" width="5" height="14" rx="2" fill="#4a463c" stroke="#1a1810" stroke-width="0.6"/>
      <path d="M108 234 L100 230" stroke="#4a463c" stroke-width="4" stroke-linecap="round"/>
    </g>

    <!-- Right hand on the single mouse -->
    <g id="hand-right">
      <path d="M300 236 L326 238 L324 258 L302 254 Z" fill="#4a463c" stroke="#1a1810" stroke-width="1"/>
      <rect x="308" y="248" width="4" height="12" rx="1.5" fill="#3a3630"/>
      <rect x="316" y="250" width="4" height="10" rx="1.5" fill="#3a3630"/>
    </g>
  </g>
  </g>
</svg>
`.trim();
