'use client'

import { useState } from 'react'
import { Invoice } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { generateInvoiceNumber } from '@/lib/invoice-number'
import InvoicePreview from './InvoicePreview'
import InvoiceEditor from './InvoiceEditor'
import { useRouter } from 'next/navigation'
import { Trash2, ReceiptText, Pencil, Copy } from 'lucide-react'

export default function HistoryDocumentView({ invoice }: { invoice: Invoice }) {
  const router = useRouter()
  const supabase = createClient()
  const [current, setCurrent] = useState(invoice)
  const [status, setStatus] = useState(invoice.status)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [converting, setConverting] = useState(false)
  const [duplicating, setDuplicating] = useState(false)

  async function handleStatusChange(newStatus: 'pending' | 'paid' | 'cancelled') {
    await supabase.from('invoices').update({ status: newStatus }).eq('id', invoice.id)
    setStatus(newStatus)
  }

  async function handleDelete() {
    if (!confirm('Delete this document permanently?')) return
    setDeleting(true)
    await supabase.from('invoices').delete().eq('id', invoice.id)
    router.push('/history')
    router.refresh()
  }

  async function handleDuplicate() {
    setDuplicating(true)
    const { data: copy, error } = await supabase.from('invoices').insert({
      invoice_number: generateInvoiceNumber(current.type),
      type: current.type,
      client_name: current.client_name,
      client_phone: current.client_phone,
      client_email: current.client_email,
      client_address: current.client_address,
      date: new Date().toISOString().split('T')[0],
      due_date: current.due_date,
      notes: current.notes,
      subtotal: current.subtotal,
      vat_rate: current.vat_rate,
      total: current.total,
      status: current.type === 'receipt' ? 'paid' : 'pending',
    }).select().single()

    if (error || !copy) {
      setDuplicating(false)
      alert('Failed to duplicate. Please try again.')
      return
    }

    await supabase.from('invoice_items').insert(
      current.invoice_items.map(item => ({
        invoice_id: copy.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }))
    )

    router.push(`/history/${copy.id}`)
  }

  async function handleCreateReceipt() {
    setConverting(true)
    const { data: receipt, error } = await supabase.from('invoices').insert({
      invoice_number: generateInvoiceNumber('receipt'),
      type: 'receipt',
      client_name: current.client_name,
      client_phone: current.client_phone,
      client_email: current.client_email,
      client_address: current.client_address,
      date: new Date().toISOString().split('T')[0],
      due_date: null,
      notes: current.notes,
      subtotal: current.subtotal,
      vat_rate: current.vat_rate,
      total: current.total,
      status: 'paid',
    }).select().single()

    if (error || !receipt) {
      setConverting(false)
      alert('Failed to create receipt. Please try again.')
      return
    }

    await supabase.from('invoice_items').insert(
      current.invoice_items.map(item => ({
        invoice_id: receipt.id,
        item_name: item.item_name,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }))
    )

    router.push(`/history/${receipt.id}`)
  }

  if (editing) {
    return (
      <InvoiceEditor
        invoice={{ ...current, status }}
        onCancel={() => setEditing(false)}
        onSaved={updated => { setCurrent(updated); setEditing(false) }}
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-600">Status:</span>
        {(['pending', 'paid', 'cancelled'] as const).map(s => (
          <button
            key={s}
            onClick={() => handleStatusChange(s)}
            className={`text-sm font-semibold px-3 py-1 rounded-full transition capitalize ${
              status === s
                ? s === 'paid' ? 'bg-green-500 text-white' : s === 'cancelled' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {s}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-semibold text-amber-600 hover:text-amber-800 flex items-center gap-1.5 transition"
          >
            <Pencil className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={handleDuplicate}
            disabled={duplicating}
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Copy className="w-4 h-4" />
            {duplicating ? 'Copying…' : 'Duplicate'}
          </button>
          {current.type === 'invoice' && (
            <button
              onClick={handleCreateReceipt}
              disabled={converting}
              className="text-sm font-semibold text-green-600 hover:text-green-800 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <ReceiptText className="w-4 h-4" />
              {converting ? 'Creating…' : 'Create Receipt'}
            </button>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1 transition disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <InvoicePreview invoice={{ ...current, status }} onBack={() => router.push('/history')} />
    </div>
  )
}
