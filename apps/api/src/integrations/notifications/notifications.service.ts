import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { Model } from 'mongoose';
import { Doctor } from '../../doctors/schemas/doctor.schema';
import { Patient } from '../../patients/schemas/patient.schema';
import {
  AppNotification,
  AppNotificationRecipientRole,
  AppNotificationType,
} from './schemas/app-notification.schema';

type CreateNotificationInput = {
  recipientRole: AppNotificationRecipientRole;
  recipientId: string;
  type: AppNotificationType;
  title: string;
  message: string;
  href?: string;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(AppNotification.name)
    private readonly notificationModel: Model<AppNotification>,
    @InjectModel(Patient.name) private readonly patientModel: Model<Patient>,
    @InjectModel(Doctor.name) private readonly doctorModel: Model<Doctor>,
  ) {}

  create(input: CreateNotificationInput): Promise<AppNotification> {
    return this.notificationModel.create({
      ...input,
      read: false,
    });
  }

  createForPatient(
    patientId: string,
    input: Omit<CreateNotificationInput, 'recipientRole' | 'recipientId'>,
  ): Promise<AppNotification> {
    return this.create({
      ...input,
      recipientRole: 'patient',
      recipientId: patientId,
    });
  }

  createForDoctor(
    doctorApplicationId: string,
    input: Omit<CreateNotificationInput, 'recipientRole' | 'recipientId'>,
  ): Promise<AppNotification> {
    return this.create({
      ...input,
      recipientRole: 'doctor',
      recipientId: doctorApplicationId,
    });
  }

  async listMine(user: DecodedIdToken): Promise<AppNotification[]> {
    const recipients = await this.getNotificationRecipients(user);

    if (recipients.length === 0) {
      return [];
    }

    return this.notificationModel
      .find({
        $or: recipients.map((recipient) => ({
          recipientRole: recipient.role,
          recipientId: recipient.id,
        })),
      })
      .sort({ createdAt: -1 })
      .limit(40)
      .exec();
  }

  async markMineAsRead(
    user: DecodedIdToken,
    notificationId: string,
  ): Promise<AppNotification> {
    const recipients = await this.getNotificationRecipients(user);
    const notification = await this.notificationModel.findById(notificationId).exec();

    if (!notification) {
      throw new NotFoundException('Notification not found.');
    }

    const hasAccess = recipients.some(
      (recipient) =>
        recipient.role === notification.recipientRole &&
        recipient.id === notification.recipientId,
    );

    if (!hasAccess) {
      throw new ForbiddenException('You cannot update this notification.');
    }

    const updated = await this.notificationModel
      .findByIdAndUpdate(notificationId, { $set: { read: true } }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Notification not found.');
    }

    return updated;
  }

  private async getNotificationRecipients(
    user: DecodedIdToken,
  ): Promise<Array<{ role: AppNotificationRecipientRole; id: string }>> {
    const email =
      typeof user.email === 'string' ? user.email.trim().toLowerCase() : '';
    const [patient, doctor] = await Promise.all([
      this.patientModel.findOne({ firebaseUid: user.uid }).select(['_id']).exec(),
      this.doctorModel
        .findOne({
          $or: [{ firebaseUid: user.uid }, { professionalEmail: email }],
          applicationStatus: 'approved',
        })
        .select(['_id'])
        .exec(),
    ]);

    return [
      ...(patient ? [{ role: 'patient' as const, id: String(patient._id) }] : []),
      ...(doctor ? [{ role: 'doctor' as const, id: String(doctor._id) }] : []),
    ];
  }
}
