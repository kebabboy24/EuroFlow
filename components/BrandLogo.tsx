import Link from "next/link";

export default function BrandLogo() {
  return (
    <Link href="/" className="brand" aria-label="EuroFlow">
      <img className="brand-logo-img brand-logo-light" src="/brand/euroflow-logo.png" alt="EuroFlow" />
      <img className="brand-logo-img brand-logo-dark" src="/brand/euroflow-logo-dark.png" alt="" aria-hidden="true" />
    </Link>
  );
}
