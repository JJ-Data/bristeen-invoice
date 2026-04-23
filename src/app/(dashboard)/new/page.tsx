import { createClient } from '@/lib/supabase/server'
import DocumentCreator from '@/components/DocumentCreator'

export default async function NewDocumentPage() {
  const supabase = await createClient()

  const [{ data: items }, { data: clients }] = await Promise.all([
    supabase.from('items').select('*').order('name'),
    supabase.from('clients').select('name').order('name'),
  ])

  return (
    <DocumentCreator
      items={items ?? []}
      existingClients={(clients ?? []).map(c => c.name)}
    />
  )
}
