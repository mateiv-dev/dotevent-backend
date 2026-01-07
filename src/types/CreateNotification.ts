import { NotificationType } from 'types/NotificationType';

export interface CreateNotification {
  user: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedEvent?: string;
  relatedRequest?: string;
}
