import * as React from "react"

import { cn } from "@/lib/utils"

const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === '') return '';
  
  // Remove non-numeric characters, except for a comma or period for decimals
  let stringValue = String(value).replace(/[^0-9,.]/g, '');
  
  // Standardize decimal separator to period
  stringValue = stringValue.replace(',', '.');
  
  // Ensure only one decimal point
  const parts = stringValue.split('.');
  if (parts.length > 2) {
    stringValue = parts[0] + '.' + parts.slice(1).join('');
  }

  const numberValue = parseFloat(stringValue);

  if (isNaN(numberValue)) return '';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numberValue);
};

const parseCurrency = (value: string | undefined): number => {
    if (value === undefined || value === null || value === '') return 0;
    const numericString = String(value).replace(/[^0-9,]/g, '').replace(',', '.');
    return parseFloat(numericString) || 0;
}


const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value: propValue, onChange, onBlur, ...props }, ref) => {
    const isCurrency = type === 'number' && !props.step;
    const [internalValue, setInternalValue] = React.useState(String(propValue || ''));
    const [isEditing, setIsEditing] = React.useState(false);

    React.useEffect(() => {
        const numericValue = typeof propValue === 'number' ? propValue : parseCurrency(String(propValue));
        if (!isEditing) {
            setInternalValue(formatCurrency(numericValue));
        }
    }, [propValue, isEditing]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsEditing(true);
        const numericValue = parseCurrency(e.target.value);
        setInternalValue(numericValue === 0 ? '' : String(numericValue).replace('.', ','));
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        setIsEditing(false);
        const numericValue = parseCurrency(e.target.value);
        setInternalValue(formatCurrency(numericValue));
        onBlur?.(e);
    };

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        // Allow only numbers and a single comma
        if (/^[0-9]*[,]?[0-9]*$/.test(inputValue)) {
            setInternalValue(inputValue);
            
            if (onChange) {
                const numericValue = parseCurrency(inputValue);
                const syntheticEvent = {
                    ...e,
                    target: {
                        ...e.target,
                        id: props.id!,
                        value: String(numericValue),
                    }
                };
                onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
            }
        }
    };
    
    return (
      <input
        type={isCurrency ? 'text' : type}
        inputMode={isCurrency ? 'decimal' : undefined}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        value={internalValue}
        onChange={isCurrency ? handleOnChange : onChange}
        onFocus={isCurrency ? handleFocus : undefined}
        onBlur={isCurrency ? handleBlur : onBlur}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
