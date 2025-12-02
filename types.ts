export enum ProspectStatus {
  TO_CONTACT = 'TO_CONTACT',
  NOT_INTERESTED = 'NOT_INTERESTED',
  CALL_LATER = 'CALL_LATER',
  MEETING_SET = 'MEETING_SET'
}

export interface Prospect {
  id?: string;
  name: string;
  phone: string;
  email: string;
  activity: string;
  city: string;
  lat?: number;
  lon?: number;
  status: ProspectStatus;
  notes: string;
  createdAt: number;
}

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  [ProspectStatus.TO_CONTACT]: '🔴 À contacter',
  [ProspectStatus.NOT_INTERESTED]: '🟠 Pas intéressé',
  [ProspectStatus.CALL_LATER]: '🟡 Rappeler + tard',
  [ProspectStatus.MEETING_SET]: '🟢 RDV pris',
};

export const STATUS_COLORS: Record<ProspectStatus, string> = {
  [ProspectStatus.TO_CONTACT]: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
  [ProspectStatus.NOT_INTERESTED]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  [ProspectStatus.CALL_LATER]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  [ProspectStatus.MEETING_SET]: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
};