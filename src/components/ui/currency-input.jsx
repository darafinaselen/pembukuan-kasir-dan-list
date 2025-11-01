import * as React from "react";
import { Input } from "@/components/ui/input";

const CurrencyInput = React.forwardRef(
  ({ value, onChange, className, disabled, placeholder, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState("");

    // Format number to IDR currency format
    const formatCurrency = (num) => {
      if (!num && num !== 0) return "";
      return new Intl.NumberFormat("id-ID").format(num);
    };

    // Parse IDR formatted string to number
    const parseCurrency = (str) => {
      if (!str) return "";
      return str.replace(/\./g, "");
    };

    // Update display value when value prop changes
    React.useEffect(() => {
      if (value || value === 0) {
        setDisplayValue(formatCurrency(value));
      } else {
        setDisplayValue("");
      }
    }, [value]);

    const handleChange = (e) => {
      const inputValue = e.target.value;

      // Remove non-digit characters
      const numericValue = inputValue.replace(/\D/g, "");

      // Update display with formatted value
      setDisplayValue(formatCurrency(numericValue));

      // Call onChange with numeric value
      if (onChange) {
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: numericValue,
          },
        };
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
          Rp
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          className={`pl-10 ${className || ""}`}
          disabled={disabled}
          placeholder={placeholder || "0"}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
