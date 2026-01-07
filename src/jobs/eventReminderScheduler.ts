import { EventDocument } from '@models/Event';
import NotificationService from '@services/NotificationService';
import { CreateNotification } from 'types/CreateNotification';
import { FavoriteEventModel } from '../models/FavoriteEvent';
import { RegistrationModel } from '../models/Registration';
import { NotificationType } from '../types/NotificationType';

const runReminderCheck = async () => {
  try {
    const limitDate = new Date();
    limitDate.setHours(limitDate.getHours() + 24);
    const now = new Date();

    const registrations = await RegistrationModel.find({
      reminderSent: false,
    })
      .populate('event', '_id title')
      .exec();

    for (const reg of registrations) {
      const event = reg.event as unknown as EventDocument;

      if (!event) continue;

      const eventStart = new Date(event.date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':');
        eventStart.setHours(parseInt(hours!), parseInt(minutes!), 0, 0);
      }

      if (eventStart <= limitDate && eventStart > now) {
        const notification: CreateNotification = {
          user: reg.user as string,
          relatedEvent: event._id.toString(),
          title: 'Event Reminder',
          message: `Don't forget! You have a ticket for '${event.title}' tomorrow.`,
          type: NotificationType.EVENT_REMINDER,
        };

        await NotificationService.createNotification(notification);

        reg.reminderSent = true;
        await reg.save();
      }
    }

    const favorites = await FavoriteEventModel.find({
      reminderSent: false,
    })
      .populate('event')
      .exec();

    for (const fav of favorites) {
      const event = fav.event as unknown as EventDocument;

      if (!event) continue;

      const eventStart = new Date(event.date);

      if (event.time) {
        const [hours, minutes] = event.time.split(':');
        eventStart.setHours(parseInt(hours!), parseInt(minutes!), 0);
      }

      if (eventStart <= limitDate && eventStart > now) {
        const hasTicket = await RegistrationModel.exists({
          user: fav.user,
          event: event._id,
        });

        if (hasTicket) {
          fav.reminderSent = true;
          await fav.save();
          continue;
        }

        const notification: CreateNotification = {
          user: fav.user as string,
          relatedEvent: event._id.toString(),
          title: 'Favorite Event',
          message: `Reminder: Your favorite event '${event.title}' starts in 24 hours!`,
          type: NotificationType.EVENT_REMINDER,
        };

        await NotificationService.createNotification(notification);

        fav.reminderSent = true;
        await fav.save();
      }
    }
  } catch (error) {
    console.error(error);
  }
};

export const startReminderSystem = (checkIntervalMs: number) => {
  setInterval(runReminderCheck, checkIntervalMs);
};
