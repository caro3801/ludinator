import { WsClient } from '../../client/WsClient'

export class AdminPanel extends HTMLElement {
  #authenticated = false
  #needsSetup = true
  #ws: WsClient
  #storageKey = 'admin_authenticated'
  #passwordStorageKey = 'admin_password'

  constructor() {
    super()
    this.#ws = new WsClient(`ws://${window.location.hostname}:3000`)
    // Charger l'état d'authentification depuis localStorage
    this.#authenticated = localStorage.getItem(this.#storageKey) === 'true'
  }

  connectedCallback() {
    this.innerHTML = this.#render()
    this.#setupEventListeners()
    this.#checkAdminSetup()
  }

  #render(): string {
    if (this.#needsSetup) return this.#renderSetup()
    if (!this.#authenticated) return this.#renderLogin()
    return this.#renderActions()
  }

  #renderSetup(): string {
    return `
      <div class="card mt-4">
        <div class="card-header bg-warning">Configuration Admin</div>
        <div class="card-body">
          <p>Première configuration du panneau admin.</p>
          <form id="admin-setup-form">
            <div class="mb-3">
              <label class="form-label">Mot de passe admin</label>
              <input type="password" class="form-control" id="admin-password" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Confirmation</label>
              <input type="password" class="form-control" id="admin-confirm" required>
            </div>
            <button type="submit" class="btn btn-primary">Configurer</button>
          </form>
        </div>
      </div>
    `
  }

  #renderLogin(): string {
    return `
      <div class="card mt-4">
        <div class="card-header bg-primary text-white">Connexion Admin</div>
        <div class="card-body">
          <form id="admin-login-form">
            <div class="mb-3">
              <label class="form-label">Mot de passe</label>
              <input type="password" class="form-control" id="admin-login-password" required>
            </div>
            <button type="submit" class="btn btn-primary">Se connecter</button>
          </form>
        </div>
      </div>
    `
  }

  #renderActions(): string {
    return `
      <div class="card mt-4">
        <div class="card-header bg-dark text-white d-flex justify-content-between align-items-center">
          <span>Panneau Admin</span>
          <button id="logout-btn" class="btn btn-sm btn-light">Déconnexion</button>
        </div>
        <div class="card-body">
          <p>Réinitialiser un module :</p>
          <div class="mb-3">
            <select class="form-select" id="reset-module">
              <option value="crew">Crew (Bénévoles)</option>
              <option value="fest">Fest (Activités)</option>
              <option value="mioum">Mioum (Snack)</option>
            </select>
          </div>
          <div class="d-flex gap-2">
            <button id="reset-btn" class="btn btn-danger">
              Réinitialiser ce module
            </button>
            <button id="reset-and-go-btn" class="btn btn-primary">
              Réinitialiser et aller au module
            </button>
          </div>
        </div>
      </div>
    `
  }

  #setupEventListeners() {
    const setupForm = this.querySelector('#admin-setup-form')
    setupForm?.addEventListener('submit', (e) => {
      e.preventDefault()
      const password = (this.querySelector('#admin-password') as HTMLInputElement)?.value || ''
      const confirm = (this.querySelector('#admin-confirm') as HTMLInputElement)?.value || ''
      this.#handleSetup(password, confirm)
    })

    const loginForm = this.querySelector('#admin-login-form')
    loginForm?.addEventListener('submit', (e) => {
      e.preventDefault()
      const password = (this.querySelector('#admin-login-password') as HTMLInputElement)?.value || ''
      this.#handleLogin(password)
    })

    const resetBtn = this.querySelector('#reset-btn')
    resetBtn?.addEventListener('click', () => {
      const module = (this.querySelector('#reset-module') as HTMLSelectElement)?.value
      if (module) this.#handleReset(module)
    })

    const resetAndGoBtn = this.querySelector('#reset-and-go-btn')
    resetAndGoBtn?.addEventListener('click', () => {
      const module = (this.querySelector('#reset-module') as HTMLSelectElement)?.value
      if (module) this.#handleResetAndGo(module)
    })

    const logoutBtn = this.querySelector('#logout-btn')
    logoutBtn?.addEventListener('click', () => this.#handleLogout())
  }

  #handleLogout() {
    this.#authenticated = false
    localStorage.removeItem(this.#storageKey)
    localStorage.removeItem(this.#passwordStorageKey)
    this.innerHTML = this.#render()
    this.#setupEventListeners()
  }

  async #checkAdminSetup() {
    try {
      const resp = await this.#ws.send('admin', 'CheckAdminSetup', {})
      this.#needsSetup = resp.status === 'needs_setup'
      this.innerHTML = this.#render()
      this.#setupEventListeners()
    } catch (err) {
      console.error('Admin setup check failed:', err)
    }
  }

  async #handleSetup(password: string, confirm: string) {
    if (password !== confirm) {
      this.#showToast('Les mots de passe ne correspondent pas', 'error')
      return
    }
    if (password.length < 4) {
      this.#showToast('Mot de passe trop court (min 4 caractères)', 'error')
      return
    }

    try {
      const resp = await this.#ws.send('admin', 'SetupAdmin', { password })
      if (resp.status === 'ok') {
        this.#needsSetup = false
        this.#showToast('Configuration admin terminée', 'success')
        this.innerHTML = this.#render()
        this.#setupEventListeners()
      }
    } catch (err) {
      this.#showToast('Erreur lors de la configuration', 'error')
    }
  }

  async #handleLogin(password: string) {
    try {
      const resp = await this.#ws.send('admin', 'AdminLogin', { password })
      if (resp.status === 'ok') {
        this.#authenticated = true
        localStorage.setItem(this.#storageKey, 'true')
        localStorage.setItem(this.#passwordStorageKey, password)
        this.innerHTML = this.#render()
        this.#setupEventListeners()
      } else {
        this.#showToast('Mot de passe incorrect', 'error')
      }
    } catch (err) {
      this.#showToast('Erreur de connexion', 'error')
    }
  }

  async #handleReset(module: string) {
    const password = localStorage.getItem(this.#passwordStorageKey) || ''

    try {
      const resp = await this.#ws.send('admin', 'ResetModule', { module, password })
      if (resp.status === 'ok') {
        this.#showToast(`Module ${module} réinitialisé`, 'success')
      } else {
        this.#showToast('Mot de passe incorrect', 'error')
      }
    } catch (err) {
      this.#showToast('Erreur lors du reset', 'error')
    }
  }

  async #handleResetAndGo(module: string) {
    const password = localStorage.getItem(this.#passwordStorageKey) || ''

    try {
      const resp = await this.#ws.send('admin', 'ResetModule', { module, password })
      if (resp.status === 'ok') {
        this.#showToast(`Module ${module} réinitialisé`, 'success')
        // Redirect to the module page
        window.location.href = `/${module}/`
      } else {
        this.#showToast('Mot de passe incorrect', 'error')
      }
    } catch (err) {
      this.#showToast('Erreur lors du reset', 'error')
    }
  }

  #showToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = document.createElement('div')
    toast.className = `toast align-items-center text-white bg-${type === 'success' ? 'success' : 'danger'} border-0`
    toast.style.position = 'fixed'
    toast.style.top = '20px'
    toast.style.right = '20px'
    toast.style.zIndex = '9999'
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `
    document.body.appendChild(toast)
    const bsToast = new (window as any).bootstrap.Toast(toast, { autohide: true, delay: 3000 })
    bsToast.show()
    setTimeout(() => toast.remove(), 4000)
  }
}

customElements.define('admin-panel', AdminPanel)
