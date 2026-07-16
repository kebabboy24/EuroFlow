export type RequiredFieldType = "text" | "textarea" | "tel";

export type RequiredField = {
  key: "payout_details" | "recipient_contact";
  label: string;
  placeholder: string;
  type?: RequiredFieldType;
};

export type PaymentMethodIconKey =
  | "sberbank"
  | "tbank"
  | "alfabank"
  | "vtb"
  | "sbp"
  | "raiffeisen"
  | "gazprom"
  | "rosselkhoz"
  | "sovcom"
  | "otkritie"
  | "pochtabank"
  | "mts"
  | "ozon"
  | "yandex"
  | "yoomoney"
  | "monobank"
  | "privatbank"
  | "pumb"
  | "oschadbank"
  | "sensebank"
  | "kaspi"
  | "halyk"
  | "forte"
  | "jusan"
  | "freedom"
  | "bog"
  | "tbc"
  | "liberty"
  | "credo"
  | "iban"
  | "sepa"
  | "revolut"
  | "wise"
  | "erste"
  | "n26"
  | "swift"
  | "bankTransfer"
  | "cash"
  | "trc20"
  | "erc20"
  | "bep20"
  | "ton"
  | "card"
  | "other";

export type PaymentMethod = {
  id: string;
  name: string;
  icon?: string;
  iconKey?: PaymentMethodIconKey;
  iconLabel?: string;
  iconColor?: string;
  popular?: boolean;
  requiredFields?: RequiredField[];
};

export type PaymentRegion = {
  id: string;
  name: string;
  methods: PaymentMethod[];
};

export type CurrencyPaymentConfig = {
  code: string;
  name: string;
  regions: PaymentRegion[];
};

const payoutDetails: RequiredField = {
  key: "payout_details",
  label: "Реквизиты получения",
  placeholder: "IBAN, номер карты, кошелёк или другие реквизиты",
};

const ibanDetails: RequiredField = {
  key: "payout_details",
  label: "IBAN получателя",
  placeholder: "Например: AT00 0000 0000 0000 0000",
};

const cardDetails: RequiredField = {
  key: "payout_details",
  label: "Номер карты или счёта",
  placeholder: "Введите только номер карты/счёта для получения",
};

const swiftDetails: RequiredField = {
  key: "payout_details",
  label: "SWIFT / банковские реквизиты",
  placeholder: "SWIFT/BIC, номер счёта и имя получателя",
};

const walletDetails: RequiredField = {
  key: "payout_details",
  label: "USDT wallet",
  placeholder: "Адрес кошелька в выбранной сети",
};

const otherMethod: PaymentMethod = { id: "other", name: "Другое", iconKey: "other" };

