import { PlanGuard } from '@/components/subscription/PlanGuard';
import { CardEditor } from '@/components/cards/CardEditor';

interface CardEditPageProps {
  params: {
    id: string;
  };
}

export default function CardEditPage({ params }: CardEditPageProps) {
  return (
    <PlanGuard feature="customThemes">
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50/80 via-blue-100/60 to-indigo-100/60 backdrop-blur-2xl py-12 px-2 animate-fade-in-up">
        <div className="w-full max-w-2xl mx-auto rounded-3xl bg-white/70 backdrop-blur-xl shadow-2xl border border-blue-100/40 p-8 flex flex-col items-center relative overflow-hidden animate-fade-in-up">
          {/* Halo décoratif */}
          <span className="absolute -inset-4 -z-10 pointer-events-none blur-2xl opacity-40 animate-pulse"
            style={{background:'radial-gradient(circle at 60% 30%,rgba(99,179,237,0.18) 0,transparent 70%)'}}/>
          {/* Header premium */}
          <h1 className="text-2xl md:text-3xl font-bold text-blue-900 mb-6 tracking-tight animate-fade-in-up bg-gradient-to-r from-black via-blue-400 to-indigo-400 bg-clip-text text-transparent">Modifier votre carte</h1>
          <CardEditor cardId={params.id} />
        </div>
      </div>
    </PlanGuard>
  );
} 