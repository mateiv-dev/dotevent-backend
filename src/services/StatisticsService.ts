import { ResponseTotalStatisticsDto } from '@dtos/TotalStatisticsDto';
import { EventModel } from '@models/Event';
import { RegistrationModel } from '@models/Registration';
import { AppError } from '@utils/AppError';
import { Role } from 'types/Role';
import UserService from './UserService';

export class StatisticsService {
  async getTotalStatistics(userId: string) {
    const user = await UserService.getUser(userId);

    if (!user) {
      throw new AppError('User not found.', 404);
    }

    if (user.role !== Role.ADMIN) {
      throw new AppError('Access denied. Admin only.', 403);
    }

    const now = new Date();

    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
    );

    const currentMonthIndex = now.getMonth();
    const startYear =
      currentMonthIndex >= 9 ? now.getFullYear() : now.getFullYear() - 1;

    const startOfAcademicYear = new Date(startYear, 9, 1);
    const endOfAcademicYear = new Date(startYear + 1, 8, 30, 23, 59, 59);

    const [
      totalEvents,
      eventsLastMonthCount,
      capacityStats,
      totalRegistrations,
      monthlyStatsRaw,
      topOrgsRaw,
    ] = await Promise.all([
      EventModel.countDocuments(),

      EventModel.countDocuments({
        date: { $gte: startOfLastMonth, $lte: endOfLastMonth },
      }),

      EventModel.aggregate([
        { $group: { _id: null, totalCapacity: { $sum: '$maxCapacity' } } },
      ]),

      RegistrationModel.countDocuments(),

      EventModel.aggregate([
        {
          $match: {
            date: { $gte: startOfAcademicYear, $lte: endOfAcademicYear },
          },
        },
        {
          $group: {
            _id: { $month: '$date' },
            count: { $sum: 1 },
          },
        },
      ]),

      EventModel.aggregate([
        {
          $group: {
            _id: {
              $ifNull: [
                '$organizer.organizationName',
                '$organizer.represents',
                'Unknown Organization',
              ],
            },
            events: { $sum: 1 },
          },
        },
        { $match: { _id: { $ne: 'Unknown Organization' } } },
        { $sort: { events: -1 } },
        { $limit: 3 },
      ]),
    ]);

    const totalCapacity = capacityStats[0]?.totalCapacity || 0;
    let averageOccupancy = 0;
    if (totalCapacity > 0) {
      averageOccupancy = Math.round((totalRegistrations / totalCapacity) * 100);
    }

    const topOrganizations = topOrgsRaw.map((item: any) => ({
      name: item._id,
      events: item.events,
    }));

    const monthlyActivity = this.formatMonthlyStatsAsNumbers(monthlyStatsRaw);

    return new ResponseTotalStatisticsDto(
      totalEvents,
      eventsLastMonthCount,
      averageOccupancy,
      monthlyActivity,
      topOrganizations,
    );
  }

  formatMonthlyStatsAsNumbers = (data: any[]) => {
    const dbDataMap = new Map();
    data.forEach((item) => dbDataMap.set(item._id, item.count));

    const academicOrder = [10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8, 9];

    return academicOrder.map((monthNum) => ({
      month: monthNum,
      count: dbDataMap.get(monthNum) || 0,
    }));
  };
}

export default new StatisticsService();
