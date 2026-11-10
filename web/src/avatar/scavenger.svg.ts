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
    <!-- Olive/tan plate carrier (literal photo — warmer drab, not pure green) -->
    <linearGradient id="armorOlive" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8a8668"/>
      <stop offset="35%" stop-color="#6a664c"/>
      <stop offset="100%" stop-color="#3e3c2e"/>
    </linearGradient>
    <linearGradient id="collarPad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7a7658"/>
      <stop offset="100%" stop-color="#4a4836"/>
    </linearGradient>
    <!-- Dark navy/black tracksuit -->
    <linearGradient id="suitDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#141820"/>
      <stop offset="100%" stop-color="#07090c"/>
    </linearGradient>
    <linearGradient id="pouchGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2a2e36"/>
      <stop offset="100%" stop-color="#101218"/>
    </linearGradient>
    <!-- Charcoal/gunmetal Maska metal — mid greys, not cartoon black blob -->
    <linearGradient id="helmDark" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5c5c5c"/>
      <stop offset="45%" stop-color="#353535"/>
      <stop offset="100%" stop-color="#1a1a1a"/>
    </linearGradient>
    <linearGradient id="helmDome" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6a6a6a"/>
      <stop offset="30%" stop-color="#484848"/>
      <stop offset="70%" stop-color="#2e2e2e"/>
      <stop offset="100%" stop-color="#1c1c1c"/>
    </linearGradient>
    <linearGradient id="helmRim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#707070"/>
      <stop offset="100%" stop-color="#2a2a2a"/>
    </linearGradient>
    <linearGradient id="plateMetal" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a5a5a"/>
      <stop offset="40%" stop-color="#3a3a3a"/>
      <stop offset="100%" stop-color="#222222"/>
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
      <rect x="181" y="120" width="38" height="5" rx="0.55"/>
    </clipPath>
    <!-- Stripes clipped to continuous Maska shell silhouette -->
    <clipPath id="maska-shell-clip">
      <path d="M172 70 Q200 52 228 70 L236 84 L238 178 L228 188 L172 188 L162 178 L164 84 Z"/>
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
    <!-- TORSO: soft layered Killa carrier — rounded shoulders, not cardboard box. -->
    <g id="layer-torso">
      <g id="torso-sit" transform="translate(0 40)">
      <g id="torso-scale" transform="translate(200 148) scale(0.86) translate(-200 -148)">
      <g id="torso-core" clip-path="url(#torso-above-desk)">
      <!-- Navy tracksuit — pronounced shoulder soft curve + waist taper -->
      <path d="M142 158
        C128 148 118 140 122 128
        C148 118 176 116 200 116
        C224 116 252 118 278 128
        C282 140 272 148 258 158
        C268 178 270 208 262 230
        L138 230
        C130 208 132 178 142 158 Z" fill="url(#suitDark)" stroke="#05070a" stroke-width="1.35"/>
      <!-- Olive/tan carrier — rounded delts, soft belly, not a box -->
      <path id="plate-carrier" d="M140 152
        C124 142 114 132 120 122
        C150 112 176 110 200 110
        C224 110 250 112 280 122
        C286 132 276 142 260 152
        C272 174 274 206 266 228
        Q200 240 134 228
        C126 206 128 174 140 152 Z" fill="url(#armorOlive)" stroke="#2a281c" stroke-width="1.35"/>
      <!-- Soft shoulder mass -->
      <ellipse id="shoulder-pad-l" cx="132" cy="148" rx="22" ry="16" fill="#5a5640" opacity="0.5"/>
      <ellipse id="shoulder-pad-r" cx="268" cy="148" rx="22" ry="16" fill="#5a5640" opacity="0.5"/>
      <!-- Thick padded collar tucked under helm -->
      <path id="padded-collar" d="M158 118 Q200 106 242 118 C248 132 246 150 236 154 Q200 164 164 154 C154 150 152 132 158 118 Z" fill="url(#collarPad)" stroke="#2a281c" stroke-width="1.1"/>
      <g id="collar-ribs" fill="none" stroke="#3a3828" stroke-width="1" opacity="0.55">
        <path d="M166 128 Q200 118 234 128"/>
        <path d="M164 136 Q200 128 236 136"/>
        <path d="M164 144 Q200 138 236 144"/>
      </g>
      <g id="shoulder-straps">
        <path d="M156 128 C148 144 142 166 146 178 L160 176 C158 158 162 140 166 132 Z" fill="#14161c" stroke="#05070a" stroke-width="0.85"/>
        <path d="M244 128 C252 144 258 166 254 178 L240 176 C242 158 238 140 234 132 Z" fill="#14161c" stroke="#05070a" stroke-width="0.85"/>
        <rect x="146" y="152" width="15" height="9" rx="2" fill="#0e1014" stroke="#3a3e46" stroke-width="0.75"/>
        <rect x="239" y="152" width="15" height="9" rx="2" fill="#0e1014" stroke="#3a3e46" stroke-width="0.75"/>
      </g>
      <g id="vest-wear" fill="none" stroke-linecap="round">
        <path d="M136 160 L152 166" stroke="#a8a488" stroke-width="0.55" opacity="0.4"/>
        <path d="M248 162 L264 168" stroke="#b0ac90" stroke-width="0.5" opacity="0.32"/>
        <path d="M126 192 Q136 200 132 214" stroke="#4a4836" stroke-width="0.7" opacity="0.4"/>
        <path d="M274 192 Q264 200 268 214" stroke="#5a5844" stroke-width="0.65" opacity="0.38"/>
      </g>
      <!-- KILLA clear on upper olive plate -->
      <g id="chest-killa" font-family="Arial Black, Impact, 'Arial Narrow', sans-serif" font-weight="800" text-anchor="middle" letter-spacing="3">
        <text x="200.8" y="174.2" fill="#2a281c" font-size="15.5" opacity="0.55" textLength="140" lengthAdjust="spacingAndGlyphs">KILLA</text>
        <text id="chest-killa-main" x="200" y="173.6" fill="#f2ece0" font-size="15.5" opacity="0.98" textLength="140" lengthAdjust="spacingAndGlyphs">KILLA</text>
        <g id="chest-killa-scratches" fill="none" stroke="#3e3c2e" stroke-linecap="round" opacity="0.75">
          <path d="M140 164 L152 170" stroke-width="0.7"/>
          <path d="M158 163 L170 169" stroke-width="0.5"/>
          <path d="M176 165 L192 168" stroke-width="0.6"/>
          <path d="M162 172 L196 162" stroke-width="0.45"/>
          <path d="M208 164 L228 169" stroke-width="0.55"/>
          <path d="M234 171 L258 164" stroke-width="0.5"/>
        </g>
      </g>
      <!-- Soft layered dark rig + pouches -->
      <g id="chest-rig">
        <path id="molle-plate" d="M138 184
          C150 178 170 176 200 176
          C230 176 250 178 262 184
          L258 228
          C240 234 220 236 200 236
          C180 236 160 234 142 228
          Z" fill="#12151a" stroke="#05070a" stroke-width="1" opacity="0.95"/>
        <g id="molle-stitch" fill="none" stroke="#2a2e36" stroke-width="0.5" opacity="0.65">
          <path d="M148 192 H252 M148 202 H252 M148 212 H252 M148 222 H252"/>
        </g>
        <g id="stanag-0" class="stanag-pouch" transform="translate(140 188)">
          <rect x="0" y="6" width="26" height="30" rx="2.2" fill="url(#pouchGrad)" stroke="#0a0c10" stroke-width="1"/>
          <path d="M1 6 H25 L22.5 1 H3.5 Z" fill="#1a1e24" stroke="#05070a" stroke-width="0.8"/>
        </g>
        <g id="stanag-1" class="stanag-pouch" transform="translate(170 188)">
          <rect x="0" y="6" width="26" height="30" rx="2.2" fill="url(#pouchGrad)" stroke="#0a0c10" stroke-width="1"/>
          <path d="M1 6 H25 L22.5 1 H3.5 Z" fill="#1a1e24" stroke="#05070a" stroke-width="0.8"/>
        </g>
        <g id="stanag-2" class="stanag-pouch" transform="translate(200 188)">
          <rect x="0" y="6" width="26" height="30" rx="2.2" fill="url(#pouchGrad)" stroke="#0a0c10" stroke-width="1"/>
          <path d="M1 6 H25 L22.5 1 H3.5 Z" fill="#1a1e24" stroke="#05070a" stroke-width="0.8"/>
        </g>
        <g id="stanag-3" class="stanag-pouch" transform="translate(230 188)">
          <rect x="0" y="6" width="26" height="30" rx="2.2" fill="url(#pouchGrad)" stroke="#0a0c10" stroke-width="1"/>
          <path d="M1 6 H25 L22.5 1 H3.5 Z" fill="#1a1e24" stroke="#05070a" stroke-width="0.8"/>
        </g>
      </g>
      <path d="M146 230 Q200 238 254 230" fill="none" stroke="#1a1c18" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
      </g>
      </g>
      </g>
    </g>

    <!-- HEAD: ONE continuous tall Maska shell — no circle-on-square stack. -->
    <g id="layer-head">
      <g id="head-sit" transform="translate(0 18)">
      <g id="head-scale" transform="translate(200 140) scale(0.74) translate(-200 -140)">
      <!-- ONE continuous tall Maska shell (same path for dome+faceplane — no stacked silhouette) -->
      <path id="helm-dome" d="M172 70 Q200 52 228 70 L236 84 L238 178 L228 188 L172 188 L162 178 L164 84 Z" fill="url(#plateMetal)" stroke="#1a1a1a" stroke-width="1.6"/>
      <path id="helm-faceplate" d="M172 70 Q200 52 228 70 L236 84 L238 178 L228 188 L172 188 L162 178 L164 84 Z" fill="url(#plateMetal)" opacity="0"/>
      <!-- Soft top shade on the same shell only -->
      <path d="M176 76 Q200 58 224 76 L222 86 Q200 74 178 86 Z" fill="#000" opacity="0.16"/>
      <path id="helm-cheek-l" d="M164 92 L167 98 L165 172 L162 170 Z" fill="#000" opacity="0.12"/>
      <path id="helm-cheek-r" d="M236 92 L233 98 L235 172 L238 170 Z" fill="#000" opacity="0.12"/>
      <g id="helm-metal-grain" fill="none" stroke-linecap="round" opacity="0.28">
        <path d="M180 100 L190 108" stroke="#8a8a8a" stroke-width="0.4"/>
        <path d="M210 102 L222 110" stroke="#7a7a7a" stroke-width="0.35"/>
        <path d="M178 150 L190 158" stroke="#9a9a9a" stroke-width="0.4"/>
        <path d="M210 152 L224 160" stroke="#8a8a8a" stroke-width="0.35"/>
      </g>
      <!-- Stripes fit the tall continuous shell only -->
      <g id="helm-stripes" fill="#f2ece0" clip-path="url(#maska-shell-clip)">
        <path id="helm-stripe-c" d="M192 58 Q200 50 208 58 L204 184 L196 184 Z" opacity="0.98"/>
        <path id="helm-stripe-l" d="M178 64 Q184 56 190 66 L186 182 L178 180 Z" opacity="0.95"/>
        <path id="helm-stripe-r" d="M210 66 Q216 56 222 64 L222 180 L214 182 Z" opacity="0.95"/>
        <g id="helm-stripe-chips" fill="#3a3a3a" opacity="0.45">
          <path d="M196 82 L200 86 L197 89 Z"/>
          <path d="M182 118 L186 122 L180 124 Z"/>
          <path d="M214 128 L218 132 L212 134 Z"/>
        </g>
      </g>
      <!-- Eye slit ONLY opening in the shell -->
      <g id="eyes">
        <rect id="eye-slit" x="178" y="118" width="44" height="9" rx="1" fill="#0a0a0a" stroke="#1e1e1e" stroke-width="1"/>
        <rect x="181" y="120" width="38" height="5" rx="0.55" fill="#121212"/>
        <g id="eye-look" clip-path="url(#visor-clip)">
          <ellipse class="eye-white" cx="190" cy="122.5" rx="3.6" ry="1.55" fill="#d8d2c4"/>
          <ellipse class="eye-white" cx="210" cy="122.5" rx="3.6" ry="1.55" fill="#d8d2c4"/>
          <circle class="pupil" cx="190" cy="122.5" r="1.1" fill="#101010"/>
          <circle class="pupil" cx="210" cy="122.5" r="1.1" fill="#101010"/>
        </g>
        <rect class="eyelid" x="181" y="120" width="38" height="5" fill="#141414" opacity="0"/>
        <rect id="visor-glow" class="eq-blink" x="181" y="120.5" width="38" height="4" rx="0.55" fill="#2a2a2a" opacity="0.12"/>
      </g>
      <g id="helm-stripe-drips" fill="#f2ece0" opacity="0.88">
        <rect x="194" y="127" width="2" height="5" rx="0.25"/>
        <rect x="201" y="127" width="1.8" height="3.8" rx="0.25"/>
      </g>
      <g id="helm-wear" fill="none" stroke-linecap="round">
        <path d="M178 92 L186 100" stroke="#f2ece0" stroke-width="0.35" opacity="0.18"/>
        <path d="M214 94 Q222 100 228 98" stroke="#c8c2b0" stroke-width="0.35" opacity="0.18"/>
        <path d="M176 156 L186 164" stroke="#9a9a9a" stroke-width="0.35" opacity="0.22"/>
      </g>
      <!-- Tiny chin vent on the same shell surface -->
      <g id="mouth-vent">
        <ellipse cx="200" cy="168" rx="7" ry="3.8" fill="#1a1a1a" stroke="#3a3a3a" stroke-width="0.7"/>
        <path id="mouth-slats" d="M195 167 H205 M196 169.5 H204" stroke="#4a4a4a" stroke-width="0.65" opacity="0.65"/>
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
      <path id="mouse-lmb" class="mouse-btn mouse-lmb" d="M301.5 268.5 Q309 265.5 314.6 268 L314.3 280 Q308.2 282.2 301.8 280 Z" fill="#1a1a1a"/>
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
              <g id="sleeve-stripes-left" fill="none" stroke="#f2ece0" stroke-linecap="butt" stroke-linejoin="miter" stroke-width="2.1">
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
              <g id="sleeve-stripes-right" fill="none" stroke="#f2ece0" stroke-linecap="butt" stroke-linejoin="miter" stroke-width="2.0">
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
            <rect id="finger-lmb" x="304.5" y="268.8" width="4.6" height="9.2" rx="1.4" fill="#b89068" stroke="#6a4a32" stroke-width="0.45"/>
            <rect id="finger-rmb" x="315.2" y="269.5" width="4.6" height="9" rx="1.4" fill="#b89068" stroke="#6a4a32" stroke-width="0.45"/>
          </g>
        </g>
      </g>
    </g>

    <!-- Button amber overlays ON TOP of fingers — shine buttons only, never the hand -->
    <g id="mouse-btn-overlays" pointer-events="none">
      <path id="mouse-lmb-overlay" class="mouse-lmb-overlay" d="M301.5 268.5 Q309 265.5 314.6 268 L314.3 280 Q308.2 282.2 301.8 280 Z" fill="#c7923a" fill-opacity="0"/>
      <path id="mouse-rmb-overlay" class="mouse-rmb-overlay" d="M315.5 268 Q321.5 266 328 270 L326.5 280 Q321 282.5 315.5 279.5 Z" fill="#c7923a" fill-opacity="0"/>
    </g>
  </g>
  </g>
</svg>
`.trim();
