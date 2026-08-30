"use client";

import {
  cloneElement,
  isValidElement,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field as FieldBase, Input } from "./ui";
import { cn } from "@/lib/utils";

/** Password input with an inline show/hide reveal button. The reveal
 *  state lives on the client; the actual password value stays in the
 *  consumer's controlled input. */
export function PasswordInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  const [shown, setShown] = useState(false);
  return (
    <span className="relative block">
      <Input
        type={shown ? "text" : "password"}
        className={cn("pe-12", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-label={shown ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
        aria-pressed={shown}
        className="absolute end-1.5 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-muted transition-colors hover:text-ink"
      >
        {shown ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </span>
  );
}

/** Client-side Field: when `error` is set, injects `aria-invalid` and
 *  `aria-describedby` into the single input child so screen readers
 *  announce the error without callers having to thread props manually.
 *  Falls back to the server-safe Field for non-error cases (and when
 *  the child isn't a single React element). */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  const generatedId = useId();
  const errorId = error ? `field-error-${generatedId}` : undefined;
  let decorated: ReactNode = children;
  if (error && isValidElement(children)) {
    const child = children as ReactElement<{
      "aria-invalid"?: boolean;
      "aria-describedby"?: string;
    }>;
    decorated = cloneElement(child, {
      "aria-invalid": true,
      "aria-describedby": errorId,
    });
  }
  return (
    <FieldBase label={label} hint={hint} error={error}>
      {decorated}
    </FieldBase>
  );
}
