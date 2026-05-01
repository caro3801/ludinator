import { LocalStorageProductRepository } from './adapters/storage/LocalStorageProductRepository.js'
import { LocalStorageTicketRepository } from './adapters/storage/LocalStorageTicketRepository.js'
import { CreateProduct } from './application/usecases/CreateProduct.js'
import { UpdateProduct } from './application/usecases/UpdateProduct.js'
import { DeleteProduct } from './application/usecases/DeleteProduct.js'
import { OpenTicket } from './application/usecases/OpenTicket.js'
import { AddLineToTicket } from './application/usecases/AddLineToTicket.js'
import { RemoveLineFromTicket } from './application/usecases/RemoveLineFromTicket.js'
import { CloseTicket } from './application/usecases/CloseTicket.js'
import { CancelTicket } from './application/usecases/CancelTicket.js'
import { GetSalesStats } from './application/usecases/GetSalesStats.js'
import './adapters/ui/MioumProductForm.js'
import './adapters/ui/MioumProductList.js'
import './adapters/ui/MioumTicketView.js'
import './adapters/ui/MioumStatsView.js'

const productRepo = new LocalStorageProductRepository()
const ticketRepo = new LocalStorageTicketRepository()

const createProduct = new CreateProduct(productRepo)
const updateProduct = new UpdateProduct(productRepo)
const deleteProduct = new DeleteProduct(productRepo)
const openTicket = new OpenTicket(ticketRepo)
const addLineToTicket = new AddLineToTicket(ticketRepo, productRepo)
const removeLineFromTicket = new RemoveLineFromTicket(ticketRepo)
const closeTicket = new CloseTicket(ticketRepo)
const cancelTicket = new CancelTicket(ticketRepo)
const getSalesStats = new GetSalesStats(ticketRepo)

const productForm = document.querySelector('mioum-product-form')
const productList = document.querySelector('mioum-product-list')
const ticketView = document.querySelector('mioum-ticket-view')
const statsView = document.querySelector('mioum-stats-view')

productForm.createProductUseCase = createProduct

let currentTicket = null

const refreshProducts = () => productList.refresh(productRepo)
const refreshTicket = () => ticketView.refresh(currentTicket, productRepo)
const refreshStats = () => statsView.refresh(getSalesStats)

const dispatchError = msg => document.dispatchEvent(new CustomEvent('mioum-error', { detail: { message: msg } }))

const initTicket = async () => {
  try {
    const openTickets = await ticketRepo.findByStatus('open')
    if (openTickets.length > 1) console.warn(`[mioum] ${openTickets.length} tickets ouverts trouvés, utilisation du premier.`)
    currentTicket = openTickets.length > 0 ? openTickets[0] : await openTicket.execute()
    refreshTicket()
  } catch (err) { dispatchError(err.message) }
}

refreshProducts()
initTicket()
refreshStats()

document.addEventListener('product-created', () => refreshProducts())

document.addEventListener('product-delete-requested', async e => {
  try {
    await deleteProduct.execute({ id: e.detail.productId })
    refreshProducts()
  } catch (err) { dispatchError(err.message) }
})

document.addEventListener('product-edit-requested', async e => {
  // TODO: replace with inline edit form
  const { productId, name, price } = e.detail
  const newName = window.prompt('Nouveau nom du produit :', name)
  if (newName === null) return
  const newPriceRaw = window.prompt('Nouveau prix (€) :', price)
  if (newPriceRaw === null) return
  const newPrice = parseFloat(newPriceRaw)
  if (isNaN(newPrice) || newPrice < 0) { dispatchError('Prix invalide.'); return }
  try {
    await updateProduct.execute({ id: productId, name: newName, price: newPrice })
    refreshProducts()
  } catch (err) { dispatchError(err.message) }
})

document.addEventListener('line-add-requested', async e => {
  try {
    await addLineToTicket.execute(e.detail)
    currentTicket = await ticketRepo.findById(e.detail.ticketId)
    refreshTicket()
  } catch (err) { dispatchError(err.message) }
})

document.addEventListener('line-remove-requested', async e => {
  try {
    await removeLineFromTicket.execute(e.detail)
    currentTicket = await ticketRepo.findById(e.detail.ticketId)
    refreshTicket()
  } catch (err) { dispatchError(err.message) }
})

document.addEventListener('ticket-close-requested', async e => {
  try {
    await closeTicket.execute(e.detail)
    refreshStats()
    currentTicket = await openTicket.execute()
    refreshTicket()
  } catch (err) { dispatchError(err.message) }
})

document.addEventListener('ticket-cancel-requested', async e => {
  try {
    await cancelTicket.execute(e.detail)
    currentTicket = await openTicket.execute()
    refreshTicket()
  } catch (err) { dispatchError(err.message) }
})

document.addEventListener('mioum-error', e => {
  const alert = document.getElementById('mioum-alert')
  alert.textContent = e.detail.message
  alert.hidden = false
  setTimeout(() => { alert.hidden = true }, 4000)
})
