export function generateInvoiceNumber(type: 'invoice' | 'receipt'): string {
  const prefix = type === 'invoice' ? 'INV' : 'REC'
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const random = Math.floor(Math.random() * 9000 + 1000)
  return `${prefix}-${year}${month}-${random}`
}
