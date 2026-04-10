import { useEffect, useState } from 'react'
import { fetchRegistrations } from './api/retreatGuru'
import Calendar from './components/Calendar'
import RegistrationPanel from './components/RegistrationPanel'
import './App.css'

const DEFAULT_YEAR = 2025
const DEFAULT_MONTH = 7  // August — JS months are 0-indexed (0 = January)
const DEFAULT_ROOM = 5

export default function App() {
  const [year, setYear] = useState(DEFAULT_YEAR)
  const [month, setMonth] = useState(DEFAULT_MONTH)
  const [room, setRoom] = useState(DEFAULT_ROOM)
  const [registrations, setRegistrations] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchRegistrations()
      .then(setRegistrations)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function handleMonthChange(y, m) {
    setYear(y)
    setMonth(m)
    setSelected(null)
  }

  function handleRoomChange(r) {
    setRoom(r)
    setSelected(null)
  }

  const availableRooms = [...new Set(registrations.map(r => r.room_id - 1))].sort((a, b) => a - b)

  const roomRegistrations = registrations.filter(r => r.room_id === room + 1)

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <div className="navbar shadow-sm px-6 text-white" style={{background: '#2c3e50'}}>
        <span className="text-xl font-bold">Retreat Guru</span>
      </div>

      <main className="flex-1 p-6">
        {error && (
          <div role="alert" className="alert alert-error mb-4">
            <span>Could not load registrations: {error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <Calendar
            year={year}
            month={month}
            room={room}
            availableRooms={availableRooms}
            registrations={roomRegistrations}
            onMonthChange={handleMonthChange}
            onRoomChange={handleRoomChange}
            onSelectRegistration={setSelected}
          />
        )}

        {selected && (
          <RegistrationPanel
            registration={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </main>
    </div>
  )
}
