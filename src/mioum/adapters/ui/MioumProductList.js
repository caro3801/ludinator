export class MioumProductList extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]')
      if (!btn) return
      const { action, productId, name, price } = btn.dataset
      if (action === 'edit-product') {
        this.dispatchEvent(new CustomEvent('product-edit-requested', {
          detail: { productId, name, price: parseFloat(price) },
          bubbles: true,
        }))
      }
      if (action === 'delete-product') {
        this.dispatchEvent(new CustomEvent('product-delete-requested', {
          detail: { productId },
          bubbles: true,
        }))
      }
    })
  }

  async refresh(repo) {
    const products = await repo.findAll()
    if (products.length === 0) {
      this.innerHTML = '<p class="text-muted">Aucun produit enregistré.</p>'
      return
    }
    this.innerHTML = `<ul class="list-group">${products.map(p => `
      <li class="list-group-item d-flex align-items-center gap-2">
        <span>${p.name.value}</span>
        <span class="text-muted ms-2">${p.price.value} €</span>
        <button class="btn btn-outline-secondary btn-sm py-0 px-1 ms-auto"
          data-action="edit-product"
          data-product-id="${p.id}"
          data-name="${p.name.value}"
          data-price="${p.price.value}">✏️</button>
        <button class="btn btn-outline-danger btn-sm py-0 px-1"
          data-action="delete-product"
          data-product-id="${p.id}">🗑</button>
      </li>
    `).join('')}</ul>`
  }
}

customElements.define('mioum-product-list', MioumProductList)
