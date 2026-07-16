type CurrencyIconProps = {
  code: string;
  size?: "sm" | "md" | "lg";
};

const currencySymbols: Record<string, string> = {
  RUB: "₽",
  EUR: "€",
  USD: "$",
  UAH: "₴",
  KZT: "₸",
  GEL: "₾",
  TRY: "₺",
  GBP: "£",
  CHF: "₣",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  USDT: "₮",
};

export default function CurrencyIcon({
  code,
  size = "md",
}: CurrencyIconProps) {
  const normalizedCode = code.toUpperCase();
  const symbol = currencySymbols[normalizedCode] || normalizedCode.slice(0, 1);

  return (
    <span
      className={`currency-icon currency-icon-${size} currency-${normalizedCode.toLowerCase()}`}
      aria-hidden="true"
    >
      {symbol}
    </span>
  );
}
