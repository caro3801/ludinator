import { ProductRepository } from '../../ports/ProductRepository.js'
import { Product } from '../../domain/model/Product.js'

const KEY = 'mioum:products'

export class LocalStorageProductRepository extends ProductRepository {
  #read() { return JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  #write(data) { localStorage.setItem(KEY, JSON.stringify(data)) }

  async save(product) {
    const data = this.#read()
    data[product.id] = product.toJSON()
    this.#write(data)
  }
  async findById(id) {
    const data = this.#read()
    return data[id] ? Product.fromJSON(data[id]) : null
  }
  async findAll() {
    return Object.values(this.#read()).map(p => Product.fromJSON(p))
  }
  async delete(id) {
    const data = this.#read()
    delete data[id]
    this.#write(data)
  }
}
