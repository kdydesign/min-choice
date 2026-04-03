const CHILD_NAME_ALLOWED_PATTERN = /^[\p{L}\p{N}\p{P}\p{S}\s]+$/u;

function getLocalToday(referenceDate: Date = new Date()) {
  return new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
}

function padDateSegment(value: number) {
  return String(value).padStart(2, "0");
}

function formatDateInput(date: Date) {
  return `${date.getFullYear()}-${padDateSegment(date.getMonth() + 1)}-${padDateSegment(date.getDate())}`;
}

function parseDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function getLastDayOfMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function isValidChildName(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return false;
  }

  return CHILD_NAME_ALLOWED_PATTERN.test(trimmedValue);
}

export function isValidAgeMonthsInput(value: string) {
  return /^\d+$/.test(value.trim());
}

export function getDefaultBirthDate(referenceDate: Date = new Date()) {
  return formatDateInput(getLocalToday(referenceDate));
}

export function deriveBirthDateFromAgeMonths(ageMonths: number, referenceDate: Date = new Date()) {
  if (!Number.isInteger(ageMonths) || ageMonths < 0) {
    return "";
  }

  const today = getLocalToday(referenceDate);
  const totalMonths = today.getFullYear() * 12 + today.getMonth() - ageMonths;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonthIndex = ((totalMonths % 12) + 12) % 12;
  const targetDay = Math.min(today.getDate(), getLastDayOfMonth(targetYear, targetMonthIndex));

  return formatDateInput(new Date(targetYear, targetMonthIndex, targetDay));
}

export function deriveAgeMonthsFromBirthDate(value: string, referenceDate: Date = new Date()) {
  const birthDate = parseDateInput(value);

  if (!birthDate) {
    return null;
  }

  const today = getLocalToday(referenceDate);

  if (birthDate.getTime() > today.getTime()) {
    return null;
  }

  const diff =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    (today.getMonth() - birthDate.getMonth());

  return Math.max(0, diff);
}

export function isFutureBirthDate(value: string, referenceDate: Date = new Date()) {
  const birthDate = parseDateInput(value);

  if (!birthDate) {
    return false;
  }

  return birthDate.getTime() > getLocalToday(referenceDate).getTime();
}
