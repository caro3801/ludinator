import { ProductName } from './ProductName.js'
import { Price } from './Price.js'
import { ValidationError } from '../errors/ValidationError.js'
import { generateId } from '../../../shared/generateId.js'

function validateCategory(value) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError('Product category must not be empty')
  }
  return value.trim()
}

export class Product {
  #id
  #name
  #price
  #category

  constructor(id, name, price, category) {
    this.#id = id
    this.#name = name
    this.#price = price
    this.#category = category
  }

  get id() { return this.#id }
  get name() { return this.#name }
  get price() { return this.#price }
  get category() { return this.#category }

  update({ name, price, category } = {}) {
    const newName = name !== undefined ? new ProductName(name) : this.#name
    const newPrice = price !== undefined ? Price.create(price) : this.#price
    const newCategory = category !== undefined ? validateCategory(category) : this.#category
    this.#name = newName
    this.#price = newPrice
    this.#category = newCategory
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name.value,
      price: this.#price.value,
      category: this.#category,
    }
  }

  static fromJSON({ id, name, price, category }) {
    return new Product(id, new ProductName(name), Price.create(price), category)
  }

  static create(rawName, rawPrice, rawCategory) {
    return new Product(generateId(), new ProductName(rawName), Price.create(rawPrice), validateCategory(rawCategory))
  }
}
