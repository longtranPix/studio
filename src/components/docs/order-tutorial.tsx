
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Edit3, Save, Send, CreditCard, QrCode } from 'lucide-react';

const steps = [
  {
    icon: <Mic className="h-6 w-6 text-primary" />,
    title: 'Bước 1: Ghi âm thông tin đơn hàng',
    description: 'Nhấn vào nút micro lớn ở trang chủ để bắt đầu ghi âm. Đọc to và rõ ràng các thông tin cần thiết cho đơn hàng, bao gồm: tên khách hàng, tên sản phẩm, số lượng, đơn giá và thuế suất (nếu có). Ví dụ: "Bán cho anh Long hai cái bánh mì, giá mười nghìn một cái, VAT năm phần trăm".',
  },
  {
    icon: <Edit3 className="h-6 w-6 text-accent" />,
    title: 'Bước 2: Chỉnh sửa và xác nhận',
    description: 'Sau khi ghi âm, AI sẽ tự động chuyển đổi giọng nói thành văn bản và điền vào biểu mẫu đơn hàng. Bạn có thể kiểm tra lại, chỉnh sửa tên, số lượng, đơn giá, hoặc thêm/bớt sản phẩm trực tiếp trên biểu mẫu để đảm bảo thông tin chính xác tuyệt đối.',
  },
  {
    icon: <CreditCard className="h-6 w-6 text-purple-500" />,
    title: 'Bước 3: Chọn phương thức thanh toán & Tạo QR',
    description: 'Trong mục "Phương thức thanh toán", chọn "Chuyển khoản (CK)". Nếu thông tin ngân hàng của bạn đã được cấu hình trong trang Tài khoản, một nút "Xem QR Code Chuyển Khoản" sẽ xuất hiện. Nhấn vào đó để hiển thị mã QR cho khách hàng quét, mã đã chứa sẵn số tiền và nội dung chuyển khoản.',
  },
  {
    icon: <Save className="h-6 w-6 text-blue-500" />,
    title: 'Bước 4: Lưu hoặc Lưu & Xuất Hóa Đơn',
    description: 'Bạn có hai lựa chọn: nhấn "Lưu đơn hàng" để chỉ lưu lại thông tin, hoặc nhấn "Lưu & Xuất hóa đơn" để vừa lưu, vừa tự động tạo và gửi hóa đơn điện tử đến Viettel S-Invoice. Đơn hàng đã lưu sẽ xuất hiện trong trang "Lịch sử đơn hàng".',
  },
    {
    icon: <Send className="h-6 w-6 text-green-500" />,
    title: 'Bước 5: Xem, Tải hóa đơn và Tạo lại QR',
    description: 'Trong trang "Lịch sử đơn hàng", các đơn đã xuất hóa đơn sẽ có trạng thái "Đã xuất". Bạn có thể nhấn nút "Tải file" để tải hóa đơn. Đối với các đơn hàng thanh toán chuyển khoản, bạn cũng có thể nhấn vào biểu tượng mã QR trên thẻ đơn hàng để hiển thị lại mã thanh toán bất cứ lúc nào.',
  },
];

export function OrderTutorial() {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <Card key={index} className="shadow-sm border border-border/60">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex items-center gap-4 sm:block sm:gap-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  {step.icon}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
