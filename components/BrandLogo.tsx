import Link from "next/link";

export default function BrandLogo() {
  return (
    <Link href="/" className="brand" aria-label="EuroFlow">
      <span className="brand-emblem" aria-hidden="true">
        <span className="brand-stars">•••</span>
        <span className="brand-euro">€</span>
      </span>
      <span className="brand-name">EuroFlow</span>
    </Link>
  );
}
