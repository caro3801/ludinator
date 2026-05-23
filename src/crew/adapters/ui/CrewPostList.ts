import { PostRepository } from '../../ports/PostRepository'
import { Post } from '../../domain/model/Post'
import { PostId } from '../../../shared/types'

export class CrewPostList extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', (e: Event) => {
      const btn = (e.target as HTMLElement).closest<HTMLElement>('button[data-action]')
      if (!btn) return
      const { action, postId, slotId, name, slot } = btn.dataset

      if (action === 'delete-post') {
        this.dispatchEvent(new CustomEvent('post-delete-requested', {
          detail: { postId },
          bubbles: true,
        }))
      }
      if (action === 'edit-post-name') {
        this.dispatchEvent(new CustomEvent('post-edit-name-requested', {
          detail: { postId, name },
          bubbles: true,
        }))
      }
      if (action === 'delete-slot') {
        this.dispatchEvent(new CustomEvent('slot-delete-requested', {
          detail: { postId, slotId },
          bubbles: true,
        }))
      }
      if (action === 'edit-slot' && slot) {
        const slotData = JSON.parse(slot)
        this.dispatchEvent(new CustomEvent('slot-edit-requested', {
          detail: { postId, slot: slotData },
          bubbles: true,
        }))
      }
    })
  }

  async refresh(repo: PostRepository): Promise<void> {
    const posts = await repo.findAll()
    if (posts.length === 0) {
      this.innerHTML = '<p class="text-muted">Aucun poste enregistré.</p>'
      return
    }
    this.innerHTML = `<ul class="list-group">${(posts as Post[]).map(p => `
      <li class="list-group-item">
        <div class="d-flex align-items-center gap-2">
          <strong>${p.name.value}</strong>
          <span class="badge bg-secondary">min ${p.minVolunteers}</span>
          <button class="btn btn-outline-secondary btn-sm py-0 px-1 ms-auto"
            data-action="edit-post-name"
            data-post-id="${p.id}"
            data-name="${p.name.value}">✏️ Nom</button>
          <button class="btn btn-outline-danger btn-sm py-0 px-1"
            data-action="delete-post"
            data-post-id="${p.id}">🗑 Poste</button>
        </div>
        ${p.slots.length > 0 ? `
          <ul class="mt-1 mb-0">
            ${p.slots.map(s => `
              <li class="small d-flex align-items-center gap-2 py-1">
                <span class="text-muted">${s.window.day} ${s.window.startTime}–${s.window.endTime}</span>
                <button class="btn btn-outline-secondary btn-sm py-0 px-1"
                  data-action="edit-slot"
                  data-post-id="${p.id}"
                  data-slot-id="${s.id}"
                  data-slot='${JSON.stringify({ id: s.id, window: { day: s.window.day, startTime: s.window.startTime, endTime: s.window.endTime } })}'>✏️</button>
                <button class="btn btn-outline-danger btn-sm py-0 px-1"
                  data-action="delete-slot"
                  data-post-id="${p.id}"
                  data-slot-id="${s.id}">🗑</button>
              </li>
            `).join('')}
          </ul>` : ''}
      </li>
    `).join('')}</ul>`
  }
}

customElements.define('crew-post-list', CrewPostList)
