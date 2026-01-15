import firebase from '@config/firebase';
import { CreateUserDto, UpdateUserDto } from '@dtos/UserDto';
import { UserDocument, UserModel } from '@models/User';
import { AppError } from '@utils/AppError';
import { UNIVERSITY_DOMAINS } from '@utils/universities';
import { Role } from 'types/Role';

const studentDomainRegex = /^[a-zA-Z0-9._%+-]+@student\.([a-zA-Z0-9-]+)\.ro$/;

class UserService {
  async getUsers(): Promise<UserDocument[]> {
    return await UserModel.find().lean().exec();
  }

  async getUser(id: string): Promise<UserDocument | null> {
    const user = await UserModel.findById(id).exec();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await firebase.auth().setCustomUserClaims(id, { role: user.role });

    return user;
  }

  async userExists(id: string): Promise<boolean> {
    const user = await UserModel.findById(id).select('_id').lean().exec();

    if (user) {
      return true;
    }

    return false;
  }

  async createUser(
    userData: CreateUserDto,
    adminKey?: string,
  ): Promise<UserDocument> {
    const { firebaseId } = userData;
    let roleToAssign = Role.SIMPLE_USER;
    let universityNameResult: string | undefined = undefined;

    const emailExists = await UserModel.findOne({ email: userData.email })
      .select('_id')
      .lean()
      .exec();

    if (emailExists) {
      throw new AppError('This email is already in use.', 409);
    }

    if (adminKey) {
      if (adminKey.trim() !== process.env.ADMIN_KEY) {
        throw new AppError('Incorrect admin secret key', 403);
      }
      roleToAssign = Role.ADMIN;
    }

    const match = userData.email.toLowerCase().match(studentDomainRegex);

    if (roleToAssign !== Role.ADMIN && match) {
      const domainKey = match[1];
      if (domainKey) {
        roleToAssign = Role.STUDENT;
        const mappedUniversity = UNIVERSITY_DOMAINS[domainKey];
        universityNameResult = mappedUniversity || domainKey.toUpperCase();
      }
    }

    const newUser = new UserModel({
      _id: firebaseId,
      email: userData.email.toLowerCase(),
      name: userData.name,
      role: roleToAssign,
      university: universityNameResult,
      preferences: {
        notifications: {
          eventUpdated: userData.receiveEventUpdatedNotifications,
          eventReminder: userData.receiveEventReminderNotifications,
        },

        emails: {
          eventUpdated: userData.receiveEventUpdatedEmails,
          eventReminder: userData.receiveEventReminderEmails,
        },

        eventCategories: userData.preferredEventCategories,
        organizers: userData.preferredOrganizers,
      },
    });

    await newUser.save();

    try {
      await firebase
        .auth()
        .setCustomUserClaims(firebaseId, { role: roleToAssign });
    } catch (firebaseError) {
      await UserModel.findByIdAndDelete(firebaseId);
      console.error('Firebase Claims Error:', firebaseError);
      throw new AppError('Failed to set user claims on Firebase.', 500);
    }

    return newUser;
  }

  async deleteUser(id: string): Promise<UserDocument | null> {
    const user = await UserModel.findByIdAndDelete(id).lean().exec();

    if (!user) {
      throw new AppError('User not found', 404);
    }

    await firebase.auth().deleteUser(id);

    return user;
  }

  async updateUser(id: string, incomingData: UpdateUserDto) {
    if (!incomingData) {
      throw new AppError('Invalid input data', 400);
    }

    const user = await UserModel.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (incomingData.name !== undefined) {
      user.name = incomingData.name;
    }

    switch (user.role) {
      case Role.STUDENT:
        if (incomingData.university !== undefined)
          user.university = incomingData.university;
        break;
      case Role.STUDENT_REP:
        if (incomingData.university !== undefined)
          user.university = incomingData.university;
        if (incomingData.represents !== undefined)
          user.represents = incomingData.represents;
        break;
      case Role.ORGANIZER:
        if (incomingData.organizationName !== undefined)
          user.organizationName = incomingData.organizationName;
        break;
    }

    if (user.preferences) {
      const prefs = user.preferences;

      if (prefs.notifications) {
        if (incomingData.receiveEventUpdatedNotifications !== undefined) {
          (prefs.notifications.eventUpdated as any) =
            incomingData.receiveEventUpdatedNotifications;
        }
        if (incomingData.receiveEventReminderNotifications !== undefined) {
          (prefs.notifications.eventReminder as any) =
            incomingData.receiveEventReminderNotifications;
        }
      }

      if (prefs.emails) {
        if (incomingData.receiveEventUpdatedEmails !== undefined) {
          (prefs.emails.eventUpdated as any) =
            incomingData.receiveEventUpdatedEmails;
        }
        if (incomingData.receiveEventReminderEmails !== undefined) {
          (prefs.emails.eventReminder as any) =
            incomingData.receiveEventReminderEmails;
        }
      }

      if (incomingData.preferredEventCategories !== undefined) {
        user.preferences.eventCategories =
          incomingData.preferredEventCategories;
      }
      if (incomingData.preferredOrganizers !== undefined) {
        user.preferences.organizers = incomingData.preferredOrganizers;
      }
    }

    return await user.save();
  }

  async syncEmail(id: string, newEmail: string): Promise<UserDocument> {
    const user = await UserModel.findById(id);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.email === newEmail) {
      return user;
    }

    user.email = newEmail;

    return user.save();
  }

  async getAvailableOrganizers() {
    const organizers = await UserModel.find({
      role: { $in: [Role.ORGANIZER, Role.STUDENT_REP] },
    })
      .select('organizationName represents')
      .lean()
      .exec();

    const distinctNames = organizers
      .map((user) => {
        const displayName = user.organizationName || user.represents;
        return displayName;
      })
      .filter((name): name is string => !!name);

    const uniqueNames = [...new Set(distinctNames)];

    return uniqueNames.sort((a, b) => a.localeCompare(b, 'ro'));
  }
}

export default new UserService();
