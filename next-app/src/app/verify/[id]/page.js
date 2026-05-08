import { redirect } from 'next/navigation';

export default async function VerifyIdRedirect({ params }) {
  const { id } = await params;
  redirect(`/verify?id=${id}`);
}
