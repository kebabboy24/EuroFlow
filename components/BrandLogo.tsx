import Link from "next/link";

export default function BrandLogo() {
  return (
    <Link href="/" className="brand" aria-label="EuroFlow">
      <img className="brand-logo-img" src="/brand/euroflow-logo.png" alt="EuroFlow" />
    </Link>
  );
}
