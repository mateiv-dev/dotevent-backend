import { EventDocument } from "@models/Event";
import { FavoriteEventModel } from "@models/FavoriteEvent";

class FavoriteEventService {

  async markFavorite(userId: string, eventId: string): Promise<EventDocument> {
    const existing = await FavoriteEventModel.findOne({ user: userId, event: eventId })
      .populate('event');
    
    if (existing) {
      return existing.event as unknown as EventDocument;
    }

    const newFavorite = await FavoriteEventModel.create({
      user: userId,
      event: eventId
    });

    const populatedFavorite = await newFavorite.populate('event');

    return populatedFavorite.event as unknown as EventDocument;
  }

  async unmarkFavorite(userId: string, eventId: string): Promise<void> {
    await FavoriteEventModel.deleteOne({ user: userId, event: eventId });
  }
}

export default new FavoriteEventService();
