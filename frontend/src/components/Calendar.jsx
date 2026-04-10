import { useState } from 'react'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function firstWeekday(year, month) {
  return new Date(year, month, 1).getDay()
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function registrationsForDay(registrations, dateStr) {
  return registrations.filter(r => r.start_date <= dateStr && dateStr <= r.end_date)
}

// 'single' | 'start' | 'middle' | 'end'
function spanPosition(reg, dateStr) {
  const isStart = reg.start_date === dateStr
  const isEnd = reg.end_date === dateStr
  if (isStart && isEnd) return 'single'
  if (isStart) return 'start'
  if (isEnd) return 'end'
  return 'middle'
}

// Assign each registration a stable vertical slot index so its ribbon chip
// stays on the same row across every day it spans. Works like a calendar
// event layout: sort by start date, then greedily place each registration
// into the first slot whose previous occupant has already ended.
function assignSlots(registrations) {
  const sorted = [...registrations].sort(
    (a, b) => a.start_date.localeCompare(b.start_date) || a.id - b.id
  )
  const slotEnds = []
  const regSlot = {}

  for (const reg of sorted) {
    const free = slotEnds.findIndex(end => end < reg.start_date)
    const slot = free === -1 ? slotEnds.length : free
    slotEnds[slot] = reg.end_date
    regSlot[reg.id] = slot
  }

  return { regSlot, totalSlots: slotEnds.length }
}

export default function Calendar({ year, month, registrations, onMonthChange, onSelectRegistration }) {
  const [pendingOnly, setPendingOnly] = useState(false)

  const visible = pendingOnly ? registrations.filter(r => r.status === 'pending') : registrations

  const totalDays = daysInMonth(year, month)
  const startOffset = firstWeekday(year, month)
  const monthName = new Date(year, month).toLocaleString('default', { month: 'long' })

  const { regSlot, totalSlots } = assignSlots(visible)

  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= totalDays; d++) cells.push(d)

  const availableDays = cells.filter(day => {
    if (!day) return false
    const dateStr = toDateStr(year, month, day)
    return registrationsForDay(visible, dateStr).length === 0
  }).length

  function prevMonth() {
    const d = new Date(year, month - 1)
    onMonthChange(d.getFullYear(), d.getMonth())
  }

  function nextMonth() {
    const d = new Date(year, month + 1)
    onMonthChange(d.getFullYear(), d.getMonth())
  }

  return (
    <div className="card bg-white shadow-sm flex-1">
      <div className="card-body p-5">

        <div className="flex items-center justify-between mb-4">
          <button className="btn btn-ghost btn-lg btn-circle text-2xl" onClick={prevMonth}>‹</button>
          <h2 className="text-lg font-semibold">{monthName} {year}</h2>
          <label
            className="flex items-center gap-2 text-sm text-base-content/60 cursor-pointer"
            title="When on, only pending registrations are shown"
          >
            <span>Pending only</span>
            <input
              type="checkbox"
              className="toggle toggle-success"
              checked={pendingOnly}
              onChange={() => setPendingOnly(p => !p)}
            />
          </label>
          <button className="btn btn-ghost btn-lg btn-circle text-2xl" onClick={nextMonth}>›</button>
        </div>

        <div className="cal-grid">
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs font-semibold text-base-content/40 uppercase tracking-wide pb-2">
              {d}
            </div>
          ))}

          {cells.map((day, i) => {
            if (!day) return <div key={`empty-${i}`} className="cal-cell" />

            const dateStr = toDateStr(year, month, day)
            const dayRegs = registrationsForDay(visible, dateStr)
            const isBlocked = dayRegs.length > 0

            // Build a fixed-length array where index = slot number.
            // Slots with no registration on this day stay null (rendered as
            // invisible placeholders to keep row heights consistent).
            const slottedRegs = Array(totalSlots).fill(null)
            dayRegs.forEach(r => { slottedRegs[regSlot[r.id]] = r })

            return (
              <div
                key={day}
                className={`cal-cell${isBlocked ? ' cal-cell--blocked' : ''}`}
                onClick={() => isBlocked && onSelectRegistration(dayRegs[0])}
                title={isBlocked ? dayRegs.map(r => r.full_name).join(', ') : undefined}
              >
                <span className={`text-xs font-semibold`} style={{color: isBlocked ? '#1a5f9e' : '#999'}}>
                  {day}
                </span>
                {slottedRegs.map((r, slot) => {
                  if (!r) return <div key={`slot-${slot}`} className="cal-reg-chip cal-reg-chip--empty">&nbsp;</div>
                  const pos = spanPosition(r, dateStr)
                  return (
                    <div
                      key={`reg-${r.id}`}
                      className={`cal-reg-chip cal-reg-chip--${r.status} cal-reg-chip--${pos}`}
                      onClick={e => { e.stopPropagation(); onSelectRegistration(r) }}
                      title={r.full_name}
                    >
                      {(pos === 'single' || pos === 'start' || day === 1) ? r.program : '\u00A0'}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>

        <p className="text-center text-sm text-base-content/50 mt-4">
          {availableDays} available day{availableDays !== 1 ? 's' : ''} in {monthName}
        </p>

      </div>
    </div>
  )
}
