export interface MonthlyActivityDto {
  month: number;
  count: number;
}

export interface TopOrganizationDto {
  name: string;
  events: number;
}

export class ResponseTotalStatisticsDto {
  public totalEventsAllTime: number;
  public eventsLastMonth: number;
  public averageOccupancy: number;

  public monthlyActivity: MonthlyActivityDto[];
  public topOrganizations: TopOrganizationDto[];

  constructor(
    totalEventsAllTime: number,
    eventsLastMonth: number,
    averageOccupancy: number,
    monthlyActivity: MonthlyActivityDto[],
    topOrganizations: TopOrganizationDto[],
  ) {
    this.totalEventsAllTime = totalEventsAllTime;
    this.eventsLastMonth = eventsLastMonth;
    this.averageOccupancy = averageOccupancy;
    this.monthlyActivity = monthlyActivity;
    this.topOrganizations = topOrganizations;
  }
}