export const paymentMethods: CurrencyPaymentConfig[] = [
  {
    code: "RUB",
    name: "Российский рубль",
    regions: [
      {
        id: "ru",
        name: "Россия",
        methods: [
          { id: "sberbank", name: "Сбербанк", icon: "/banks/sberbank.svg", iconKey: "sberbank", popular: true },
          { id: "tbank", name: "Т-Банк / Тинькофф", icon: "/banks/tbank.svg", iconKey: "tbank", popular: true },
          { id: "alfabank", name: "Альфа-Банк", icon: "/banks/alfabank.svg", iconKey: "alfabank", popular: true },
          { id: "vtb", name: "ВТБ", icon: "/banks/vtb.svg", iconKey: "vtb", popular: true },
          { id: "sbp", name: "СБП", icon: "/banks/sbp.png", iconKey: "sbp", popular: true },
          { id: "raiffeisen_ru", name: "Райффайзен", icon: "/banks/raiffeisenbank.svg", iconKey: "raiffeisen" },
          { id: "gazprombank", name: "Газпромбанк", icon: "/banks/gazprombank.svg", iconKey: "gazprom" },
          { id: "rosselkhozbank", name: "Россельхозбанк", icon: "/banks/rosselkhozbank.svg", iconKey: "rosselkhoz" },
          { id: "sovcombank", name: "Совкомбанк", icon: "/banks/sovcombank.svg", iconKey: "sovcom" },
          { id: "otkritie", name: "Открытие", icon: "/banks/otkritie.svg", iconKey: "otkritie" },
          { id: "pochtabank", name: "Почта Банк", icon: "/banks/pochtabank.svg", iconKey: "pochtabank" },
          { id: "mtsbank", name: "МТС Банк", icon: "/banks/mts-bank.svg", iconKey: "mts" },
          { id: "ozonbank", name: "Озон Банк", icon: "/banks/ozon.svg", iconKey: "ozon" },
          { id: "yandexbank", name: "Яндекс Банк", icon: "/banks/yandex.svg", iconKey: "yandex" },
          { id: "umoney", name: "ЮMoney", icon: "/banks/yoomoney.svg", iconKey: "yoomoney" },
          otherMethod,
        ],
      },
    ],
  },
  {
    code: "UAH",
    name: "Украинская гривна",
    regions: [
      {
        id: "ua",
        name: "Украина",
        methods: [
          { id: "monobank", name: "Monobank", iconKey: "monobank", popular: true },
          { id: "privatbank", name: "PrivatBank", iconKey: "privatbank", popular: true },
          { id: "pumb", name: "PUMB", iconKey: "pumb" },
          { id: "oschadbank", name: "Oschadbank", iconKey: "oschadbank" },
          { id: "raiffeisen_ua", name: "Raiffeisen Ukraine", iconKey: "raiffeisen" },
          { id: "sensebank", name: "Sense Bank", iconKey: "sensebank" },
          otherMethod,
        ],
      },
    ],
  },
  {
    code: "KZT",
    name: "Казахстанский тенге",
    regions: [
      {
        id: "kz",
        name: "Казахстан",
        methods: [
          { id: "kaspi", name: "Kaspi", iconKey: "kaspi", popular: true },
          { id: "halyk", name: "Halyk", iconKey: "halyk", popular: true },
          { id: "forte", name: "Forte", iconKey: "forte" },
          { id: "jusan", name: "Jusan", iconKey: "jusan" },
          { id: "freedom", name: "Freedom", iconKey: "freedom" },
          otherMethod,
        ],
      },
    ],
  },
  {
    code: "GEL",
    name: "Грузинский лари",
    regions: [
      {
        id: "ge",
        name: "Грузия",
        methods: [
          { id: "bog", name: "Bank of Georgia", iconKey: "bog", popular: true },
          { id: "tbc", name: "TBC Bank", iconKey: "tbc", popular: true },
          { id: "liberty", name: "Liberty Bank", iconKey: "liberty" },
          { id: "credo", name: "Credo Bank", iconKey: "credo" },
          otherMethod,
        ],
      },
    ],
  },
  {
    code: "USD",
    name: "Доллар США",
    regions: [
      {
        id: "global_usd",
        name: "Международно",
        methods: [
          { id: "swift_usd", name: "SWIFT", iconKey: "swift", popular: true, requiredFields: [swiftDetails] },
          { id: "wise_usd", name: "Wise", iconKey: "wise", popular: true, requiredFields: [payoutDetails] },
          { id: "revolut_usd", name: "Revolut", iconKey: "revolut", popular: true, requiredFields: [payoutDetails] },
          { id: "bank_transfer_usd", name: "Bank transfer", iconKey: "bankTransfer", requiredFields: [swiftDetails] },
          { id: "cash_usd", name: "Cash pickup", iconKey: "cash", requiredFields: [payoutDetails] },
          otherMethod,
        ],
      },
    ],
  },
  {
    code: "EUR",
    name: "Евро",
    regions: [
      {
        id: "eu",
        name: "Европа",
        methods: [
          { id: "iban", name: "IBAN", iconKey: "iban", popular: true, requiredFields: [ibanDetails] },
          { id: "sepa", name: "SEPA", iconKey: "sepa", popular: true, requiredFields: [ibanDetails] },
          { id: "revolut", name: "Revolut", iconKey: "revolut", popular: true, requiredFields: [payoutDetails] },
          { id: "wise", name: "Wise", iconKey: "wise", popular: true, requiredFields: [payoutDetails] },
          { id: "erste", name: "Erste Bank", iconKey: "erste", requiredFields: [ibanDetails] },
          { id: "raiffeisen_at", name: "Raiffeisen Austria", iconKey: "raiffeisen", requiredFields: [ibanDetails] },
          { id: "n26", name: "N26", iconKey: "n26", requiredFields: [ibanDetails] },
          { id: "card_eur", name: "Карта", iconKey: "card", requiredFields: [cardDetails] },
          { ...otherMethod, requiredFields: [payoutDetails] },
        ],
      },
    ],
  },
  {
    code: "USDT",
    name: "Tether",
    regions: [
      {
        id: "crypto",
        name: "Crypto",
        methods: [
          { id: "trc20", name: "TRC20", iconKey: "trc20", popular: true, requiredFields: [walletDetails] },
          { id: "erc20", name: "ERC20", iconKey: "erc20", requiredFields: [walletDetails] },
          { id: "bep20", name: "BEP20", iconKey: "bep20", requiredFields: [walletDetails] },
          { id: "ton", name: "TON", iconKey: "ton", requiredFields: [walletDetails] },
          { ...otherMethod, requiredFields: [walletDetails] },
        ],
      },
    ],
  },
];

export const sendCurrencies = paymentMethods.map(({ code, name }) => ({ code, name }));
export const receiveCurrencies = paymentMethods.filter(({ code }) => ["EUR", "USDT", "USD"].includes(code));

export function currencyConfig(code: string) {
  return paymentMethods.find((currency) => currency.code === code) || paymentMethods[0];
}

export function defaultRegion(code: string) {
  return currencyConfig(code).regions[0];
}

export function regionConfig(code: string, regionId: string) {
  return currencyConfig(code).regions.find((region) => region.id === regionId) || defaultRegion(code);
}

export function defaultMethod(code: string, regionId?: string) {
  const region = regionId ? regionConfig(code, regionId) : defaultRegion(code);
  return region.methods.find((method) => method.popular) || region.methods[0];
}

export function methodConfig(code: string, regionId: string, methodId: string) {
  const region = regionConfig(code, regionId);
  return region.methods.find((method) => method.id === methodId) || defaultMethod(code, region.id);
}

export function methodName(code: string, regionId: string, methodId: string) {
  return methodConfig(code, regionId, methodId).name;
}

export function regionName(code: string, regionId: string) {
  return regionConfig(code, regionId).name;
}
