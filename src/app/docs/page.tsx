
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookText, Zap, Box, Truck, Camera, ClipboardList } from 'lucide-react';

const faqs = [
    {
        question: "Làm thế nào để tạo một đơn hàng/hóa đơn bằng giọng nói?",
        answer: (
            <div className="space-y-2">
                <p>Để tạo đơn hàng, bạn chỉ cần đọc tên khách hàng (nếu có) và liệt kê các sản phẩm kèm theo số lượng và đơn vị. Hệ thống sẽ tự động áp dụng giá bán đã được thiết lập sẵn.</p>
                <p className="font-semibold">Ví dụ mẫu:</p>
                <code className="block p-2 bg-muted rounded-md text-base sm:text-lg">
                    "Anh Long, 5 lốc bia Tiger, 2 thùng mì Hảo Hảo, một lốc Sting."
                </code>
                <p className="text-sm text-muted-foreground">
                    <strong>Mẹo:</strong> Bạn không cần đọc giá. AI sẽ tự động hiểu các đơn vị như "lốc", "thùng", "chai" và hệ thống sẽ tự tìm giá bán tương ứng.
                </p>
            </div>
        ),
        icon: Zap
    },
    {
        question: "Làm thế nào để tạo một hàng hóa mới bằng giọng nói?",
        answer: (
             <div className="space-y-2">
                <p>Để tạo một hàng hóa mới với các đơn vị quy đổi, hãy bắt đầu câu lệnh của bạn bằng cụm từ <strong className="text-primary">"Tạo hàng hóa"</strong>.</p>
                <p className="font-semibold">Ví dụ mẫu:</p>
                <code className="block p-2 bg-muted rounded-md text-base sm:text-lg">
                    "Tạo hàng hóa nước ngọt Sting. Đơn vị chai giá 10 nghìn, lốc 6 chai giá 58 nghìn, thùng 4 lốc giá 230 nghìn."
                </code>
                 <p className="text-sm text-muted-foreground">
                    <strong>Mẹo:</strong> AI sẽ tự động xác định "Chai" là đơn vị cơ sở và tính toán hệ số quy đổi cho "Lốc" và "Thùng".
                </p>
            </div>
        ),
        icon: Box
    },
    {
        question: "Làm thế nào để tạo phiếu nhập kho bằng giọng nói?",
        answer: (
            <div className="space-y-2">
                <p>Để tạo phiếu nhập kho, hãy bắt đầu bằng <strong className="text-primary">"Nhập kho từ"</strong> theo sau là tên nhà cung cấp và danh sách các mặt hàng nhập.</p>
                <p className="font-semibold">Ví dụ mẫu:</p>
                <code className="block p-2 bg-muted rounded-md text-base sm:text-lg">
                    "Nhập kho từ nhà cung cấp Tân Hiệp Phát, 50 thùng Hảo Hảo giá nhập 150, 100 thùng La Vie giá 80."
                </code>
                <p className="text-sm text-muted-foreground">
                    <strong>Mẹo:</strong> Giá bạn đọc sẽ được ghi nhận là giá nhập kho (giá vốn) cho lần nhập hàng này.
                </p>
            </div>
        ),
        icon: Truck
    },
    {
        question: "Làm thế nào để sử dụng máy ảnh?",
        answer: (
            <div className="space-y-4">
                <p>Từ màn hình chính, bạn có thể gạt công tắc để chuyển sang chế độ máy ảnh. Sau khi chụp ảnh, bạn có thể chọn một trong ba hành động để AI xử lý:</p>
                <div className="space-y-3 pl-4 border-l-2 border-primary/50">
                    <div>
                        <h4 className="font-semibold text-primary flex items-center gap-2"><Box className="h-5 w-5" />Tạo Sản Phẩm</h4>
                        <p className="text-muted-foreground">Chụp ảnh một sản phẩm duy nhất. AI sẽ tự động phân tích và điền các thông tin như tên, thương hiệu, danh mục và các thuộc tính liên quan.</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-primary flex items-center gap-2"><Truck className="h-5 w-5" />Nhập Hàng</h4>
                        <p className="text-muted-foreground">Chụp ảnh một hóa đơn, phiếu giao hàng từ nhà cung cấp hoặc một danh sách hàng hóa. AI sẽ trích xuất các sản phẩm và giá (nếu có) để tạo phiếu nhập kho.</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-primary flex items-center gap-2"><Zap className="h-5 w-5" />Lên Đơn Hàng</h4>
                        <p className="text-muted-foreground">Chụp ảnh một danh sách hàng hóa viết tay, một tin nhắn, hoặc một đơn hàng cũ. AI sẽ đọc và điền các sản phẩm vào đơn hàng mới.</p>
                    </div>
                </div>
                 <p className="text-sm text-muted-foreground pt-2">
                    <strong>Mẹo:</strong> Để có kết quả tốt nhất, hãy đảm bảo ảnh chụp rõ ràng, đủ sáng và không bị mờ.
                </p>
            </div>
        ),
        icon: Camera
    },
    {
        question: "Danh mục (Catalog) và Thuộc tính (Attribute) là gì?",
        answer: (
            <div className="space-y-4">
                <p>Danh mục và Thuộc tính giúp bạn phân loại và sắp xếp hàng hóa một cách chi tiết và có hệ thống.</p>
                
                <div className="space-y-3 pl-4 border-l-2 border-primary/50">
                    <div>
                        <h4 className="font-semibold text-primary">1. Danh mục (Catalog)</h4>
                        <p className="text-muted-foreground">Là nhóm lớn để phân loại sản phẩm. Ví dụ: "Nước giải khát", "Bia", "Sách", "Quần áo". Khi tạo sản phẩm mới, AI có thể tự động đề xuất một danh mục dựa trên tên sản phẩm, hoặc bạn có thể tự chọn/tạo mới.</p>
                    </div>
                     <div>
                        <h4 className="font-semibold text-primary">2. Thuộc tính (Attribute)</h4>
                        <p className="text-muted-foreground">Là các đặc điểm cụ thể của sản phẩm, bao gồm <strong className="text-foreground">Loại thuộc tính</strong> và <strong className="text-foreground">Giá trị thuộc tính</strong>.</p>
                         <ul className="list-disc pl-5 mt-2 space-y-1 text-muted-foreground">
                            <li><strong>Loại thuộc tính:</strong> Ví dụ: "Màu sắc", "Dung tích", "Tác giả", "Kích cỡ".</li>
                            <li><strong>Giá trị thuộc tính:</strong> Ví dụ: "Đỏ", "330ml", "Dale Carnegie", "XL".</li>
                        </ul>
                    </div>
                </div>
                <div className="pt-2">
                  <h4 className="font-semibold">Cách hoạt động khi tạo sản phẩm:</h4>
                  <p  className="text-muted-foreground">Khi bạn tạo một sản phẩm mới (bằng giọng nói hoặc hình ảnh), hệ thống AI sẽ cố gắng điền sẵn các thông tin này. Bạn có thể dễ dàng chỉnh sửa, tìm kiếm hoặc <strong className="text-primary">tạo mới</strong> các Danh mục, Loại thuộc tính và Giá trị thuộc tính ngay trên form tạo sản phẩm nếu chúng chưa tồn tại trong hệ thống.</p>
                </div>
                 <p className="text-sm text-muted-foreground pt-2">
                    <strong>Mẹo:</strong> Việc phân loại sản phẩm tốt giúp bạn dễ dàng quản lý tồn kho và tìm kiếm sau này.
                </p>
            </div>
        ),
        icon: ClipboardList
    }
];

export default function DocsPage() {
  return (
    <div className="flex flex-1 flex-col items-center p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-black">
      <div className="w-full max-w-5xl">
        <header className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary">
                Hướng dẫn sử dụng
            </h1>
            <p className="mt-2 text-base sm:text-lg text-muted-foreground">
                Những câu hỏi thường gặp giúp bạn sử dụng Nola hiệu quả hơn.
            </p>
        </header>
        
        <Card className="shadow-lg rounded-xl animate-fade-in-up">
            <CardContent className="p-4 sm:p-6">
                 <Accordion type="single" collapsible className="w-full">
                    {faqs.slice().sort((a, b) => a.question.localeCompare(b.question)).map((faq, index) => (
                        <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-left hover:no-underline">
                               <div className="flex items-center gap-3">
                                    <faq.icon className="h-6 w-6 text-primary" />
                                    <span className="font-semibold text-lg sm:text-xl">{faq.question}</span>
                               </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 text-base sm:text-lg text-foreground/80">
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
