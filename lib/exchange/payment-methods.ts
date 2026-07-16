export type RequiredFieldType = "text" | "textarea" | "tel";

export type RequiredField = {
  key: "payout_details" | "recipient_contact";
  label: string;
  placeholder: string;
  type?: RequiredFieldType;
};

export type PaymentMethod = {
  id: string;
  name: string;
  icon?: string;
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

const walletDetails: RequiredField = {
  key: "payout_details",
  label: "USDT wallet",
  placeholder: "Адрес кошелька в выбранной сети",
};

const otherMethod = { id: "other", name: "Другое" };

export const paymentMethods: CurrencyPaymentConfig[] = [
  {
    code: "RUB",
    name: "Российский рубль",
    regions: [
      {
        id: "ru",
        name: "Россия",
        methods: [
          { id: "sberbank", name: "Сбербанк", icon: "/banks/sberbank.svg", popular: true },
          { id: "tbank", name: "Т-Банк / Тинькофф", icon: "/banks/tbank.svg", popular: true },
          { id: "alfabank", name: "Альфа-Банк", icon: "/banks/alfabank.svg", popular: true },
          { id: "vtb", name: "ВТБ", icon: "/banks/vtb.svg", popular: true },
          { id: "raiffeisen_ru", name: "Райффайзен", icon: "/banks/raiffeisenbank.svg" },
          { id: "gazprombank", name: "Газпромбанк", icon: "/banks/gazprombank.svg" },
          { id: "rosselkhozbank", name: "Россельхозбанк", icon: "/banks/rosselkhozbank.svg" },
          { id: "sovcombank", name: "Совкомбанк", icon: "/banks/sovcombank.svg" },
          { id: "otkritie", name: "Открытие", icon: "/banks/otkritie.svg" },
          { id: "pochtabank", name: "Почта Банк", icon: "/banks/pochtabank.jpeg" },
          { id: "mtsbank", name: "МТС Банк", icon: "/banks/mts-bank.svg" },
          { id: "ozonbank", name: "Озон Банк", icon: "/banks/ozon.svg" },
          { id: "yandexbank", name: "Яндекс Банк", icon: "/banks/yandex.svg" },
          { id: "umoney", name: "ЮMoney", icon: "/banks/yoomoney.svg" },
          { id: "sbp", name: "СБП", icon: "/banks/sbp.png", popular: true },
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
          { id: "monobank", name: "Monobank", popular: true },
          { id: "privatbank", name: "PrivatBank", popular: true },
          { id: "pumb", name: "PUMB" },
          { id: "raiffeisen_ua", name: "Raiffeisen" },
          { id: "oschadbank", name: "Oschadbank" },
          { id: "sensebank", name: "Sense Bank" },
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
          { id: "kaspi", name: "Kaspi", popular: true },
          { id: "halyk", name: "Halyk", popular: true },
          { id: "forte", name: "Forte" },
          { id: "jusan", name: "Jusan" },
          { id: "freedom", name: "Freedom" },
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
          { id: "bog", name: "Bank of Georgia", popular: true },
          { id: "tbc", name: "TBC", popular: true },
          { id: "liberty", name: "Liberty" },
          { id: "credo", name: "Credo" },
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
          { id: "wise_usd", name: "Wise", popular: true },
          { id: "revolut_usd", name: "Revolut", popular: true },
          { id: "iban_usd", name: "IBAN" },
          { id: "cash_usd", name: "Наличные через оператора" },
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
          { id: "iban", name: "IBAN", popular: true, requiredFields: [ibanDetails] },
          { id: "revolut", name: "Revolut", popular: true, requiredFields: [payoutDetails] },
          { id: "wise", name: "Wise", popular: true, requiredFields: [payoutDetails] },
          { id: "erste", name: "Erste Bank", requiredFields: [ibanDetails] },
          { id: "raiffeisen_at", name: "Raiffeisen Austria", requiredFields: [ibanDetails] },
          { id: "n26", name: "N26", requiredFields: [ibanDetails] },
          { id: "card_eur", name: "Карта", requiredFields: [cardDetails] },
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
          { id: "trc20", name: "TRC20", popular: true, requiredFields: [walletDetails] },
          { id: "erc20", name: "ERC20", requiredFields: [walletDetails] },
          { id: "bep20", name: "BEP20", requiredFields: [walletDetails] },
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
