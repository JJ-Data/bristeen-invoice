'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Invoice, InvoiceItem, Item } from '@/types'
import { Plus, Trash2, Save, X } from 'lucide-react'

interface Props {
  invoice: Invoice
  onCancel: () => void
  onSaved: (updated: Invoice) => void
}

export default function InvoiceEditor({ invoice, onCancel, onSaved }: Props) {
  const supabase = createClient()

  const [clientName, setClientName] = useState(invoice.client_name)
  const [clientPhone, setClientPhone] = useState(invoice.client_phone ?? '')
  const [clientEmail, setClientEmail] = useState(invoice.client_email ?? '')
  const [clientAddress, setClientAddress] = useState(invoice.client_address ?? '')
  const [date, setDate] = useState(invoice.date)
  const [dueDate, setDueDate] = useState(invoice.due_date ?? '')
  const [notes, setNotes] = useState(invoice.notes ?? '')
  const [lineItems, setLineItems] = useState<InvoiceItem[]>(invoice.invoice_items)
  const [vatRate, setVatRate] = useState(invoice.vat_rate ?? 0)
  const [saving, setSaving] = useState(false)
  const [catalogItems, setCatalogItems] = useState<Item[]>([])
  const [clientSuggestions, setClientSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const clientRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.from('items').select('*').order('name').then(({ data }) => {
      if (data) setCatalogItems(data)
    })
    supabase.from('clients').select('name').then(({ data }) => {
      if (data) setClientSuggestions(data.map(c => c.name))
    })
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const subtotal = lineItems.reduce((sum, l) => sum + l.total, 0)
  const vatAmount = subtotal * vatRate / 100
  const total = subtotal + vatAmount

  function handleClientInput(value: string) {
    setClientName(value)
    if (value.length > 0) {
      const filtered = clientSuggestions.filter(c =>
        c.toLowerCase().includes(value.toLowerCase())
      )
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  function addCatalogItem(item: Item) {
    setLineItems(prev => [
      ...prev,
      { item_name: item.name, quantity: 1, unit_price: item.default_price, total: item.default_price },
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

  async function handleSave() {
    if (!clientName || lineItems.length === 0) return
    setSaving(true)

    const { data: updated, error } = await supabase
      .from('invoices')
      .update({
        client_name: clientName,
        client_phone: clientPhone || null,
        client_email: clientEmail || null,
        client_address: clientAddress || null,
        date,
        due_date: dueDate || null,
        notes: notes || null,
        subtotal,
        vat_rate: vatRate,
        total,
      })
      .eq('id', invoice.id)
      .select()
      .single()

    if (error || !updated) {
      setSaving(false)
      alert('Failed to save. Please try again.')
      return
    }

    await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id)
    await supabase.from('invoice_items').insert(
      lineItems.map(l => ({
        invoice_id: invoice.id,
        item_name: l.item_name,
        quantity: l.quantity,
        unit_price: l.unit_price,
        total: l.total,
      }))
    )

    setSaving(false)
    onSaved({ ...updated, invoice_items: lineItems })
  }

  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-lg">Edit {invoice.type.charAt(0).toUpperCase() + invoice.type.slice(1)}</h3>
        <button onClick={onCancel} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition">
          <X className="w-4 h-4" /> Cancel
        </button>
      </div>

      {/* Client Details */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-gray-700">Client Details</h3>
        <div ref={clientRef} className="relative">
          <input
            value={clientName}
            onChange={e => handleClientInput(e.target.value)}
            onFocus={() => setShowSuggestions(
              clientSuggestions.some(c => c.toLowerCase().includes(clientName.toLowerCase()))
            )}
            placeholder="Client name *"
            className={`w-full ${inputCls}`}
          />
          {showSuggestions && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
              {clientSuggestions
                .filter(c => c.toLowerCase().includes(clientName.toLowerCase()))
                .map(name => (
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
          <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="Phone" className={inputCls} />
          <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="Email" className={inputCls} />
        </div>
        <input value={clientAddress} onChange={e => setClientAddress(e.target.value)} placeholder="Address" className={`w-full ${inputCls}`} />
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl p-5 shadow-sm grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} className={`w-full ${inputCls}`} />
        </div>
        {invoice.type === 'invoice' && (
          <div>
            <label className="text-xs font-medium text-gray-500 block mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className={`w-full ${inputCls}`} />
          </div>
        )}
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-gray-700">Items</h3>

        {catalogItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {catalogItems.map(item => (
              <button
                key={item.id}
                onClick={() => addCatalogItem(item)}
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
                  type="number" min="0"
                  value={line.quantity}
                  onChange={e => updateLine(i, 'quantity', parseFloat(e.target.value) || 0)}
                  className="col-span-2 border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="number" min="0"
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

            {/* Summary */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span className="font-semibold text-gray-700">₦{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span>VAT / Tax</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number" min="0" max="100" step="0.5"
                      value={vatRate}
                      onChange={e => setVatRate(parseFloat(e.target.value) || 0)}
                      className="w-16 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                    <span className="text-gray-400">%</span>
                  </div>
                </div>
                <span className="font-semibold text-gray-700">₦{vatAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold text-gray-800 border-t border-gray-100 pt-2">
                <span>Total</span>
                <span>₦{total.toFixed(2)}</span>
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
          className={`w-full resize-none ${inputCls}`}
        />
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !clientName || lineItems.length === 0}
        className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold py-4 rounded-2xl transition text-lg flex items-center justify-center gap-2"
      >
        {saving ? 'Saving…' : <><Save className="w-5 h-5" /> Save Changes</>}
      </button>
    </div>
  )
}
