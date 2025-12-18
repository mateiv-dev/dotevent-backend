import { EventModel } from "@models/Event";
import { RegistrationDocument, RegistrationModel } from "@models/Registration";
import { UserModel } from "@models/User";
import { AppError } from "@utils/AppError";

class EventRegistrationService {

  async registerParticipant(userId: string, eventId: string): Promise<RegistrationDocument> {
    const user = await UserModel.findOne({ firebaseId: userId }).select('_id role');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const event = await EventModel.findById(eventId).select('_id');

    if (!event) {
      throw new AppError('Event not found', 404);
    }

    const registration = await RegistrationModel.findOne({
      user: userId,
      event: eventId
    });

    if (registration) {
      throw new AppError('The user is already registered for this event.', 409);
    }

    const updatedEvent = await EventModel.findByIdAndUpdate(
      eventId,
      { $inc: { attendees: 1 } },
      { new: true }
    );

    if (!updatedEvent) {
      throw new AppError('Event not found during attendance update.', 404);
    }

    const newRegistration = await RegistrationModel.create({
      user: userId,
      event: eventId
    });

    return newRegistration;
  }

  async unregisterParticipant(userId: string, eventId: string): Promise<RegistrationDocument> {
    const result = await RegistrationModel.findOneAndDelete({
      user: userId,
      event: eventId
    });

    if (!result) {
      throw new AppError('The user is not registered for this event.', 404);
    }

    const updatedEvent = await EventModel.findByIdAndUpdate(
      eventId,
      { $inc: { attendees: -1 } },
      { new: true }
    );

    if (!updatedEvent) {
      throw new AppError('Event not found during attendance update.', 404);
    }

    return result;
  }

  async getUserRegistrations(userId: string) {
    const registrations = await RegistrationModel.find({ user: userId })
      .populate('event')
      .exec();

    return registrations.map(reg => ({
      ...reg.toObject(),
      event: reg.event
    }));
  }
}

export default new EventRegistrationService();
