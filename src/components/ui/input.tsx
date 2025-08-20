import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value: propValue, onChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState('');

    const formatCurrency = (val: string) => {
      if (!val) return '';
      // Remove all non-digit characters
      let numStr = val.replace(/\D/g, '');
      if (!numStr) return '';

      // Pad with zeros to ensure there are at least 3 digits for cents and integer part
      numStr = numStr.padStart(3, '0');

      // Split into integer and decimal parts
      let integerPart = numStr.slice(0, -2);
      let decimalPart = numStr.slice(-2);

      // Add thousand separators
      integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

      return `${integerPart},${decimalPart}`;
    };
    
    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
       if (type === 'number' && props.step !== 'any') { // Assuming 'number' type is for currency
            const rawValue = e.target.value;
            const formattedValue = formatCurrency(rawValue);
            setInternalValue(formattedValue);

            // Create a synthetic event for the parent form handler
            const numericValue = rawValue.replace(/\D/g, '');
            const number = parseFloat(numericValue) / 100;
            
            const syntheticEvent = {
                ...e,
                target: { ...e.target, value: isNaN(number) ? '' : String(number) }
            };
            onChange?.(syntheticEvent as React.ChangeEvent<HTMLInputElement>);

        } else {
            onChange?.(e);
        }
    };
    
    // Effect to format initial value
    React.useEffect(() => {
        if (type === 'number' && props.step !== 'any' && propValue) {
            // When the prop value changes (e.g., loaded from state), format it.
            const numValue = Number(propValue);
            if (!isNaN(numValue) && numValue > 0) {
              setInternalValue(formatCurrency(String(propValue).replace('.', '')));
            } else {
              setInternalValue('');
            }
        }
    }, [propValue, type, props.step]);

    const displayValue = (type === 'number' && props.step !== 'any') ? internalValue : propValue;


    return (
      <input
        type={type === 'number' && props.step !== 'any' ? 'text' : type}
        inputMode={type === 'number' && props.step !== 'any' ? 'decimal' : undefined}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={displayValue || ''}
        onChange={handleOnChange}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
