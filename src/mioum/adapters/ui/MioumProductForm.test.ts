// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MioumProductForm } from './MioumProductForm'
import './MioumProductForm'

interface ProductPayload {
  id: string
  name: string
  price: number
  category: string
}

const makeUseCase = (result: unknown) => ({ execute: vi.fn().mockResolvedValue(result) })
const makeFailingUseCase = (msg: string) => ({ execute: vi.fn().mockRejectedValue(new Error(msg)) })

describe('MioumProductForm', () => {
  let el: MioumProductForm

  beforeEach(() => {
    el = document.createElement('mioum-product-form') as MioumProductForm
    document.body.appendChild(el)
  })

  it('renders inputs for name, category and price', () => {
    expect(el.querySelector<HTMLInputElement>('input[name="name"]')).not.toBeNull()
    expect(el.querySelector<HTMLInputElement>('input[name="category"]')).not.toBeNull()
    expect(el.querySelector<HTMLInputElement>('input[name="price"]')).not.toBeNull()
    expect(el.querySelector<HTMLButtonElement>('button[type="submit"]')).not.toBeNull()
  })

  it('price input has type number and step 0.01', () => {
    const input = el.querySelector<HTMLInputElement>('input[name="price"]')!
    expect(input.type).toBe('number')
    expect(input.step).toBe('0.01')
  })

  it('calls the use case with name, category and price as float on submit', async () => {
    const useCase = makeUseCase({ id: '1' })
    el.createProductUseCase = useCase

    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Café'
    el.querySelector<HTMLInputElement>('input[name="category"]')!.value = 'Boissons'
    el.querySelector<HTMLInputElement>('input[name="price"]')!.value = '1.50'
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(useCase.execute).toHaveBeenCalledWith({ name: 'Café', price: 1.5, category: 'Boissons' }))
  })

  it('dispatches product-created on success', async () => {
    const product: ProductPayload = { id: '1', name: 'Café', price: 1.5, category: 'Boissons' }
    el.createProductUseCase = makeUseCase(product)

    const events: ProductPayload[] = []
    el.addEventListener('product-created', (e: Event) => events.push((e as CustomEvent<ProductPayload>).detail))

    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Café'
    el.querySelector<HTMLInputElement>('input[name="category"]')!.value = 'Boissons'
    el.querySelector<HTMLInputElement>('input[name="price"]')!.value = '1.50'
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(events[0]).toBe(product))
  })

  it('resets the form after success', async () => {
    el.createProductUseCase = makeUseCase({ id: '1' })
    el.querySelector<HTMLInputElement>('input[name="name"]')!.value = 'Café'
    el.querySelector<HTMLInputElement>('input[name="category"]')!.value = 'Boissons'
    el.querySelector<HTMLInputElement>('input[name="price"]')!.value = '1.50'
    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => {
      expect(el.querySelector<HTMLInputElement>('input[name="name"]')!.value).toBe('')
    })
  })

  it('dispatches mioum-error on failure', async () => {
    el.createProductUseCase = makeFailingUseCase('Product name must not be empty')

    const errors: { message: string }[] = []
    el.addEventListener('mioum-error', (e: Event) => errors.push((e as CustomEvent<{ message: string }>).detail))

    el.querySelector<HTMLFormElement>('form')!.dispatchEvent(new Event('submit'))

    await vi.waitFor(() => expect(errors[0].message).toContain('empty'))
  })
})
