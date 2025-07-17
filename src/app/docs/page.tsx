
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookText, Zap, Box, Truck } from 'lucide-react';

const faqs = [
    {
        question: "Làm thế nào để tạo một đơn hàng/hóa đơn bằng giọng nói?",
        answer: (
            <div className="space-y-2">
                <p>Để tạo đơn hàng, bạn chỉ cần đọc tên khách hàng (nếu có) và liệt kê các sản phẩm kèm theo số lượng và đơn vị. Hệ thống sẽ tự động áp dụng giá bán đã được thiết lập sẵn.</p>
                <p className="font-semibold">Ví dụ mẫu:</p>
                <code className="block p-2 bg-muted rounded-md text-sm">
                    "Anh Long, 5 lốc bia Tiger, 2 thùng mì Hảo Hảo, một lốc Sting."
                </code>
                <p className="text-xs text-muted-foreground">
                    <strong>Mẹo:</strong> Bạn không cần đọc giá. AI sẽ tự động hiểu các đơn vị như "lốc", "thùng", "chai" và hệ thống sẽ tự tìm giá bán tương ứng.
                </p>
            </div>
        ),
        icon: Zap
    },
    {
        question: "Làm thế nào để tạo một hàng hóa mới?",
        answer: (
             <div className="space-y-2">
                <p>Để tạo một hàng hóa mới với các đơn vị quy đổi, hãy bắt đầu câu lệnh của bạn bằng cụm từ <strong className="text-primary">"Tạo hàng hóa"</strong>.</p>
                <p className="font-semibold">Ví dụ mẫu:</p>
                <code className="block p-2 bg-muted rounded-md text-sm">
                    "Tạo hàng hóa nước ngọt Sting. Đơn vị chai giá 10 nghìn, lốc 6 chai giá 58 nghìn, thùng 4 lốc giá 230 nghìn."
                </code>
                 <p className="text-xs text-muted-foreground">
                    <strong>Mẹo:</strong> AI sẽ tự động xác định "Chai" là đơn vị cơ sở và tính toán hệ số quy đổi cho "Lốc" và "Thùng".
                </p>
            </div>
        ),
        icon: Box
    },
    {
        question: "Làm thế nào để tạo phiếu nhập kho?",
        answer: (
            <div className="space-y-2">
                <p>Để tạo phiếu nhập kho, hãy bắt đầu bằng <strong className="text-primary">"Nhập kho từ"</strong> theo sau là tên nhà cung cấp và danh sách các mặt hàng nhập.</p>
                <p className="font-semibold">Ví dụ mẫu:</p>
                <code className="block p-2 bg-muted rounded-md text-sm">
                    "Nhập kho từ nhà cung cấp Tân Hiệp Phát, 50 thùng Hảo Hảo giá nhập 150, 100 thùng La Vie giá 80."
                </code>
                <p className="text-xs text-muted-foreground">
                    <strong>Mẹo:</strong> Giá bạn đọc sẽ được ghi nhận là giá nhập kho (giá vốn) cho lần nhập hàng này.
                </p>
            </div>
        ),
        icon: Truck
    }
];

export default function DocsPage() {
  return (
    <div className="flex flex-1 flex-col items-center p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-black">
      <div className="w-full max-w-3xl">
        <header className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-headline text-primary">
                Hướng dẫn sử dụng
            </h1>
            <p className="mt-2 text-muted-foreground">
                Những câu hỏi thường gặp giúp bạn sử dụng Nola hiệu quả hơn.
            </p>
        </header>
        
        <Card className="shadow-lg rounded-xl animate-fade-in-up">
            <CardContent className="p-4 sm:p-6">
                 <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-left hover:no-underline">
                               <div className="flex items-center gap-3">
                                    <faq.icon className="h-5 w-5 text-primary" />
                                    <span className="font-semibold text-base">{faq.question}</span>
                               </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 text-sm sm:text-base text-foreground/80">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
