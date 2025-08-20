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
  value: number | string;
  onValueChange: (value: number) => void;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, className, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    const format = (num: number) => {
      if (isNaN(num)) return '';
      return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const parse = (str: string) => {
      const cleaned = str.replace(/[^\d,]/g, '').replace(',', '.');
      return parseFloat(cleaned) || 0;
    };

    React.useEffect(() => {
      const numericValue = typeof value === 'string' ? parse(value) : value;
      setDisplayValue(format(numericValue));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      const numericValue = parse(inputVal);
      
      if (!isNaN(numericValue)) {
          onValueChange(numericValue);
      }
      
      setDisplayValue(inputVal.replace(/[^\d,]/g, ''));
    };

    const handleBlur = () => {
       const numericValue = parse(displayValue);
       setDisplayValue(format(numericValue));
    };

    return (
      <Input
        ref={ref}
        type="text"
        className={cn("text-right", className)}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="0,00"
        {...props}
      />
    );
  }
);
CurrencyInput.displayName = "CurrencyInput";


export { Input, CurrencyInput };
