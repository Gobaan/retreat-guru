import { render, screen, waitFor } from '@testing-library/react'
import { describe, test, expect, vi, beforeEach } from 'vitest'
import RegistrationPanel from '../components/RegistrationPanel'
import { MULTI_DAY } from './fixtures'

// Mock the API module so tests never hit the network
vi.mock('../api/localBackend', () => ({
  fetchRegistrationInfo: vi.fn(),
  saveRegistrationInfo: vi.fn(),
  deleteRegistrationInfo: vi.fn(),
}))

import { fetchRegistrationInfo, saveRegistrationInfo } from '../api/localBackend'

const SAVED_INFO = {
  flight_info: 'AA123 Thu 6pm',
  meal_preference: 'vegan',
  activities: ['yoga_class', 'massage'],
}

describe('RegistrationPanel DOM snapshots', () => {
  beforeEach(() => vi.clearAllMocks())

  test('renders modal with no saved info', async () => {
    fetchRegistrationInfo.mockRejectedValue(new Error('Not found'))
    const { container } = render(
      <RegistrationPanel registration={MULTI_DAY} onClose={noop} />
    )
    await waitFor(() => screen.getByText(/no retreat info saved/i))
    expect(container.querySelector('.modal-box')).toMatchSnapshot()
  })

  test('renders modal with saved info', async () => {
    fetchRegistrationInfo.mockResolvedValue(SAVED_INFO)
    const { container } = render(
      <RegistrationPanel registration={MULTI_DAY} onClose={noop} />
    )
    await waitFor(() => screen.getByText(/vegan/i))
    expect(container.querySelector('.modal-box')).toMatchSnapshot()
  })

  test('displays registration header details', async () => {
    fetchRegistrationInfo.mockRejectedValue(new Error('Not found'))
    render(<RegistrationPanel registration={MULTI_DAY} onClose={noop} />)
    expect(screen.getByText(MULTI_DAY.program)).toBeInTheDocument()
    expect(screen.getByText(MULTI_DAY.full_name)).toBeInTheDocument()
  })
})

function noop() {}
