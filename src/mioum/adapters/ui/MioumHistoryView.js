export class MioumHistoryView extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]')
      if (!btn) return
      const { action, ticketId } = btn.dataset
      if (action === 'reopen-ticket') {
        this.dispatchEvent(new CustomEvent('ticket-reopen-requested', {
          detail: { ticketId },
          bubbles: true,
        }))
      }
    })
  }

  async refresh(ticketRepo) {
    const all = await ticketRepo.findAll()
    const past = all
      .filter(t => !t.isOpen)
      .sort((a, b) => (b.closedAt ?? 0) - (a.closedAt ?? 0))

    if (past.length === 0) {
      this.innerHTML = '<p class="text-muted">Aucun ticket dans l\'historique.</p>'
      return
    }

    this.innerHTML = `
      <table class="table table-sm table-hover">
        <thead>
          <tr>
            <th>Date</th>
            <th>Statut</th>
            <th>Lignes</th>
            <th>Total</th>
            <th>Paiement</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${past.map(t => {
            const date = t.closedAt ? new Date(t.closedAt).toLocaleString('fr-FR') : '—'
            const statusLabel = t.status === 'closed' ? 'Encaissé' : 'Annulé'
            const statusClass = t.status === 'closed' ? 'success' : 'secondary'
            const paymentLabel = t.paymentMethod === 'cash' ? 'Espèces'
              : t.paymentMethod === 'card' ? 'Carte bleue'
              : '—'
            return `
              <tr>
                <td class="text-nowrap">${date}</td>
                <td><span class="badge bg-${statusClass}">${statusLabel}</span></td>
                <td>${t.lines.length}</td>
                <td>${t.total.toFixed(2)} €</td>
                <td>${paymentLabel}</td>
                <td>
                  ${t.status === 'closed' ? `
                    <button class="btn btn-outline-warning btn-sm py-0"
                      data-action="reopen-ticket"
                      data-ticket-id="${t.id}">Rouvrir</button>
                  ` : ''}
                </td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    `
  }
}

customElements.define('mioum-history-view', MioumHistoryView)
