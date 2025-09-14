export interface ReportDateRange {
  start_date: string;
  end_date: string;
}

export interface ReportSummary {
  total_orders: number;
  total_temp: number;
  total_vat: number;
  total_with_tax: number;
  max_total_day: number;
  max_total_date: string;
}

export interface DailyBreakdown {
  [date: string]: number;
}

export interface OrderReportData {
  date_range: ReportDateRange;
  summary: ReportSummary;
  daily_breakdown: DailyBreakdown;
}

export interface OrderReportResponse {
  status: string;
  message: string;
  data: OrderReportData;
}

export interface ReportFilters {
  startDate: Date;
  endDate: Date;
}
