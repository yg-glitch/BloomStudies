import { redirect } from 'next/navigation'

// "Bloom Learn" was renamed to "Academy". Preserve old links.
export default function LearnRedirect() {
  redirect('/dashboard/academy')
}
