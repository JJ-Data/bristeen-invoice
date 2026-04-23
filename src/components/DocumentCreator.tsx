'use client'

import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generateInvoiceNumber } from '@/lib/invoice-number'
import { Item, InvoiceItem, DocumentType } from '@/types'
import { Plus, Trash2, Save } from 'lucide-react'

interface Props {
  items: Item[]
  existingClients: string[]
}

export default function DocumentCreator({ items, existingClients }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const [docType, setDocType] = useState<DocumentType>(
    (searchParams.get('type') as DocumentType) ?? 'invoice'
  )
  const [clientName, setClientName] = useState('')
  const [clientPhone, setClientPhone] = useState('')
  const [clientEmail, setClientEmail] = useState('')
  const [clientAddress, setClientAddress] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lineItems, setLineItems] = useState<InvoiceItem[]>([])
  const [saving, setSaving] = useState(false)
  const [clientSuggestions, setClientSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [invoiceNumber] = useState(() => generateInvoiceNumber(docType))
  const clientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleClientInput(value: string) {
    setClientName(value)
    if (value.length > 0) {
      const filtered = existingClients.filter(c =>
        c.toLowerCase().includes(value.toLowerCase())
      )
      setClientSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  function addItem(item: Item) {
    setLineItems(prev => [
      ...prev,
      { item_name: item.name, quantity: 1, unit_price: item.default_price, total: item.default_price }
    ])
  }

  function updateLine(index: number, field: 'quantity' | 'unit_price', value: number) {
    setLineItems(prev => prev.map((line, i) => {
      if (i !== index) return line
      const updated = { ...line, [field]: value }
      updated.total = updated.quantity * updated.unit_price
      return updated
    }))
  }

  function removeLine(index: number) {
    setLineItems(prev => prev.filter((_, i) => i !== index))
  }

  function addCustomLine() {
    setLineItems(prev => [...prev, { item_name: '', quantity: 1, unit_price: 0, total: 0 }])
  }

  const subtotal = lineItems.reduce((sum, l) => sum + l.total, 0)
  const total = subtotal

  async function handleSave() {
    if (!clientName || lineItems.length === 0) return
    setSaving(true)

    const { data: invoice, error } = await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      type: docType,
      client_name: clientName,
      client_phone: clientPhone || null,
      client_email: clientEmail || null,
      client_address: clientAddress || null,
      date,
      due_date: dueDate || null,
      notes: notes || null,
      subtotal,
      total,
      status: docType === 'receipt' ? 'paid' : 'pending',
    }).select().single()

    if (error || !invoice) {
      setSaving(false)
      alert('Failed to save. Please try again.')
      return
    }

    await supabase.from('invoice_items').insert(
      lineItems.map(l => ({ ...l, invoice_id: invoice.id }))
    )

    // Upsert client for future autocomplete
    await supabase.from('clients').upsert(
      { name: clientName, phone: clientPhone || null, email: clientEmail || null, address: clientAddress || null },
      { onConflict: 'name' }
    )

    setSaving(false)
    router.push(`/history/${invoice.id}`)
  }

  return (
    <div className="space-y-5">
      {/* Type Selector */}
      <div className="flex gap-3">
        {(['invoice', 'receipt'] as DocumentType[]).map(t => (
          <button
            key={t}
            onClick={() => setDocType(t)}
            className={`flex-1 py-3 rounded-xl font-semibold capitalize transition border-2 ${
              docType === t
                ? t === 'invoice'
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-green-500 border-green-500 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Client Details */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-gray-700">Client Details</h3>
        <div ref={clientRef} className="relative">
          <input
            value={clientName}
            onChange={e => handleClientInput(e.target.value)}
            onFocus={() => clientName && setShowSuggestions(clientSuggestions.length > 0)}
            placeholder="Client name *"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          {showSuggestions && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
              {clientSuggestions.map(name => (
                <li
                  key={name}
                  onClick={() => { setClientName(name); setShowSuggestions(false) }}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-amber-50"
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Phone" className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email" className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Address" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400" />
      </div>

      {/* Date */}
      <div className="bg-white rounded-2xl p-5 shadow-sm grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400" />
        </div>
        {docType === 'invoice' && (
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
        )}
      </div>

      {/* Item Picker */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-gray-700">Items</h3>

        {items.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className="bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-sm px-3 py-1.5 rounded-full transition flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> {item.name}
              </button>
            ))}
          </div>
        )}

        <button onClick={addCustomLine} className="text-sm text-gray-500 hover:text-amber-600 flex items-center gap-1 transition">
          <Plus className="w-4 h-4" /> Add custom line
        </button>

        {/* Line Items Table */}
        {lineItems.length > 0 && (
          <div className="space-y-2 mt-2">
            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 px-1">
              <span className="col-span-5">Item</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-3 text-right">Price</span>
              <span className="col-span-1 text-right">Total</span>
              <span className="col-span-1" />
            </div>
            {lineItems.map((line, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  value={line.item_name}
                  onChange={e => setLineItems(prev => prev.map((l, idx) => idx === i ? { ...l, item_name: e.target.value } : l))}
                  className="col-span-5 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="number"
                  min="0"
                  value={line.quantity}
                  onChange={e => updateLine(i, 'quantity', parseFloat(e.target.value) || 0)}
                  className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="number"
                  min="0"
                  value={line.unit_price}
                  onChange={e => updateLine(i, 'unit_price', parseFloat(e.target.value) || 0)}
                  className="col-span-3 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-right text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <span className="col-span-1 text-sm text-right text-gray-700 font-medium">
                  {line.total.toFixed(2)}
                </span>
                <button onClick={() => removeLine(i)} className="col-span-1 text-gray-300 hover:text-red-500 transition flex justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <div className="text-right space-y-1">
                <p className="text-sm text-gray-500">Subtotal: <span className="font-semibold text-gray-700">₦{subtotal.toFixed(2)}</span></p>
                <p className="text-lg font-bold text-gray-800">Total: ₦{total.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          rows={2}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || !clientName || lineItems.length === 0}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition text-lg flex items-center justify-center gap-2"
      >
        {saving ? 'Saving…' : (
          <><Save className="w-5 h-5" /> Save & Preview {docType.charAt(0).toUpperCase() + docType.slice(1)}</>
        )}
      </button>
    </div>
  )
}
