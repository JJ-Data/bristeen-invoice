import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import HistoryDocumentView from '@/components/HistoryDocumentView'

export default async function HistoryDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .single()

  if (!invoice) notFound()

  return <HistoryDocumentView invoice={invoice} />
}
