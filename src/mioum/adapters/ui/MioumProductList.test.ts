// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { MioumProductList } from './MioumProductList'
import './MioumProductList'
import type { ProductRepository } from '../../ports/ProductRepository'

interface ProductLike {
  id: string
  name: { value: string }
  price: { value: number }
  category: string
}

const makeProduct = (name: string, price: number, category: string = 'Snacks'): ProductLike => ({
  id: crypto.randomUUID(),
  name: { value: name },
  price: { value: price },
  category,
})

const repoWith = (products: ProductLike[]): ProductRepository => ({
  findAll: async () => products,
  findById: async () => null,
  save: async () => {},
  delete: async () => {},
} as unknown as ProductRepository)

describe('MioumProductList', () => {
  let el: MioumProductList

  beforeEach(() => {
    el = document.createElement('mioum-product-list') as MioumProductList
    document.body.appendChild(el)
  })

  it('renders an empty state when no products exist', async () => {
    await el.refresh(repoWith([]))
    expect(el.textContent).toContain('Aucun produit enregistré')
  })

  it('renders a list item for each product', async () => {
    await el.refresh(repoWith([makeProduct('Café', 1.5), makeProduct('Eau', 1)]))
    expect(el.querySelectorAll('li')).toHaveLength(2)
    expect(el.textContent).toContain('Café')
    expect(el.textContent).toContain('Eau')
  })

  it('renders an edit button per product', async () => {
    await el.refresh(repoWith([makeProduct('Café', 1.5)]))
    expect(el.querySelector<HTMLButtonElement>('button[data-action="edit-product"]')).not.toBeNull()
  })

  it('renders a delete button per product', async () => {
    await el.refresh(repoWith([makeProduct('Café', 1.5)]))
    expect(el.querySelector<HTMLButtonElement>('button[data-action="delete-product"]')).not.toBeNull()
  })

  it('edit button carries data-product-id, data-name, data-price, data-category', async () => {
    const product = makeProduct('Café', 1.5, 'Boissons')
    await el.refresh(repoWith([product]))
    const btn = el.querySelector<HTMLButtonElement>('button[data-action="edit-product"]')
    expect(btn?.dataset.productId).toBe(product.id)
    expect(btn?.dataset.name).toBe('Café')
    expect(btn?.dataset.price).toBe('1.5')
    expect(btn?.dataset.category).toBe('Boissons')
  })

  it('delete button carries data-product-id', async () => {
    const product = makeProduct('Café', 1.5)
    await el.refresh(repoWith([product]))
    const btn = el.querySelector<HTMLButtonElement>('button[data-action="delete-product"]')
    expect(btn?.dataset.productId).toBe(product.id)
  })

  it('dispatches product-edit-requested with productId, name, price as float and category', async () => {
    const product = makeProduct('Café', 1.5, 'Boissons')
    await el.refresh(repoWith([product]))

    const events: { productId: string; name: string; price: number; category: string }[] = []
    el.addEventListener('product-edit-requested', (e: Event) => events.push((e as CustomEvent<{ productId: string; name: string; price: number; category: string }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="edit-product"]')?.click()

    expect(events[0].productId).toBe(product.id)
    expect(events[0].name).toBe('Café')
    expect(events[0].price).toBe(1.5)
    expect(events[0].category).toBe('Boissons')
  })

  it('dispatches product-delete-requested with productId', async () => {
    const product = makeProduct('Café', 1.5)
    await el.refresh(repoWith([product]))

    const events: { productId: string }[] = []
    el.addEventListener('product-delete-requested', (e: Event) => events.push((e as CustomEvent<{ productId: string }>).detail))
    el.querySelector<HTMLButtonElement>('button[data-action="delete-product"]')?.click()

    expect(events[0].productId).toBe(product.id)
  })

  it('replaces the list on subsequent refresh calls', async () => {
    await el.refresh(repoWith([makeProduct('Café', 1.5)]))
    await el.refresh(repoWith([makeProduct('Eau', 1), makeProduct('Jus', 2)]))
    expect(el.querySelectorAll('li')).toHaveLength(2)
    expect(el.textContent).not.toContain('Café')
  })
})
