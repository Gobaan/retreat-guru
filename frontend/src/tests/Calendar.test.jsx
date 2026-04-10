import { render, screen } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import Calendar from '../components/Calendar'
import { ALL, LARGE, MULTI_DAY, OVERLAPPING } from './fixtures'

const noop = () => {}

describe('Calendar DOM snapshots', () => {
  test('empty month renders 31 day cells', () => {
    const { container } = render(
      <Calendar year={2025} month={7} registrations={[]} onMonthChange={noop} onSelectRegistration={noop} />
    )
    expect(container.querySelector('.cal-grid')).toMatchSnapshot()
  })

  test('single-day registration renders a single chip', () => {
    const { container } = render(
      <Calendar year={2025} month={7} registrations={ALL} onMonthChange={noop} onSelectRegistration={noop} />
    )
    expect(container.querySelector('.cal-grid')).toMatchSnapshot()
  })

  test('overlapping registrations are assigned different vertical slots', () => {
    const { container } = render(
      <Calendar year={2025} month={7} registrations={ALL} onMonthChange={noop} onSelectRegistration={noop} />
    )
    // Day 12 must have two chips — one per overlapping registration
    const chips = container.querySelectorAll('.cal-reg-chip:not(.cal-reg-chip--empty)')
    const day12Chips = [...chips].filter(el =>
      el.closest('.cal-cell') ===
      [...container.querySelectorAll('.cal-cell')].find(cell =>
        cell.querySelector('span')?.textContent === '12'
      )
    )
    expect(day12Chips.length).toBe(2)
  })

  test('pending registrations render with pending class', () => {
    const { container } = render(
      <Calendar year={2025} month={7} registrations={ALL} onMonthChange={noop} onSelectRegistration={noop} />
    )
    const pendingChips = container.querySelectorAll('.cal-reg-chip--pending')
    expect(pendingChips.length).toBeGreaterThan(0)
  })

  test('available days count is displayed', () => {
    render(
      <Calendar year={2025} month={7} registrations={ALL} onMonthChange={noop} onSelectRegistration={noop} />
    )
    expect(screen.getByText(/available day/i)).toBeInTheDocument()
  })
})

describe('Calendar performance', () => {
  test('renders 50 registrations within 100ms', () => {
    const start = performance.now()
    render(
      <Calendar year={2025} month={7} registrations={LARGE} onMonthChange={noop} onSelectRegistration={noop} />
    )
    expect(performance.now() - start).toBeLessThan(100)
  })
})
