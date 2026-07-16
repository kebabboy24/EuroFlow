import Link from "next/link";

export default function BrandLogo() {
  return (
    <Link href="/" className="brand">
      <span className="brand-icon"><span>€</span><i>→</i></span>
      <strong>EuroFlow</strong>
    </Link>
  );
}
