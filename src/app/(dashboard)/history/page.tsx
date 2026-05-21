import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { FileText, Receipt } from 'lucide-react'
import { fmt } from '@/lib/format'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, type, client_name, total, status, date, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">History</h2>
        <p className="text-sm text-gray-500 mt-1">{invoices?.length ?? 0} documents total</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {!invoices || invoices.length === 0 ? (
          <div className="p-10 text-center text-gray-400">No documents yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {invoices.map(doc => (
              <Link key={doc.id} href={`/history/${doc.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-amber-50 transition">
                <div className={`p-2 rounded-xl ${doc.type === 'invoice' ? 'bg-amber-100' : 'bg-green-100'}`}>
                  {doc.type === 'invoice'
                    ? <FileText className="w-5 h-5 text-amber-600" />
                    : <Receipt className="w-5 h-5 text-green-600" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{doc.client_name}</p>
                  <p className="text-xs text-gray-400">{doc.invoice_number} · {doc.date}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-800">₦{fmt(doc.total)}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    doc.status === 'paid'
                      ? 'bg-green-100 text-green-700'
                      : doc.status === 'cancelled'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
