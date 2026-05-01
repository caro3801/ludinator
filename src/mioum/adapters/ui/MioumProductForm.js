export class MioumProductForm extends HTMLElement {
  #createProductUseCase = null

  set createProductUseCase(uc) { this.#createProductUseCase = uc }

  connectedCallback() {
    this.innerHTML = `
      <form>
        <div class="mb-2">
          <input name="name" type="text" class="form-control form-control-sm" placeholder="Nom du produit" required>
        </div>
        <div class="mb-2">
          <input name="category" type="text" class="form-control form-control-sm" placeholder="Catégorie" required>
        </div>
        <div class="mb-2">
          <input name="price" type="number" step="0.01" class="form-control form-control-sm" placeholder="Prix (€)" required>
        </div>
        <button type="submit" class="btn btn-sm btn-primary">Créer</button>
      </form>
    `
    this.querySelector('form').addEventListener('submit', e => this.#onSubmit(e))
  }

  async #onSubmit(e) {
    e.preventDefault()
    const name = this.querySelector('input[name="name"]').value.trim()
    const category = this.querySelector('input[name="category"]').value.trim()
    const price = parseFloat(this.querySelector('input[name="price"]').value)
    try {
      const product = await this.#createProductUseCase.execute({ name, price, category })
      this.dispatchEvent(new CustomEvent('product-created', { detail: product, bubbles: true }))
      e.target.reset()
    } catch (err) {
      this.dispatchEvent(new CustomEvent('mioum-error', { detail: { message: err.message }, bubbles: true }))
    }
  }
}

customElements.define('mioum-product-form', MioumProductForm)
