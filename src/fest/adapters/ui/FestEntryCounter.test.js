// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './FestEntryCounter.js'
import { EntryLog } from '../../domain/model/EntryLog.js'

const makeUseCase = (result) => ({ execute: vi.fn().mockResolvedValue(result) })

describe('FestEntryCounter', () => {
  let el, log, sc, scBatch
  let addScUC, removeScUC, recordScUC, updateScUC, deleteScUC

  beforeEach(() => {
    log = EntryLog.create('edition-2024')
    sc = log.addSubCounter('Samedi')
    scBatch = sc.addBatch({ adults: 2, children: 1, families: 0 })

    addScUC = makeUseCase(sc)
    removeScUC = makeUseCase(undefined)
    recordScUC = makeUseCase(scBatch)
    updateScUC = makeUseCase(undefined)
    deleteScUC = makeUseCase(undefined)

    el = document.createElement('fest-entry-counter')
    document.body.appendChild(el)
    el.editionId = 'edition-2024'
    el.addSubCounterUseCase = addScUC
    el.removeSubCounterUseCase = removeScUC
    el.recordSubCounterEntriesUseCase = recordScUC
    el.updateSubCounterBatchUseCase = updateScUC
    el.deleteSubCounterBatchUseCase = deleteScUC

    el.refresh(log)
  })

  it('displays aggregated totals from sub-counters', () => {
    expect(el.querySelector('[data-total]').textContent).toBe('3')
    expect(el.querySelector('[data-total-adults]').textContent).toBe('2')
    expect(el.querySelector('[data-total-children]').textContent).toBe('1')
  })

  it('renders each sub-counter with its label', () => {
    expect(el.textContent).toContain('Samedi')
  })

  it('renders the sub-counter totals', () => {
    expect(el.querySelector(`[data-sc-id="${sc.id}"] [data-sc-total]`).textContent).toBe('3')
  })

  it('renders batches inside the sub-counter', () => {
    expect(el.querySelectorAll(`[data-sc-id="${sc.id}"] form[data-batch-id]`)).toHaveLength(1)
  })

  it('shows empty state when no sub-counters', () => {
    el.refresh(EntryLog.create('edition-2024'))
    expect(el.textContent).toContain('Aucun sous-compteur')
  })

  it('calls recordSubCounterEntriesUseCase on sub-counter add form submit', async () => {
    const form = el.querySelector(`[data-sc-id="${sc.id}"] form[data-add-form]`)
    form.querySelector('[name="adults"]').value = '2'
    form.querySelector('[name="children"]').value = '1'
    form.querySelector('[name="families"]').value = '0'
    form.dispatchEvent(new Event('submit', { bubbles: true }))
    await vi.waitFor(() =>
      expect(recordScUC.execute).toHaveBeenCalledWith({
        editionId: 'edition-2024', subCounterId: sc.id, adults: 2, children: 1, families: 0,
      })
    )
  })

  it('calls updateSubCounterBatchUseCase on sub-counter batch save', async () => {
    const row = el.querySelector(`[data-sc-id="${sc.id}"] form[data-batch-id="${scBatch.id}"]`)
    row.querySelector('[name="adults"]').value = '7'
    row.querySelector('button[type="submit"]').click()
    await vi.waitFor(() =>
      expect(updateScUC.execute).toHaveBeenCalledWith({
        editionId: 'edition-2024', subCounterId: sc.id, batchId: scBatch.id, adults: 7, children: 1, families: 0,
      })
    )
  })

  it('calls deleteSubCounterBatchUseCase on sub-counter batch delete', async () => {
    el.querySelector(`[data-sc-id="${sc.id}"] button[data-action="delete-sc-batch"]`).click()
    await vi.waitFor(() =>
      expect(deleteScUC.execute).toHaveBeenCalledWith({
        editionId: 'edition-2024', subCounterId: sc.id, batchId: scBatch.id,
      })
    )
  })

  it('calls removeSubCounterUseCase on remove sub-counter click', async () => {
    el.querySelector(`button[data-action="remove-sub-counter"][data-sc-id="${sc.id}"]`).click()
    await vi.waitFor(() =>
      expect(removeScUC.execute).toHaveBeenCalledWith({ editionId: 'edition-2024', subCounterId: sc.id })
    )
  })

  it('dispatches entries-updated after any mutation', async () => {
    const events = []
    el.addEventListener('entries-updated', () => events.push(true))
    el.querySelector(`button[data-action="remove-sub-counter"][data-sc-id="${sc.id}"]`).click()
    await vi.waitFor(() => expect(events).toHaveLength(1))
  })
})
