'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { CalendarIcon, Check } from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subDays, subWeeks, subMonths, subYears } from 'date-fns';
import { vi } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onDateChange: (startDate: Date, endDate: Date) => void;
  isLoading?: boolean;
}

export function DateRangePicker({ startDate, endDate, onDateChange, isLoading }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempRange, setTempRange] = useState<{from: Date | undefined, to: Date | undefined}>({from: undefined, to: undefined});
  const [isRangeMode, setIsRangeMode] = useState(true);
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string | null>('today');

  const handleQuickSelect = (type: string) => {
    const today = new Date();
    let start: Date, end: Date;

    switch (type) {
      case 'today':
        start = end = today;
        break;
      case 'yesterday':
        start = end = subDays(today, 1);
        break;
      case 'last7days':
        start = subDays(today, 6);
        end = today;
        break;
      case 'last30days':
        start = subDays(today, 29);
        end = today;
        break;
      case 'lastweek':
        start = startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        end = endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 });
        break;
      case 'thisweek':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        break;
      case 'lastmonth':
        start = startOfMonth(subMonths(today, 1));
        end = endOfMonth(subMonths(today, 1));
        break;
      case 'thismonth':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      case 'thisquarter':
        start = startOfQuarter(today);
        end = endOfQuarter(today);
        break;
      case 'lastyear':
        start = startOfYear(subYears(today, 1));
        end = endOfYear(subYears(today, 1));
        break;
      default:
        return;
    }

    onDateChange(start, end);
    setSelectedQuickFilter(type);
    setIsOpen(false);
  };

  const handleCalendarSelect = (range: {from: Date | undefined, to: Date | undefined} | Date | undefined) => {
    if (!range) return;
    
    if (isRangeMode) {
      // Range mode - range is an object with from/to
      setTempRange(range as {from: Date | undefined, to: Date | undefined});
    } else {
      // Single date mode - range is a single Date
      const selectedDate = range as Date;
      setTempRange({ from: selectedDate, to: selectedDate });
    }
  };

  const handleConfirm = () => {
    if (tempRange.from && tempRange.to) {
      onDateChange(tempRange.from, tempRange.to);
      setSelectedQuickFilter(null); // Clear quick filter selection when using calendar
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Chọn khoảng thời gian';
    
    if (startDate.getTime() === endDate.getTime()) {
      return format(startDate, 'dd/MM/yyyy', { locale: vi });
    }
    
    return `${format(startDate, 'dd/MM/yyyy', { locale: vi })} - ${format(endDate, 'dd/MM/yyyy', { locale: vi })}`;
  };

  const quickFilters = [
    { key: 'today', label: 'Hôm nay' },
    { key: 'yesterday', label: 'Hôm qua' },
    { key: 'last7days', label: '7 ngày qua' },
    { key: 'last30days', label: '30 ngày qua' },
    { key: 'thisweek', label: 'Tuần này' },
    { key: 'lastweek', label: 'Tuần trước' },
    { key: 'thismonth', label: 'Tháng này' },
    { key: 'lastmonth', label: 'Tháng trước' },
    { key: 'thisquarter', label: 'Quý này' },
    { key: 'lastyear', label: 'Năm trước' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Label className="text-sm font-medium mb-2 block">Khoảng thời gian</Label>
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !startDate && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formatDateRange()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-3 border-b">
                <div className="flex gap-2 mb-3">
                  <Button
                    variant={isRangeMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsRangeMode(true);
                      setTempRange({ from: undefined, to: undefined });
                    }}
                    className="text-xs"
                  >
                    Khoảng thời gian
                  </Button>
                  <Button
                    variant={!isRangeMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setIsRangeMode(false);
                      setTempRange({ from: undefined, to: undefined });
                    }}
                    className="text-xs"
                  >
                    Ngày đơn
                  </Button>
                </div>
                <Calendar
                  mode={isRangeMode ? "range" : "single"}
                  selected={isRangeMode ? tempRange : tempRange.from}
                  onSelect={handleCalendarSelect}
                  numberOfMonths={1}
                  locale={vi}
                  className="rounded-md border"
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-xs"
                  >
                    Hủy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleConfirm}
                    disabled={!tempRange.from || (isRangeMode && !tempRange.to)}
                    className="text-xs"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Xác nhận
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium">Chọn nhanh</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {quickFilters.map((filter) => (
              <Button
                key={filter.key}
                variant={selectedQuickFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickSelect(filter.key)}
                disabled={isLoading}
                className={`text-xs ${
                  selectedQuickFilter === filter.key 
                    ? "bg-green-600 hover:bg-green-700 text-white" 
                    : ""
                }`}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
