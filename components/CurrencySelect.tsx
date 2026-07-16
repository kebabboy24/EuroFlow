"use client";

import { useEffect, useRef, useState } from "react";
import CurrencyIcon from "@/components/CurrencyIcon";

export type CurrencyOption = {
  code: string;
  name: string;
};

export default function CurrencySelect({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: string;
  options: CurrencyOption[];
  onChange: (currency: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected =
    options.find((option) => option.code === value) || options[0];

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div className="currency-select" ref={wrapperRef}>
      <button
        type="button"
        className="currency-select-trigger"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        aria-expanded={open}
      >
        <CurrencyIcon code={selected.code} />
        <span className="currency-select-text">
          <strong>{selected.code}</strong>
          <small>{selected.name}</small>
        </span>
        {!disabled && <span className="currency-chevron">⌄</span>}
      </button>

      {open && !disabled && (
        <div className="currency-menu">
          {options.map((option) => (
            <button
              type="button"
              key={option.code}
              className={
                option.code === value
                  ? "currency-menu-item active"
                  : "currency-menu-item"
              }
              onClick={() => {
                onChange(option.code);
                setOpen(false);
              }}
            >
              <CurrencyIcon code={option.code} />
              <span>
                <strong>{option.code}</strong>
                <small>{option.name}</small>
              </span>
              {option.code === value && (
                <span className="currency-selected-mark">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
