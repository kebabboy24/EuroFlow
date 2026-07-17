export default function HeroGlobe() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <svg className="hero-globe" viewBox="0 0 640 520" role="presentation">
        <defs>
          <radialGradient id="efGlobeSurface" cx="38%" cy="28%" r="76%">
            <stop offset="0%" stopColor="var(--globe-highlight)" stopOpacity=".92" />
            <stop offset="55%" stopColor="var(--globe-surface)" stopOpacity=".58" />
            <stop offset="100%" stopColor="var(--globe-edge)" stopOpacity=".18" />
          </radialGradient>
          <linearGradient id="efGlobeRim" x1=".1" y1=".1" x2=".9" y2=".9">
            <stop offset="0%" stopColor="var(--globe-rim-start)" />
            <stop offset="58%" stopColor="var(--globe-rim-mid)" />
            <stop offset="100%" stopColor="var(--globe-rim-end)" />
          </linearGradient>
          <linearGradient id="efRouteBlue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#165dff" stopOpacity=".28" />
            <stop offset="55%" stopColor="#3986ff" stopOpacity=".9" />
            <stop offset="100%" stopColor="#12d7c7" stopOpacity=".64" />
          </linearGradient>
          <linearGradient id="efRouteCyan" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#12d7c7" stopOpacity=".34" />
            <stop offset="65%" stopColor="#39aaff" stopOpacity=".88" />
            <stop offset="100%" stopColor="#165dff" stopOpacity=".5" />
          </linearGradient>
          <pattern id="efMapDots" width="5.5" height="5.5" patternUnits="userSpaceOnUse">
            <circle cx="1.3" cy="1.3" r=".82" fill="var(--globe-map-dot)" />
          </pattern>
          <clipPath id="efGlobeClip">
            <circle cx="326" cy="254" r="206" />
          </clipPath>
          <radialGradient id="efGlobeFade">
            <stop offset="0%" stopColor="white" />
            <stop offset="76%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
          <mask id="efGlobeFadeMask">
            <circle cx="326" cy="254" r="206" fill="url(#efGlobeFade)" />
          </mask>
          <filter id="efSoftGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="efNodeGlow" x="-120%" y="-120%" width="340%" height="340%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <ellipse className="hero-globe-shadow" cx="326" cy="478" rx="142" ry="17" />
        <circle className="hero-globe-ambient" cx="326" cy="254" r="222" />
        <circle className="hero-globe-orbit hero-globe-orbit-one" cx="326" cy="254" r="229" />
        <circle className="hero-globe-orbit hero-globe-orbit-two" cx="326" cy="254" r="218" />

        <g clipPath="url(#efGlobeClip)">
          <circle className="hero-globe-surface" cx="326" cy="254" r="206" />

          <g className="hero-globe-grid" mask="url(#efGlobeFadeMask)">
            <path d="M126 199C222 169 432 169 526 201" />
            <path d="M120 254C228 229 430 229 532 254" />
            <path d="M135 312C236 335 419 336 518 309" />
            <path d="M218 64C174 155 173 352 222 443" />
            <path d="M326 48C291 150 291 361 326 460" />
            <path d="M434 66C478 158 477 348 432 442" />
          </g>

          <g className="hero-globe-map" mask="url(#efGlobeFadeMask)">
            <path d="M310 104l18-19 17 9 8 26-9 26-18 15-10 31-19 3-4-25 9-26-4-23 12-17Z" />
            <path d="M282 161l18-9 14 12-6 16-18 9-12-12 4-16Z" />
            <path d="M250 185l15-11 14 8-2 20-17 11-13-9 3-19Z" />
            <path d="M217 213l18-5 12 17-9 29-21 7-15-14 5-18 10-16Z" />
            <path d="M263 210l24-20 30 3 22 19-7 24-30 8-26-7-13-27Z" />
            <path d="M334 187l39-17 34 14 17 28-16 21-35-4-20 18-23-12 10-21-6-27Z" />
            <path d="M280 247l29-7 25 14-4 23-23 11-30-13 3-28Z" />
            <path d="M313 284l18-5 12 18-4 15 18 25-8 8-20-22-5-18-15-8 4-13Z" />
            <path d="M347 245l26-12 35 9 13 25-18 16-29-4-23 10-17-20 13-24Z" />
            <path d="M390 289l35-10 32 13 16 18-14 15-32-6-25 9-21-16 9-23Z" />
            <path d="M430 329l39-7 44 15 20 18-12 14-43-8-30 5-25-15 7-22Z" />
            <path d="M245 294l35-9 27 20-5 32-31 13-38-11-10-26 22-19Z" />
            <path className="hero-globe-map-muted" d="M205 350l64 7 55 24 45-8 61 18 49 39-47 40-149-12-95-57 17-51Z" />
          </g>

          <g className="hero-globe-coasts" mask="url(#efGlobeFadeMask)">
            <path d="M310 104l18-19 17 9 8 26-9 26-18 15-10 31M250 185l15-11 14 8-2 20-17 11M217 213l18-5 12 17-9 29-21 7M263 210l24-20 30 3 22 19-7 24-30 8-26-7M334 187l39-17 34 14 17 28-16 21-35-4M280 247l29-7 25 14-4 23-23 11M313 284l18-5 12 18-4 15 18 25M347 245l26-12 35 9 13 25-18 16M390 289l35-10 32 13 16 18M430 329l39-7 44 15 20 18" />
          </g>

          <g className="hero-transfer-lines">
            <path className="hero-route route-blue" d="M348 251C317 205 280 198 235 224" />
            <path className="hero-route route-cyan" d="M348 251C386 205 421 193 463 210" />
            <path className="hero-route route-blue" d="M348 251C402 259 451 276 487 316" />
            <path className="hero-route route-cyan" d="M348 251C374 298 403 326 447 345" />
            <path className="hero-route route-blue" d="M348 251C312 282 282 308 250 329" />
          </g>
        </g>

        <g className="hero-transfer-points" filter="url(#efNodeGlow)">
          <circle className="hero-node cyan" cx="235" cy="224" r="4.5" />
          <circle className="hero-node blue" cx="463" cy="210" r="4.5" />
          <circle className="hero-node cyan" cx="487" cy="316" r="4.5" />
          <circle className="hero-node blue" cx="447" cy="345" r="4.5" />
          <circle className="hero-node cyan" cx="250" cy="329" r="4.5" />
        </g>

        <g className="hero-euro-mark" filter="url(#efSoftGlow)">
          <circle className="hero-euro-orbit" cx="348" cy="251" r="25" />
          <circle className="hero-euro-core" cx="348" cy="251" r="17" />
          <text className="hero-euro-symbol" x="348" y="258" textAnchor="middle">€</text>
        </g>
      </svg>
    </div>
  );
}
