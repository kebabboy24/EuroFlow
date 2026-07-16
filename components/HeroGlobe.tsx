export default function HeroGlobe() {
  return (
    <div className="hero-visual" aria-hidden="true">
      <svg className="hero-globe" viewBox="0 0 640 520" role="img">
        <defs>
          <radialGradient id="efGlobeSurface" cx="42%" cy="34%" r="72%">
            <stop offset="0%" stopColor="var(--globe-core)" stopOpacity="1" />
            <stop offset="52%" stopColor="var(--globe-mid)" stopOpacity="0.78" />
            <stop offset="100%" stopColor="var(--globe-edge)" stopOpacity="0.18" />
          </radialGradient>
          <radialGradient id="efEuroGlow" cx="50%" cy="45%" r="62%">
            <stop offset="0%" stopColor="#8ea0ff" />
            <stop offset="100%" stopColor="#165dff" />
          </radialGradient>
          <linearGradient id="efRouteGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#165dff" />
            <stop offset="100%" stopColor="#12d7c7" />
          </linearGradient>
          <pattern id="efDotGrid" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="1.7" cy="1.7" r="0.9" fill="var(--globe-dot)" />
          </pattern>
          <clipPath id="efGlobeClip">
            <circle cx="318" cy="252" r="210" />
          </clipPath>
        </defs>

        <ellipse className="hero-globe-shadow" cx="318" cy="484" rx="145" ry="20" />
        <circle className="hero-globe-halo" cx="318" cy="252" r="224" />
        <g clipPath="url(#efGlobeClip)">
          <circle className="hero-globe-surface" cx="318" cy="252" r="210" />
          <rect className="hero-globe-dots" x="98" y="34" width="440" height="438" fill="url(#efDotGrid)" />
          <path className="hero-globe-grid" d="M116 198c99-33 288-38 405-4M105 252c122-27 319-27 431 2M132 312c98 29 270 34 382 8M206 56c-63 111-66 283-9 392M318 42c-26 119-27 305 0 426M430 60c62 110 64 275 8 388" />
          <path className="hero-globe-land muted" d="M154 188l46-22 51 8 23 25-20 34-59 9-46-20 5-34ZM150 281l55 9 34 36-15 50-55 21-48-35 5-51 24-30ZM407 145l60 15 42 37-30 33-59-12-39-42 26-31ZM420 306l72 20 24 48-46 39-66-12-30-48 46-47Z" />
          <path className="hero-globe-europe" d="M258 166l45-20 49 13 24 27 43 7 29 34-19 38 27 31-19 51-45 9-30 41-54-6-29-35-49 10-36-34 14-48-34-33 22-43 43-7 19-35Z" />
          <path className="hero-globe-coast" d="M276 184l-22 38 26 31-18 39 31 39 49-5 30 37 35-38-26-39 28-44-45-15-22-31-42 10-24-22Z" />
          <path className="hero-globe-land thin" d="M230 132c28-12 61-17 98-13M198 384c48 25 98 35 151 29M444 250c32 4 58 14 80 30" />
        </g>

        <g className="hero-transfer-lines">
          <path className="hero-route route-cis" d="M318 258 C238 194 184 164 126 162" />
          <path className="hero-route route-cis" d="M318 258 C218 242 153 247 92 276" />
          <path className="hero-route route-south" d="M318 258 C236 320 176 365 128 424" />
          <path className="hero-route route-austria" d="M318 258 C382 210 414 190 458 184" />
          <path className="hero-route route-east" d="M318 258 C421 246 486 274 548 326" />
          <path className="hero-route route-south" d="M318 258 C364 344 388 407 394 466" />
        </g>

        <g className="hero-transfer-points">
          <circle className="hero-node cyan" cx="126" cy="162" r="7" />
          <circle className="hero-node blue" cx="92" cy="276" r="7" />
          <circle className="hero-node cyan" cx="128" cy="424" r="7" />
          <circle className="hero-node blue" cx="458" cy="184" r="7" />
          <circle className="hero-node cyan" cx="548" cy="326" r="7" />
          <circle className="hero-node blue" cx="394" cy="466" r="7" />
        </g>

        <g className="hero-euro-mark">
          <circle className="hero-euro-orbit" cx="318" cy="258" r="40" />
          <circle className="hero-euro-core" cx="318" cy="258" r="29" />
          <text className="hero-euro-symbol" x="318" y="270" textAnchor="middle">€</text>
        </g>
      </svg>
    </div>
  );
}
