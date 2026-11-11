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
    <!-- Dark gunmetal Maska — deep shadows, restrained mid highlights -->
    <linearGradient id="helmDark" x1="0" y1="0" x2="0.2" y2="1">
      <stop offset="0%" stop-color="#4a4c4e"/>
      <stop offset="40%" stop-color="#2a2c2e"/>
      <stop offset="100%" stop-color="#0e1012"/>
    </linearGradient>
    <linearGradient id="helmDome" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0%" stop-color="#525456"/>
      <stop offset="22%" stop-color="#3a3c3e"/>
      <stop offset="55%" stop-color="#222426"/>
      <stop offset="100%" stop-color="#0c0e10"/>
    </linearGradient>
    <linearGradient id="helmRim" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5a5c5e"/>
      <stop offset="100%" stop-color="#1a1c1e"/>
    </linearGradient>
    <linearGradient id="plateMetal" x1="0.2" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#484a4c"/>
      <stop offset="35%" stop-color="#2e3032"/>
      <stop offset="75%" stop-color="#181a1c"/>
      <stop offset="100%" stop-color="#080a0c"/>
    </linearGradient>
    <linearGradient id="plateEdge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.4"/>
    </linearGradient>
    <!-- Battered olive steel workbench -->
    <linearGradient id="deskTopGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3e4436"/>
      <stop offset="35%" stop-color="#2a3024"/>
      <stop offset="100%" stop-color="#141810"/>
    </linearGradient>
    <linearGradient id="deskEdgeGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2e3428"/>
      <stop offset="100%" stop-color="#0a0c08"/>
    </linearGradient>
    <linearGradient id="deskGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#32382c"/>
      <stop offset="100%" stop-color="#121410"/>
    </linearGradient>
    <linearGradient id="oliveFrag" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#6a6640"/>
      <stop offset="55%" stop-color="#3e3c28"/>
      <stop offset="100%" stop-color="#1e1c12"/>
    </linearGradient>
    <linearGradient id="pistolSteel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3a3c40"/>
      <stop offset="50%" stop-color="#1a1c20"/>
      <stop offset="100%" stop-color="#0a0c10"/>
    </linearGradient>
    <clipPath id="visor-clip">
      <rect x="170" y="128" width="60" height="4.5" rx="0.4"/>
    </clipPath>
    <!-- Stripes clipped to Maska unit ~1×1.2 (shallow dome + squared shield) -->
    <clipPath id="maska-shell-clip">
      <path d="M164 118 C164 96 176 80 200 78 C224 80 236 96 236 118
        L238 140 L240 168 L230 172 L170 172 L160 168 L162 140 Z"/>
    </clipPath>
    <!-- Clip vest/core only — sleeves live outside so they aren't hard-stumped -->
    <clipPath id="torso-above-desk">
      <!-- Keep pouches + KILLA; cut belt that would pierce desk (local y) -->
      <rect x="40" y="100" width="320" height="128"/>
    </clipPath>
  </defs>

  <!-- Soft contact shade under compact workbench (no big scenery) -->
  <ellipse cx="200" cy="312" rx="150" ry="10" fill="#000" opacity="0.32"/>

  <!-- Operator: torso/head FIRST, desk AFTER so body sits behind desk lip (no torso-through-table). -->
  <g id="operator">
    <!-- LOCKED torso: sloping shoulders, compact olive vest, raised collar, small KILLA patch. -->
    <g id="layer-torso">
      <g id="torso-sit" transform="translate(0 40)">
      <g id="torso-scale" transform="translate(200 150) scale(0.90) translate(-200 -150)">
      <g id="torso-core" clip-path="url(#torso-above-desk)">
      <!-- Idle breath only — nested so talk/cough on #layer-torso never restarts it; arms/hands stay outside. -->
      <g id="idle-breath">
      <!-- Black Adidas tracksuit under-layer — sloping shoulders -->
      <path d="M136 168
        C128 156 134 142 148 134
        C168 124 188 120 200 120
        C212 120 232 124 252 134
        C266 142 272 156 264 168
        C270 188 268 210 260 228
        L140 228
        C132 210 130 188 136 168 Z" fill="url(#suitDark)" stroke="#05070a" stroke-width="1.2"/>
      <!-- Upper arms under vest — connect to sleeve roots (no floating forearms) -->
      <path id="suit-upper-arm-l" d="M134 158
        C122 166 116 182 118 200
        C120 212 124 218 130 220
        L142 218
        C140 200 138 178 144 164
        Z" fill="#0c0e12" stroke="#05070a" stroke-width="0.7"/>
      <path id="suit-upper-arm-r" d="M266 158
        C278 166 284 182 282 200
        C280 212 276 218 270 220
        L258 218
        C260 200 262 178 256 164
        Z" fill="#0c0e12" stroke="#05070a" stroke-width="0.7"/>
      <!-- Compact olive vest -->
      <path id="plate-carrier" d="M140 164
        C132 152 138 140 152 132
        C170 124 188 120 200 120
        C212 120 230 124 248 132
        C262 140 268 152 260 164
        C268 184 266 208 258 226
        Q200 236 142 226
        C134 208 132 184 140 164 Z" fill="url(#armorOlive)" stroke="#2a281c" stroke-width="1.15"/>
      <!-- Vest panel seams -->
      <g id="vest-seams" fill="none" stroke="#2a281c" stroke-width="0.7" opacity="0.45">
        <path d="M156 140 C170 136 186 134 200 134 C214 134 230 136 244 140"/>
        <path d="M150 170 C168 164 186 162 200 162 C214 162 232 164 250 170"/>
        <path d="M200 134 V162"/>
      </g>
      <!-- Soft shoulder slope shade (not winged ellipses) -->
      <path d="M140 150 C148 138 168 132 186 130 L180 148 C166 150 152 154 142 162 Z" fill="#000" opacity="0.16"/>
      <path d="M260 150 C252 138 232 132 214 130 L220 148 C234 150 248 154 258 162 Z" fill="#000" opacity="0.14"/>
      <!-- Raised fabric collar — helm sits low inside -->
      <path id="padded-collar" d="M162 112
        Q200 98 238 112
        C248 124 246 146 234 156
        Q200 168 166 156
        C154 146 152 124 162 112 Z" fill="url(#collarPad)" stroke="#2a281c" stroke-width="1.05"/>
      <g id="collar-ribs" fill="none" stroke="#3a3828" stroke-width="0.95" opacity="0.55">
        <path d="M170 122 Q200 110 230 122"/>
        <path d="M168 132 Q200 122 232 132"/>
        <path d="M168 142 Q200 134 232 142"/>
      </g>
      <path d="M198 112 V154" fill="none" stroke="#2a281c" stroke-width="0.8" opacity="0.35"/>
      <g id="shoulder-straps">
        <path d="M168 126 C160 144 156 164 158 178 L172 176 C170 160 172 142 176 130 Z" fill="#14161c" stroke="#05070a" stroke-width="0.8"/>
        <path d="M232 126 C240 144 244 164 242 178 L228 176 C230 160 228 142 224 130 Z" fill="#14161c" stroke="#05070a" stroke-width="0.8"/>
        <path d="M170 132 L162 170" fill="none" stroke="#3a3e46" stroke-width="0.55" opacity="0.45"/>
        <path d="M230 132 L238 170" fill="none" stroke="#3a3e46" stroke-width="0.55" opacity="0.45"/>
        <rect x="158" y="150" width="13" height="8" rx="1.6" fill="#0e1014" stroke="#3a3e46" stroke-width="0.7"/>
        <rect x="229" y="150" width="13" height="8" rx="1.6" fill="#0e1014" stroke="#3a3e46" stroke-width="0.7"/>
      </g>
      <g id="vest-wear" fill="none" stroke-linecap="round" pointer-events="none">
        <path d="M146 158 L160 164" stroke="#a8a488" stroke-width="0.5" opacity="0.35"/>
        <path d="M240 160 L254 166" stroke="#b0ac90" stroke-width="0.45" opacity="0.3"/>
        <path d="M144 196 Q152 204 148 216" stroke="#4a4836" stroke-width="0.6" opacity="0.35"/>
        <path d="M256 196 Q248 204 252 216" stroke="#5a5844" stroke-width="0.55" opacity="0.32"/>
        <path d="M152 178 Q158 182 154 188" stroke="#5a5844" stroke-width="1.1" opacity="0.28"/>
        <path d="M248 184 Q254 190 250 196" stroke="#4a4836" stroke-width="0.9" opacity="0.22"/>
        <circle cx="160" cy="210" r="2.2" fill="#3a3828" opacity="0.2"/>
        <!-- restrained fabric dirt / edge scuffs (surface only) -->
        <path d="M150 170 Q154 176 152 182" stroke="#2a2818" stroke-width="1.4" opacity="0.18"/>
        <path d="M248 172 Q252 178 250 186" stroke="#1a1810" stroke-width="1.2" opacity="0.16"/>
        <path d="M168 148 L174 152" stroke="#c8c4a8" stroke-width="0.4" opacity="0.28"/>
        <path d="M230 150 L236 154" stroke="#b8b498" stroke-width="0.35" opacity="0.24"/>
        <path d="M158 200 L166 206" stroke="#0a0c08" stroke-width="0.55" opacity="0.22"/>
        <path d="M234 204 L242 210" stroke="#121410" stroke-width="0.5" opacity="0.2"/>
        <circle cx="242" cy="198" r="2.8" fill="#2a281c" opacity="0.16"/>
        <circle cx="170" cy="214" r="1.8" fill="#1a1810" opacity="0.14"/>
        <!-- sparse dried blood fleck near left strap (not gore) -->
        <path d="M156 154 Q158 158 157 162" stroke="#3a1212" stroke-width="0.9" opacity="0.28"/>
        <circle cx="155" cy="160" r="0.65" fill="#2e1010" opacity="0.32"/>
      </g>
      <!-- Fabric chest patch — readable at overlay size, clear of pouches -->
      <g id="chest-killa">
        <rect x="172" y="160" width="56" height="16" rx="1.6" fill="#3a3828" stroke="#1a1810" stroke-width="0.75" opacity="0.95"/>
        <rect x="173.5" y="161.4" width="53" height="13" rx="1.1" fill="#2a281c" opacity="0.55"/>
        <text id="chest-killa-main" x="200" y="172.6" fill="#f2ece0" font-family="Arial Black, Impact, 'Arial Narrow', sans-serif" font-weight="800" font-size="11" text-anchor="middle" letter-spacing="1.4" opacity="0.98">KILLA</text>
      </g>
      <!-- Compact shaded pouches (below patch) -->
      <g id="chest-rig">
        <path id="molle-plate" d="M148 184
          C160 178 178 176 200 176
          C222 176 240 178 252 184
          L248 224
          C232 230 216 232 200 232
          C184 232 168 230 152 224
          Z" fill="#12151a" stroke="#05070a" stroke-width="0.95" opacity="0.95"/>
        <g id="molle-stitch" fill="none" stroke="#2a2e36" stroke-width="0.45" opacity="0.6">
          <path d="M156 192 H244 M156 202 H244 M156 212 H244 M156 220 H244"/>
        </g>
        <g id="stanag-0" class="stanag-pouch" transform="translate(152 188)">
          <rect x="0" y="5" width="22" height="28" rx="2" fill="url(#pouchGrad)" stroke="#0a0c10" stroke-width="0.9"/>
          <path d="M1 5 H21 L19 1 H3 Z" fill="#1a1e24" stroke="#05070a" stroke-width="0.7"/>
          <path d="M2 12 H20" stroke="#000" stroke-width="0.6" opacity="0.35"/>
          <path d="M3 22 H19" stroke="#000" stroke-width="0.5" opacity="0.25"/>
        </g>
        <g id="stanag-1" class="stanag-pouch" transform="translate(176 188)">
          <rect x="0" y="5" width="22" height="28" rx="2" fill="url(#pouchGrad)" stroke="#0a0c10" stroke-width="0.9"/>
          <path d="M1 5 H21 L19 1 H3 Z" fill="#1a1e24" stroke="#05070a" stroke-width="0.7"/>
          <path d="M2 12 H20" stroke="#000" stroke-width="0.6" opacity="0.35"/>
          <path d="M3 22 H19" stroke="#000" stroke-width="0.5" opacity="0.25"/>
        </g>
        <g id="stanag-2" class="stanag-pouch" transform="translate(200 188)">
          <rect x="0" y="5" width="22" height="28" rx="2" fill="url(#pouchGrad)" stroke="#0a0c10" stroke-width="0.9"/>
          <path d="M1 5 H21 L19 1 H3 Z" fill="#1a1e24" stroke="#05070a" stroke-width="0.7"/>
          <path d="M2 12 H20" stroke="#000" stroke-width="0.6" opacity="0.35"/>
          <path d="M3 22 H19" stroke="#000" stroke-width="0.5" opacity="0.25"/>
        </g>
        <g id="stanag-3" class="stanag-pouch" transform="translate(224 188)">
          <rect x="0" y="5" width="22" height="28" rx="2" fill="url(#pouchGrad)" stroke="#0a0c10" stroke-width="0.9"/>
          <path d="M1 5 H21 L19 1 H3 Z" fill="#1a1e24" stroke="#05070a" stroke-width="0.7"/>
          <path d="M2 12 H20" stroke="#000" stroke-width="0.6" opacity="0.35"/>
          <path d="M3 22 H19" stroke="#000" stroke-width="0.5" opacity="0.25"/>
        </g>
      </g>
      <path d="M150 228 Q200 234 250 228" fill="none" stroke="#1a1c18" stroke-width="2.2" stroke-linecap="round" opacity="0.45"/>
      </g>
      </g>
      </g>
      </g>
    </g>

    <!--
      LOCKED helm direction (user approved): shallow dome + squared wraparound shield,
      ~1w×1.2h, ~½ shoulder width, low in collar. NO cartoon sphere / skinny pill / stretch.
      Uniform scale only. Prefer /avatar/killa-maska-head.webp when present.
    -->
    <g id="layer-head">
      <g id="head-sit" transform="translate(0 22)">
      <g id="head-scale" transform="translate(200 140) scale(0.84) translate(-200 -140)">
      <!-- Idle head life — nested; talk/cough on #layer-head does not restart this loop. -->
      <g id="idle-head">
      <!-- Painted asset (preferred). Vector below is silhouette fallback. -->
      <image id="helm-photo" href="/avatar/killa-maska-head.webp" x="152" y="70" width="96" height="120" opacity="0" preserveAspectRatio="xMidYMin meet" pointer-events="none"/>
      <g id="helm-drawn">
      <!-- Silhouette: shallow dome + squared wraparound shield. BBox ~74×89 (~1×1.2). -->
      <g id="helm-silhouette">
        <path id="helm-dome" d="M163 120
          C163 98 176 80 200 78
          C224 80 237 98 237 120
          L236 142
          L234 160
          L166 160
          L164 142
          Z" fill="url(#helmDome)" stroke="#0a0c0e" stroke-width="0.75"/>
        <!-- Squared lower face shield overlapping dome vertically -->
        <path id="helm-faceplate" d="M168 100
          L232 100
          L238 112
          L240 152
          L232 169
          L168 169
          L160 152
          L162 112
          Z" fill="url(#plateMetal)" stroke="#06080a" stroke-width="0.75"/>
      </g>
      <g id="helm-detail">
        <!-- Plate depth / wrap AO (slight 3/4 bias right) -->
        <path d="M162 112 L160 152 L168 169 L170 165 L164 152 L166 114 Z" fill="#000" opacity="0.42"/>
        <path d="M232 100 L238 112 L240 152 L232 169 L228 165 L236 150 L234 112 Z" fill="url(#plateEdge)" opacity="0.65"/>
        <path d="M170 165 L230 165 L232 169 L168 169 Z" fill="#000" opacity="0.48"/>
        <path d="M170 100 L230 100 L228 108 L172 108 Z" fill="#000" opacity="0.22"/>
        <path id="helm-cheek-l" d="M162 118 L168 122 L166 150 L160 146 Z" fill="#000" opacity="0.22"/>
        <path id="helm-cheek-r" d="M238 118 L232 122 L234 150 L240 146 Z" fill="#000" opacity="0.2"/>
        <g id="helm-bolts">
          <g id="helm-bolt-l">
            <circle cx="166" cy="118" r="3.2" fill="#2a2c2e" stroke="#0a0c0e" stroke-width="0.55"/>
            <circle cx="166" cy="118" r="1.7" fill="#4a4c4e"/>
            <circle cx="165.5" cy="117.5" r="0.45" fill="#9a9c9e" opacity="0.4"/>
            <circle cx="166.5" cy="134" r="2.7" fill="#222426" stroke="#0a0c0e" stroke-width="0.5"/>
            <circle cx="166.5" cy="134" r="1.35" fill="#3a3c3e"/>
          </g>
          <g id="helm-bolt-r">
            <circle cx="234" cy="118" r="3.2" fill="#2a2c2e" stroke="#0a0c0e" stroke-width="0.55"/>
            <circle cx="234" cy="118" r="1.7" fill="#4a4c4e"/>
            <circle cx="233.5" cy="117.5" r="0.45" fill="#9a9c9e" opacity="0.4"/>
            <circle cx="233.5" cy="134" r="2.7" fill="#222426" stroke="#0a0c0e" stroke-width="0.5"/>
            <circle cx="233.5" cy="134" r="1.35" fill="#3a3c3e"/>
          </g>
        </g>
        <g id="helm-metal-grain" fill="none" stroke-linecap="round" opacity="0.32">
          <path d="M180 96 L190 104" stroke="#6a6c6e" stroke-width="0.3"/>
          <path d="M212 98 L224 106" stroke="#5a5c5e" stroke-width="0.28"/>
          <path d="M178 148 L188 156" stroke="#7a7c7e" stroke-width="0.3"/>
          <path d="M214 150 L226 158" stroke="#5a5c5e" stroke-width="0.28"/>
        </g>
        <g id="helm-stripes" fill="#e8e2d4" clip-path="url(#maska-shell-clip)">
          <path id="helm-stripe-c" d="M194 82 Q200 76 206 82 L204 168 L196 168 Z" opacity="0.9"/>
          <path id="helm-stripe-l" d="M180 86 Q186 78 192 88 L188 166 L180 164 Z" opacity="0.86"/>
          <path id="helm-stripe-r" d="M208 88 Q216 78 220 86 L220 164 L212 166 Z" opacity="0.86"/>
          <g id="helm-stripe-chips" fill="#1a1c1e" opacity="0.5">
            <path d="M196 100 L200 104 L197 106 Z"/>
            <path d="M184 128 L188 132 L182 133 Z"/>
            <path d="M214 142 L218 146 L212 147 Z"/>
            <!-- extra stripe wear — keep stripes readable, clear of slit -->
            <path d="M198 118 L201 121 L199 122 Z" opacity="0.7"/>
            <path d="M186 146 L189 149 L185 150 Z" opacity="0.55"/>
            <path d="M212 112 L216 115 L213 116 Z" opacity="0.6"/>
          </g>
        </g>
        <!-- Visor slit + clipped pupils (ride with #idle-head; do not reshape helm) -->
        <g id="eyes">
          <rect id="eye-slit-recess" x="168" y="126" width="64" height="9" rx="0.5" fill="#000" opacity="0.55"/>
          <rect id="eye-slit" x="170" y="128" width="60" height="4.5" rx="0.35" fill="#050607" stroke="#121416" stroke-width="0.45"/>
          <rect x="172" y="128.4" width="56" height="2.2" fill="#000" opacity="0.88"/>
          <g id="eye-look" clip-path="url(#visor-clip)" pointer-events="none">
            <!-- Left eye — restrained pupil + thin highlight, inside slit -->
            <ellipse class="eye-sclera" cx="184.5" cy="130.25" rx="3.25" ry="1.65" fill="#2a3824" opacity="0.95"/>
            <ellipse class="eye-pupil" cx="184.5" cy="130.25" rx="1.4" ry="1.25" fill="#050705"/>
            <ellipse class="eye-glint" cx="185.2" cy="129.7" rx="0.48" ry="0.36" fill="#e4ecd8" opacity="0.7"/>
            <!-- Right eye -->
            <ellipse class="eye-sclera" cx="215.5" cy="130.25" rx="3.25" ry="1.65" fill="#2a3824" opacity="0.95"/>
            <ellipse class="eye-pupil" cx="215.5" cy="130.25" rx="1.4" ry="1.25" fill="#050705"/>
            <ellipse class="eye-glint" cx="216.2" cy="129.7" rx="0.48" ry="0.36" fill="#e4ecd8" opacity="0.7"/>
          </g>
          <rect class="eyelid" x="170" y="128" width="60" height="4.5" rx="0.35" fill="#050607" opacity="0" pointer-events="none"/>
          <rect id="visor-glow" class="eq-blink" x="172" y="128.4" width="56" height="2.2" fill="#1a1c1e" opacity="0.06"/>
        </g>
        <g id="helm-stripe-drips" fill="#e8e2d4" opacity="0.7">
          <rect x="196" y="133" width="1.6" height="4.5" rx="0.2"/>
          <rect x="202" y="133" width="1.3" height="3.2" rx="0.2"/>
        </g>
        <g id="helm-wear" fill="none" stroke-linecap="round" pointer-events="none">
          <path d="M178 104 L186 112" stroke="#7a7c7e" stroke-width="0.28" opacity="0.22"/>
          <path d="M216 106 Q224 112 228 110" stroke="#5a5c5e" stroke-width="0.28" opacity="0.2"/>
          <!-- surface scratches / scuffs — clear of eye slit -->
          <path d="M172 100 L180 106" stroke="#8a8c8e" stroke-width="0.32" opacity="0.28"/>
          <path d="M174 148 L182 154" stroke="#6a6c6e" stroke-width="0.3" opacity="0.24"/>
          <path d="M220 102 L228 108" stroke="#7a7c7e" stroke-width="0.28" opacity="0.26"/>
          <path d="M218 150 L226 156" stroke="#5a5c5e" stroke-width="0.26" opacity="0.22"/>
          <path d="M188 94 Q192 98 190 102" stroke="#9a9c9e" stroke-width="0.25" opacity="0.2"/>
          <path d="M210 96 L218 100" stroke="#6a6c70" stroke-width="0.22" opacity="0.18"/>
          <path d="M170 118 L176 122" stroke="#4a4c4e" stroke-width="0.35" opacity="0.3"/>
          <path d="M226 120 L232 124" stroke="#3a3c3e" stroke-width="0.32" opacity="0.26"/>
        </g>
        <!-- Restrained asymmetrical battle damage — does NOT alter silhouette or cover stripes/slit -->
        <g id="helm-battle" clip-path="url(#maska-shell-clip)" pointer-events="none">
          <!-- Impact nick on right cheek only (upper-dome almond removed — floated outside shell) -->
          <ellipse cx="234" cy="148" rx="2.4" ry="1.6" fill="#050607" opacity="0.4"/>
          <path d="M232 146 L236 150" fill="none" stroke="#5a5c60" stroke-width="0.3" opacity="0.35"/>
          <!-- dried blood smear + flecks on left faceplate / cheek edge -->
          <path d="M164 138 C168 146 170 156 166 162 C162 156 160 146 164 138 Z" fill="#4a1a1a" opacity="0.48"/>
          <path d="M166 144 C169 150 170 156 168 160" fill="none" stroke="#3a1212" stroke-width="1.1" opacity="0.4"/>
          <circle cx="162" cy="150" r="1.05" fill="#3a1212" opacity="0.45"/>
          <circle cx="170" cy="158" r="0.7" fill="#2e1010" opacity="0.4"/>
          <circle cx="165" cy="164" r="0.55" fill="#3a1212" opacity="0.35"/>
          <!-- tiny dried flecks near left visor edge (not covering slit) -->
          <circle cx="168" cy="122" r="0.55" fill="#3a1212" opacity="0.38"/>
          <circle cx="166" cy="136" r="0.4" fill="#2e1010" opacity="0.32"/>
        </g>
        <!-- anim hook kept; no visible mouth -->
        <g id="mouth-vent" opacity="0" aria-hidden="true"></g>
      </g>
      </g>
      </g>
      </g>
      </g>
    </g>

    <!--
      DESK after torso/head: body stays BEHIND the table.
      Battered olive steel workbench — NO gold/glow strip, no big legs/scenery.
      KB/mouse/hands paint AFTER this so they sit ON the surface.
    -->
    <g id="desk">
      <path id="desk-top" d="M12 256 H388 L372 290 H28 Z" fill="url(#deskTopGrad)" stroke="#4a5240" stroke-width="1.3"/>
      <!-- Reinforced lip / apron (compact) -->
      <path id="desk-apron" d="M28 290 H372 L364 308 H36 Z" fill="url(#deskEdgeGrad)" stroke="#1a1c18" stroke-width="1.15"/>
      <path d="M30 292 H370" stroke="#5a6350" stroke-width="1" opacity="0.35"/>
      <path d="M36 308 H364" stroke="#050605" stroke-width="1.2" opacity="0.55"/>
      <!-- Chipped front edge -->
      <path d="M70 290 L78 288 L86 290 L94 287 L104 290" fill="none" stroke="#0a0c08" stroke-width="1.1" opacity="0.55"/>
      <path d="M300 290 L312 287 L322 290" fill="none" stroke="#0a0c08" stroke-width="1" opacity="0.45"/>
      <!-- Corner bolts -->
      <g id="desk-bolts" fill="#1a1c18" stroke="#4a5044" stroke-width="0.45">
        <circle cx="34" cy="262" r="2.4"/><circle cx="34" cy="262" r="1.1" fill="#2a2e28" stroke="none"/>
        <circle cx="366" cy="262" r="2.4"/><circle cx="366" cy="262" r="1.1" fill="#2a2e28" stroke="none"/>
        <circle cx="42" cy="286" r="2.1"/><circle cx="42" cy="286" r="0.95" fill="#2a2e28" stroke="none"/>
        <circle cx="358" cy="286" r="2.1"/><circle cx="358" cy="286" r="0.95" fill="#2a2e28" stroke="none"/>
      </g>
      <path d="M18 258 H382" stroke="#6b7355" stroke-width="0.9" opacity="0.28"/>
      <g id="desk-grain" fill="none" stroke-linecap="butt" opacity="0.34">
        <path d="M24 262 H376" stroke="#0e100e" stroke-width="0.5"/>
        <path d="M28 268 H372" stroke="#3a4234" stroke-width="0.38"/>
        <path d="M32 274 H368" stroke="#121410" stroke-width="0.42"/>
        <path d="M36 280 H364" stroke="#4a5346" stroke-width="0.32"/>
        <path d="M40 285 H360" stroke="#1a1c18" stroke-width="0.38"/>
      </g>
      <g id="desk-wear" fill="none" stroke-linecap="round">
        <path d="M96 268 Q118 272 132 266 Q148 263 168 270" stroke="#050605" stroke-width="1.15" opacity="0.65"/>
        <path d="M118 267 L126 274" stroke="#0a0c0a" stroke-width="0.8" opacity="0.5"/>
        <path d="M250 264 Q268 270 286 266" stroke="#1a1c18" stroke-width="0.95" opacity="0.48"/>
        <path d="M300 274 L322 282" stroke="#0e100e" stroke-width="0.8" opacity="0.42"/>
        <path d="M78 282 Q92 286 108 281" stroke="#121410" stroke-width="0.7" opacity="0.38"/>
        <path d="M22 260 L34 266" stroke="#050605" stroke-width="0.7" opacity="0.45"/>
        <path d="M378 260 L366 268" stroke="#050605" stroke-width="0.65" opacity="0.4"/>
      </g>
      <!-- Faded inventory stencil + restrained dried blood (outside corner) -->
      <g id="desk-stencil" opacity="0.28" fill="none" stroke="#8a9060" stroke-width="0.55">
        <rect x="318" y="270" width="38" height="12" rx="0.6"/>
        <text x="337" y="278.5" fill="#8a9060" stroke="none" font-family="ui-monospace, Consolas, monospace" font-size="4.2" text-anchor="middle" opacity="0.9">INV-04</text>
      </g>
      <g id="desk-blood" opacity="0.42">
        <path d="M352 278 C358 282 364 286 360 288 C354 286 350 282 352 278 Z" fill="#3a1212"/>
        <circle cx="348" cy="284" r="0.9" fill="#2e1010"/>
        <circle cx="366" cy="282" r="0.55" fill="#2e1010"/>
      </g>
    </g>

    <!-- Static props — clear of KB/mousepad/hands/arm paths -->
    <g id="prop-frag" pointer-events="none">
      <ellipse cx="28" cy="284" rx="9" ry="2.4" fill="#000" opacity="0.28"/>
      <ellipse cx="28" cy="276" rx="7.2" ry="9.5" fill="url(#oliveFrag)" stroke="#1a1810" stroke-width="0.7"/>
      <ellipse cx="28" cy="268.5" rx="6.2" ry="2.2" fill="#4a4830" stroke="#1a1810" stroke-width="0.5"/>
      <path d="M22 269 Q28 266 34 269" fill="none" stroke="#7a7650" stroke-width="0.7" opacity="0.45"/>
      <!-- lever + pin -->
      <path d="M34 270 L40 262 L38 260 L33 268 Z" fill="#2a2c28" stroke="#0a0c08" stroke-width="0.45"/>
      <circle cx="39" cy="261" r="1.15" fill="none" stroke="#c7923a" stroke-width="0.55"/>
      <path d="M39 261 L42 258" stroke="#8a8a70" stroke-width="0.55"/>
      <path d="M24 274 H32 M24 278 H32 M24 282 H32" stroke="#1a1810" stroke-width="0.45" opacity="0.4"/>
    </g>
    <g id="prop-pistol" pointer-events="none">
      <ellipse cx="362" cy="286" rx="14" ry="2.6" fill="#000" opacity="0.26"/>
      <!-- worn dark pistol, diagonal muzzle out (no muzzle flash) -->
      <g transform="translate(350 272) rotate(-28)">
        <path d="M0 8 H28 L30 6 H0 Z" fill="url(#pistolSteel)" stroke="#05070a" stroke-width="0.55"/>
        <path d="M0 8 L2 18 H10 L12 8 Z" fill="#121418" stroke="#05070a" stroke-width="0.5"/>
        <rect x="4" y="10" width="4" height="6" rx="0.4" fill="#1a1c20"/>
        <path d="M18 5.5 H26" stroke="#4a4c50" stroke-width="0.55" opacity="0.45"/>
        <circle cx="8" cy="7" r="1.1" fill="#0a0c10" stroke="#3a3c40" stroke-width="0.35"/>
      </g>
    </g>

    <!-- RECTANGULAR Nordic KB — rugged security-room office; same key slots/positions. -->
    <g id="prop-keyboard">
      <rect x="56" y="262" width="192" height="28" rx="2.2" fill="#0a0a0a" stroke="#4a4a4a" stroke-width="0.65"/>
      <rect x="59" y="264.5" width="186" height="23" rx="1.4" fill="#101010"/>
      <!-- matte casing wear + dirt between rows -->
      <path d="M60 266 H244" stroke="#1a1a1a" stroke-width="0.5" opacity="0.55"/>
      <path d="M60 286 H244" stroke="#050505" stroke-width="0.7" opacity="0.4"/>
      <g id="kb-amber-leds" opacity="0.55">
        <circle class="kb-led" cx="66" cy="264.2" r="0.85" fill="#c7923a"/>
        <circle class="kb-led" cx="70" cy="264.2" r="0.85" fill="#a87830"/>
        <circle class="kb-led" cx="74" cy="264.2" r="0.85" fill="#6a5020" opacity="0.7"/>
      </g>
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

    <!-- Faded dark olive fabric pad + worn charcoal wired mouse (same contact geometry) -->
    <g id="prop-mousepad">
      <rect x="288" y="264" width="56" height="26" rx="2.2" fill="#2a2e22" stroke="#1a1c18" stroke-width="0.55" opacity="0.95"/>
      <rect x="291" y="266.5" width="50" height="21" rx="1.2" fill="#1e2218" opacity="0.55"/>
      <path d="M290 266 Q300 268 310 265" fill="none" stroke="#3a3e30" stroke-width="0.55" opacity="0.4"/>
      <path d="M320 286 Q330 284 340 287" fill="none" stroke="#121410" stroke-width="0.7" opacity="0.45"/>
      <path d="M292 288 L298 286" stroke="#0a0c08" stroke-width="0.8" opacity="0.4"/>
    </g>
    <g id="prop-mouse">
      <!-- short curved cable back (static) -->
      <path id="mouse-cable" d="M328 272 Q338 268 344 260 Q348 254 352 250" fill="none" stroke="#1a1a1a" stroke-width="1.35" stroke-linecap="round"/>
      <path d="M328 272 Q338 268 344 260" fill="none" stroke="#2a2a2a" stroke-width="0.55" opacity="0.5"/>
      <ellipse cx="315" cy="286" rx="12" ry="2.2" fill="#000" opacity="0.2"/>
      <path d="M300 268 Q316 264 330 269 L328 284 Q315 289 302 284 Z" fill="#121212" stroke="#4a4a4a" stroke-width="0.85"/>
      <path d="M302 270 Q316 266 328 271" fill="none" stroke="#2a2a2a" stroke-width="0.55" opacity="0.4"/>
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
              <!-- Match mouse sleeve construction (24/20/14, ±4.0); cuff stays on KB hand -->
              <path d="M128 220 L114 236 L106 250 L110 260 L118 268" fill="none" stroke="#050507" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
              <path id="sleeve-left-fill" d="M128 220 L114 236 L106 250 L110 260 L118 268" fill="none" stroke="#0e0e0e" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M128 220 L114 236 L106 250 L110 260 L118 268" fill="none" stroke="#181a1e" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
              <g id="sleeve-stripes-left" fill="none" stroke="#e8e2d4" stroke-linecap="butt" stroke-linejoin="round" stroke-width="2.1">
                <path d="M128 220 L114 236 L106 250 L110 260 L118 268" transform="translate(-4.0 0)"/>
                <path d="M128 220 L114 236 L106 250 L110 260 L118 268"/>
                <path d="M128 220 L114 236 L106 250 L110 260 L118 268" transform="translate(4.0 0)"/>
              </g>
              <g id="sleeve-folds-left" fill="none" stroke-linecap="round">
                <path d="M100 246 Q106 250 112 248" stroke="#2a2c30" stroke-width="1.05" opacity="0.5"/>
                <path d="M102 252 Q108 256 114 254" stroke="#000" stroke-width="0.85" opacity="0.38"/>
                <path d="M108 258 Q114 262 118 260" stroke="#2a2c30" stroke-width="0.75" opacity="0.32"/>
              </g>
              <g id="sleeve-wear-left" fill="none" stroke-linecap="round" pointer-events="none">
                <path d="M116 232 L108 238" stroke="#c8c2b0" stroke-width="0.5" opacity="0.26"/>
                <path d="M110 246 L104 252" stroke="#5a5040" stroke-width="0.65" opacity="0.32"/>
                <path d="M106 248 Q110 252 108 256" stroke="#3a3428" stroke-width="1.1" opacity="0.22"/>
                <!-- fabric scuffs along sleeve (stripes stay readable) -->
                <path d="M120 228 L112 234" stroke="#3a3c40" stroke-width="0.45" opacity="0.3"/>
                <path d="M112 242 L106 248" stroke="#1a1c20" stroke-width="0.55" opacity="0.28"/>
                <path d="M108 258 L114 262" stroke="#4a4c50" stroke-width="0.4" opacity="0.22"/>
                <!-- stripe chips (dark nicks on cream stripes) -->
                <path d="M116 240 L118 242 L116 243 Z" fill="#0e0e0e" stroke="none" opacity="0.45"/>
                <path d="M112 254 L114 256 L111 257 Z" fill="#0e0e0e" stroke="none" opacity="0.4"/>
              </g>
              <ellipse cx="118" cy="268" rx="7.6" ry="4.1" fill="#121418" stroke="#050505" stroke-width="0.75"/>
              <ellipse cx="118" cy="267.2" rx="6.1" ry="2.4" fill="none" stroke="#2a2e34" stroke-width="0.65" opacity="0.5"/>
              <path d="M111 266 H125" stroke="#000" stroke-width="0.55" opacity="0.32"/>
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
        <!-- Mouse-follow deltas only — click animations stay on #hand-right-aim -->
        <g id="hand-right-follow">
        <g id="hand-right-aim">
          <g id="hand-right-sit" transform="translate(-272 -220)">
            <g id="arm-right" class="arm-continuous">
              <path d="M272 220 L286 236 L298 250 L306 260 L314 268" fill="none" stroke="#050507" stroke-width="24" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
              <path id="sleeve-right-fill" d="M272 220 L286 236 L298 250 L306 260 L314 268" fill="none" stroke="#0e0e0e" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M272 220 L286 236 L298 250 L306 260 L314 268" fill="none" stroke="#181a1e" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" opacity="0.55"/>
              <g id="sleeve-stripes-right" fill="none" stroke="#e8e2d4" stroke-linecap="butt" stroke-linejoin="round" stroke-width="2.1">
                <path d="M272 220 L286 236 L298 250 L306 260 L314 268" transform="translate(-4.0 0)"/>
                <path d="M272 220 L286 236 L298 250 L306 260 L314 268"/>
                <path d="M272 220 L286 236 L298 250 L306 260 L314 268" transform="translate(4.0 0)"/>
              </g>
              <g id="sleeve-folds-right" fill="none" stroke-linecap="round">
                <path d="M292 246 Q298 250 304 248" stroke="#2a2c30" stroke-width="1.05" opacity="0.5"/>
                <path d="M294 252 Q300 256 306 254" stroke="#000" stroke-width="0.85" opacity="0.38"/>
                <path d="M300 258 Q306 262 310 260" stroke="#2a2c30" stroke-width="0.75" opacity="0.32"/>
              </g>
              <g id="sleeve-wear-right" fill="none" stroke-linecap="round" pointer-events="none">
                <path d="M282 232 L290 238" stroke="#c8c2b0" stroke-width="0.5" opacity="0.26"/>
                <path d="M294 246 L300 252" stroke="#5a5040" stroke-width="0.65" opacity="0.32"/>
                <path d="M298 248 Q302 252 300 256" stroke="#3a3428" stroke-width="1.1" opacity="0.22"/>
                <path d="M280 228 L288 234" stroke="#3a3c40" stroke-width="0.45" opacity="0.28"/>
                <path d="M292 242 L298 248" stroke="#1a1c20" stroke-width="0.55" opacity="0.26"/>
                <path d="M300 258 L306 262" stroke="#4a4c50" stroke-width="0.4" opacity="0.2"/>
                <path d="M290 240 L292 242 L290 243 Z" fill="#0e0e0e" stroke="none" opacity="0.42"/>
                <path d="M300 254 L302 256 L299 257 Z" fill="#0e0e0e" stroke="none" opacity="0.38"/>
              </g>
              <ellipse cx="314" cy="268" rx="7.6" ry="4.1" fill="#121418" stroke="#050505" stroke-width="0.75"/>
              <ellipse cx="314" cy="267.2" rx="6.1" ry="2.4" fill="none" stroke="#2a2e34" stroke-width="0.65" opacity="0.5"/>
              <path d="M307 266 H321" stroke="#000" stroke-width="0.55" opacity="0.32"/>
            </g>
            <path d="M302 264 L324 266 L322 278 L304 276 Z" fill="#c4a07a" stroke="#6a4a32" stroke-width="1" opacity="0.96"/>
            <rect id="finger-lmb" x="304.5" y="268.8" width="4.6" height="9.2" rx="1.4" fill="#b89068" stroke="#6a4a32" stroke-width="0.45"/>
            <rect id="finger-rmb" x="315.2" y="269.5" width="4.6" height="9" rx="1.4" fill="#b89068" stroke="#6a4a32" stroke-width="0.45"/>
          </g>
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
