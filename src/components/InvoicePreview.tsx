'use client'

import { useEffect, useState } from 'react'
import { Invoice } from '@/types'
import { fmt } from '@/lib/format'
import { ArrowLeft, Download } from 'lucide-react'
import Image from 'next/image'

interface Props {
  invoice: Invoice
  onBack: () => void
}

export default function InvoicePreview({ invoice, onBack }: Props) {
  const [signature, setSignature] = useState<string | null>(null)

  useEffect(() => {
    setSignature(localStorage.getItem('bristeen_signature') ?? '/signature.png')
  }, [])

  function handleDownload() {
    window.print()
  }

  const isReceipt = invoice.type === 'receipt'

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <button
          onClick={handleDownload}
          className="ml-auto flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded-xl transition"
        >
          <Download className="w-4 h-4" /> Download PDF
        </button>
      </div>

      {/* Document */}
      <div className="invoice-print-area bg-white rounded-2xl shadow-sm p-8 font-sans">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 relative">
              <Image src="/bristeen-logo.png" alt="Bristeen Catering" fill className="object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-gray-800 text-lg">Bristeen Catering Services</h1>
              <p className="text-xs text-gray-400">Professional Catering Solutions</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-2xl font-extrabold uppercase ${isReceipt ? 'text-green-600' : 'text-amber-500'}`}>
              {invoice.type}
            </span>
            <p className="text-xs text-gray-400 mt-1"># {invoice.invoice_number}</p>
            <p className="text-xs text-gray-400">{invoice.date}</p>
            {invoice.due_date && (
              <p className="text-xs text-red-400">Due: {invoice.due_date}</p>
            )}
          </div>
        </div>

        {/* Client */}
        <div className="mb-8">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Bill To</p>
          <p className="font-bold text-gray-800 text-base">{invoice.client_name}</p>
          {invoice.client_phone && <p className="text-sm text-gray-500">{invoice.client_phone}</p>}
          {invoice.client_email && <p className="text-sm text-gray-500">{invoice.client_email}</p>}
          {invoice.client_address && <p className="text-sm text-gray-500">{invoice.client_address}</p>}
        </div>

        {/* Items Table */}
        <table className="w-full text-xs sm:text-sm mb-6 table-fixed">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[10%]" />
            <col className="w-[25%]" />
            <col className="w-[25%]" />
          </colgroup>
          <thead>
            <tr className="border-b-2 border-gray-800">
              <th className="text-left py-2 pr-2 font-semibold text-gray-700">Description</th>
              <th className="text-center py-2 px-1 font-semibold text-gray-700">Qty</th>
              <th className="text-right py-2 px-1 font-semibold text-gray-700">Unit Price</th>
              <th className="text-right py-2 pl-1 font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.invoice_items.map((item, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2 pr-2 text-gray-700 break-words">{item.item_name}</td>
                <td className="py-2 px-1 text-center text-gray-600">{item.quantity}</td>
                <td className="py-2 px-1 text-right text-gray-600 whitespace-nowrap">₦{fmt(item.unit_price)}</td>
                <td className="py-2 pl-1 text-right font-medium text-gray-800 whitespace-nowrap">₦{fmt(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-48 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>₦{fmt(invoice.subtotal)}</span>
            </div>
            {invoice.vat_rate > 0 && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>VAT ({invoice.vat_rate}%)</span>
                <span>₦{fmt(invoice.subtotal * invoice.vat_rate / 100)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base text-gray-800 border-t pt-1 border-gray-300">
              <span>Total</span>
              <span>₦{fmt(invoice.total)}</span>
            </div>
            {isReceipt && (
              <div className="flex justify-between text-green-600 font-semibold text-sm">
                <span>Amount Paid</span>
                <span>₦{fmt(invoice.total)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-gray-50 rounded-lg p-3 mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase mb-1">Notes</p>
            <p className="text-sm text-gray-600">{invoice.notes}</p>
          </div>
        )}

        {/* Payment Details — invoices only */}
        {!isReceipt && (
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Payment Details</p>
            <div className="space-y-0.5 text-sm text-gray-700">
              <p><span className="text-gray-400">Bank:</span> <span className="font-medium">Access Bank</span></p>
              <p><span className="text-gray-400">Account Name:</span> <span className="font-medium">Bristeen Catering Services</span></p>
              <p><span className="text-gray-400">Account No:</span> <span className="font-bold tracking-widest">1463898191</span></p>
            </div>
          </div>
        )}

        {/* Signature */}
        <div className="mt-8 flex justify-end">
          <div className="text-center min-w-40">
            {signature
              ? <img src={signature} alt="Signature" className="h-12 mx-auto mb-1 object-contain" />
              : <div className="h-12 mb-1" />
            }
            <div className="border-t border-gray-400 pt-1">
              <p className="text-xs text-gray-500">Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 mt-6 text-center">
          <p className="text-xs text-gray-400">Thank you for choosing Bristeen Catering Services!</p>
        </div>
      </div>
    </div>
  )
}
