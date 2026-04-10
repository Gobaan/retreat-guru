// Shared registration fixtures used across unit and e2e tests.
// Dates are fixed to August 2025 to match the app's default view.

export const SINGLE_DAY = {
  id: 1,
  program: 'Morning Yoga',
  start_date: '2025-08-05',
  end_date: '2025-08-05',
  status: 'reserved',
  full_name: 'Alice Smith',
  email: 'alice@example.com',
  lodging: 'Cabin A',
  nights: 1,
}

export const MULTI_DAY = {
  id: 2,
  program: 'Juice Detox',
  start_date: '2025-08-10',
  end_date: '2025-08-14',
  status: 'pending',
  full_name: 'Bob Jones',
  email: 'bob@example.com',
  lodging: 'Cabin B',
  nights: 4,
}

export const OVERLAPPING = {
  id: 3,
  program: 'Breath Work',
  start_date: '2025-08-12',
  end_date: '2025-08-16',
  status: 'reserved',
  full_name: 'Carol Lee',
  email: 'carol@example.com',
  lodging: 'Cabin C',
  nights: 4,
}

// A set that exercises slot assignment: MULTI_DAY and OVERLAPPING share days
// 12–14, so assignSlots must place them in different vertical slots.
export const ALL = [SINGLE_DAY, MULTI_DAY, OVERLAPPING]

// 50 non-overlapping single-day registrations for perf tests
export const LARGE = Array.from({ length: 50 }, (_, i) => ({
  id: 100 + i,
  program: `Program ${i}`,
  start_date: `2025-08-${String((i % 28) + 1).padStart(2, '0')}`,
  end_date:   `2025-08-${String((i % 28) + 1).padStart(2, '0')}`,
  status: i % 2 === 0 ? 'reserved' : 'pending',
  full_name: `Guest ${i}`,
  email: `guest${i}@example.com`,
  lodging: 'Cabin A',
  nights: 1,
}))
