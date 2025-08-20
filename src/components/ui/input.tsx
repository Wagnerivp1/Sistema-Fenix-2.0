import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"


interface CurrencyInputProps extends Omit<InputProps, 'onChange' | 'value'> {
  value: number;
  onValueChange: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, className, ...props }, ref) => {
    const format = (num: number) => {
      return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };

    const [displayValue, setDisplayValue] = React.useState(format(value || 0));

    React.useEffect(() => {
        // Update display value only if it's different from the internal state
        // to avoid overriding user input.
        const numericValue = parse(displayValue);
        if (numericValue !== value) {
            setDisplayValue(format(value || 0));
        }
    }, [value]);
    
    const parse = (str: string): number => {
        const numbers = str.replace(/[^\d]/g, '');
        if (!numbers) return 0;
        return Number(numbers) / 100;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      const numericValue = parse(inputVal);
      
      // Update the parent component with the raw numeric value
      onValueChange(numericValue);
      
      // Update the display with the formatted value
      setDisplayValue(format(numericValue));
    };

    return (
      <Input
        ref={ref}
        type="text"
        inputMode="decimal"
        className={cn("text-right", className)}
        value={displayValue}
        onChange={handleChange}
        placeholder="0,00"
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";


export { Input, CurrencyInput };
