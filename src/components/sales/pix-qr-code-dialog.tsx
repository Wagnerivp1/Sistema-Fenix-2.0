
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
  txid: string,
  amount: number
): string => {
  const payload = [
    '000201', // Payload Format Indicator
    '26' + (('0014br.gov.bcb.pix' + '01' + pixKey.length.toString().padStart(2, '0') + pixKey).length).toString().padStart(2, '0') + '0014br.gov.bcb.pix' + '01' + pixKey.length.toString().padStart(2, '0') + pixKey,
    '52040000', // Merchant Category Code
    '5303986', // Transaction Currency
    '54' + amount.toFixed(2).length.toString().padStart(2, '0') + amount.toFixed(2),
    '5802BR', // Country Code
    '59' + merchantName.substring(0, 25).length.toString().padStart(2, '0') + merchantName.substring(0, 25),
    '60' + merchantCity.substring(0, 15).length.toString().padStart(2, '0') + merchantCity.substring(0, 15),
    '62' + (('05' + txid.substring(0, 25).length.toString().padStart(2, '0') + txid.substring(0, 25)).length).toString().padStart(2, '0') + '05' + txid.substring(0, 25).length.toString().padStart(2, '0') + txid.substring(0, 25),
  ].join('');

  const payloadWithCrc = payload + '6304';

  let crc = 0xFFFF;
  for (let i = 0; i < payloadWithCrc.length; i++) {
    crc ^= payloadWithCrc.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (crc << 1) ^ 0x1021 : crc << 1;
    }
  }

  const crc16 = crc & 0xFFFF;
  return payloadWithCrc + crc16.toString(16).toUpperCase().padStart(4, '0');
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
          companyInfo.name || 'Empresa',
          'SAO PAULO',
          `txid_${sale.id}`,
          sale.total
        );

        setPixCopyPaste(pixPayload);

        QRCode.toDataURL(pixPayload, { width: 256, margin: 1, errorCorrectionLevel: 'M' })
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
    } else {
        setQrCodeDataUrl('');
        setPixCopyPaste('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, sale.id, sale.total]); // Roda apenas quando o diálogo abre ou a venda muda
  
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
        <div className="py-4 space-y-6 text-center">
            {qrCodeDataUrl ? (
                <div className="flex justify-center">
                    <Image src={qrCodeDataUrl} alt="PIX QR Code" width={280} height={280} />
                </div>
            ) : (
                 <div className="h-[280px] w-[280px] bg-muted animate-pulse rounded-md mx-auto flex items-center justify-center">
                    <p className="text-muted-foreground">Gerando QR Code...</p>
                </div>
            )}
            <div className="text-center">
                <p className="text-lg">Total a Pagar</p>
                <p className="text-4xl font-bold text-primary">R$ {sale.total.toFixed(2)}</p>
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
