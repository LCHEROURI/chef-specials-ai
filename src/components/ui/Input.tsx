import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: string;
  hint?: string;
  label: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { error, hint, id, label, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;

  return (
    <label className="ui-field" htmlFor={inputId}>
      <span className="ui-field__label">{label}</span>
      <input
        aria-describedby={error || hint ? messageId : undefined}
        aria-invalid={Boolean(error)}
        className="ui-input"
        id={inputId}
        ref={ref}
        {...props}
      />
      {error ? (
        <span className="ui-field__error" id={messageId}>
          {error}
        </span>
      ) : hint ? (
        <span className="ui-field__hint" id={messageId}>
          {hint}
        </span>
      ) : null}
    </label>
  );
});
