import { createClient } from '@/lib/supabase/server'
import ItemsManager from '@/components/ItemsManager'

export default async function ItemsPage() {
  const supabase = await createClient()
  const { data: items } = await supabase.from('items').select('*').order('name')

  return <ItemsManager initialItems={items ?? []} />
}
