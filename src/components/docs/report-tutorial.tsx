
import { Card, CardContent } from '@/components/ui/card';
import { CalendarRange, Calendar, ChevronsUpDown } from 'lucide-react';

const steps = [
  {
    icon: <CalendarRange className="h-6 w-6 text-primary" />,
    title: 'Cách 1: Lọc theo khoảng thời gian',
    description: 'Nhấn vào ô hiển thị ngày tháng để mở lịch. Chọn "Khoảng thời gian", sau đó nhấp vào ngày bắt đầu và ngày kết thúc trên lịch. Nhấn "Xác nhận" để áp dụng bộ lọc. Báo cáo sẽ hiển thị dữ liệu tổng hợp cho toàn bộ khoảng thời gian bạn đã chọn.',
  },
  {
    icon: <Calendar className="h-6 w-6 text-accent" />,
    title: 'Cách 2: Lọc theo một ngày duy nhất',
    description: 'Mở lịch và chọn "Ngày đơn". Nhấp vào một ngày cụ thể trên lịch và nhấn "Xác nhận". Báo cáo sẽ chỉ hiển thị dữ liệu cho ngày duy nhất đó. Đây là cách nhanh để xem lại doanh số của một ngày làm việc.',
  },
  {
    icon: <ChevronsUpDown className="h-6 w-6 text-orange-500" />,
    title: 'Cách 3: Sử dụng bộ lọc nhanh',
    description: 'Để tiện lợi hơn, hãy sử dụng menu "Chọn nhanh". Menu này cung cấp các tùy chọn lọc phổ biến bằng tiếng Việt như "Hôm nay", "Tuần này", "Tháng trước", v.v. Chỉ cần chọn một mục, báo cáo sẽ tự động cập nhật mà không cần mở lịch.',
  },
];

export function ReportTutorial() {
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
