interface CreateProductUseCase {
  execute(params: { name: string; price: number; category: string }): Promise<unknown>
}

export class MioumProductForm extends HTMLElement {
  #createProductUseCase: CreateProductUseCase | null = null

  set createProductUseCase(uc: CreateProductUseCase) { this.#createProductUseCase = uc }

  connectedCallback(): void {
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
    const form = this.querySelector('form')
    if (form) form.addEventListener('submit', (e: Event) => this.#onSubmit(e as SubmitEvent))
  }

  async #onSubmit(e: SubmitEvent): Promise<void> {
    e.preventDefault()
    const name = (this.querySelector<HTMLInputElement>('input[name="name"]'))?.value.trim() ?? ''
    const category = (this.querySelector<HTMLInputElement>('input[name="category"]'))?.value.trim() ?? ''
    const price = parseFloat((this.querySelector<HTMLInputElement>('input[name="price"]'))?.value ?? '0')
    if (!this.#createProductUseCase) return
    try {
      const product = await this.#createProductUseCase.execute({ name, price, category })
      this.dispatchEvent(new CustomEvent('product-created', { detail: product, bubbles: true }))
      ;(e.target as HTMLFormElement).reset()
    } catch (err) {
      this.dispatchEvent(new CustomEvent('mioum-error', { detail: { message: err instanceof Error ? err.message : String(err) }, bubbles: true }))
    }
  }
}

customElements.define('mioum-product-form', MioumProductForm)
