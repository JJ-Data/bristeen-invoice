'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Item } from '@/types'
import { Plus, Trash2, Pencil, Check, X } from 'lucide-react'

export default function ItemsManager({ initialItems }: { initialItems: Item[] }) {
  const supabase = createClient()
  const [items, setItems] = useState<Item[]>(initialItems)
  const [newName, setNewName] = useState('')
  const [newPrice, setNewPrice] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ name: string; default_price: string; unit: string }>({ name: '', default_price: '', unit: '' })

  async function handleAdd() {
    if (!newName || !newPrice) return
    setAdding(true)
    const { data, error } = await supabase
      .from('items')
      .insert({ name: newName, default_price: parseFloat(newPrice), unit: newUnit || null })
      .select()
      .single()

    if (!error && data) {
      setItems(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setNewName('')
      setNewPrice('')
      setNewUnit('')
    }
    setAdding(false)
  }

  function startEdit(item: Item) {
    setEditingId(item.id)
    setEditValues({ name: item.name, default_price: String(item.default_price), unit: item.unit ?? '' })
  }

  async function saveEdit(id: string) {
    const { data, error } = await supabase
      .from('items')
      .update({ name: editValues.name, default_price: parseFloat(editValues.default_price), unit: editValues.unit || null })
      .eq('id', id)
      .select()
      .single()

    if (!error && data) {
      setItems(prev => prev.map(i => i.id === id ? data : i).sort((a, b) => a.name.localeCompare(b.name)))
    }
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await supabase.from('items').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Manage Items</h2>
        <p className="text-sm text-gray-500 mt-1">Add items and set their default prices. Prices can always be edited when creating a document.</p>
      </div>

      {/* Add New Item */}
      <div className="bg-white rounded-2xl p-5 shadow-sm space-y-3">
        <h3 className="font-bold text-gray-700">Add New Item</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Item name *"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            type="number"
            value={newPrice}
            onChange={e => setNewPrice(e.target.value)}
            placeholder="Default price (₦) *"
            min="0"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <input
            value={newUnit}
            onChange={e => setNewUnit(e.target.value)}
            placeholder="Unit (e.g. per plate)"
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={adding || !newName || !newPrice}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-xl transition text-sm"
        >
          <Plus className="w-4 h-4" /> {adding ? 'Adding…' : 'Add Item'}
        </button>
      </div>

      {/* Items List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No items yet. Add your first item above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Item</th>
                <th className="text-left px-5 py-3 font-semibold text-gray-600 hidden sm:table-cell">Unit</th>
                <th className="text-right px-5 py-3 font-semibold text-gray-600">Default Price</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} className="border-b border-gray-100 last:border-0 hover:bg-amber-50 transition">
                  {editingId === item.id ? (
                    <>
                      <td className="px-5 py-3">
                        <input value={editValues.name} onChange={e => setEditValues(v => ({ ...v, name: e.target.value }))} className="border border-amber-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400" />
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <input value={editValues.unit} onChange={e => setEditValues(v => ({ ...v, unit: e.target.value }))} className="border border-amber-300 rounded px-2 py-1 text-sm w-full focus:outline-none focus:ring-2 focus:ring-amber-400" />
                      </td>
                      <td className="px-5 py-3">
                        <input type="number" value={editValues.default_price} onChange={e => setEditValues(v => ({ ...v, default_price: e.target.value }))} className="border border-amber-300 rounded px-2 py-1 text-sm w-full text-right focus:outline-none focus:ring-2 focus:ring-amber-400" />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => saveEdit(item.id)} className="text-green-500 hover:text-green-700"><Check className="w-4 h-4" /></button>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3 font-medium text-gray-800">{item.name}</td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{item.unit ?? '—'}</td>
                      <td className="px-5 py-3 text-right font-medium text-gray-800">₦{item.default_price.toFixed(2)}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2 justify-end">
                          <button onClick={() => startEdit(item)} className="text-gray-400 hover:text-amber-500 transition"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-500 transition"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
