/**
 * Original bulky zone-ops operator (Killa/Maska-inspired vibe only).
 * LMG silhouette is original art (RPK-energy, no ripped assets).
 * Desk name uses self-hosted Bender (#desk-streamer-name).
 * Layers: #layer-torso #layer-head #hand-left #hand-right
 */
export const scavengerSvg = `
<svg viewBox="0 0 400 340" xmlns="http://www.w3.org/2000/svg" aria-label="Zone scavenger avatar" role="img">
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
    <linearGradient id="gunMetal" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3a3e36"/>
      <stop offset="100%" stop-color="#1a1c16"/>
    </linearGradient>
  </defs>

  <ellipse cx="200" cy="318" rx="140" ry="14" fill="#000" opacity="0.45"/>

  <!-- Original LMG resting on back — barrel left, drum left flank, stock right of helm -->
  <g id="prop-lmg">
    <!-- long barrel rising behind left shoulder -->
    <path d="M18 96 L118 128 L116 140 L16 108 Z" fill="#2e3228" stroke="#0e100c" stroke-width="1.2"/>
    <path d="M28 90 L108 118 L106 124 L26 96 Z" fill="#3a4034" stroke="#0e100c" stroke-width="0.8"/>
    <rect x="12" y="94" width="16" height="16" rx="2" fill="#242820" stroke="#0e100c" transform="rotate(18 20 102)"/>
    <!-- receiver tucked behind shoulders -->
    <path d="M112 124 L292 96 L304 118 L124 148 Z" fill="url(#gunMetal)" stroke="#0e100c" stroke-width="1.3"/>
    <!-- RPK-energy drum mag clear of left torso -->
    <circle cx="58" cy="168" r="36" fill="#2a2e24" stroke="#0e100c" stroke-width="1.8"/>
    <circle cx="58" cy="168" r="24" fill="#1a1c16" stroke="#5a6450" stroke-width="1.4"/>
    <circle cx="58" cy="168" r="8" fill="#0e100c"/>
    <path d="M58 132 L66 146 M82 150 L70 162 M82 186 L68 180 M34 186 L42 172 M34 150 L46 158"
      stroke="#6b7355" stroke-width="1.7" opacity="0.8"/>
    <path d="M78 148 L98 138" stroke="#3a4034" stroke-width="6" stroke-linecap="round"/>
    <!-- wooden stock peeking right of helmet -->
    <path d="M292 92 L352 68 L362 92 L340 128 L300 124 Z" fill="#2a241c" stroke="#0e100c" stroke-width="1.2"/>
    <path d="M304 88 H330 V78 H310 Z" fill="#1a1c16" stroke="#0e100c"/>
    <!-- folded bipod under barrel -->
    <path d="M42 112 L28 148 M56 118 L68 152" stroke="#3a4034" stroke-width="3.2" stroke-linecap="round"/>
  </g>

  <!-- DESK — name sits fully on front panel inside viewBox -->
  <g id="desk">
    <path d="M32 262 H368 L348 304 H52 Z" fill="url(#deskGrad)" stroke="#5a5348" stroke-width="1.6"/>
    <path d="M52 304 V326 H80 V304 M320 304 V326 H348 V304" fill="#241e18" stroke="#4a443c"/>
    <!-- surface lip -->
    <path d="M40 262 H360" stroke="#6b7355" stroke-width="1.2" opacity="0.55"/>
    <text id="desk-streamer-name" x="200" y="290" text-anchor="middle"
      fill="#d4a03a" stroke="#1a1408" stroke-width="0.9"
      font-family="Bender, Oswald, sans-serif" font-weight="700" font-size="20"
      letter-spacing="1.5" style="paint-order: stroke fill">datguydaz</text>
    <path d="M118 298 H282" stroke="#6b7355" stroke-width="1" stroke-dasharray="4 3" opacity="0.55"/>
  </g>

  <!-- TORSO -->
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
    <rect x="62" y="138" width="72" height="44" rx="10" fill="#5a6842" stroke="#1a2014" stroke-width="1.6"/>
    <rect x="266" y="138" width="72" height="44" rx="10" fill="#5a6842" stroke="#1a2014" stroke-width="1.6"/>

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
    <rect x="156" y="94" width="11" height="80" rx="1.5" fill="#efe6d2"/>
    <rect x="174" y="94" width="11" height="80" rx="1.5" fill="#efe6d2"/>
    <rect x="215" y="94" width="11" height="80" rx="1.5" fill="#efe6d2"/>
    <rect x="233" y="94" width="11" height="80" rx="1.5" fill="#efe6d2"/>
    <rect x="162" y="124" width="76" height="10" rx="2" fill="#0a0c08" stroke="#c7923a" stroke-width="1.4"/>
    <rect x="168" y="126" width="64" height="5" rx="1" fill="#3a4a28" opacity="0.85"/>
    <rect x="150" y="96" width="100" height="5" rx="1" fill="#c7923a" opacity="0.75"/>
    <ellipse cx="200" cy="168" rx="16" ry="10" fill="#1a1c16" stroke="#3a3830" stroke-width="1.2"/>
    <circle cx="200" cy="168" r="4" fill="#0a0c08"/>
  </g>

  <!-- Improvised field keyboard — shallow perspective, under left hand -->
  <g id="prop-keyboard">
    <path d="M54 250 L238 246 L234 274 L60 276 Z" fill="#141612" stroke="#6b7355" stroke-width="1.3"/>
    <path d="M58 252 L232 248 L230 260 L60 262 Z" fill="#1c2218"/>
    <g fill="#2e3428" stroke="#4a5240" stroke-width="0.45">
      <path d="M66 254 h14 v6 h-14z"/><path d="M82 254 h14 v6 h-14z"/><path d="M98 254 h14 v6 h-14z"/>
      <path d="M114 254 h14 v6 h-14z"/><path d="M130 254 h14 v6 h-14z"/><path d="M146 254 h14 v6 h-14z"/>
      <path d="M162 254 h14 v6 h-14z"/><path d="M178 254 h14 v6 h-14z"/><path d="M194 254 h14 v6 h-14z"/>
      <path d="M210 254 h16 v6 h-16z"/>
    </g>
    <g fill="#262c22" stroke="#3a4234" stroke-width="0.4">
      <path d="M70 264 h12 v5 h-12z"/><path d="M84 264 h12 v5 h-12z"/><path d="M98 264 h12 v5 h-12z"/>
      <path d="M114 264 h48 v5 h-48z"/>
      <path d="M164 264 h12 v5 h-12z"/><path d="M178 264 h12 v5 h-12z"/><path d="M192 264 h12 v5 h-12z"/>
      <path d="M208 264 h18 v5 h-18z"/>
    </g>
    <path d="M64 272 H220" stroke="#5a6450" stroke-width="0.7" opacity="0.45"/>
  </g>

  <!-- Compact field mouse — under right hand -->
  <g id="prop-mouse">
    <path d="M276 246 Q292 238 308 246 L312 268 Q292 278 272 268 Z" fill="#1a1e16" stroke="#8a9480" stroke-width="1.4"/>
    <path d="M292 240 V262" stroke="#c7923a" stroke-width="1.2" opacity="0.9"/>
    <path d="M278 250 Q292 246 306 250" fill="none" stroke="#4a5240" stroke-width="1"/>
    <ellipse cx="292" cy="270" rx="6" ry="3.5" fill="#2a2e24" opacity="0.75"/>
  </g>

  <g id="desk-lights">
    <rect x="326" y="250" width="28" height="9" rx="1" fill="#121410" stroke="#4a5240"/>
    <circle class="eq-light" cx="334" cy="266" r="3.2" fill="#c7923a">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.15s" repeatCount="indefinite"/>
    </circle>
    <circle class="eq-light" cx="346" cy="266" r="3.2" fill="#c7923a" opacity="0.35"/>
  </g>

  <!-- Hands resting on peripherals -->
  <g id="hand-left">
    <path d="M86 244 Q112 230 146 242 Q154 254 134 260 Q106 264 88 252 Z" fill="#4a463c" stroke="#1a1810" stroke-width="1.2"/>
    <path d="M102 242 L106 254 M114 240 L118 254 M126 242 L128 254" stroke="#2a261c" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="94" cy="248" rx="6" ry="5" fill="#3a3630"/>
  </g>

  <g id="hand-right">
    <path d="M274 244 Q296 228 318 246 Q324 258 302 264 Q276 266 272 250 Z" fill="#4a463c" stroke="#1a1810" stroke-width="1.2"/>
    <path d="M286 242 L288 256 M296 240 L300 256 M306 244 L308 254" stroke="#2a261c" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="280" cy="248" rx="6" ry="5" fill="#3a3630"/>
  </g>
</svg>
`.trim();
