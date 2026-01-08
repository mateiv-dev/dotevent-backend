import { EventDocument } from '@models/Event';
import { FavoriteEventModel } from '@models/FavoriteEvent';
import { RegistrationModel } from '@models/Registration';
import NotificationService from '@services/NotificationService';
import { INotification } from 'types/INotification';
import { NotificationType } from 'types/NotificationType';

const getEventStartDate = (event: EventDocument): Date => {
  const eventStart = new Date(event.date);
  if (event.time) {
    const [hours, minutes] = event.time.split(':');
    eventStart.setHours(parseInt(hours!), parseInt(minutes!), 0, 0);
  } else {
    eventStart.setHours(0, 0, 0, 0);
  }
  return eventStart;
};

const runReminderCheck = async (hoursAhead: number) => {
  try {
    const now = new Date();
    const limitDate = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const registrations = await RegistrationModel.find({ reminderSent: false })
      .populate('event', '_id title date time')
      .exec();

    for (const reg of registrations) {
      try {
        if (!reg.event) {
          reg.reminderSent = true;
          await reg.save();
          continue;
        }

        const event = reg.event as unknown as EventDocument;
        const eventStart = getEventStartDate(event);

        if (eventStart < now) {
          reg.reminderSent = true;
          await reg.save();
          continue;
        }

        if (eventStart <= limitDate) {
          const notification: INotification = {
            user: reg.user as string,
            relatedEvent: event._id.toString(),
            title: event.title,
            // message: `Don't forget! You have a ticket for '${event.title}' starting soon.`,
            type: NotificationType.REGISTERED_EVENT_REMINDER,
          };

          await NotificationService.createNotification(notification);

          reg.reminderSent = true;
          await reg.save();
        }
      } catch (err) {
        console.error(
          `[Error] Failed to process registration ${reg._id}:`,
          err,
        );
      }
    }

    const favorites = await FavoriteEventModel.find({ reminderSent: false })
      .populate('event', '_id title date time')
      .exec();

    for (const fav of favorites) {
      try {
        if (!fav.event) {
          fav.reminderSent = true;
          await fav.save();
          continue;
        }

        const event = fav.event as unknown as EventDocument;
        const eventStart = getEventStartDate(event);

        if (eventStart < now) {
          fav.reminderSent = true;
          await fav.save();
          continue;
        }

        if (eventStart <= limitDate) {
          const hasTicket = await RegistrationModel.exists({
            user: fav.user,
            event: event._id,
          });

          if (hasTicket) {
            fav.reminderSent = true;
            await fav.save();
            continue;
          }

          const notification: INotification = {
            user: fav.user as string,
            relatedEvent: event._id.toString(),
            title: event.title,
            // message: `Reminder: Your favorite event '${event.title}' starts in ${hoursAhead} hours!`,
            type: NotificationType.FAVORITE_EVENT_REMINDER,
          };

          await NotificationService.createNotification(notification);

          fav.reminderSent = true;
          await fav.save();
        }
      } catch (err) {
        console.error(`[Error] Failed to process favorite ${fav._id}:`, err);
      }
    }
  } catch (error) {
    console.error('[Critical Reminder System Error]:', error);
  }
};

export const startReminderSystem = (
  checkIntervalMs: number,
  hoursAhead: number = 24,
) => {
  setInterval(() => runReminderCheck(hoursAhead), checkIntervalMs);
};
