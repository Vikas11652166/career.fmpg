import RecommendationsPanel from '@/components/admin/RecommendationsPanel';

export const metadata = { title: 'AI Recommendations | FMPG Admin' };

export default function RecommendationsPage() {
  return (
    <main className="min-h-screen p-6 bg-transparent">
      <RecommendationsPanel />
    </main>
  );
}
