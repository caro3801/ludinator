export class MioumStatsView extends HTMLElement {
  async refresh(statsUseCase) {
    const stats = await statsUseCase.execute()

    if (stats.ticketCount === 0) {
      this.innerHTML = '<p class="text-muted">Aucune vente enregistrée.</p>'
      return
    }

    this.innerHTML = `
      <div class="mb-3 d-flex gap-4">
        <div>
          <div class="fw-bold">${stats.ticketCount}</div>
          <div class="text-muted small">Tickets</div>
        </div>
        <div>
          <div class="fw-bold">${stats.totalRevenue} €</div>
          <div class="text-muted small">Recette totale</div>
        </div>
        <div>
          <div class="fw-bold">${stats.averageTicket} €</div>
          <div class="text-muted small">Panier moyen</div>
        </div>
      </div>
      <table class="table table-sm table-striped">
        <thead>
          <tr>
            <th>Produit</th>
            <th class="text-end">Quantité</th>
            <th class="text-end">Recette (€)</th>
          </tr>
        </thead>
        <tbody>
          ${stats.breakdown.map(b => `
            <tr>
              <td>${b.productName}</td>
              <td class="text-end">${b.quantity}</td>
              <td class="text-end">${b.revenue} €</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }
}

customElements.define('mioum-stats-view', MioumStatsView)
