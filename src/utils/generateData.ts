import { DataRecord } from '../types';

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Christopher', 'Karen', 'Charles', 'Lisa', 'Daniel', 'Nancy',
  'Alexander', 'Sofia', 'Lucas', 'Emma', 'Hugo', 'Olivia', 'Mateo', 'Aria',
  'Yuki', 'Sakura', 'Wei', 'Mei', 'Raj', 'Priya', 'Omar', 'Fatima',
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Müller', 'Schmidt', 'Schneider', 'Tanaka', 'Watanabe', 'Patel', 'Kumar',
];

const DEPARTMENTS = [
  'Engineering', 'Marketing', 'Sales', 'Human Resources', 'Finance',
  'Operations', 'Product', 'Design', 'Legal', 'Customer Success',
];

const STATUSES = ['Active', 'Inactive', 'On Leave', 'Probation', 'Contract'];

const COUNTRIES = [
  'United States', 'United Kingdom', 'Germany', 'Japan', 'India',
  'Brazil', 'Canada', 'Australia', 'France', 'South Korea',
  'Singapore', 'Netherlands', 'Sweden', 'Israel', 'Ireland',
];

const ROLES = [
  'Junior', 'Mid-Level', 'Senior', 'Staff', 'Lead', 'Principal', 'Manager', 'Director',
];

const OFFICES = [
  'New York', 'San Francisco', 'London', 'Tokyo', 'Mumbai',
  'São Paulo', 'Toronto', 'Sydney', 'Paris', 'Seoul',
  'Singapore', 'Amsterdam', 'Stockholm', 'Tel Aviv', 'Dublin',
  'Berlin', 'Remote',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function randomDate(start: Date, end: Date, rand: () => number): string {
  const time = start.getTime() + rand() * (end.getTime() - start.getTime());
  return new Date(time).toISOString().split('T')[0];
}

export function generateSampleData(count: number, seed = 42): DataRecord[] {
  const rand = seededRandom(seed);
  const data: DataRecord[] = [];
  const startDate = new Date('2019-01-01');
  const endDate = new Date('2025-12-31');

  for (let i = 0; i < count; i++) {
    const firstName = pick(FIRST_NAMES, rand);
    const lastName = pick(LAST_NAMES, rand);

    const baseSalary = 45000 + rand() * 155000;
    const salary = Math.round(baseSalary / 1000) * 1000;

    data.push({
      id: i + 1,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(rand() * 100)}@company.com`,
      department: pick(DEPARTMENTS, rand),
      status: pick(STATUSES, rand),
      country: pick(COUNTRIES, rand),
      role: pick(ROLES, rand),
      office: pick(OFFICES, rand),
      salary,
      performance: Math.ceil(rand() * 5),
      joinDate: randomDate(startDate, endDate, rand),
      projects: Math.ceil(rand() * 15),
    });
  }

  return data;
}
