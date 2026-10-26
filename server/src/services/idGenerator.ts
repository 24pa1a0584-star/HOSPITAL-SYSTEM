import { getNextSequence } from '../models/Counter';

export async function generateDoctorId(): Promise<string> {
  const seq = await getNextSequence('doctor_id');
  const padded = seq.toString().padStart(6, '0');
  return `CARE-DOC-${padded}`;
}

export async function generateAppointmentReference(): Promise<string> {
  const year = new Date().getFullYear();
  const seq = await getNextSequence(`apt_${year}`);
  const padded = seq.toString().padStart(6, '0');
  return `CARE-APT-${year}-${padded}`;
}

export async function generateQueueNumber(doctorId: string, dateString: string): Promise<number> {
  const counterKey = `queue_${doctorId}_${dateString}`;
  return await getNextSequence(counterKey);
}
