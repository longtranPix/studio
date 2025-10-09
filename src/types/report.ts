export interface ReportDateRange {
  start_date: string;
  end_date: string;
}

export interface ReportSummary {
  total_orders: number;
  total: number;
  total_cash: number;
  total_transfer: number;
  max_total_day: number;
  max_total_date: string;
}

export interface Breakdown {
  [key: string]: number;
}

export interface OrderReportData {
  date_range: ReportDateRange;
  summary: ReportSummary;
  breakdown: Breakdown;
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
