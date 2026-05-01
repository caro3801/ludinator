export class MioumTicketView extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]')
      if (!btn) return
      const { action, ticketId, lineId } = btn.dataset
      if (action === 'remove-line') {
        this.dispatchEvent(new CustomEvent('line-remove-requested', {
          detail: { ticketId, lineId },
          bubbles: true,
        }))
      }
      if (action === 'close-ticket') {
        this.dispatchEvent(new CustomEvent('ticket-close-requested', {
          detail: { ticketId },
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
        <div>
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Qté</th>
                <th>P.U.</th>
                <th>Sous-total</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${lines.length === 0
                ? '<tr><td colspan="5" class="text-muted">Aucune ligne.</td></tr>'
                : lines.map(l => `
                  <tr>
                    <td>${l.productName}</td>
                    <td>${l.quantity}</td>
                    <td>${l.unitPrice} €</td>
                    <td>${l.subtotal} €</td>
                    <td>
                      <button class="btn btn-outline-danger btn-sm py-0 px-1"
                        data-action="remove-line"
                        data-ticket-id="${ticket.id}"
                        data-line-id="${l.id}">✕</button>
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>

          <form data-form="add-line" class="d-flex gap-2 mb-3">
            <select name="productId" class="form-select form-select-sm">
              ${products.map(p => `<option value="${p.id}">${p.name.value} — ${p.price.value} €</option>`).join('')}
            </select>
            <input name="quantity" type="number" min="1" value="1" class="form-control form-control-sm" style="width:80px">
            <button type="submit" class="btn btn-sm btn-success">Ajouter</button>
          </form>

          <div class="d-flex gap-2">
            <button class="btn btn-sm btn-primary"
              data-action="close-ticket"
              data-ticket-id="${ticket.id}">Encaisser</button>
            <button class="btn btn-sm btn-outline-danger"
              data-action="cancel-ticket"
              data-ticket-id="${ticket.id}">Annuler</button>
          </div>
        </div>
      `
      this.querySelector('form[data-form="add-line"]').addEventListener('submit', e => {
        e.preventDefault()
        const productId = this.querySelector('select[name="productId"]').value
        const quantity = parseInt(this.querySelector('input[name="quantity"]').value, 10)
        this.dispatchEvent(new CustomEvent('line-add-requested', {
          detail: { ticketId: ticket.id, productId, quantity },
          bubbles: true,
        }))
      })
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
                <td class="fw-bold">${ticket.total} €</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `
    }
  }
}

customElements.define('mioum-ticket-view', MioumTicketView)
