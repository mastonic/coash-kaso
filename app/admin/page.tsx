import { redirect } from 'next/navigation';

/** /admin n'a pas de contenu propre : on envoie vers la gestion des accès. */
export default function AdminIndexPage() {
  redirect('/admin/users');
}
