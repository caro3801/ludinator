import Chart from 'chart.js/auto'
import { bucketBatches } from './bucketBatches'

interface EntryBatch {
  timestamp: number
  adults: number
  children: number
  families: number
}

interface LogLike {
  allBatches: EntryBatch[]
}

export class FestAttendanceChart extends HTMLElement {
  #chart: Chart | null = null
  #log: LogLike | null = null
  #interval = 30

  connectedCallback(): void {
    this.#renderShell()
  }

  refresh(log: LogLike): void {
    this.#log = log
    if (!this.querySelector('canvas')) this.#renderShell()
    this.#updateChart()
  }

  #renderShell(): void {
    this.innerHTML = `
      <div class="d-flex align-items-center gap-3 mb-3">
        <label class="form-label mb-0 small">Intervalle (min)</label>
        <input class="form-control form-control-sm" style="width:80px" type="number"
          name="interval" value="${this.#interval}" min="1" />
      </div>
      <div class="chart-area position-relative" style="min-height:200px">
        <canvas></canvas>
        <p class="empty-notice text-muted text-center" hidden>Aucune donnée à afficher.</p>
      </div>
    `
    this.querySelector('input[name="interval"]')?.addEventListener('change', (e: Event) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10)
      if (val > 0) { this.#interval = val; this.#updateChart() }
    })
  }

  #updateChart(): void {
    const batches = this.#log?.allBatches ?? []
    const buckets = bucketBatches(batches, this.#interval)
    const empty = !buckets.length

    const emptyNotice = this.querySelector<HTMLElement>('.empty-notice')
    const canvas = this.querySelector<HTMLCanvasElement>('canvas')
    if (emptyNotice) emptyNotice.hidden = !empty
    if (canvas) canvas.hidden = empty

    if (empty) {
      this.#chart?.destroy()
      this.#chart = null
      return
    }

    if (!canvas) return
    const labels = buckets.map(b => b.label)

    if (this.#chart) {
      this.#chart.data.labels = labels
      this.#chart.data.datasets[0].data = buckets.map(b => b.adults)
      this.#chart.data.datasets[1].data = buckets.map(b => b.children)
      this.#chart.update()
    } else {
      this.#chart = new Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              label: 'Adultes',
              data: buckets.map(b => b.adults),
              backgroundColor: 'rgba(13, 110, 253, 0.7)',
              stack: 'attendance',
            },
            {
              label: 'Enfants',
              data: buckets.map(b => b.children),
              backgroundColor: 'rgba(255, 193, 7, 0.7)',
              stack: 'attendance',
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            x: { stacked: true, title: { display: true, text: 'Heure' } },
            y: { stacked: true, beginAtZero: true, ticks: { stepSize: 1 } },
          },
          plugins: { legend: { display: true } },
        },
      })
    }
  }
}

customElements.define('fest-attendance-chart', FestAttendanceChart)
