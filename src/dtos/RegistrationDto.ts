import { PopulatedRegistrationDocument } from '@models/Registration';
import { ResponseEventDto } from './EventDto';

export interface ResponseRegistrationUserDto {
  name: string;
  email: string;
}

export class ResponseRegistrationDto {
  public id: string;
  public user: ResponseRegistrationUserDto;
  public event: ResponseEventDto;
  public hasCheckedIn: boolean;
  public ticketCode: string;
  public registeredAt: Date;

  constructor(registration: PopulatedRegistrationDocument) {
    const userData: ResponseRegistrationUserDto = {
      name: registration.user.name,
      email: registration.user.email,
    };

    const eventData: ResponseEventDto = new ResponseEventDto(
      registration.event,
    );

    this.id = registration._id.toString();
    this.user = userData;
    this.event = eventData;
    this.hasCheckedIn = registration.hasCheckedIn as boolean;
    this.ticketCode = registration.ticketCode as string;
    this.registeredAt = registration.createdAt as Date;
  }

  static from(
    registration: PopulatedRegistrationDocument,
  ): ResponseRegistrationDto | null {
    if (!registration) {
      return null;
    }

    return new ResponseRegistrationDto(registration);
  }

  static fromArray(
    registrations: PopulatedRegistrationDocument[],
  ): ResponseRegistrationDto[] | null {
    if (!registrations) {
      return null;
    }

    return registrations.map((reg) => new ResponseRegistrationDto(reg));
  }
}
