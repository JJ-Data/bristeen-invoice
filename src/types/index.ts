export type DocumentType = 'invoice' | 'receipt'

export interface Item {
  id: string
  name: string
  default_price: number
  unit: string | null
  created_at: string
}

export interface Client {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
}

export interface InvoiceItem {
  id?: string
  item_name: string
  quantity: number
  unit_price: number
  total: number
}

export interface Invoice {
  id: string
  invoice_number: string
  type: DocumentType
  client_name: string
  client_phone: string | null
  client_email: string | null
  client_address: string | null
  date: string
  due_date: string | null
  notes: string | null
  subtotal: number
  total: number
  status: 'pending' | 'paid' | 'cancelled'
  created_at: string
  invoice_items: InvoiceItem[]
}
