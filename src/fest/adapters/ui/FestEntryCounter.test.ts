// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FestEntryCounter } from './FestEntryCounter'
import './FestEntryCounter'
import { EntryLog } from '../../domain/model/EntryLog'

const makeUseCase = <T>(result: T) => ({ execute: vi.fn().mockResolvedValue(result) })

interface SubCounterBatch {
  id: string
  timestamp: number
  adults: number
  children: number
  families: number
}

describe('FestEntryCounter', () => {
  let el: FestEntryCounter
  let log: EntryLog
  let sc: any
  let scBatch: SubCounterBatch

  beforeEach(() => {
    log = EntryLog.create('edition-2024')
    sc = log.addSubCounter('Samedi')
    scBatch = sc.addBatch({ adults: 2, children: 1, families: 0 })

    el = document.createElement('fest-entry-counter') as FestEntryCounter
    document.body.appendChild(el)
    el.editionId = 'edition-2024'
    el.addSubCounterUseCase = makeUseCase(sc)
    el.removeSubCounterUseCase = makeUseCase(undefined)
    el.recordSubCounterEntriesUseCase = makeUseCase(scBatch)
    el.updateSubCounterBatchUseCase = makeUseCase(undefined)
    el.deleteSubCounterBatchUseCase = makeUseCase(undefined)

    el.refresh(log)
  })

  it('displays aggregated totals from sub-counters', () => {
    expect(el.querySelector<HTMLElement>('[data-total]')?.textContent).toBe('3')
    expect(el.querySelector<HTMLElement>('[data-total-adults]')?.textContent).toBe('2')
    expect(el.querySelector<HTMLElement>('[data-total-children]')?.textContent).toBe('1')
  })

  it('renders each sub-counter with its label', () => {
    expect(el.textContent).toContain('Samedi')
  })

  it('renders the sub-counter totals', () => {
    expect(el.querySelector<HTMLElement>(`[data-sc-id="${sc.id}"] [data-sc-total]`)?.textContent).toBe('3')
  })

  it('renders batches inside the sub-counter', () => {
    expect(el.querySelectorAll(`[data-sc-id="${sc.id}"] form[data-batch-id]`)).toHaveLength(1)
  })

  it('shows empty state when no sub-counters', () => {
    el.refresh(EntryLog.create('edition-2024'))
    expect(el.textContent).toContain('Aucun sous-compteur')
  })

  it('calls recordSubCounterEntriesUseCase on sub-counter add form submit', async () => {
    const form = el.querySelector<HTMLFormElement>(`[data-sc-id="${sc.id}"] form[data-add-form]`)
    form!.querySelector<HTMLInputElement>('[name="adults"]')!.value = '2'
    form!.querySelector<HTMLInputElement>('[name="children"]')!.value = '1'
    form!.querySelector<HTMLInputElement>('[name="families"]')!.value = '0'
    form?.dispatchEvent(new Event('submit', { bubbles: true }))
    await vi.waitFor(() =>
      expect(el.recordSubCounterEntriesUseCase.execute).toHaveBeenCalledWith({
        editionId: 'edition-2024', subCounterId: sc.id, adults: 2, children: 1, families: 0,
      })
    )
  })

  it('calls updateSubCounterBatchUseCase on sub-counter batch save', async () => {
    const row = el.querySelector<HTMLFormElement>(`[data-sc-id="${sc.id}"] form[data-batch-id="${scBatch.id}"]`)
    row!.querySelector<HTMLInputElement>('[name="adults"]')!.value = '7'
    row?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click()
    await vi.waitFor(() =>
      expect(el.updateSubCounterBatchUseCase.execute).toHaveBeenCalledWith({
        editionId: 'edition-2024', subCounterId: sc.id, batchId: scBatch.id, adults: 7, children: 1, families: 0,
      })
    )
  })

  it('calls deleteSubCounterBatchUseCase on sub-counter batch delete', async () => {
    el.querySelector<HTMLButtonElement>(`[data-sc-id="${sc.id}"] button[data-action="delete-sc-batch"]`)?.click()
    await vi.waitFor(() =>
      expect(el.deleteSubCounterBatchUseCase.execute).toHaveBeenCalledWith({
        editionId: 'edition-2024', subCounterId: sc.id, batchId: scBatch.id,
      })
    )
  })

  it('calls removeSubCounterUseCase on remove sub-counter click', async () => {
    el.querySelector<HTMLButtonElement>(`button[data-action="remove-sub-counter"][data-sc-id="${sc.id}"]`)?.click()
    await vi.waitFor(() =>
      expect(el.removeSubCounterUseCase.execute).toHaveBeenCalledWith({ editionId: 'edition-2024', subCounterId: sc.id })
    )
  })

  it('dispatches entries-updated after any mutation', async () => {
    const events: boolean[] = []
    el.addEventListener('entries-updated', () => events.push(true))
    el.querySelector<HTMLButtonElement>(`button[data-action="remove-sub-counter"][data-sc-id="${sc.id}"]`)?.click()
    await vi.waitFor(() => expect(events).toHaveLength(1))
  })
})
