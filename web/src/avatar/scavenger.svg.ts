/** Original zone-ops scavenger — athletic padded tracksuit / sports-visor vibe. */
export const scavengerSvg = `
<svg viewBox="0 0 380 320" xmlns="http://www.w3.org/2000/svg" aria-label="Zone scavenger avatar" role="img">
  <defs>
    <linearGradient id="suitGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a5a3a"/>
      <stop offset="45%" stop-color="#3a4a30"/>
      <stop offset="100%" stop-color="#2a3224"/>
    </linearGradient>
    <linearGradient id="padGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#5a6848"/>
      <stop offset="100%" stop-color="#3a4430"/>
    </linearGradient>
    <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3d3830"/>
      <stop offset="100%" stop-color="#221e18"/>
    </linearGradient>
    <linearGradient id="visorGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2e28"/>
      <stop offset="100%" stop-color="#121410"/>
    </linearGradient>
    <linearGradient id="lensGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d4a84a"/>
      <stop offset="55%" stop-color="#8a6528"/>
      <stop offset="100%" stop-color="#3a2e14"/>
    </linearGradient>
    <linearGradient id="hoodieGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a4032"/>
      <stop offset="100%" stop-color="#1c2018"/>
    </linearGradient>
  </defs>

  <!-- Floor / shadow -->
  <ellipse cx="190" cy="294" rx="122" ry="14" fill="#000" opacity="0.38"/>

  <!-- Improvised desk -->
  <g id="desk">
    <path d="M42 250 H338 L322 282 H58 Z" fill="url(#deskGrad)" stroke="#5a5348" stroke-width="1.5"/>
    <path d="M58 282 V308 H86 V282 M294 282 V308 H322 V282" fill="#2a2620" stroke="#4a443c" stroke-width="1"/>
    <!-- keyboard -->
    <rect x="72" y="238" width="156" height="20" rx="2" fill="#1a1c18" stroke="#6b7355" stroke-width="1"/>
    <g fill="#2e3228" stroke="#4a5240" stroke-width="0.6">
      <rect x="78" y="242" width="11" height="8" rx="1"/>
      <rect x="93" y="242" width="11" height="8" rx="1"/>
      <rect x="108" y="242" width="11" height="8" rx="1"/>
      <rect x="123" y="242" width="11" height="8" rx="1"/>
      <rect x="138" y="242" width="11" height="8" rx="1"/>
      <rect x="153" y="242" width="11" height="8" rx="1"/>
      <rect x="168" y="242" width="11" height="8" rx="1"/>
      <rect x="183" y="242" width="11" height="8" rx="1"/>
      <rect x="198" y="242" width="22" height="8" rx="1"/>
      <rect x="84" y="252" width="128" height="2" fill="#c7923a" opacity="0.4" stroke="none"/>
    </g>
    <!-- mouse -->
    <ellipse cx="272" cy="248" rx="17" ry="23" fill="#2a2c26" stroke="#6b7355" stroke-width="1"/>
    <line x1="272" y1="230" x2="272" y2="248" stroke="#8a6528" stroke-width="1.2"/>
    <!-- amber equipment lights -->
    <rect x="298" y="230" width="30" height="10" rx="1" fill="#1a1c18" stroke="#4a5240"/>
    <circle class="eq-light" cx="306" cy="244" r="3.5" fill="#c7923a">
      <animate attributeName="opacity" values="0.35;1;0.35" dur="1.2s" repeatCount="indefinite"/>
    </circle>
    <circle class="eq-light" cx="318" cy="244" r="3.5" fill="#c7923a" opacity="0.3"/>
    <!-- Streamer callsign on desk front (updated from settings) -->
    <text id="desk-streamer-name" x="190" y="273" text-anchor="middle" fill="#d8cbb0" font-size="14" font-family="Oswald, 'Arial Narrow', sans-serif" font-weight="600" letter-spacing="2.8" style="text-transform:uppercase">datguydaz</text>
  </g>

  <!-- Torso: padded athletic tracksuit / sportswear -->
  <g id="layer-torso">
    <!-- bulk jacket body -->
    <path d="M108 148 Q190 132 272 148 L292 252 H88 Z" fill="url(#suitGrad)" stroke="#2a3224" stroke-width="1.6"/>
    <!-- center zip -->
    <path d="M190 150 V248" stroke="#1a1c18" stroke-width="3" stroke-linecap="round"/>
    <path d="M190 150 V248" stroke="#6b7355" stroke-width="1" stroke-dasharray="3 5" opacity="0.7"/>
    <!-- chest padding panels -->
    <path d="M120 168 Q155 160 185 168 L180 210 Q150 218 124 208 Z" fill="url(#padGrad)" stroke="#2a3224" stroke-width="1" opacity="0.95"/>
    <path d="M195 168 Q225 160 260 168 L256 208 Q230 218 200 210 Z" fill="url(#padGrad)" stroke="#2a3224" stroke-width="1" opacity="0.95"/>
    <!-- shoulder pads -->
    <ellipse cx="118" cy="158" rx="28" ry="16" fill="#4a5840" stroke="#2a3224" stroke-width="1.2"/>
    <ellipse cx="262" cy="158" rx="28" ry="16" fill="#4a5840" stroke="#2a3224" stroke-width="1.2"/>
    <!-- side stripes (tracksuit) -->
    <path d="M100 172 L92 248" stroke="#c7923a" stroke-width="6" opacity="0.75"/>
    <path d="M280 172 L288 248" stroke="#c7923a" stroke-width="6" opacity="0.75"/>
    <path d="M108 172 L100 248" stroke="#c4b59a" stroke-width="2.5" opacity="0.5"/>
    <path d="M272 172 L280 248" stroke="#c4b59a" stroke-width="2.5" opacity="0.5"/>
    <!-- athletic collar -->
    <path d="M168 148 Q190 158 212 148" fill="none" stroke="#1a1c18" stroke-width="6" stroke-linecap="round"/>
    <path d="M172 148 Q190 156 208 148" fill="none" stroke="#6b7355" stroke-width="2" stroke-linecap="round"/>
    <!-- waist banding -->
    <rect x="112" y="236" width="156" height="10" rx="2" fill="#242820" stroke="#3a4032" stroke-width="1"/>
    <rect x="118" y="238" width="40" height="6" rx="1" fill="#c7923a" opacity="0.35"/>
    <rect x="222" y="238" width="40" height="6" rx="1" fill="#c7923a" opacity="0.35"/>
    <!-- thick athletic arms -->
    <path d="M112 165 Q78 198 104 240" fill="none" stroke="#3a4a30" stroke-width="28" stroke-linecap="round"/>
    <path d="M268 165 Q312 198 276 240" fill="none" stroke="#3a4a30" stroke-width="28" stroke-linecap="round"/>
    <path d="M112 165 Q78 198 104 240" fill="none" stroke="#4a5a3a" stroke-width="18" stroke-linecap="round"/>
    <path d="M268 165 Q312 198 276 240" fill="none" stroke="#4a5a3a" stroke-width="18" stroke-linecap="round"/>
    <!-- forearm pads -->
    <path d="M88 210 Q98 225 108 236" fill="none" stroke="#5a6848" stroke-width="10" stroke-linecap="round" opacity="0.85"/>
    <path d="M292 210 Q282 225 272 236" fill="none" stroke="#5a6848" stroke-width="10" stroke-linecap="round" opacity="0.85"/>
  </g>

  <!-- Head: hood + sports-visor / round-lens face covering -->
  <g id="layer-head">
    <!-- hood volume -->
    <path d="M112 126 Q190 42 268 126 L252 162 Q190 182 128 162 Z" fill="url(#hoodieGrad)" stroke="#2a2e24" stroke-width="1.5"/>
    <path d="M128 124 Q190 72 252 124" fill="none" stroke="#1a1c18" stroke-width="10" opacity="0.35"/>
    <!-- balaclava / face cover -->
    <ellipse cx="190" cy="128" rx="46" ry="40" fill="#2e3228" stroke="#1a1c18" stroke-width="1.4"/>
    <!-- sports visor shell over eyes -->
    <path d="M148 108 H232 Q238 108 238 116 V128 Q238 138 228 138 H152 Q142 138 142 128 V116 Q142 108 148 108 Z"
      fill="url(#visorGrad)" stroke="#c7923a" stroke-width="1.6"/>
    <!-- distinctive round lenses -->
    <circle cx="170" cy="122" r="14" fill="#1a2218" stroke="#c4b59a" stroke-width="1.8"/>
    <circle cx="210" cy="122" r="14" fill="#1a2218" stroke="#c4b59a" stroke-width="1.8"/>
    <circle cx="170" cy="122" r="10" fill="url(#lensGrad)" opacity="0.92"/>
    <circle cx="210" cy="122" r="10" fill="url(#lensGrad)" opacity="0.92"/>
    <ellipse cx="166" cy="118" rx="4" ry="3" fill="#f0d090" opacity="0.55"/>
    <ellipse cx="206" cy="118" rx="4" ry="3" fill="#f0d090" opacity="0.55"/>
    <!-- bridge / nose cover -->
    <path d="M182 128 Q190 134 198 128" fill="none" stroke="#5a5348" stroke-width="3" stroke-linecap="round"/>
    <!-- lower face / filter snout -->
    <path d="M168 140 Q190 158 212 140 L208 152 Q190 164 172 152 Z" fill="#3a4032" stroke="#2a2e24" stroke-width="1.2"/>
    <ellipse cx="190" cy="148" rx="10" ry="7" fill="#1a1c18" stroke="#6b7355" stroke-width="1"/>
    <circle cx="190" cy="148" r="3" fill="#c7923a" opacity="0.5"/>
    <!-- ear / cheek pads -->
    <ellipse cx="140" cy="132" rx="10" ry="14" fill="#3a4430" stroke="#2a3224" stroke-width="1"/>
    <ellipse cx="240" cy="132" rx="10" ry="14" fill="#3a4430" stroke="#2a3224" stroke-width="1"/>
  </g>

  <!-- Left hand (keyboard) -->
  <g id="hand-left">
    <path d="M94 230 Q112 218 140 228 Q150 238 134 246 Q110 250 96 240 Z" fill="#5a5648" stroke="#2a2e24" stroke-width="1.2"/>
    <path d="M106 228 L110 240 M116 226 L120 240 M126 227 L128 240" stroke="#3a3830" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="102" cy="234" rx="5.5" ry="4.5" fill="#4a463c"/>
    <!-- glove cuff stripe -->
    <path d="M100 226 Q118 220 132 228" fill="none" stroke="#c7923a" stroke-width="1.5" opacity="0.6"/>
  </g>

  <!-- Right hand (mouse) -->
  <g id="hand-right">
    <path d="M250 228 Q272 214 292 230 Q298 242 278 250 Q254 252 248 238 Z" fill="#5a5648" stroke="#2a2e24" stroke-width="1.2"/>
    <path d="M262 226 L264 242 M272 224 L276 242 M282 228 L284 240" stroke="#3a3830" stroke-width="2.2" stroke-linecap="round"/>
    <ellipse cx="256" cy="234" rx="5.5" ry="4.5" fill="#4a463c"/>
    <path d="M256 224 Q274 216 288 228" fill="none" stroke="#c7923a" stroke-width="1.5" opacity="0.6"/>
  </g>
</svg>
`.trim();
