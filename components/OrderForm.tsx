"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import CurrencyIcon from "@/components/CurrencyIcon";
import {
  currencyConfig,
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
  receiveAmount: number;
  marginPercent: number;
  source: "binance_p2p" | "bybit_p2p" | "manual_fallback";
};

type CreatedOrder = {
  id: string;
  payment_reference?: string | null;
  send_amount: number;
  send_currency: string;
  send_bank?: string | null;
};

type Step = "send" | "receive" | "amount" | "review" | "instructions";

const stepOrder: Step[] = ["send", "receive", "amount", "review", "instructions"];

const sourceLabel: Record<RateResponse["source"], string> = {
  binance_p2p: "Binance P2P",
  bybit_p2p: "Bybit P2P",
  manual_fallback: "ручной fallback",
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
            <span>{method.name}</span>
            {method.popular && <small>Популярно</small>}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function OrderForm({
  initialCurrency,
  initialAmount,
  initialReceive,
  userEmail,
}: {
  initialCurrency: string;
  initialAmount: string;
  initialReceive: string;
  userEmail: string;
}) {
  const initialSendCurrency = sendCurrencies.some((item) => item.code === initialCurrency)
    ? initialCurrency
    : "RUB";
  const initialSendRegion = defaultRegion(initialSendCurrency).id;
  const initialSendMethod = defaultMethod(initialSendCurrency, initialSendRegion).id;
  const initialReceiveCurrency = "EUR";
  const initialReceiveRegion = defaultRegion(initialReceiveCurrency).id;
  const initialReceiveMethod = defaultMethod(initialReceiveCurrency, initialReceiveRegion).id;

  const [step, setStep] = useState<Step>("send");
  const [error, setError] = useState("");
  const [rateError, setRateError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<CreatedOrder | null>(null);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [sendCurrency, setSendCurrency] = useState(initialSendCurrency);
  const [sendRegion, setSendRegion] = useState(initialSendRegion);
  const [sendMethod, setSendMethod] = useState(initialSendMethod);
  const [receiveCurrency, setReceiveCurrency] = useState(initialReceiveCurrency);
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

  const sendCurrencyConfig = currencyConfig(sendCurrency);
  const sendMethodConfig = methodConfig(sendCurrency, sendRegion, sendMethod);
  const receiveCurrencyConfig = currencyConfig(receiveCurrency);
  const receiveMethodConfig = methodConfig(receiveCurrency, receiveRegion, receiveMethod);
  const payoutField = fieldValue(receiveMethodConfig, "payout_details") || {
    label: "Реквизиты получателя",
    placeholder: "IBAN, карта, кошелёк или другой реквизит",
  };
  const currentStepIndex = stepOrder.indexOf(step);

  useEffect(() => {
    const nextRegion = defaultRegion(sendCurrency).id;
    const nextMethod = defaultMethod(sendCurrency, nextRegion).id;
    setSendRegion(nextRegion);
    setSendMethod(nextMethod);
  }, [sendCurrency]);

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
          direction: "buy_eur",
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
      setError(result.error || "Не удалось отправить заявку.");
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
          <span className="dashboard-kicker">Новая заявка</span>
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
          <p>Выберите валюту, страну и банк или способ оплаты.</p>
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

          <label className="flow-label">
            Страна / регион
            <select value={sendRegion} onChange={(event) => setSendRegion(event.target.value)}>
              {sendCurrencyConfig.regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </label>

          <MethodPicker currency={sendCurrency} region={sendRegion} value={sendMethod} onChange={setSendMethod} />
        </section>
      )}

      {step === "receive" && (
        <section className="flow-panel">
          <h3>Куда получить</h3>
          <p>Введите только реквизиты для получения. Не указывайте CVV, PIN, пароли или SMS-коды.</p>
          <div className="currency-choice-grid compact">
            {receiveCurrencies.map((currency) => (
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

          <label className="flow-label">
            Страна / регион
            <select value={receiveRegion} onChange={(event) => setReceiveRegion(event.target.value)}>
              {receiveCurrencyConfig.regions.map((region) => (
                <option key={region.id} value={region.id}>{region.name}</option>
              ))}
            </select>
          </label>

          <MethodPicker currency={receiveCurrency} region={receiveRegion} value={receiveMethod} onChange={setReceiveMethod} />

          <label className="flow-label">
            {payoutField.label}
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
              {rate && <small>Курс: 1 {sendCurrency} = {rate.rate.toFixed(6)} {receiveCurrency}</small>}
            </div>
          </div>
          {rateError && <div className="error">{rateError}</div>}
        </section>
      )}

      {step === "review" && (
        <section className="flow-panel">
          <h3>Проверка заявки</h3>
          <p>Финальный курс фиксируется после подтверждения заявки оператором.</p>
          <div className="flow-summary-card">
            <div><span>Отправляет</span><b>{formatMoney(sendAmount, sendCurrency)}</b></div>
            <div><span>Способ отправки</span><b>{sendMethodConfig.name}</b></div>
            <div><span>Получает</span><b>{receiveCurrency}</b></div>
            <div><span>Способ получения</span><b>{receiveMethodConfig.name}</b></div>
            <div><span>Реквизиты</span><b>{payoutDetails}</b></div>
            <div><span>Ориентировочный курс</span><b>{rate ? `1 ${sendCurrency} = ${rate.rate.toFixed(6)} ${receiveCurrency}` : "Будет уточнён"}</b></div>
            <div><span>К получению</span><b>{formatMoney(receiveAmount, receiveCurrency)}</b></div>
            <div><span>Маржа</span><b>{rate ? `${rate.marginPercent.toFixed(1)}%` : "По тарифу"}</b></div>
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
        <section className="flow-panel">
          <h3>Инструкция по оплате</h3>
          <p>Заявка создана. Оператор проверит детали и подтвердит финальный курс.</p>
          <div className="payment-instruction-card">
            <div><span>Номер заявки</span><b>{createdOrder.id}</b></div>
            <div><span>Сколько оплатить</span><b>{formatMoney(sendAmount, sendCurrency)}</b></div>
            <div><span>Куда оплатить</span><b>{sendMethodConfig.name}</b></div>
            <div><span>Комментарий к переводу</span><b>{createdOrder.payment_reference || `EF-${createdOrder.id.slice(0, 8)}`}</b></div>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setPaymentConfirmed(true)}>
            Я оплатил
          </button>
          {paymentConfirmed && <div className="success">Спасибо. Оператор увидит отметку и свяжется с вами.</div>}
          <button type="button" className="btn" onClick={() => router.push("/dashboard?created=1")}>
            Перейти в кабинет
          </button>
        </section>
      )}

      {error && <div className="error">{error}</div>}

      {step !== "instructions" && (
        <div className="flow-actions">
          <button type="button" className="btn" onClick={goBack} disabled={currentStepIndex === 0 || loading}>
            Назад
          </button>
          {step === "review" ? (
            <button className="btn btn-primary" disabled={loading || !canContinue}>
              {loading ? "Создаём…" : "Создать заявку"}
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
