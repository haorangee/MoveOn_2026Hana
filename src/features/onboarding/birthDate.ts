export type BirthDateParts = {
  year: string;
  month: string;
  day: string;
};

const MIN_AGE = 8;
const MAX_AGE = 99;

function padTwoDigits(value: number) {
  return value.toString().padStart(2, '0');
}

export function calculateAge(birthDate: string, now = new Date()) {
  const [year, month, day] = birthDate.split('-').map(Number);
  let age = now.getFullYear() - year;
  const birthdayHasPassed = now.getMonth() + 1 > month
    || (now.getMonth() + 1 === month && now.getDate() >= day);

  if (!birthdayHasPassed) age -= 1;
  return age;
}

export function createBirthDate(
  yearValue: string,
  monthValue: string,
  dayValue: string,
  now = new Date(),
) {
  if (!/^\d{4}$/.test(yearValue) || !/^\d{1,2}$/.test(monthValue) || !/^\d{1,2}$/.test(dayValue)) {
    return null;
  }

  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }

  const birthDate = `${year}-${padTwoDigits(month)}-${padTwoDigits(day)}`;
  const age = calculateAge(birthDate, now);
  if (age < MIN_AGE || age > MAX_AGE) return null;

  return birthDate;
}

export function birthDateFromAge(age: number, now = new Date()) {
  const safeAge = Math.min(MAX_AGE, Math.max(MIN_AGE, Math.floor(age)));
  return `${now.getFullYear() - safeAge}-${padTwoDigits(now.getMonth() + 1)}-${padTwoDigits(now.getDate())}`;
}

export function resolveBirthDate(value: unknown, fallbackAge: number) {
  if (typeof value === 'string') {
    const [year = '', month = '', day = ''] = value.split('-');
    const birthDate = createBirthDate(year, month, day);
    if (birthDate) return birthDate;
  }

  return birthDateFromAge(fallbackAge);
}

export function getBirthDateParts(birthDate: string): BirthDateParts {
  const [year = '', month = '', day = ''] = birthDate.split('-');
  return { year, month, day };
}
