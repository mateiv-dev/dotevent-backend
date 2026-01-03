import { FavoriteEventModel } from '../models/FavoriteEvent';
import { RegistrationModel } from '../models/Registration';
import { NotificationModel } from '../models/Notification';
import { NotificationType } from '../types/NotificationType';
import { EventDocument } from '@models/Event';

const runReminderCheck = async () => {
  try {
    const limitDate = new Date();
    limitDate.setHours(limitDate.getHours() + 24);
    const now = new Date();

    const favorites = await FavoriteEventModel.find({ reminderSent: false }).populate('event');

    for (const fav of favorites) {
      const event = fav.event as unknown as EventDocument;

      if (!event) continue;

      const eventStart = new Date(event.date);
      
      if (event.time) {
        const [hours, minutes] = event.time.split(':');
        eventStart.setHours(parseInt(hours!), parseInt(minutes!), 0);
      }

      if (eventStart <= limitDate && eventStart > now) {
        await NotificationModel.create({
          user: fav.user,
          relatedEvent: event._id,
          title: "Favorite Event",
          message: `Reminder: Your favorite event '${event.title}' starts in 24 hours!`,
          type: NotificationType.EVENT_REMINDER
        });

        fav.reminderSent = true;
        await fav.save();
      }
    }

    const registrations = await RegistrationModel.find({ reminderSent: false }).populate('event');

    for (const reg of registrations) {
      const event = reg.event as unknown as EventDocument;

      if (!event) continue;

      const eventStart = new Date(event.date);
      if (event.time) {
        const [hours, minutes] = event.time.split(':');
        eventStart.setHours(parseInt(hours!), parseInt(minutes!), 0);
      }

      if (eventStart <= limitDate && eventStart > now) {
        await NotificationModel.create({
          user: reg.user,
          relatedEvent: event._id,
          title: "Event Reminder",
          message: `Don't forget! You have a ticket for '${event.title}' tomorrow.`,
          type: NotificationType.EVENT_REMINDER
        });

        reg.reminderSent = true;
        await reg.save();
      }
    }
  }
  catch (error) {
    console.error(error);
  }
};

export const startReminderSystem = (checkIntervalMs: number) => {
  setInterval(runReminderCheck, checkIntervalMs);
};
