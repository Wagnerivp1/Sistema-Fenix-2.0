import * as React from "react"

import { cn } from "@/lib/utils"

const formatCurrency = (value: number | string | undefined): string => {
  if (value === undefined || value === null || value === '') return '';
  let stringValue = String(value).replace(/\D/g, '');
  if (stringValue === '') return '';

  // Converte para número e divide por 100 para tratar como centavos
  const numberValue = parseFloat(stringValue) / 100;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
  .format(numberValue)
  .replace('R$', '') // Remove o símbolo da moeda para um campo mais limpo
  .trim();
};

const unformatCurrency = (value: string | undefined): string => {
    if (value === undefined || value === null) return '';
    return String(value).replace(/\D/g, '');
}


const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, value: propValue, onChange, ...props }, ref) => {
    // Apenas aplica a máscara de moeda se o tipo for "number" e não tiver um "step" (indicando que não é um number-stepper)
    const isCurrency = type === 'number' && !props.step;

    const [internalValue, setInternalValue] = React.useState(() => {
      if (isCurrency) {
        return formatCurrency(String(propValue || ''));
      }
      return String(propValue || '');
    });

    React.useEffect(() => {
        const newValue = String(propValue || '');
        if (isCurrency) {
            setInternalValue(formatCurrency(newValue.replace('.', '')));
        } else {
            setInternalValue(newValue);
        }
    }, [propValue, isCurrency]);

    const handleOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (isCurrency) {
        const rawValue = e.target.value;
        const formatted = formatCurrency(rawValue);
        setInternalValue(formatted);
        
        // Propaga a mudança para o formulário com o valor numérico correto
        if (onChange) {
            const numericString = unformatCurrency(rawValue);
            const numericValue = parseFloat(numericString) / 100;
            
            // Simula um evento de mudança com o valor numérico
            const syntheticEvent = {
                ...e,
                target: {
                    ...e.target,
                    id: props.id!,
                    value: isNaN(numericValue) ? '' : String(numericValue),
                }
            };
             onChange(syntheticEvent as React.ChangeEvent<HTMLInputElement>);
        }
      } else {
        onChange?.(e);
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
        onChange={handleOnChange}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
