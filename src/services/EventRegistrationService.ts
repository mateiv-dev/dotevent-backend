import { EventModel } from '@models/Event';
import {
  PopulatedRegistrationDocument,
  RegistrationModel,
} from '@models/Registration';
import { AppError } from '@utils/AppError';
import EventService, { EVENT_POPULATE_OPTIONS } from './EventService';
import UserService from './UserService';

const REGISTRATION_POPULATE_CONFIG = [
  {
    path: 'user',
    select: '-_id name email',
  },
  {
    path: 'event',
    populate: EVENT_POPULATE_OPTIONS,
  },
];

class EventRegistrationService {
  async registerParticipant(
    userId: string,
    eventId: string,
  ): Promise<PopulatedRegistrationDocument> {
    const user = await UserService.userExists(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const event = await EventService.getEvent(eventId);

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    if (event.author === userId) {
      throw new AppError('You cannot register for your own event.', 409);
    }

    const registration = await RegistrationModel.findOne({
      user: userId,
      event: eventId,
    });

    if (registration) {
      throw new AppError('The user is already registered for this event.', 409);
    }

    const newRegistration = await RegistrationModel.create({
      user: userId,
      event: eventId,
    });

    const updatedEvent = await EventModel.findByIdAndUpdate(
      eventId,
      { $inc: { attendees: 1 } },
      { new: true },
    );

    if (!updatedEvent) {
      throw new AppError('Event not found during attendance update.', 404);
    }

    await newRegistration.populate(REGISTRATION_POPULATE_CONFIG);

    return newRegistration as unknown as PopulatedRegistrationDocument;
  }

  async unregisterParticipant(userId: string, eventId: string): Promise<void> {
    const result = await RegistrationModel.findOneAndDelete({
      user: userId,
      event: eventId,
    });

    if (!result) {
      throw new AppError('The user is not registered for this event.', 404);
    }

    const updatedEvent = await EventModel.findByIdAndUpdate(
      eventId,
      { $inc: { attendees: -1 } },
      { new: true },
    );

    if (!updatedEvent) {
      throw new AppError('Event not found during attendance update.', 404);
    }
  }

  async getUserRegistrations(
    userId: string,
  ): Promise<PopulatedRegistrationDocument[]> {
    const registrations = await RegistrationModel.find({ user: userId })
      .populate(REGISTRATION_POPULATE_CONFIG)
      .lean()
      .exec();

    return registrations.filter(
      (reg) => reg.event !== null,
    ) as unknown as PopulatedRegistrationDocument[];
  }

  async getRegistration(
    userId: string,
    eventId: string,
  ): Promise<PopulatedRegistrationDocument | null> {
    const registration = await RegistrationModel.findOne({
      user: userId,
      event: eventId,
    })
      .populate(REGISTRATION_POPULATE_CONFIG)
      .lean()
      .exec();

    if (!registration) {
      throw new AppError('Registration not found.', 400);
    }

    return registration as unknown as PopulatedRegistrationDocument;
  }
}

export default new EventRegistrationService();
