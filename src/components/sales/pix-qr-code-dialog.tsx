
'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import type { CompanyInfo } from '@/types';
import { Copy, Check } from 'lucide-react';

interface PixQrCodeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  companyInfo: CompanyInfo | null;
  sale: { total: number, id: string };
  onConfirm: (printReceipt: boolean) => void;
}

const generatePixPayload = (
    pixKey: string,
    merchantName: string,
    merchantCity: string,
    amount: number,
    txid: string,
  ): string => {
      const merchantNameFormatted = (merchantName || 'Empresa').normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 25);
      const merchantCityFormatted = (merchantCity || 'SAO PAULO').normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0, 15);
      
      const payloadFields: { [key: string]: string } = {
          '00': '01',
          '26': `0014br.gov.bcb.pix01${pixKey.length.toString().padStart(2, '0')}${pixKey}`,
          '52': '0000',
          '53': '986',
          '54': amount.toFixed(2),
          '58': 'BR',
          '59': merchantNameFormatted,
          '60': merchantCityFormatted,
          '62': `05${txid.length.toString().padStart(2, '0')}${txid}`,
      };
  
      const formatField = (id: string, value: string): string => {
          return `${id}${value.length.toString().padStart(2, '0')}${value}`;
      };
  
      let payloadString = '';
      for (const id in payloadFields) {
        if (id !== '26') {
            payloadString += formatField(id, payloadFields[id]);
        } else {
            payloadString += formatField('26', payloadFields['26']);
        }
      }
      payloadString += '6304';
  
      const getCrc16 = (payload: string): string => {
          let crc = 0xFFFF;
          const bytes = new TextEncoder().encode(payload);
          for (const byte of bytes) {
              crc ^= (byte << 8);
              for (let i = 0; i < 8; i++) {
                  if ((crc & 0x8000) !== 0) {
                      crc = (crc << 1) ^ 0x1021;
                  } else {
                      crc <<= 1;
                  }
              }
          }
          return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
      };
  
      const crc = getCrc16(payloadString);
      return `${payloadString}${crc}`;
  };


export function PixQrCodeDialog({
  isOpen,
  onOpenChange,
  companyInfo,
  sale,
  onConfirm,
}: PixQrCodeDialogProps) {
  const { toast } = useToast();
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState('');
  const [pixCopyPaste, setPixCopyPaste] = React.useState('');
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && companyInfo?.pixKey && sale.total > 0 && sale.id) {
      try {
        const pixPayload = generatePixPayload(
          companyInfo.pixKey,
          companyInfo.name,
          'SAO PAULO',
          sale.total,
          '***'
        );

        setPixCopyPaste(pixPayload);

        QRCode.toDataURL(pixPayload, { width: 200, margin: 1, errorCorrectionLevel: 'M' })
          .then(url => {
            setQrCodeDataUrl(url);
          })
          .catch(err => {
            console.error(err);
            toast({
              variant: 'destructive',
              title: 'Erro ao gerar QR Code',
              description: 'Não foi possível criar a imagem do QR Code.',
            });
          });
      } catch (error) {
        console.error("PIX Payload Error:", error);
        toast({
            variant: 'destructive',
            title: 'Erro de Dados PIX',
            description: 'Verifique se a chave PIX e nome da empresa estão corretos nas configurações.',
        });
      }
    }
  }, [isOpen, companyInfo, sale.id, sale.total, toast]);
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(pixCopyPaste);
    setHasCopied(true);
    toast({ title: "Copiado!", description: "O código PIX Copia e Cola foi copiado para a área de transferência." });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagamento via PIX</DialogTitle>
          <DialogDescription>
            Aponte a câmera do seu celular para o QR Code ou use o Copia e Cola.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 text-center">
            {qrCodeDataUrl ? (
                <div className="flex justify-center">
                    <Image src={qrCodeDataUrl} alt="PIX QR Code" width={200} height={200} />
                </div>
            ) : (
                 <div className="h-[200px] w-[200px] bg-muted animate-pulse rounded-md mx-auto flex items-center justify-center">
                    <p className="text-muted-foreground">Gerando QR Code...</p>
                </div>
            )}
            <div className="text-center">
                <p className="text-base">Total a Pagar</p>
                <p className="text-3xl font-bold text-primary">R$ {sale.total.toFixed(2)}</p>
            </div>
             <Button variant="outline" onClick={handleCopyToClipboard}>
                {hasCopied ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Copy className="mr-2 h-4 w-4" />}
                {hasCopied ? 'Copiado!' : 'PIX Copia e Cola'}
            </Button>
        </div>
        <DialogFooter className="flex-col sm:flex-row sm:justify-between gap-2">
          <Button variant="secondary" onClick={() => onConfirm(true)}>Confirmar e Imprimir Recibo</Button>
          <Button onClick={() => onConfirm(false)}>Confirmar Pagamento</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
