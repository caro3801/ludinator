export class MioumTicketView extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]')
      if (!btn) return
      const { action, ticketId, lineId, productId } = btn.dataset
      if (!ticketId) return
      if (action === 'remove-line') {
        this.dispatchEvent(new CustomEvent('line-remove-requested', {
          detail: { ticketId, lineId },
          bubbles: true,
        }))
      }
      if (action === 'add-product') {
        this.dispatchEvent(new CustomEvent('line-add-requested', {
          detail: { ticketId, productId, quantity: 1 },
          bubbles: true,
        }))
      }
      if (action === 'close-cash') {
        this.dispatchEvent(new CustomEvent('ticket-close-requested', {
          detail: { ticketId, paymentMethod: 'cash' },
          bubbles: true,
        }))
      }
      if (action === 'close-card') {
        this.dispatchEvent(new CustomEvent('ticket-close-requested', {
          detail: { ticketId, paymentMethod: 'card' },
          bubbles: true,
        }))
      }
      if (action === 'cancel-ticket') {
        this.dispatchEvent(new CustomEvent('ticket-cancel-requested', {
          detail: { ticketId },
          bubbles: true,
        }))
      }
    })
  }

  async refresh(ticket, productRepo) {
    if (!ticket) {
      this.innerHTML = '<p class="text-muted">Aucun ticket ouvert.</p>'
      return
    }

    const lines = ticket.lines

    if (ticket.isOpen) {
      const products = await productRepo.findAll()
      this.innerHTML = `
        <div class="row g-0" style="min-height: 400px">
          <div class="col-8 border-end p-2">
            <div class="row g-2">
              ${products.map(p => `
                <div class="col-6 col-md-4">
                  <button class="btn btn-outline-primary w-100 py-3"
                    data-action="add-product"
                    data-product-id="${p.id}"
                    data-ticket-id="${ticket.id}">
                    <div class="fw-semibold">${p.name.value}</div>
                    <div class="text-muted small">${p.price.value.toFixed(2)} €</div>
                  </button>
                </div>
              `).join('')}
              ${products.length === 0 ? '<p class="text-muted">Aucun produit dans le catalogue.</p>' : ''}
            </div>
          </div>
          <div class="col-4 d-flex flex-column p-2">
            <div class="flex-grow-1 overflow-auto mb-2">
              ${lines.length === 0
                ? '<p class="text-muted small">Aucune ligne.</p>'
                : `<ul class="list-unstyled mb-0">
                    ${lines.map(l => `
                      <li class="d-flex justify-content-between align-items-center mb-1">
                        <span class="me-1">
                          <span class="fw-semibold">${l.productName}</span>
                          <span class="text-muted small">× ${l.quantity} (${l.unitPrice} €)</span>
                        </span>
                        <span class="d-flex align-items-center gap-1">
                          <span>${l.subtotal} €</span>
                          <button class="btn btn-outline-danger btn-sm py-0 px-1"
                            data-action="remove-line"
                            data-ticket-id="${ticket.id}"
                            data-line-id="${l.id}">✕</button>
                        </span>
                      </li>
                    `).join('')}
                  </ul>`
              }
            </div>
            <div class="border-top pt-2">
              <div class="d-flex justify-content-between fw-bold fs-5 mb-3">
                <span>Total</span><span>${ticket.total.toFixed(2)} €</span>
              </div>
              <div class="d-grid gap-2">
                <button class="btn btn-success btn-lg"
                  data-action="close-cash"
                  data-ticket-id="${ticket.id}"
                  ${lines.length === 0 ? 'disabled' : ''}>
                  Espèces
                </button>
                <button class="btn btn-primary btn-lg"
                  data-action="close-card"
                  data-ticket-id="${ticket.id}"
                  ${lines.length === 0 ? 'disabled' : ''}>
                  Carte bleue
                </button>
                <button class="btn btn-outline-danger btn-sm"
                  data-action="cancel-ticket"
                  data-ticket-id="${ticket.id}">
                  Annuler le ticket
                </button>
              </div>
            </div>
          </div>
        </div>
      `
    } else {
      const statusLabel = ticket.status === 'closed' ? 'Encaissé' : 'Annulé'
      this.innerHTML = `
        <div>
          <span class="badge bg-secondary mb-2" data-status="${ticket.status}">${statusLabel}</span>
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Qté</th>
                <th>P.U.</th>
                <th>Sous-total</th>
              </tr>
            </thead>
            <tbody>
              ${lines.length === 0
                ? '<tr><td colspan="4" class="text-muted">Aucune ligne.</td></tr>'
                : lines.map(l => `
                  <tr>
                    <td>${l.productName}</td>
                    <td>${l.quantity}</td>
                    <td>${l.unitPrice} €</td>
                    <td>${l.subtotal} €</td>
                  </tr>
                `).join('')}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-end fw-bold">Total</td>
                <td class="fw-bold">${ticket.total.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `
    }
  }
}

customElements.define('mioum-ticket-view', MioumTicketView)
