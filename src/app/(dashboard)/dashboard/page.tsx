import Link from 'next/link'
import { FileText, Receipt, Package, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { fmt } from '@/lib/format'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: recentDocs } = await supabase
    .from('invoices')
    .select('id, invoice_number, type, client_name, total, status, date')
    .order('created_at', { ascending: false })
    .limit(5)

  const { count: invoiceCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'invoice')

  const { count: receiptCount } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .eq('type', 'receipt')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Good day!</h2>
        <p className="text-gray-500 text-sm mt-1">What would you like to create?</p>
      </div>

      {/* Main Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/new?type=invoice" className="group bg-white rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-amber-400 transition flex items-center gap-4">
          <div className="bg-amber-100 p-4 rounded-xl group-hover:bg-amber-200 transition">
            <FileText className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">New Invoice</h3>
            <p className="text-gray-500 text-sm">Request payment from client</p>
          </div>
        </Link>

        <Link href="/new?type=receipt" className="group bg-white rounded-2xl p-6 shadow-sm border-2 border-transparent hover:border-green-400 transition flex items-center gap-4">
          <div className="bg-green-100 p-4 rounded-xl group-hover:bg-green-200 transition">
            <Receipt className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 text-lg">New Receipt</h3>
            <p className="text-gray-500 text-sm">Confirm payment received</p>
          </div>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-amber-500">{invoiceCount ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Invoices</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center">
          <p className="text-3xl font-bold text-green-500">{receiptCount ?? 0}</p>
          <p className="text-sm text-gray-500 mt-1">Receipts</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm text-center col-span-2 sm:col-span-1">
          <Link href="/items" className="flex flex-col items-center group">
            <Package className="w-8 h-8 text-gray-400 group-hover:text-amber-500 transition" />
            <p className="text-sm text-gray-500 mt-1 group-hover:text-amber-500 transition">Manage Items</p>
          </Link>
        </div>
      </div>

      {/* Recent Documents */}
      {recentDocs && recentDocs.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Recent Documents
            </h3>
            <Link href="/history" className="text-sm text-amber-500 hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {recentDocs.map(doc => (
              <Link key={doc.id} href={`/history/${doc.id}`} className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50 transition">
                <div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mr-2 ${doc.type === 'invoice' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {doc.type.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{doc.client_name}</span>
                  <span className="text-xs text-gray-400 ml-2">{doc.invoice_number}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-800">₦{fmt(doc.total)}</p>
                  <p className="text-xs text-gray-400">{doc.date}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
