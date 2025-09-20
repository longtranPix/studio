'use client';

import { useState } from 'react';
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { X } from 'lucide-react';

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

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-lg p-6">
        <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </DialogClose>
        <DialogTitle className="text-center">
          QR Code Chuyển Khoản
        </DialogTitle>
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mt-1">{bankName}</p>
          </div>
          
          <div className="flex justify-center">
            <Image
              src={qrCodeUrl}
              alt={`QR Code for ${orderCode}`}
              width={280}
              height={280}
              className="rounded-lg border border-gray-200"
            />
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Số tài khoản:</span>
              <span className="font-medium">{accountNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tên tài khoản:</span>
              <span className="font-medium text-right">{accountName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Số tiền:</span>
              <span className="font-semibold text-green-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Nội dung:</span>
              <span className="font-medium">{orderCode}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
