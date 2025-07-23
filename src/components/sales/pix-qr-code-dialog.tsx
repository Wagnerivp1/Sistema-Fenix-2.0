
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

const formatText = (id: string, text: string | undefined, maxLength = 99) => {
    const cleanText = String(text || '').substring(0, maxLength);
    const length = cleanText.length.toString().padStart(2, '0');
    return `${id}${length}${cleanText}`;
};

const getCrc16 = (payload: string) => {
    let crc = 0xFFFF;
    const polynomial = 0x1021;
    for (const b of Buffer.from(payload, 'utf8')) {
        crc ^= (b << 8);
        for (let i = 0; i < 8; i++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ polynomial;
            } else {
                crc <<= 1;
            }
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
};

const generatePixPayload = (companyInfo: CompanyInfo, sale: { total: number, id: string }) => {
    const merchantAccountInfo = formatText('00', 'br.gov.bcb.pix') + formatText('01', companyInfo.pixKey);

    const txid = `***${sale.id.slice(-22)}`.substring(0, 25);

    const payloadWithoutCrc = [
        formatText('00', '01'),
        formatText('26', merchantAccountInfo),
        formatText('52', '0000'),
        formatText('53', '986'),
        formatText('54', sale.total.toFixed(2)),
        formatText('58', 'BR'),
        formatText('59', companyInfo.name.replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 25)),
        formatText('60', 'SAO PAULO'),
        formatText('62', formatText('05', txid)),
        '6304' // CRC16 ID and size placeholder
    ].join('');
    
    const crc = getCrc16(payloadWithoutCrc);
    
    return payloadWithoutCrc + crc;
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
    if (isOpen && companyInfo && sale.total > 0) {
      try {
        const pixPayload = generatePixPayload(companyInfo, sale);

        setPixCopyPaste(pixPayload);

        QRCode.toDataURL(pixPayload, { width: 256, margin: 1, errorCorrectionLevel: 'H' })
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
  }, [isOpen, companyInfo, sale, toast]);
  
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
