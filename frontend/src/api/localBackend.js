const BASE = '/api'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (res.status === 204) return null  // 204 No Content — DELETE returns no body
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail || 'Request failed')
  return data
}

export const fetchRegistrationInfo = (registrationId) =>
  request(`/registrations/${registrationId}/`)

export const saveRegistrationInfo = (registrationId, info) =>
  request(`/registrations/${registrationId}/`, {
    method: 'PUT',
    body: JSON.stringify(info),
  })

export const deleteRegistrationInfo = (registrationId) =>
  request(`/registrations/${registrationId}/`, { method: 'DELETE' })
