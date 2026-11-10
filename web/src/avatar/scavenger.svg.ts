/** Original scavenger operator SVG — layered for independent hand/head/torso motion. */
export const scavengerSvg = `
<svg viewBox="0 0 380 320" xmlns="http://www.w3.org/2000/svg" aria-label="Zone scavenger avatar" role="img">
  <defs>
    <linearGradient id="hoodGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3a4032"/>
      <stop offset="55%" stop-color="#2a2e24"/>
      <stop offset="100%" stop-color="#1c2018"/>
    </linearGradient>
    <linearGradient id="vestGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#4a5240"/>
      <stop offset="100%" stop-color="#2e3428"/>
    </linearGradient>
    <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3d3830"/>
      <stop offset="100%" stop-color="#221e18"/>
    </linearGradient>
    <linearGradient id="maskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6a6558"/>
      <stop offset="100%" stop-color="#3a3830"/>
    </linearGradient>
    <filter id="softScratch" x="-10%" y="-10%" width="120%" height="120%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2"/>
    </filter>
  </defs>

  <!-- Floor / shadow -->
  <ellipse cx="190" cy="292" rx="118" ry="14" fill="#000" opacity="0.35"/>

  <!-- Improvised desk -->
  <g id="desk">
    <path d="M48 248 H332 L318 278 H62 Z" fill="url(#deskGrad)" stroke="#5a5348" stroke-width="1.5"/>
    <path d="M62 278 V304 H88 V278 M292 278 V304 H318 V278" fill="#2a2620" stroke="#4a443c" stroke-width="1"/>
    <rect x="72" y="236" width="150" height="18" rx="2" fill="#1a1c18" stroke="#6b7355" stroke-width="1"/>
    <!-- keyboard keys suggestion -->
    <g fill="#2e3228" stroke="#4a5240" stroke-width="0.6">
      <rect x="78" y="240" width="10" height="8" rx="1"/>
      <rect x="92" y="240" width="10" height="8" rx="1"/>
      <rect x="106" y="240" width="10" height="8" rx="1"/>
      <rect x="120" y="240" width="10" height="8" rx="1"/>
      <rect x="134" y="240" width="10" height="8" rx="1"/>
      <rect x="148" y="240" width="10" height="8" rx="1"/>
      <rect x="162" y="240" width="10" height="8" rx="1"/>
      <rect x="176" y="240" width="10" height="8" rx="1"/>
      <rect x="190" y="240" width="22" height="8" rx="1"/>
      <rect x="84" y="250" width="120" height="2" fill="#c7923a" opacity="0.35" stroke="none"/>
    </g>
    <!-- mouse -->
    <ellipse cx="268" cy="246" rx="16" ry="22" fill="#2a2c26" stroke="#6b7355" stroke-width="1"/>
    <line x1="268" y1="230" x2="268" y2="246" stroke="#8a6528" stroke-width="1"/>
    <!-- amber equipment lights -->
    <circle class="eq-light" cx="300" cy="242" r="3.5" fill="#c7923a">
      <animate attributeName="opacity" values="0.35;1;0.35" dur="1.2s" repeatCount="indefinite"/>
    </circle>
    <circle class="eq-light" cx="312" cy="242" r="3.5" fill="#c7923a" opacity="0.3"/>
    <rect x="292" y="228" width="28" height="8" rx="1" fill="#1a1c18" stroke="#4a5240"/>
    <text x="56" y="272" fill="#c4b59a" font-size="9" font-family="Share Tech Mono, monospace" letter-spacing="1.2">ZONE OPS // OPERATOR</text>
  </g>

  <!-- Torso -->
  <g id="layer-torso">
    <path d="M120 150 Q190 138 260 150 L278 248 H102 Z" fill="url(#vestGrad)" stroke="#3a4032" stroke-width="1.5"/>
    <path d="M145 168 H235" stroke="#c4b59a" stroke-width="0.8" opacity="0.35"/>
    <path d="M150 186 H230" stroke="#c4b59a" stroke-width="0.8" opacity="0.25"/>
    <rect x="168" y="174" width="44" height="36" rx="3" fill="#242820" stroke="#6b7355" stroke-width="1"/>
    <text x="176" y="196" fill="#c7923a" font-size="8" font-family="Share Tech Mono, monospace">RAD</text>
    <!-- straps -->
    <path d="M150 150 L138 210" stroke="#2a2e24" stroke-width="6"/>
    <path d="M230 150 L242 210" stroke="#2a2e24" stroke-width="6"/>
    <!-- arms resting toward desk -->
    <path d="M118 168 Q90 200 108 236" fill="none" stroke="#3a4032" stroke-width="22" stroke-linecap="round"/>
    <path d="M262 168 Q300 200 272 236" fill="none" stroke="#3a4032" stroke-width="22" stroke-linecap="round"/>
    <path d="M118 168 Q90 200 108 236" fill="none" stroke="#4a5240" stroke-width="14" stroke-linecap="round"/>
    <path d="M262 168 Q300 200 272 236" fill="none" stroke="#4a5240" stroke-width="14" stroke-linecap="round"/>
  </g>

  <!-- Head -->
  <g id="layer-head">
    <!-- hood -->
    <path d="M118 128 Q190 48 262 128 L248 158 Q190 176 132 158 Z" fill="url(#hoodGrad)" stroke="#2a2e24" stroke-width="1.5"/>
    <path d="M132 128 Q190 78 248 128" fill="none" stroke="#1a1c18" stroke-width="8" opacity="0.4"/>
    <!-- gas mask body -->
    <ellipse cx="190" cy="128" rx="42" ry="38" fill="url(#maskGrad)" stroke="#2a2e24" stroke-width="1.5"/>
    <!-- lenses -->
    <ellipse cx="172" cy="120" rx="12" ry="10" fill="#1a2218" stroke="#c7923a" stroke-width="1.4"/>
    <ellipse cx="208" cy="120" rx="12" ry="10" fill="#1a2218" stroke="#c7923a" stroke-width="1.4"/>
    <ellipse cx="170" cy="118" rx="4" ry="3" fill="#6b7355" opacity="0.45"/>
    <ellipse cx="206" cy="118" rx="4" ry="3" fill="#6b7355" opacity="0.45"/>
    <!-- filter canister -->
    <rect x="176" y="138" width="28" height="22" rx="4" fill="#3a3830" stroke="#5a5348" stroke-width="1.2"/>
    <circle cx="190" cy="149" r="7" fill="#2a2c26" stroke="#6b7355" stroke-width="1"/>
    <circle cx="190" cy="149" r="3" fill="#1a1c18"/>
    <!-- hose -->
    <path d="M204 152 Q230 160 236 180" fill="none" stroke="#4a443c" stroke-width="5" stroke-linecap="round"/>
    <path d="M204 152 Q230 160 236 180" fill="none" stroke="#6b7355" stroke-width="1.5" stroke-dasharray="3 4" opacity="0.5"/>
    <!-- hood edge scratches / markings -->
    <text x="146" y="98" fill="#6b7355" font-size="6" font-family="Share Tech Mono, monospace" opacity="0.7" transform="rotate(-18 146 98)">ZONE-07</text>
  </g>

  <!-- Left hand (keyboard) -->
  <g id="hand-left">
    <path d="M96 228 Q112 218 138 226 Q148 236 132 244 Q110 248 98 238 Z" fill="#5a5648" stroke="#2a2e24" stroke-width="1.2"/>
    <path d="M108 226 L112 238 M118 224 L122 238 M128 225 L130 238" stroke="#3a3830" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="104" cy="232" rx="5" ry="4" fill="#4a463c"/>
  </g>

  <!-- Right hand (mouse) -->
  <g id="hand-right">
    <path d="M248 226 Q268 214 286 228 Q292 240 274 248 Q252 250 246 236 Z" fill="#5a5648" stroke="#2a2e24" stroke-width="1.2"/>
    <path d="M260 224 L262 240 M270 222 L274 240 M280 226 L282 238" stroke="#3a3830" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="254" cy="232" rx="5" ry="4" fill="#4a463c"/>
  </g>
</svg>
`.trim();
