import { useEffect, useState } from 'react'
import { deleteRegistrationInfo, fetchRegistrationInfo, saveRegistrationInfo } from '../api/localBackend'

const MEAL_OPTIONS = ['omnivore', 'vegetarian', 'vegan']
const ACTIVITY_OPTIONS = [
  { value: 'yoga_class', label: 'Yoga Class' },
  { value: 'juice_detox', label: 'Juice Detox' },
  { value: 'massage', label: 'Massage' },
  { value: 'breath_work', label: 'Breath Work' },
]
const EMPTY_INFO = { flight_info: '', meal_preference: 'omnivore', activities: [] }
const ACTIVITY_LABELS = Object.fromEntries(ACTIVITY_OPTIONS.map(({ value, label }) => [value, label]))

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1) }

const STATUS_BADGE = {
  pending: 'badge-warning',
  reserved: 'badge-success',
}

export default function RegistrationPanel({ registration, onClose }) {
  const [savedInfo, setSavedInfo] = useState(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(EMPTY_INFO)
  const [error, setError] = useState(null)

  useEffect(() => {
    setEditing(false)
    setError(null)
    fetchRegistrationInfo(registration.id)
      .then(info => { setSavedInfo(info); setForm(info) })
      .catch(() => { setSavedInfo(null); setForm(EMPTY_INFO) })
  }, [registration.id])

  function setField(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function toggleActivity(value) {
    setForm(f => ({
      ...f,
      activities: f.activities.includes(value)
        ? f.activities.filter(a => a !== value)
        : [...f.activities, value],
    }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError(null)
    try {
      const info = await saveRegistrationInfo(registration.id, form)
      setSavedInfo(info)
      setEditing(false)
    } catch (e) {
      setError(e.message)
    }
  }

  async function handleDelete() {
    if (!confirm('Clear saved info for this registration?')) return
    try {
      await deleteRegistrationInfo(registration.id)
      setSavedInfo(null)
      setForm(EMPTY_INFO)
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <dialog className="modal modal-open">
      <div className="modal-box p-0 overflow-hidden max-w-md">

        <div className="p-5 text-white" style={{background: '#2c3e50'}}>
          <div className="flex justify-between items-start gap-2">
            <div>
              <h2 className="font-bold text-base mb-1">{registration.program}</h2>
              <p className="text-sm opacity-70 mb-2">
                {registration.start_date} → {registration.end_date} · ID {registration.id}
              </p>
              <span className={`badge ${STATUS_BADGE[registration.status] ?? 'badge-ghost'}`}>
                {registration.status}
              </span>
            </div>
            <button className="btn btn-ghost btn-sm btn-circle text-white/70 hover:text-white hover:bg-white/10" onClick={onClose}>✕</button>
          </div>
        </div>

      <div className="p-5 flex flex-col gap-4">

        <div className="bg-base-200 rounded-xl p-4">
          <p className="font-bold text-base">{registration.full_name}</p>
          <p className="text-sm text-base-content/60">{registration.email}</p>
          <p className="text-sm text-base-content/60">
            {registration.lodging} · {registration.nights} night{registration.nights !== 1 ? 's' : ''}
          </p>
        </div>

        {error && (
          <div role="alert" className="alert alert-error py-2 text-sm">{error}</div>
        )}

        {editing ? (
          <form className="flex flex-col gap-3" onSubmit={handleSave}>
            <label className="form-control w-full">
              <div className="label"><span className="label-text font-semibold">Flight Info</span></div>
              <input
                className="input input-bordered input-sm w-full"
                value={form.flight_info}
                onChange={e => setField('flight_info', e.target.value)}
                placeholder="e.g. AA123 arrives Thu 6pm"
                autoFocus
              />
            </label>

            <label className="form-control w-full">
              <div className="label"><span className="label-text font-semibold">Meal Preference</span></div>
              <select
                className="select select-bordered select-sm w-full"
                value={form.meal_preference}
                onChange={e => setField('meal_preference', e.target.value)}
              >
                {MEAL_OPTIONS.map(o => (
                  <option key={o} value={o}>{capitalize(o)}</option>
                ))}
              </select>
            </label>

            <fieldset className="border border-base-300 rounded-lg p-3">
              <legend className="text-sm font-semibold px-1">Activities</legend>
              <div className="flex flex-col gap-1 mt-1">
                {ACTIVITY_OPTIONS.map(({ value, label }) => (
                  <label key={value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm"
                      checked={form.activities.includes(value)}
                      onChange={() => toggleActivity(value)}
                    />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <div className="flex gap-2">
              <button type="submit" className="btn btn-primary btn-sm flex-1">Save</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(false)}>Cancel</button>
            </div>
          </form>
        ) : (
          <InfoDisplay info={savedInfo} onEdit={() => setEditing(true)} onDelete={handleDelete} />
        )}

      </div>
    </div>
    <div className="modal-backdrop" onClick={onClose} />
  </dialog>
  )
}

function InfoDisplay({ info, onEdit, onDelete }) {
  if (!info) {
    return (
      <div className="flex flex-col items-center gap-3 py-4 text-base-content/50">
        <p className="text-sm">No retreat info saved yet.</p>
        <button className="btn btn-outline btn-sm" onClick={onEdit}>+ Add Info</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {info.flight_info && (
        <p className="text-sm">✈ {info.flight_info}</p>
      )}
      <p className="text-sm">
        🍽 {capitalize(info.meal_preference)}
      </p>
      {info.activities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {info.activities.map(a => (
            <span key={a} className="badge badge-outline badge-sm">{ACTIVITY_LABELS[a] ?? a}</span>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-2">
        <button className="btn btn-ghost btn-sm flex-1" onClick={onEdit}>Edit</button>
        <button className="btn btn-error btn-outline btn-sm" onClick={onDelete}>Clear</button>
      </div>
    </div>
  )
}
