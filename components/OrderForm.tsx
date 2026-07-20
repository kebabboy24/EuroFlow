"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CurrencyIcon from "@/components/CurrencyIcon";
import PaymentMethodIcon from "@/components/PaymentMethodIcon";
import PaymentRequisitesFlow, { type PaymentOrder, type PaymentRequisites } from "@/components/PaymentRequisitesFlow";
import {
  defaultMethod,
  defaultRegion,
  methodConfig,
  receiveCurrencies,
  regionConfig,
  sendCurrencies,
  type PaymentMethod,
} from "@/lib/exchange/payment-methods";

type RateResponse = {
  rate: number;
  finalRate: number;
  receiveAmount: number;
  source: "binance_p2p" | "bybit_p2p" | "manual_fallback";
};

type CreatedOrder = {
  id: string;
  status?: string | null;
  payment_reference?: string | null;
  payment_requisites?: PaymentRequisites | null;
  send_amount: number;
  send_currency: string;
  receive_amount: number;
  receive_currency: string;
  send_bank?: string | null;
  send_method?: string | null;
  receive_bank?: string | null;
  receive_method?: string | null;
};

type Step = "send" | "receive" | "amount" | "review" | "instructions";

const stepOrder: Step[] = ["send", "receive", "amount", "review", "instructions"];

const sourceLabel: Record<RateResponse["source"], string> = {
  binance_p2p: "P2P market",
  bybit_p2p: "P2P market",
  manual_fallback: "EuroFlow rate",
};

function formatMoney(value: number, currency: string) {
  return `${Number(value || 0).toLocaleString("ru-RU", {
    maximumFractionDigits: currency === "USDT" ? 4 : 2,
  })} ${currency}`;
}

function fieldValue(method: PaymentMethod, key: string) {
  return method.requiredFields?.find((field) => field.key === key);
}

