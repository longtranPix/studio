'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';

interface QRCodeDialogProps {
  bankId: string;
  accountNo: string;
  accountName: string;
  amount: number;
  orderCode: string;
  bankName: string;
  children: React.ReactNode;
}

export function QRCodeDialog({
  bankId,
  accountNo,
  accountName,
  amount,
  orderCode,
  bankName,
  children
}: QRCodeDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Generate QR code URL
  const qrCodeUrl = `https://img.vietqr.io/image/${bankId}-${accountNo}-print.png?amount=${amount}&addInfo=${encodeURIComponent(orderCode)}&accountName=${encodeURIComponent(accountName)}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm rounded-lg p-0">
        <div className="flex justify-center">
          <Image
            src={qrCodeUrl}
            alt={`QR Code for ${orderCode}`}
            width={300}
            height={300}
            className="rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
