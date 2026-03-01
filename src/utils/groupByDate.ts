type DateGroup<T> = {
  title: string;
  data: T[];
};

function getDateLabel(date: Date, now: Date): string {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const itemDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  if (itemDate.getTime() === todayStart.getTime()) return "Today";
  if (itemDate.getTime() === yesterdayStart.getTime()) return "Yesterday";

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const month = months[date.getMonth()];
  const day = date.getDate();

  if (date.getFullYear() === now.getFullYear()) {
    return `${month} ${day}`;
  }

  return `${month} ${day}, ${date.getFullYear()}`;
}

export function groupByDate<T>(
  items: T[],
  getDate: (item: T) => string,
): DateGroup<T>[] {
  const now = new Date();
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const date = new Date(getDate(item));
    const label = getDateLabel(date, now);
    const existing = groups.get(label);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(label, [item]);
    }
  }

  return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
}
