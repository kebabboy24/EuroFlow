import type { CSSProperties } from "react";
import type { PaymentMethod, PaymentMethodIconKey } from "@/lib/exchange/payment-methods";

type MethodIconStyle = CSSProperties & {
  "--method-color": string;
  "--method-bg": string;
};

const fallbackIconMeta = {
  sberbank: { label: "СБ", color: "#16A34A" },
  tbank: { label: "Т", color: "#FACC15" },
  alfabank: { label: "А", color: "#EF3124" },
  vtb: { label: "ВТБ", color: "#0A62FF" },
  sbp: { label: "СБП", color: "#1D9BF0" },
  raiffeisen: { label: "R", color: "#FFD400" },
  gazprom: { label: "ГП", color: "#1450A3" },
  rosselkhoz: { label: "РС", color: "#0F8A3B" },
  sovcom: { label: "СК", color: "#165DFF" },
  otkritie: { label: "О", color: "#00AEEF" },
  pochtabank: { label: "ПБ", color: "#081E8A" },
  mts: { label: "МТС", color: "#E30611" },
  ozon: { label: "O", color: "#005BFF" },
  yandex: { label: "Я", color: "#FC3F1D" },
  yoomoney: { label: "Ю", color: "#7B3FF2" },
  monobank: { label: "mono", color: "#111827" },
  privatbank: { label: "PB", color: "#22A447" },
  pumb: { label: "ПУ", color: "#E31E24" },
  oschadbank: { label: "ОЩ", color: "#007A3D" },
  sensebank: { label: "S", color: "#D71920" },
  kaspi: { label: "K", color: "#EF4444" },
  halyk: { label: "H", color: "#009B77" },
  forte: { label: "F", color: "#7C3AED" },
  jusan: { label: "J", color: "#F97316" },
  freedom: { label: "FR", color: "#22C55E" },
  bog: { label: "BoG", color: "#F97316" },
  tbc: { label: "TBC", color: "#00A3E0" },
  liberty: { label: "LB", color: "#EF4444" },
  credo: { label: "CR", color: "#2563EB" },
  iban: { label: "IBAN", color: "#165DFF" },
  sepa: { label: "SEPA", color: "#12B3A8" },
  revolut: { label: "R", color: "#111827" },
  wise: { label: "W", color: "#9FE870" },
  erste: { label: "E", color: "#005CA9" },
  n26: { label: "N26", color: "#111827" },
  swift: { label: "SW", color: "#F97316" },
  bankTransfer: { label: "BT", color: "#2563EB" },
  cash: { label: "$", color: "#059669" },
  trc20: { label: "TRX", color: "#EF4444" },
  erc20: { label: "ETH", color: "#627EEA" },
  bep20: { label: "BNB", color: "#F0B90B" },
  ton: { label: "TON", color: "#0098EA" },
  card: { label: "CARD", color: "#165DFF" },
  other: { label: "•••", color: "#64748B" },
} satisfies Record<PaymentMethodIconKey, { label: string; color: string }>;

function fallbackInitials(name: string) {
  return name
    .split(/\s+|\/|-/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.slice(0, 1))
    .join("")
    .toUpperCase();
}

function softColor(hex: string) {
  return `${hex}18`;
}

export default function PaymentMethodIcon({ method }: { method: PaymentMethod }) {
  const meta = method.iconKey ? fallbackIconMeta[method.iconKey] : undefined;
  const color = method.iconColor || meta?.color || "#165DFF";
  const label = method.iconLabel || meta?.label || fallbackInitials(method.name);

  return (
    <span
      className={method.icon ? "payment-method-icon has-image" : "payment-method-icon has-mark"}
      style={{ "--method-color": color, "--method-bg": softColor(color) } as MethodIconStyle}
      aria-hidden="true"
    >
      {method.icon ? (
        <img src={method.icon} alt="" />
      ) : (
        <span className="payment-method-mark">{label}</span>
      )}
    </span>
  );
}
