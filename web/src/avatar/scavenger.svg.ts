/**
 * Original zone-ops operator — clearly Killa/Maska-inspired silhouette:
 * cream face-plate helmet with bold vertical bars, athletic armored tracksuit,
 * thick sleeve stripes. No logos / extracted assets.
 * Anim layers: #layer-torso #layer-head #hand-left #hand-right
 * Desk name: #desk-streamer-name (settings-bound)
 */
export const scavengerSvg = `
<svg viewBox="0 0 380 320" xmlns="http://www.w3.org/2000/svg" aria-label="Zone scavenger avatar" role="img">
  <defs>
    <linearGradient id="suitBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6a7a4e"/>
      <stop offset="50%" stop-color="#4a5a38"/>
      <stop offset="100%" stop-color="#2e3a28"/>
    </linearGradient>
    <linearGradient id="armorPlate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7a8a58"/>
      <stop offset="100%" stop-color="#3a4a30"/>
    </linearGradient>
    <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3d3830"/>
      <stop offset="100%" stop-color="#221e18"/>
    </linearGradient>
    <linearGradient id="creamPlate" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f5eedc"/>
      <stop offset="50%" stop-color="#e8dcc4"/>
      <stop offset="100%" stop-color="#c8b898"/>
    </linearGradient>
    <linearGradient id="helmShell" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a5040"/>
      <stop offset="100%" stop-color="#1c2018"/>
    </linearGradient>
    <radialGradient id="lensGlow" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#f0c060"/>
      <stop offset="55%" stop-color="#a87828"/>
      <stop offset="100%" stop-color="#2a1c08"/>
    </radialGradient>
  </defs>

  <ellipse cx="190" cy="298" rx="128" ry="12" fill="#000" opacity="0.42"/>

  <!-- Desk -->
  <g id="desk">
    <path d="M36 254 H344 L326 286 H54 Z" fill="url(#deskGrad)" stroke="#5a5348" stroke-width="1.5"/>
    <path d="M54 286 V312 H82 V286 M298 286 V312 H326 V286" fill="#2a2620" stroke="#4a443c"/>
    <rect x="68" y="242" width="164" height="20" rx="2" fill="#141612" stroke="#6b7355"/>
    <g fill="#2a2e24" stroke="#4a5240" stroke-width="0.5">
      <rect x="74" y="246" width="12" height="8" rx="1"/>
      <rect x="90" y="246" width="12" height="8" rx="1"/>
      <rect x="106" y="246" width="12" height="8" rx="1"/>
      <rect x="122" y="246" width="12" height="8" rx="1"/>
      <rect x="138" y="246" width="12" height="8" rx="1"/>
      <rect x="154" y="246" width="12" height="8" rx="1"/>
      <rect x="170" y="246" width="12" height="8" rx="1"/>
      <rect x="186" y="246" width="12" height="8" rx="1"/>
      <rect x="202" y="246" width="22" height="8" rx="1"/>
    </g>
    <ellipse cx="276" cy="252" rx="18" ry="24" fill="#22241e" stroke="#6b7355"/>
    <line x1="276" y1="234" x2="276" y2="252" stroke="#c7923a" stroke-width="1.4"/>
    <rect x="302" y="234" width="32" height="11" rx="1" fill="#141612" stroke="#4a5240"/>
    <circle class="eq-light" cx="310" cy="248" r="4" fill="#c7923a">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite"/>
    </circle>
    <circle class="eq-light" cx="324" cy="248" r="4" fill="#c7923a" opacity="0.35"/>
    <text id="desk-streamer-name" x="190" y="276" text-anchor="middle" fill="#e8dcc4" font-size="15" font-family="Oswald, 'Arial Narrow', sans-serif" font-weight="600" letter-spacing="3">datguydaz</text>
  </g>

  <!-- TORSO: boxy armored athletic jacket (not a soft hooded blob) -->
  <g id="layer-torso">
    <!-- main jacket body — wider, more rectangular -->
    <path d="M88 150 L120 138 L190 132 L260 138 L292 150 L310 258 L70 258 Z" fill="url(#suitBody)" stroke="#1c2018" stroke-width="2"/>
    <!-- hard armor chest panels -->
    <rect x="108" y="158" width="72" height="78" rx="6" fill="url(#armorPlate)" stroke="#1c2018" stroke-width="1.5"/>
    <rect x="200" y="158" width="72" height="78" rx="6" fill="url(#armorPlate)" stroke="#1c2018" stroke-width="1.5"/>
    <line x1="118" y1="178" x2="170" y2="178" stroke="#c4b59a" stroke-width="1.2" opacity="0.35"/>
    <line x1="118" y1="198" x2="170" y2="198" stroke="#c4b59a" stroke-width="1.2" opacity="0.35"/>
    <line x1="210" y1="178" x2="262" y2="178" stroke="#c4b59a" stroke-width="1.2" opacity="0.35"/>
    <line x1="210" y1="198" x2="262" y2="198" stroke="#c4b59a" stroke-width="1.2" opacity="0.35"/>
    <!-- center zipper track -->
    <rect x="184" y="140" width="12" height="112" rx="2" fill="#1a1c18"/>
    <rect x="187" y="144" width="6" height="104" rx="1" fill="#8a9480" opacity="0.5"/>
    <!-- blocky shoulder armor -->
    <rect x="72" y="140" width="58" height="36" rx="8" fill="#5a6a44" stroke="#1c2018" stroke-width="1.6"/>
    <rect x="250" y="140" width="58" height="36" rx="8" fill="#5a6a44" stroke="#1c2018" stroke-width="1.6"/>
    <rect x="78" y="146" width="46" height="10" rx="2" fill="#c7923a" opacity="0.55"/>
    <rect x="256" y="146" width="46" height="10" rx="2" fill="#c7923a" opacity="0.55"/>
    <!-- thick arms -->
    <path d="M95 170 Q55 205 88 248" fill="none" stroke="#3a4a30" stroke-width="36" stroke-linecap="round"/>
    <path d="M285 170 Q325 205 292 248" fill="none" stroke="#3a4a30" stroke-width="36" stroke-linecap="round"/>
    <path d="M95 170 Q55 205 88 248" fill="none" stroke="#526240" stroke-width="26" stroke-linecap="round"/>
    <path d="M285 170 Q325 205 292 248" fill="none" stroke="#526240" stroke-width="26" stroke-linecap="round"/>
    <!-- THICK sleeve track stripes — unmistakable -->
    <path d="M68 188 Q52 214 74 242" fill="none" stroke="#f5eedc" stroke-width="10" stroke-linecap="round"/>
    <path d="M78 186 Q62 214 84 240" fill="none" stroke="#c7923a" stroke-width="6" stroke-linecap="round"/>
    <path d="M88 188 Q74 214 94 238" fill="none" stroke="#f5eedc" stroke-width="4" stroke-linecap="round"/>
    <path d="M312 188 Q328 214 306 242" fill="none" stroke="#f5eedc" stroke-width="10" stroke-linecap="round"/>
    <path d="M302 186 Q318 214 296 240" fill="none" stroke="#c7923a" stroke-width="6" stroke-linecap="round"/>
    <path d="M292 188 Q306 214 286 238" fill="none" stroke="#f5eedc" stroke-width="4" stroke-linecap="round"/>
    <!-- forearm cuffs -->
    <path d="M72 220 Q84 236 96 246" fill="none" stroke="#6a7850" stroke-width="14" stroke-linecap="round"/>
    <path d="M308 220 Q296 236 284 246" fill="none" stroke="#6a7850" stroke-width="14" stroke-linecap="round"/>
    <!-- waistband with stripe tabs -->
    <rect x="96" y="246" width="188" height="14" rx="2" fill="#1c2018" stroke="#3a4032"/>
    <rect x="104" y="249" width="50" height="8" rx="1" fill="#f5eedc" opacity="0.7"/>
    <rect x="226" y="249" width="50" height="8" rx="1" fill="#f5eedc" opacity="0.7"/>
  </g>

  <!-- HEAD: hard sports-visor helmet + large cream face plate (NOT a round gas mask) -->
  <g id="layer-head">
    <!-- short athletic hood cuff behind helmet only -->
    <path d="M118 108 L140 78 L190 68 L240 78 L262 108 L248 128 L190 138 L132 128 Z" fill="#3a4a30" stroke="#1c2018" stroke-width="1.4"/>
    <!-- hard helmet dome / shell -->
    <path d="M125 100 Q190 52 255 100 L248 118 Q190 98 132 118 Z" fill="url(#helmShell)" stroke="#0e100c" stroke-width="1.8"/>
    <!-- side ear cups / pods -->
    <rect x="108" y="112" width="28" height="42" rx="10" fill="#2e3428" stroke="#0e100c" stroke-width="1.5"/>
    <rect x="244" y="112" width="28" height="42" rx="10" fill="#2e3428" stroke="#0e100c" stroke-width="1.5"/>
    <circle cx="122" cy="133" r="6" fill="#1a1c18" stroke="#6b7355"/>
    <circle cx="258" cy="133" r="6" fill="#1a1c18" stroke="#6b7355"/>
    <!-- LARGE pale cream face plate — dominant head feature -->
    <rect x="138" y="92" width="104" height="86" rx="14" fill="url(#creamPlate)" stroke="#6a6050" stroke-width="2.2"/>
    <!-- BOLD vertical bars across the plate -->
    <rect x="150" y="96" width="12" height="78" rx="2" fill="#141612"/>
    <rect x="170" y="96" width="12" height="78" rx="2" fill="#141612"/>
    <rect x="198" y="96" width="12" height="78" rx="2" fill="#141612"/>
    <rect x="218" y="96" width="12" height="78" rx="2" fill="#141612"/>
    <!-- large round lenses sitting on the plate -->
    <circle cx="166" cy="128" r="22" fill="#0e100c" stroke="#3a3830" stroke-width="2.5"/>
    <circle cx="214" cy="128" r="22" fill="#0e100c" stroke="#3a3830" stroke-width="2.5"/>
    <circle cx="166" cy="128" r="17" fill="url(#lensGlow)"/>
    <circle cx="214" cy="128" r="17" fill="url(#lensGlow)"/>
    <ellipse cx="160" cy="120" rx="6" ry="4" fill="#ffe6a0" opacity="0.5"/>
    <ellipse cx="208" cy="120" rx="6" ry="4" fill="#ffe6a0" opacity="0.5"/>
    <!-- amber brow / visor lip -->
    <rect x="142" y="98" width="96" height="6" rx="2" fill="#c7923a"/>
    <!-- chin seal -->
    <path d="M152 168 Q190 188 228 168" fill="none" stroke="#6a6050" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="190" cy="172" rx="14" ry="9" fill="#2a2e24" stroke="#5a5348" stroke-width="1.2"/>
    <circle cx="190" cy="172" r="4" fill="#0e100c"/>
  </g>

  <!-- Left hand -->
  <g id="hand-left">
    <path d="M86 234 Q108 218 140 232 Q150 244 132 252 Q104 256 88 244 Z" fill="#5a5648" stroke="#1c2018" stroke-width="1.3"/>
    <path d="M100 232 L104 246 M112 230 L116 246 M124 232 L126 246" stroke="#2a2820" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="94" cy="238" rx="6" ry="5" fill="#4a463c"/>
    <path d="M96 230 Q116 220 134 232" fill="none" stroke="#c7923a" stroke-width="2.2"/>
  </g>

  <!-- Right hand -->
  <g id="hand-right">
    <path d="M254 232 Q278 214 302 234 Q308 248 284 256 Q258 258 252 242 Z" fill="#5a5648" stroke="#1c2018" stroke-width="1.3"/>
    <path d="M266 230 L268 248 M276 228 L280 248 M288 232 L290 246" stroke="#2a2820" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="260" cy="238" rx="6" ry="5" fill="#4a463c"/>
    <path d="M260 228 Q280 216 298 232" fill="none" stroke="#c7923a" stroke-width="2.2"/>
  </g>
</svg>
`.trim();
