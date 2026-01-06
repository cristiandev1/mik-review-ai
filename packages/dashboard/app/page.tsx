import { redirect } from 'next/navigation';

export default function Home() {
  // Redirect to pricing page
  redirect('/pricing');
}
