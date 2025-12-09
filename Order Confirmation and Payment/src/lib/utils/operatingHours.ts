export type DayHours = {
  isOpen: boolean;
  openTime: string; // 24h HH:MM
  closeTime: string; // 24h HH:MM
};

export type WeeklyHours = {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
};

type DayKey = keyof WeeklyHours;

const defaultHours: WeeklyHours = {
  monday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  tuesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  wednesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  friday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
  saturday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
  sunday: { isOpen: true, openTime: '08:00', closeTime: '22:00' }
};

const specialtyDefaults = {
  burger: {
    monday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '00:00' },
    saturday: { isOpen: false, openTime: '09:00', closeTime: '00:00' },
    sunday: { isOpen: false, openTime: '09:00', closeTime: '00:00' }
  } as WeeklyHours,
  chicken: {
    monday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    tuesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    wednesday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    thursday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    friday: { isOpen: true, openTime: '09:00', closeTime: '21:00' },
    saturday: { isOpen: true, openTime: '08:00', closeTime: '22:00' },
    sunday: { isOpen: true, openTime: '08:00', closeTime: '22:00' }
  } as WeeklyHours,
  pizza: {
    monday: { isOpen: true, openTime: '12:00', closeTime: '00:00' },
    tuesday: { isOpen: true, openTime: '12:00', closeTime: '00:00' },
    wednesday: { isOpen: true, openTime: '12:00', closeTime: '00:00' },
    thursday: { isOpen: true, openTime: '12:00', closeTime: '00:00' },
    friday: { isOpen: false, openTime: '12:00', closeTime: '00:00' },
    saturday: { isOpen: true, openTime: '10:00', closeTime: '00:00' },
    sunday: { isOpen: true, openTime: '10:00', closeTime: '00:00' }
  } as WeeklyHours
};

const dayMap: Record<string, DayKey> = {
  mon: 'monday',
  monday: 'monday',
  tue: 'tuesday',
  tuesday: 'tuesday',
  wed: 'wednesday',
  wednesday: 'wednesday',
  thu: 'thursday',
  thursday: 'thursday',
  fri: 'friday',
  friday: 'friday',
  sat: 'saturday',
  saturday: 'saturday',
  sun: 'sunday',
  sunday: 'sunday'
};

const to24Hour = (time12: string): string => {
  const cleaned = time12.trim().replace(/\s+/g, ' ');
  const match = cleaned.match(/(\d{1,2}):(\d{2})\s*([AP]M)/i);
  if (!match) return '09:00';

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const ampm = match[3].toUpperCase();

  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const cloneHours = (hours: WeeklyHours): WeeklyHours => JSON.parse(JSON.stringify(hours));

const pickDefaults = (restaurantId?: string, restaurantName?: string): WeeklyHours => {
  if (restaurantId === '003' || restaurantName?.toLowerCase().includes('burger')) return cloneHours(specialtyDefaults.burger);
  if (restaurantId === '001' || restaurantName?.toLowerCase().includes('chicken')) return cloneHours(specialtyDefaults.chicken);
  if (restaurantId === '002' || restaurantName?.toLowerCase().includes('pizza')) return cloneHours(specialtyDefaults.pizza);
  return cloneHours(defaultHours);
};

export const parseOperatingHours = (operatingHoursText?: string | null, restaurantId?: string, restaurantName?: string): WeeklyHours => {
  const defaults = pickDefaults(restaurantId, restaurantName);

  if (!operatingHoursText) return defaults;

  // JSON-based storage (preferred)
  try {
    const parsed = JSON.parse(operatingHoursText);
    if (parsed && typeof parsed === 'object' && parsed.hours) {
      return { ...defaults, ...parsed.hours } as WeeklyHours;
    }
    if (parsed && typeof parsed === 'object') {
      return { ...defaults, ...parsed } as WeeklyHours;
    }
  } catch {
    // Not JSON, fall through to text parsing
  }

  const lines = operatingHoursText
    .split(/[\n,]/)
    .map(line => line.trim())
    .filter(Boolean);

  const parsedHours = { ...defaults };

  lines.forEach(line => {
    const match = line.match(/(\w+)[:\s]+(.+)/i);
    if (!match) return;

    const dayName = match[1].toLowerCase();
    const hoursText = match[2].trim();
    const dayKey = dayMap[dayName];
    if (!dayKey) return;

    if (hoursText.toLowerCase().includes('closed')) {
      parsedHours[dayKey] = { isOpen: false, openTime: '09:00', closeTime: '21:00' };
      return;
    }

    const timeMatch = hoursText.match(/(\d{1,2}:\d{2}\s*[AP]M)\s*[-–]\s*(\d{1,2}:\d{2}\s*[AP]M)/i);
    if (timeMatch) {
      const openTime = to24Hour(timeMatch[1].trim());
      const closeTime = to24Hour(timeMatch[2].trim());
      parsedHours[dayKey] = { isOpen: true, openTime, closeTime };
    }
  });

  return parsedHours;
};

export const serializeOperatingHours = (hours: WeeklyHours): string => {
  return JSON.stringify({ version: 'v1', hours });
};

export const format24hTo12h = (time24: string): string => {
  if (!time24) return '';
  const [h, m] = time24.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export const getTodayKey = (date = new Date()): DayKey => {
  const map: DayKey[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return map[date.getDay()];
};

export const isOpenNow = (hours: WeeklyHours, date = new Date()): boolean => {
  const dayKey = getTodayKey(date);
  const today = hours[dayKey];
  if (!today || !today.isOpen) return false;

  const toMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const openM = toMinutes(today.openTime);
  const closeM = toMinutes(today.closeTime);
  const nowM = date.getHours() * 60 + date.getMinutes();

  // Handle overnight (close <= open)
  if (closeM <= openM) {
    return nowM >= openM || nowM < closeM;
  }

  return nowM >= openM && nowM < closeM;
};

export const getTodayDisplayHours = (hours: WeeklyHours, date = new Date()): { isOpen: boolean; open: string; close: string } => {
  const dayKey = getTodayKey(date);
  const today = hours[dayKey];
  if (!today) return { isOpen: false, open: '', close: '' };

  return {
    isOpen: today.isOpen,
    open: format24hTo12h(today.openTime),
    close: format24hTo12h(today.closeTime)
  };
};

