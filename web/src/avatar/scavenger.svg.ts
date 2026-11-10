/**
 * Original bulky zone-ops operator (Killa/Maska-inspired vibe only).
 * Fat padded silhouette, dark Maska-style shell + stripe bars, triple sleeve
 * stripes (no brand marks), chest-rig mass, KB+mouse under animatable hands.
 * Layers: #layer-torso #layer-head #hand-left #hand-right
 * Desk name: #desk-streamer-name (settings-bound)
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
    <filter id="stencilScratch" x="-5%" y="-20%" width="110%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" result="noise" seed="7"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
  </defs>

  <ellipse cx="200" cy="318" rx="140" ry="14" fill="#000" opacity="0.45"/>

  <!-- DESK with KB + mouse -->
  <g id="desk">
    <path d="M28 268 H372 L352 302 H48 Z" fill="url(#deskGrad)" stroke="#5a5348" stroke-width="1.6"/>
    <path d="M48 302 V328 H78 V302 M322 302 V328 H352 V302" fill="#241e18" stroke="#4a443c"/>

    <!-- Keyboard under left hand -->
    <g id="prop-keyboard">
      <rect x="70" y="252" width="168" height="24" rx="2" fill="#121410" stroke="#6b7355" stroke-width="1.2"/>
      <g fill="#2a2e24" stroke="#4a5240" stroke-width="0.55">
        <rect x="76" y="256" width="12" height="9" rx="1"/>
        <rect x="92" y="256" width="12" height="9" rx="1"/>
        <rect x="108" y="256" width="12" height="9" rx="1"/>
        <rect x="124" y="256" width="12" height="9" rx="1"/>
        <rect x="140" y="256" width="12" height="9" rx="1"/>
        <rect x="156" y="256" width="12" height="9" rx="1"/>
        <rect x="172" y="256" width="12" height="9" rx="1"/>
        <rect x="188" y="256" width="12" height="9" rx="1"/>
        <rect x="204" y="256" width="26" height="9" rx="1"/>
        <rect x="82" y="267" width="140" height="5" rx="1"/>
      </g>
      <rect x="78" y="270" width="150" height="2" fill="#c7923a" opacity="0.35"/>
    </g>

    <!-- Mouse under right hand -->
    <g id="prop-mouse">
      <ellipse cx="292" cy="264" rx="20" ry="26" fill="#1e201a" stroke="#6b7355" stroke-width="1.2"/>
      <line x1="292" y1="244" x2="292" y2="264" stroke="#8a6528" stroke-width="1.5"/>
      <path d="M280 252 Q292 248 304 252" fill="none" stroke="#4a5240" stroke-width="1"/>
    </g>

    <rect x="322" y="248" width="34" height="12" rx="1" fill="#121410" stroke="#4a5240"/>
    <circle class="eq-light" cx="330" cy="266" r="4" fill="#c7923a">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.15s" repeatCount="indefinite"/>
    </circle>
    <circle class="eq-light" cx="344" cy="266" r="4" fill="#c7923a" opacity="0.35"/>

    <!-- Distressed stencil / hazard desk lettering -->
    <g filter="url(#stencilScratch)">
      <text id="desk-streamer-name" x="200" y="292" text-anchor="middle"
        fill="#c7923a" stroke="#1a1408" stroke-width="0.8"
        font-size="18" font-family="Oswald, 'Arial Narrow', Impact, sans-serif"
        font-weight="700" letter-spacing="3.5"
        style="paint-order: stroke fill">datguydaz</text>
      <text aria-hidden="true" x="201.5" y="293.5" text-anchor="middle"
        fill="#2a2418" opacity="0.45"
        font-size="18" font-family="Oswald, 'Arial Narrow', Impact, sans-serif"
        font-weight="700" letter-spacing="3.5">datguydaz</text>
    </g>
    <!-- scratched underline / hazard tick marks -->
    <path d="M118 298 H282" stroke="#6b7355" stroke-width="1" stroke-dasharray="6 4 2 4" opacity="0.7"/>
    <path d="M124 296 L128 300 M270 296 L274 300" stroke="#c7923a" stroke-width="1.2" opacity="0.6"/>
  </g>

  <!-- TORSO: imposing fat armored mass -->
  <g id="layer-torso">
    <!-- dark tracksuit base under armor -->
    <path d="M78 148 L118 132 L200 124 L282 132 L322 148 L342 272 L58 272 Z" fill="url(#suitDark)" stroke="#0e100c" stroke-width="1.5"/>

    <!-- thick arms (dark suit) -->
    <path d="M95 165 Q48 210 82 262" fill="none" stroke="#1a1e18" stroke-width="42" stroke-linecap="round"/>
    <path d="M305 165 Q352 210 318 262" fill="none" stroke="#1a1e18" stroke-width="42" stroke-linecap="round"/>
    <path d="M95 165 Q48 210 82 262" fill="none" stroke="#2a2e28" stroke-width="32" stroke-linecap="round"/>
    <path d="M305 165 Q352 210 318 262" fill="none" stroke="#2a2e28" stroke-width="32" stroke-linecap="round"/>

    <!-- THREE sleeve track stripes (no logos) — left -->
    <path d="M64 188 Q48 220 70 252" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
    <path d="M74 186 Q58 220 80 250" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
    <path d="M84 188 Q70 220 90 248" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
    <!-- THREE sleeve track stripes — right -->
    <path d="M336 188 Q352 220 330 252" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
    <path d="M326 186 Q342 220 320 250" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>
    <path d="M316 188 Q330 220 310 248" fill="none" stroke="#efe6d2" stroke-width="5" stroke-linecap="round"/>

    <!-- forearm cuffs -->
    <path d="M68 232 Q80 250 92 260" fill="none" stroke="#3a4034" stroke-width="16" stroke-linecap="round"/>
    <path d="M332 232 Q320 250 308 260" fill="none" stroke="#3a4034" stroke-width="16" stroke-linecap="round"/>

    <!-- massive olive armor vest -->
    <path d="M96 142 L130 128 L200 122 L270 128 L304 142 L318 250 L82 250 Z" fill="url(#armorOlive)" stroke="#1a2014" stroke-width="2"/>
    <!-- high neck / gorget pad -->
    <path d="M148 128 Q200 148 252 128 L246 158 Q200 172 154 158 Z" fill="#5a6440" stroke="#1a2014" stroke-width="1.4"/>
    <!-- blocky shoulders -->
    <rect x="62" y="138" width="72" height="44" rx="10" fill="#5a6842" stroke="#1a2014" stroke-width="1.6"/>
    <rect x="266" y="138" width="72" height="44" rx="10" fill="#5a6842" stroke="#1a2014" stroke-width="1.6"/>
    <rect x="70" y="148" width="56" height="12" rx="2" fill="#2a2e24" opacity="0.5"/>
    <rect x="274" y="148" width="56" height="12" rx="2" fill="#2a2e24" opacity="0.5"/>

    <!-- chest rig: four mag pouches -->
    <g id="chest-rig">
      <rect x="118" y="178" width="36" height="52" rx="3" fill="url(#pouchGrad)" stroke="#0e100c" stroke-width="1.3"/>
      <rect x="160" y="178" width="36" height="52" rx="3" fill="url(#pouchGrad)" stroke="#0e100c" stroke-width="1.3"/>
      <rect x="204" y="178" width="36" height="52" rx="3" fill="url(#pouchGrad)" stroke="#0e100c" stroke-width="1.3"/>
      <rect x="246" y="178" width="36" height="52" rx="3" fill="url(#pouchGrad)" stroke="#0e100c" stroke-width="1.3"/>
      <path d="M124 186 H148 M166 186 H190 M210 186 H234 M252 186 H276" stroke="#5a5348" stroke-width="2"/>
      <path d="M124 200 H148 M166 200 H190 M210 200 H234 M252 200 H276" stroke="#3a3830" stroke-width="1" opacity="0.6"/>
    </g>

    <!-- waistband -->
    <rect x="90" y="248" width="220" height="16" rx="2" fill="#1a1c16" stroke="#3a4032"/>
    <rect x="100" y="252" width="48" height="8" rx="1" fill="#efe6d2" opacity="0.55"/>
    <rect x="252" y="252" width="48" height="8" rx="1" fill="#efe6d2" opacity="0.55"/>
  </g>

  <!-- HEAD: dark Maska-energy shell + vertical bars + crown stripes -->
  <g id="layer-head">
    <!-- helmet dome -->
    <ellipse cx="200" cy="108" rx="72" ry="58" fill="url(#helmDark)" stroke="#0a0c08" stroke-width="2"/>
    <!-- THREE white crown / face stripes over helmet (racing energy, original) -->
    <path d="M188 58 Q200 48 212 58 L208 118 L192 118 Z" fill="#efe6d2"/>
    <path d="M170 64 Q180 52 186 66 L182 120 L168 118 Z" fill="#efe6d2" opacity="0.95"/>
    <path d="M214 66 Q220 52 230 64 L232 118 L218 120 Z" fill="#efe6d2" opacity="0.95"/>

    <!-- ear cups -->
    <rect x="118" y="100" width="32" height="48" rx="12" fill="#2a2e24" stroke="#0a0c08" stroke-width="1.5"/>
    <rect x="250" y="100" width="32" height="48" rx="12" fill="#2a2e24" stroke="#0a0c08" stroke-width="1.5"/>
    <circle cx="134" cy="124" r="7" fill="#121410" stroke="#5a5348"/>
    <circle cx="266" cy="124" r="7" fill="#121410" stroke="#5a5348"/>

    <!-- heavy dark face plate -->
    <rect x="144" y="88" width="112" height="92" rx="10" fill="url(#plateMetal)" stroke="#0a0c08" stroke-width="2.2"/>
    <!-- bold vertical white bars on plate -->
    <rect x="156" y="94" width="11" height="80" rx="1.5" fill="#efe6d2"/>
    <rect x="174" y="94" width="11" height="80" rx="1.5" fill="#efe6d2"/>
    <rect x="215" y="94" width="11" height="80" rx="1.5" fill="#efe6d2"/>
    <rect x="233" y="94" width="11" height="80" rx="1.5" fill="#efe6d2"/>
    <!-- narrow horizontal vision slit (Maska energy) -->
    <rect x="162" y="124" width="76" height="10" rx="2" fill="#0a0c08" stroke="#c7923a" stroke-width="1.4"/>
    <rect x="168" y="126" width="64" height="5" rx="1" fill="#3a4a28" opacity="0.85"/>
    <!-- amber brow lip -->
    <rect x="150" y="96" width="100" height="5" rx="1" fill="#c7923a" opacity="0.75"/>
    <!-- chin / seal -->
    <ellipse cx="200" cy="168" rx="16" ry="10" fill="#1a1c16" stroke="#3a3830" stroke-width="1.2"/>
    <circle cx="200" cy="168" r="4" fill="#0a0c08"/>
  </g>

  <!-- Left hand over keyboard -->
  <g id="hand-left">
    <path d="M88 248 Q112 232 148 246 Q158 258 138 268 Q108 272 90 258 Z" fill="#4a463c" stroke="#1a1810" stroke-width="1.3"/>
    <path d="M104 246 L108 262 M116 244 L120 262 M128 246 L130 262" stroke="#2a261c" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="96" cy="252" rx="7" ry="6" fill="#3a3630"/>
    <path d="M98 244 Q120 234 140 246" fill="none" stroke="#c7923a" stroke-width="2"/>
  </g>

  <!-- Right hand over mouse -->
  <g id="hand-right">
    <path d="M268 246 Q294 228 320 248 Q326 262 300 272 Q272 274 266 256 Z" fill="#4a463c" stroke="#1a1810" stroke-width="1.3"/>
    <path d="M282 244 L284 264 M292 242 L296 264 M304 246 L306 260" stroke="#2a261c" stroke-width="2.6" stroke-linecap="round"/>
    <ellipse cx="274" cy="252" rx="7" ry="6" fill="#3a3630"/>
    <path d="M274 240 Q296 228 316 246" fill="none" stroke="#c7923a" stroke-width="2"/>
  </g>
</svg>
`.trim();
