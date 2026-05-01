import { ProductName } from './ProductName.js'
import { Price } from './Price.js'
import { generateId } from '../../../shared/generateId.js'

export class Product {
  #id
  #name
  #price

  constructor(id, name, price) {
    this.#id = id
    this.#name = name
    this.#price = price
  }

  get id() { return this.#id }
  get name() { return this.#name }
  get price() { return this.#price }

  update({ name, price } = {}) {
    if (name !== undefined) this.#name = new ProductName(name)
    if (price !== undefined) this.#price = Price.create(price)
  }

  toJSON() {
    return {
      id: this.#id,
      name: this.#name.value,
      price: this.#price.value,
    }
  }

  static fromJSON({ id, name, price }) {
    return new Product(id, new ProductName(name), Price.create(price))
  }

  static create(rawName, rawPrice) {
    return new Product(generateId(), new ProductName(rawName), Price.create(rawPrice))
  }
}
