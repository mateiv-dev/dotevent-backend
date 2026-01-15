import { UserDocument } from '@models/User';
import { EventCategory } from 'types/EventCategory';

export interface CreateUserDto {
  firebaseId: string;
  name: string;
  email: string;

  receiveEventUpdatedNotifications?: boolean;
  receiveEventReminderNotifications?: boolean;
  receiveEventUpdatedEmails?: boolean;
  receiveEventReminderEmails?: boolean;

  preferredEventCategories: EventCategory[];
  preferredOrganizers: string[];
}

export interface UpdateUserDto {
  name?: string;
  university?: string;
  // represents?: string;
  // organizationName?: string;

  receiveEventUpdatedNotifications?: boolean;
  receiveEventReminderNotifications?: boolean;
  receiveEventUpdatedEmails?: boolean;
  receiveEventReminderEmails?: boolean;

  preferredEventCategories?: EventCategory[];
  preferredOrganizers?: string[];
}

interface Settings {
  eventUpdates: boolean;
  eventReminders: boolean;
}

interface Preferences {
  notifications: Settings;
  emails: Settings;
  eventCategories: EventCategory[];
  organizers: string[];
}

export class ResponseUserDto {
  public _id: string;
  public name: string;
  public email: string;
  public role: string;
  public university: string | null;
  public represents: string | null;
  public organizationName: string | null;
  public preferences: Preferences;
  public createdAt: Date;

  constructor(user: UserDocument) {
    this._id = user._id;
    this.name = user.name;
    this.email = user.email;
    this.role = user.role;

    this.university = user.university ?? null;
    this.represents = user.represents ?? null;
    this.organizationName = user.organizationName ?? null;

    this.preferences = {
      notifications: {
        eventUpdates:
          (user.preferences?.notifications
            ?.eventUpdated as unknown as boolean) ?? true,
        eventReminders:
          (user.preferences?.notifications
            ?.eventReminder as unknown as boolean) ?? true,
      },

      emails: {
        eventUpdates: user.preferences?.notifications?.eventUpdated ?? true,
        eventReminders: user.preferences?.emails?.eventReminder ?? true,
      },

      eventCategories: user.preferences?.eventCategories ?? [],
      organizers: user.preferences?.organizers ?? [],
    };

    this.createdAt = user.createdAt;
  }

  static from(user: UserDocument | null): ResponseUserDto | null {
    if (!user) {
      return null;
    }
    return new ResponseUserDto(user);
  }

  static fromArray(users: UserDocument[]): ResponseUserDto[] {
    if (!users) {
      return [];
    }

    return users.map((user) => new ResponseUserDto(user));
  }
}
