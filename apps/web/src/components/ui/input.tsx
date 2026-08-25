import { forwardRef, type InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, error, className = "", ...inputProps },
  ref,
) {
  if (!id) {
    throw new Error("Input component requires an id");
  }

  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>

      <input
        ref={ref}
        id={id}
        className={`px-3 py-2 ${error ? "border-red-600 focus:border-red-600" : ""} ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
});

export default Input;
