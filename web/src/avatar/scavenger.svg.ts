/**
 * Original zone-ops operator SVG — athletic padded tracksuit + cream face-plate
 * sports-visor helmet (Killa / Maska-inspired vibe only; no logos or ripped assets).
 * Layers kept for independent animation: #layer-torso, #layer-head, #hand-left, #hand-right.
 */
export const scavengerSvg = `
<svg viewBox="0 0 380 320" xmlns="http://www.w3.org/2000/svg" aria-label="Zone scavenger avatar" role="img">
  <defs>
    <linearGradient id="jacketGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a6b42"/>
      <stop offset="40%" stop-color="#3f4f32"/>
      <stop offset="100%" stop-color="#2a3424"/>
    </linearGradient>
    <linearGradient id="armorGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6a7850"/>
      <stop offset="100%" stop-color="#3a4630"/>
    </linearGradient>
    <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3d3830"/>
      <stop offset="100%" stop-color="#221e18"/>
    </linearGradient>
    <linearGradient id="plateGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#efe6d2"/>
      <stop offset="55%" stop-color="#d8ccb0"/>
      <stop offset="100%" stop-color="#b8a888"/>
    </linearGradient>
    <linearGradient id="helmetGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a4034"/>
      <stop offset="100%" stop-color="#1a1e16"/>
    </linearGradient>
    <linearGradient id="lensGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2210"/>
      <stop offset="35%" stop-color="#c7923a"/>
      <stop offset="100%" stop-color="#3a2a10"/>
    </linearGradient>
    <linearGradient id="hoodGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a5438"/>
      <stop offset="100%" stop-color="#2a3224"/>
    </linearGradient>
  </defs>

  <ellipse cx="190" cy="296" rx="124" ry="13" fill="#000" opacity="0.4"/>

  <!-- Desk (streamer name settings-bound) -->
  <g id="desk">
    <path d="M40 252 H340 L324 284 H56 Z" fill="url(#deskGrad)" stroke="#5a5348" stroke-width="1.5"/>
    <path d="M56 284 V310 H84 V284 M296 284 V310 H324 V284" fill="#2a2620" stroke="#4a443c" stroke-width="1"/>
    <rect x="70" y="240" width="160" height="20" rx="2" fill="#1a1c18" stroke="#6b7355" stroke-width="1"/>
    <g fill="#2e3228" stroke="#4a5240" stroke-width="0.55">
      <rect x="76" y="244" width="11" height="8" rx="1"/>
      <rect x="91" y="244" width="11" height="8" rx="1"/>
      <rect x="106" y="244" width="11" height="8" rx="1"/>
      <rect x="121" y="244" width="11" height="8" rx="1"/>
      <rect x="136" y="244" width="11" height="8" rx="1"/>
      <rect x="151" y="244" width="11" height="8" rx="1"/>
      <rect x="166" y="244" width="11" height="8" rx="1"/>
      <rect x="181" y="244" width="11" height="8" rx="1"/>
      <rect x="196" y="244" width="24" height="8" rx="1"/>
    </g>
    <ellipse cx="274" cy="250" rx="17" ry="23" fill="#2a2c26" stroke="#6b7355" stroke-width="1"/>
    <line x1="274" y1="232" x2="274" y2="250" stroke="#8a6528" stroke-width="1.2"/>
    <rect x="300" y="232" width="30" height="10" rx="1" fill="#1a1c18" stroke="#4a5240"/>
    <circle class="eq-light" cx="308" cy="246" r="3.5" fill="#c7923a">
      <animate attributeName="opacity" values="0.35;1;0.35" dur="1.2s" repeatCount="indefinite"/>
    </circle>
    <circle class="eq-light" cx="320" cy="246" r="3.5" fill="#c7923a" opacity="0.3"/>
    <text id="desk-streamer-name" x="190" y="274" text-anchor="middle" fill="#d8cbb0" font-size="14" font-family="Oswald, 'Arial Narrow', sans-serif" font-weight="600" letter-spacing="2.8">datguydaz</text>
  </g>

  <!-- Torso: bulk armored athletic jacket -->
  <g id="layer-torso">
    <path d="M100 146 Q190 128 280 146 L304 254 H76 Z" fill="url(#jacketGrad)" stroke="#243022" stroke-width="1.7"/>
    <!-- armored chest plates -->
    <path d="M118 164 Q152 152 186 164 L182 218 Q150 230 122 216 Z" fill="url(#armorGrad)" stroke="#2a3224" stroke-width="1.2"/>
    <path d="M194 164 Q228 152 262 164 L258 216 Q230 230 198 218 Z" fill="url(#armorGrad)" stroke="#2a3224" stroke-width="1.2"/>
    <path d="M130 176 H170 M130 192 H168 M206 176 H246 M206 192 H244" stroke="#c4b59a" stroke-width="1" opacity="0.28"/>
    <!-- center zipper -->
    <path d="M190 148 V250" stroke="#1a1c18" stroke-width="4" stroke-linecap="round"/>
    <path d="M190 148 V250" stroke="#8a9480" stroke-width="1.2" stroke-dasharray="2 4"/>
    <!-- heavy shoulder pads -->
    <ellipse cx="112" cy="156" rx="34" ry="20" fill="#4a5838" stroke="#2a3224" stroke-width="1.4"/>
    <ellipse cx="268" cy="156" rx="34" ry="20" fill="#4a5838" stroke="#2a3224" stroke-width="1.4"/>
    <path d="M88 150 Q112 142 136 152" fill="none" stroke="#6b7355" stroke-width="2" opacity="0.5"/>
    <path d="M244 152 Q268 142 292 150" fill="none" stroke="#6b7355" stroke-width="2" opacity="0.5"/>
    <!-- body side track accents -->
    <path d="M94 178 L86 248" stroke="#c7923a" stroke-width="5" opacity="0.7"/>
    <path d="M286 178 L294 248" stroke="#c7923a" stroke-width="5" opacity="0.7"/>
    <!-- thick sleeves -->
    <path d="M108 168 Q70 200 98 242" fill="none" stroke="#3a4a30" stroke-width="32" stroke-linecap="round"/>
    <path d="M272 168 Q320 200 282 242" fill="none" stroke="#3a4a30" stroke-width="32" stroke-linecap="round"/>
    <path d="M108 168 Q70 200 98 242" fill="none" stroke="#4e5e3c" stroke-width="22" stroke-linecap="round"/>
    <path d="M272 168 Q320 200 282 242" fill="none" stroke="#4e5e3c" stroke-width="22" stroke-linecap="round"/>
    <!-- clear sleeve track stripes (outer arm) -->
    <path d="M78 182 Q68 208 84 236" fill="none" stroke="#efe6d2" stroke-width="7" stroke-linecap="round"/>
    <path d="M86 180 Q76 208 92 234" fill="none" stroke="#c7923a" stroke-width="4" stroke-linecap="round"/>
    <path d="M94 182 Q86 208 98 232" fill="none" stroke="#efe6d2" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
    <path d="M302 182 Q312 208 296 236" fill="none" stroke="#efe6d2" stroke-width="7" stroke-linecap="round"/>
    <path d="M294 180 Q304 208 288 234" fill="none" stroke="#c7923a" stroke-width="4" stroke-linecap="round"/>
    <path d="M286 182 Q294 208 282 232" fill="none" stroke="#efe6d2" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
    <!-- forearm armor cuffs -->
    <path d="M84 214 Q96 228 106 238" fill="none" stroke="#5a6848" stroke-width="12" stroke-linecap="round"/>
    <path d="M296 214 Q284 228 274 238" fill="none" stroke="#5a6848" stroke-width="12" stroke-linecap="round"/>
    <!-- waistband -->
    <rect x="108" y="240" width="164" height="12" rx="2" fill="#242820" stroke="#3a4032"/>
    <rect x="116" y="243" width="44" height="6" rx="1" fill="#c7923a" opacity="0.4"/>
    <rect x="220" y="243" width="44" height="6" rx="1" fill="#c7923a" opacity="0.4"/>
  </g>

  <!-- Head: heavy sports-visor helmet + cream face plate -->
  <g id="layer-head">
    <!-- hood behind helmet -->
    <path d="M108 122 Q190 38 272 122 L258 158 Q190 176 122 158 Z" fill="url(#hoodGrad)" stroke="#2a3224" stroke-width="1.4"/>
    <!-- helmet shell -->
    <ellipse cx="190" cy="118" rx="58" ry="48" fill="url(#helmetGrad)" stroke="#1a1c18" stroke-width="1.8"/>
    <path d="M140 88 Q190 62 240 88" fill="none" stroke="#4a5240" stroke-width="3" opacity="0.45"/>
    <!-- pale / cream face plate -->
    <path d="M148 96 H232 Q244 96 244 110 V148 Q244 168 190 172 Q136 168 136 148 V110 Q136 96 148 96 Z"
      fill="url(#plateGrad)" stroke="#6a6050" stroke-width="1.6"/>
    <!-- bold vertical stripe bars on plate (Maska-energy, original) -->
    <rect x="156" y="98" width="9" height="68" rx="1.5" fill="#1a1c18"/>
    <rect x="170" y="98" width="9" height="68" rx="1.5" fill="#1a1c18"/>
    <rect x="201" y="98" width="9" height="68" rx="1.5" fill="#1a1c18"/>
    <rect x="215" y="98" width="9" height="68" rx="1.5" fill="#1a1c18"/>
    <!-- large round lenses -->
    <circle cx="168.5" cy="124" r="18" fill="#1a1c18" stroke="#3a3830" stroke-width="2"/>
    <circle cx="211.5" cy="124" r="18" fill="#1a1c18" stroke="#3a3830" stroke-width="2"/>
    <circle cx="168.5" cy="124" r="14" fill="url(#lensGrad)"/>
    <circle cx="211.5" cy="124" r="14" fill="url(#lensGrad)"/>
    <ellipse cx="163" cy="118" rx="5" ry="3.5" fill="#f0d090" opacity="0.45"/>
    <ellipse cx="206" cy="118" rx="5" ry="3.5" fill="#f0d090" opacity="0.45"/>
    <!-- visor brow ridge -->
    <path d="M142 104 H238" stroke="#8a6528" stroke-width="2.2" opacity="0.7"/>
    <!-- lower jaw / seal -->
    <path d="M150 156 Q190 178 230 156" fill="none" stroke="#6a6050" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="190" cy="160" rx="12" ry="8" fill="#3a3830" stroke="#5a5348" stroke-width="1"/>
    <circle cx="190" cy="160" r="3.5" fill="#1a1c18"/>
    <!-- cheek / ear armor pods -->
    <ellipse cx="128" cy="128" rx="14" ry="20" fill="#3a4034" stroke="#1a1c18" stroke-width="1.3"/>
    <ellipse cx="252" cy="128" rx="14" ry="20" fill="#3a4034" stroke="#1a1c18" stroke-width="1.3"/>
    <path d="M122 120 V138 M116 128 H140" stroke="#6b7355" stroke-width="1.2" opacity="0.5"/>
    <path d="M246 120 V138 M240 128 H264" stroke="#6b7355" stroke-width="1.2" opacity="0.5"/>
  </g>

  <!-- Left hand -->
  <g id="hand-left">
    <path d="M90 232 Q110 218 140 230 Q150 240 134 248 Q108 252 92 242 Z" fill="#5a5648" stroke="#2a2e24" stroke-width="1.2"/>
    <path d="M104 230 L108 242 M114 228 L118 242 M124 229 L126 242" stroke="#3a3830" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="98" cy="236" rx="6" ry="5" fill="#4a463c"/>
    <path d="M98 228 Q116 220 132 230" fill="none" stroke="#c7923a" stroke-width="2" opacity="0.65"/>
  </g>

  <!-- Right hand -->
  <g id="hand-right">
    <path d="M252 230 Q274 214 296 232 Q302 244 280 252 Q256 254 250 240 Z" fill="#5a5648" stroke="#2a2e24" stroke-width="1.2"/>
    <path d="M264 228 L266 244 M274 226 L278 244 M284 230 L286 242" stroke="#3a3830" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="258" cy="236" rx="6" ry="5" fill="#4a463c"/>
    <path d="M258 226 Q276 216 292 230" fill="none" stroke="#c7923a" stroke-width="2" opacity="0.65"/>
  </g>
</svg>
`.trim();
