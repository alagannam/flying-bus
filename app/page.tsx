import { redirect } from 'next/navigation'

// app.theflyingbus.com root redirects to the marketing site
export default function RootPage() {
  redirect('https://theflyingbus.com')
}
