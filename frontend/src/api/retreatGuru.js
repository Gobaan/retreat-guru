export async function fetchRegistrations() {
  const res = await fetch('/api/retreat-guru/registrations/')
  if (!res.ok) throw new Error('Failed to fetch registrations')
  const data = await res.json()
  return data
}
