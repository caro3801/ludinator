// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import './MioumProductForm.js'

const makeUseCase = (result) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

describe('MioumProductForm', () => {
  let el

  beforeEach(() => {
    el = document.createElement('mioum-product-form')
    document.body.appendChild(el)
  })

  it('renders inputs for name and price', () => {
    expect(el.querySelector('input[name="name"]')).not.toBeNull()
    expect(el.querySelector('input[name="price"]')).not.toBeNull()
    expect(el.querySelector('button[type="submit"]')).not.toBeNull()
  })

  it('price input has type number and step 0.01', () => {
    const input = el.querySelector('input[name="price"]')
    expect(input.type).toBe('number')
    expect(input.step).toBe('0.01')
  })

  it('calls the use case with name and price as float on submit', async () => {
    const useCase = makeUseCase({ id: '1' })
    el.createProductUseCase = useCase

    el.querySelector('input[name="name"]').value = 'Café'
    el.querySelector('input[name="price"]').value = '1.50'
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(useCase.execute).toHaveBeenCalledWith({ name: 'Café', price: 1.5 }))
  })

  it('dispatches product-created on success', async () => {
    const product = { id: '1', name: 'Café', price: 1.5 }
    el.createProductUseCase = makeUseCase(product)

    const events = []
    el.addEventListener('product-created', e => events.push(e.detail))

    el.querySelector('input[name="name"]').value = 'Café'
    el.querySelector('input[name="price"]').value = '1.50'
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(events[0]).toBe(product))
  })

  it('resets the form after success', async () => {
    el.createProductUseCase = makeUseCase({ id: '1' })
    el.querySelector('input[name="name"]').value = 'Café'
    el.querySelector('input[name="price"]').value = '1.50'
    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => {
      expect(el.querySelector('input[name="name"]').value).toBe('')
    })
  })

  it('dispatches mioum-error on failure', async () => {
    el.createProductUseCase = makeFailingUseCase('Product name must not be empty')

    const errors = []
    el.addEventListener('mioum-error', e => errors.push(e.detail))

    el.querySelector('form').dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(errors[0].message).toContain('empty'))
  })
})