function MethodPicker({
  currency,
  region,
  value,
  onChange,
}: {
  currency: string;
  region: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const methods = regionConfig(currency, region).methods;
  const filtered = methods.filter((method) =>
    method.name.toLowerCase().includes(query.trim().toLowerCase())
  );
  const popular = filtered.filter((method) => method.popular);
  const regular = filtered.filter((method) => !method.popular && method.id !== "other");
  const other = filtered.find((method) => method.id === "other");
  const visible = [...popular, ...regular, ...(other ? [other] : [])];

  return (
    <div className="method-picker">
      <input
        className="method-search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Найти банк или способ"
        aria-label="Найти банк или способ"
      />
      <div className="method-list">
        {visible.map((method) => (
          <button
            type="button"
            key={method.id}
            className={method.id === value ? "method-option active" : "method-option"}
            onClick={() => onChange(method.id)}
          >
            <span className="method-main">
              <PaymentMethodIcon method={method} />
              <span>{method.name}</span>
            </span>
            {method.popular && <small>Популярно</small>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrderForm({
  initialCurrency,
  initialReceiveCurrency,
  initialAmount,
  initialReceive,
  userEmail,
}: {
  initialCurrency: string;
  initialReceiveCurrency: string;
  initialAmount: string;
  initialReceive: string;
  userEmail: string;
}) {
  const initialSendCurrency = sendCurrencies.some((item) => item.code === initialCurrency)
    ? initialCurrency
    : "RUB";
  const initialSendRegion = defaultRegion(initialSendCurrency).id;
  const initialSendMethod = defaultMethod(initialSendCurrency, initialSendRegion).id;
  const validatedReceiveCurrency = receiveCurrencies.some(
    (item) => item.code === initialReceiveCurrency && item.code !== initialSendCurrency
  )
    ? initialReceiveCurrency
    : initialSendCurrency === "EUR" ? "USD" : "EUR";
  const initialReceiveRegion = defaultRegion(validatedReceiveCurrency).id;
  const initialReceiveMethod = defaultMethod(validatedReceiveCurrency, initialReceiveRegion).id;

  const [step, setStep] = useState<Step>("send");
  const [error, setError] = useState("");
  const [rateError, setRateError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [sendCurrency, setSendCurrency] = useState(initialSendCurrency);
  const [sendRegion, setSendRegion] = useState(initialSendRegion);
  const [sendMethod, setSendMethod] = useState(initialSendMethod);
  const [receiveCurrency, setReceiveCurrency] = useState(validatedReceiveCurrency);
  const [receiveRegion, setReceiveRegion] = useState(initialReceiveRegion);
  const [receiveMethod, setReceiveMethod] = useState(initialReceiveMethod);
  const [sendAmount, setSendAmount] = useState(Number(initialAmount) || 0);
  const [receiveAmount, setReceiveAmount] = useState(Number(initialReceive) || 0);
  const [rate, setRate] = useState<RateResponse | null>(null);
  const [payoutDetails, setPayoutDetails] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [telegram, setTelegram] = useState("");
  const [comment, setComment] = useState("");
  const router = useRouter();

  const sendMethodConfig = methodConfig(sendCurrency, sendRegion, sendMethod);
  const receiveMethodConfig = methodConfig(receiveCurrency, receiveRegion, receiveMethod);
  const payoutField = fieldValue(receiveMethodConfig, "payout_details") || {
    label: "Реквизиты получателя",
    placeholder: "IBAN, карта, кошелёк или другой реквизит",
  };
  const showIbanHelp = payoutField.label.toLowerCase().includes("iban");
  const isUsdtReceive = receiveCurrency === "USDT";
  const currentStepIndex = stepOrder.indexOf(step);

  useEffect(() => {
    const nextRegion = defaultRegion(sendCurrency).id;
    const nextMethod = defaultMethod(sendCurrency, nextRegion).id;
    setSendRegion(nextRegion);
    setSendMethod(nextMethod);
  }, [sendCurrency]);

  useEffect(() => {
    if (receiveCurrency === sendCurrency) {
      setReceiveCurrency(receiveCurrencies.find((item) => item.code !== sendCurrency)?.code || "EUR");
    }
  }, [receiveCurrency, sendCurrency]);

  useEffect(() => {
    setSendMethod(defaultMethod(sendCurrency, sendRegion).id);
  }, [sendRegion, sendCurrency]);

  useEffect(() => {
    const nextRegion = defaultRegion(receiveCurrency).id;
    const nextMethod = defaultMethod(receiveCurrency, nextRegion).id;
    setReceiveRegion(nextRegion);
    setReceiveMethod(nextMethod);
    setPayoutDetails("");
  }, [receiveCurrency]);

  useEffect(() => {
    setReceiveMethod(defaultMethod(receiveCurrency, receiveRegion).id);
    setPayoutDetails("");
  }, [receiveRegion, receiveCurrency]);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      if (!sendAmount) {
        setReceiveAmount(0);
        return;
      }

      setLoadingRate(true);
      setRateError("");

      try {
        const params = new URLSearchParams({
          from: sendCurrency,
          to: receiveCurrency,
          amount: String(sendAmount || 0),
        });
        const response = await fetch(`/api/rates?${params.toString()}`, {
          signal: controller.signal,
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Не удалось обновить курс.");
        }

        setRate(result);
        setReceiveAmount(Number(result.receiveAmount || 0));
      } catch (error) {
        if (!controller.signal.aborted) {
          setRate(null);
          setRateError(error instanceof Error ? error.message : "Курс недоступен.");
        }
      } finally {
        if (!controller.signal.aborted) setLoadingRate(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [sendAmount, sendCurrency, receiveCurrency]);

  const canContinue = useMemo(() => {
    if (step === "send") return Boolean(sendCurrency && sendRegion && sendMethod);
    if (step === "receive") return Boolean(receiveCurrency && receiveRegion && receiveMethod && payoutDetails.trim().length >= 4);
    if (step === "amount") return sendAmount > 0 && Boolean(rate) && !loadingRate;
    if (step === "review") return Boolean(fullName.trim() && email.trim() && telegram.trim() && payoutDetails.trim());
    return true;
  }, [email, fullName, loadingRate, payoutDetails, rate, receiveCurrency, receiveMethod, receiveRegion, sendAmount, sendCurrency, sendMethod, sendRegion, step, telegram]);

  function goNext() {
    setError("");
    if (!canContinue) {
      setError("Заполните данные на этом шаге, чтобы продолжить.");
      return;
    }
    setStep(stepOrder[Math.min(currentStepIndex + 1, stepOrder.length - 1)]);
  }

  function goBack() {
    setError("");
    setStep(stepOrder[Math.max(currentStepIndex - 1, 0)]);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!canContinue) {
      setError("Проверьте контактные данные и реквизиты получения.");
      return;
    }

    setError("");
    setLoading(true);
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name: fullName,
        email,
        telegram,
        send_amount: sendAmount,
        send_currency: sendCurrency,
        receive_amount: receiveAmount,
        receive_currency: receiveCurrency,
        send_region: sendRegion,
        send_method: sendMethod,
        send_bank: sendMethodConfig.name,
        receive_region: receiveRegion,
        receive_method: receiveMethod,
        receive_bank: receiveMethodConfig.name,
        payout_details: payoutDetails,
        bank_name: receiveMethodConfig.name,
        iban: payoutDetails,
        rate_value: rate?.rate,
        comment,
      }),
    });
    const result = await response.json();
    setLoading(false);

    if (!response.ok) {
      setError(result.error || "Не удалось отправить обмен.");
      return;
    }

    setCreatedOrder(result.order);
    setStep("instructions");
    router.refresh();
  }

  return (
    <form className="card form exchange-flow" onSubmit={submit}>
      <div className="flow-top">
        <div>
          <span className="dashboard-kicker">Новый обмен</span>
          <h2>Создать обмен</h2>
        </div>
        <span className="flow-step-count">Шаг {Math.min(currentStepIndex + 1, 5)} из 5</span>
      </div>

      <div className="flow-progress" aria-hidden="true">
        {stepOrder.map((item, index) => (
          <span key={item} className={index <= currentStepIndex ? "active" : ""} />
        ))}
      </div>

      {step === "send" && (
        <section className="flow-panel">
          <h3>Откуда отправляете</h3>
          <p>Выберите валюту и банк или способ оплаты.</p>
          <div className="currency-choice-grid">
            {sendCurrencies.map((currency) => (
              <button
                type="button"
                key={currency.code}
                className={currency.code === sendCurrency ? "currency-choice active" : "currency-choice"}
                onClick={() => setSendCurrency(currency.code)}
              >
                <CurrencyIcon code={currency.code} size="sm" />
                <span>{currency.code}</span>
              </button>
            ))}
          </div>

          <MethodPicker currency={sendCurrency} region={sendRegion} value={sendMethod} onChange={setSendMethod} />
        </section>
      )}

      {step === "receive" && (
        <section className="flow-panel">
          <h3>Куда получить</h3>
          <p>Введите только реквизиты для получения. Не указывайте CVV, PIN, пароли или SMS-коды.</p>
          <div className="currency-choice-grid compact">
            {receiveCurrencies.filter((currency) => currency.code !== sendCurrency).map((currency) => (
              <button
                type="button"
                key={currency.code}
                className={currency.code === receiveCurrency ? "currency-choice active" : "currency-choice"}
                onClick={() => setReceiveCurrency(currency.code)}
              >
                <CurrencyIcon code={currency.code} size="sm" />
                <span>{currency.code}</span>
              </button>
            ))}
          </div>

          <MethodPicker currency={receiveCurrency} region={receiveRegion} value={receiveMethod} onChange={setReceiveMethod} />

          {isUsdtReceive && (
            <div className="crypto-network-warning" role="note">
              Проверьте сеть перед отправкой. Ошибка сети может привести к потере средств.
            </div>
          )}

          <label className="flow-label">
            <span className="flow-label-row">
              {payoutField.label}
              {showIbanHelp && (
                <span className="field-help" tabIndex={0} aria-label="Где найти IBAN">
                  ?
                  <span className="field-help-tooltip" role="tooltip">
                    IBAN обычно находится в приложении банка в разделе реквизитов счёта: Account details, Details, IBAN или Реквизиты. Это не номер карты, не CVV и не пароль.
                  </span>
                </span>
              )}
            </span>
            <textarea
              value={payoutDetails}
              onChange={(event) => setPayoutDetails(event.target.value)}
              placeholder={payoutField.placeholder}
              rows={3}
              required
            />
          </label>
        </section>
      )}

      {step === "amount" && (
        <section className="flow-panel">
          <h3>Сумма</h3>
          <p>Введите сумму, которую отправляете. Ориентировочный курс обновится автоматически.</p>
          <div className="flow-amount-card">
            <label>
              Вы отправляете
              <div className="flow-money-input">
                <input
                  type="number"
                  min="1"
                  value={sendAmount || ""}
                  onChange={(event) => setSendAmount(Number(event.target.value) || 0)}
                  required
                />
                <span>{sendCurrency}</span>
              </div>
            </label>
            <div className="flow-rate-preview">
              <span>Ориентировочно получите</span>
              <strong>{loadingRate ? "Обновляем…" : formatMoney(receiveAmount, receiveCurrency)}</strong>
              {rate && <small>Курс EuroFlow: 1 {sendCurrency} = {rate.rate.toFixed(6)} {receiveCurrency}</small>}
            </div>
          </div>
          {rateError && <div className="error">{rateError}</div>}
        </section>
      )}

      {step === "review" && (
        <section className="flow-panel">
          <h3>Проверка обмена</h3>
          <p>Финальный курс фиксируется после подтверждения обмена оператором.</p>
          <div className="flow-summary-card">
            <div><span>Отправляет</span><b>{formatMoney(sendAmount, sendCurrency)}</b></div>
            <div><span>Способ отправки</span><b>{sendMethodConfig.name}</b></div>
            <div><span>Получает</span><b>{receiveCurrency}</b></div>
            <div><span>Способ получения</span><b>{receiveMethodConfig.name}</b></div>
            <div><span>Реквизиты</span><b>{payoutDetails}</b></div>
            <div><span>Курс EuroFlow</span><b>{rate ? `1 ${sendCurrency} = ${rate.rate.toFixed(6)} ${receiveCurrency}` : "Будет уточнён"}</b></div>
            <div><span>Источник курса</span><b>{rate ? sourceLabel[rate.source] : "Будет уточнён"}</b></div>
            <div><span>К получению</span><b>{formatMoney(receiveAmount, receiveCurrency)}</b></div>
          </div>

          <div className="flow-contact-grid">
            <input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Имя и фамилия" required />
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required />
            <input value={telegram} onChange={(event) => setTelegram(event.target.value)} placeholder="Telegram: @username" required />
            <input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Комментарий, если нужно" />
          </div>
        </section>
      )}

      {step === "instructions" && createdOrder && (
        <PaymentRequisitesFlow initialOrder={createdOrder as PaymentOrder} />
      )}

      {error && <div className="error">{error}</div>}

      {step !== "instructions" && (
        <div className="flow-actions">
          <button type="button" className="btn" onClick={goBack} disabled={currentStepIndex === 0 || loading}>
            Назад
          </button>
          {step === "review" ? (
            <button className="btn btn-primary" disabled={loading || !canContinue}>
              {loading ? "Обмениваем…" : "Обменять"}
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={goNext} disabled={!canContinue}>
              Продолжить
            </button>
          )}
        </div>
      )}

      <p className="small flow-warning">
        EuroFlow не запрашивает CVV, PIN, пароли банка и одноразовые SMS-коды.
      </p>
    </form>
  );
}
