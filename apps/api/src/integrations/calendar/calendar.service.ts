import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { google } from 'googleapis';

type CreateConsultationEventInput = {
  doctorEmail: string;
  doctorName: string;
  patientEmail: string;
  patientName: string;
  startsAt: Date;
  endsAt: Date;
  summary: string;
  description: string;
};

export type CalendarEventResult = {
  eventId: string;
  htmlLink?: string;
  meetLink?: string;
};

@Injectable()
export class CalendarService {
  private readonly logger = new Logger(CalendarService.name);

  constructor(private readonly configService: ConfigService) {}

  async createConsultationEvent(
    input: CreateConsultationEventInput,
  ): Promise<CalendarEventResult> {
    if (!this.isConfigured()) {
      this.logger.warn(
        'Google Calendar is not configured. Returning mock consultation links for local development.',
      );
      return buildMockCalendarResult();
    }

    try {
      const auth = new google.auth.OAuth2(
        this.configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
        this.configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
        this.configService.getOrThrow<string>('GOOGLE_REDIRECT_URI'),
      );

      auth.setCredentials({
        refresh_token:
          this.configService.getOrThrow<string>('GOOGLE_REFRESH_TOKEN'),
      });

      const calendar = google.calendar({ version: 'v3', auth });
      const calendarId =
        this.configService.get<string>('GOOGLE_CALENDAR_ID') ?? 'primary';

      const event = await calendar.events.insert({
        calendarId,
        conferenceDataVersion: 1,
        sendUpdates: 'all',
        requestBody: {
          summary: input.summary,
          description: input.description,
          start: {
            dateTime: input.startsAt.toISOString(),
            timeZone: 'Asia/Manila',
          },
          end: {
            dateTime: input.endsAt.toISOString(),
            timeZone: 'Asia/Manila',
          },
          attendees: [
            {
              email: input.patientEmail,
              displayName: input.patientName,
            },
            {
              email: input.doctorEmail,
              displayName: input.doctorName,
            },
          ],
          conferenceData: {
            createRequest: {
              requestId: randomUUID(),
              conferenceSolutionKey: {
                type: 'hangoutsMeet',
              },
            },
          },
        },
      });

      return {
        eventId: event.data.id ?? randomUUID(),
        htmlLink: event.data.htmlLink ?? undefined,
        meetLink:
          event.data.hangoutLink ??
          event.data.conferenceData?.entryPoints?.find(
            (entryPoint) => entryPoint.entryPointType === 'video',
          )?.uri ??
          undefined,
      };
    } catch (error) {
      this.logger.error('Failed to create Google Calendar consultation event.', error);
      throw new InternalServerErrorException(
        'Google Calendar booking failed. Please try again.',
      );
    }
  }

  private isConfigured(): boolean {
    return Boolean(
      this.configService.get<string>('GOOGLE_CLIENT_ID') &&
        this.configService.get<string>('GOOGLE_CLIENT_SECRET') &&
        this.configService.get<string>('GOOGLE_REDIRECT_URI') &&
        this.configService.get<string>('GOOGLE_REFRESH_TOKEN'),
    );
  }
}

function buildMockCalendarResult(): CalendarEventResult {
  const token = randomUUID().replace(/-/g, '').slice(0, 10);
  return {
    eventId: `mock-${token}`,
    htmlLink: `https://calendar.google.com/calendar/u/0/r`,
    meetLink: `https://meet.google.com/${token.slice(0, 3)}-${token.slice(3, 7)}-${token.slice(7, 10)}`,
  };
}
