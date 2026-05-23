import { ProductName } from './ProductName'
import { Price } from './Price'
import { ValidationError } from '../errors/ValidationError'
import { generateId } from '../../../shared/generateId'
import { ProductId } from '../../../shared/types'

function validateCategory(value: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError('Product category must not be empty')
  }
  return value.trim()
}

export class Product {
  #id: ProductId
  #name: ProductName
  #price: Price
  #category: string

  constructor(id: ProductId, name: ProductName, price: Price, category: string) {
    this.#id = id
    this.#name = name
    this.#price = price
    this.#category = category
  }

  get id(): ProductId { return this.#id }
  get name(): ProductName { return this.#name }
  get price(): Price { return this.#price }
  get category(): string { return this.#category }

  update({ name, price, category }: { name?: string, price?: number, category?: string } = {}): void {
    const newName = name !== undefined ? new ProductName(name) : this.#name
    const newPrice = price !== undefined ? Price.create(price) : this.#price
    const newCategory = category !== undefined ? validateCategory(category) : this.#category
    this.#name = newName
    this.#price = newPrice
    this.#category = newCategory
  }

  toJSON(): { id: ProductId, name: string, price: number, category: string } {
    return {
      id: this.#id,
      name: this.#name.value,
      price: this.#price.value,
      category: this.#category,
    }
  }

  static fromJSON(data: { id: ProductId, name: string, price: number, category: string }): Product {
    return new Product(data.id, new ProductName(data.name), Price.create(data.price), data.category)
  }

  static create(rawName: string, rawPrice: number, rawCategory: string): Product {
    return new Product(
      generateId() as ProductId,
      new ProductName(rawName),
      Price.create(rawPrice),
      validateCategory(rawCategory)
    )
  }
}
