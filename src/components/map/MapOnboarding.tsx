import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    icon: '🔍',
    title: 'Cherche un pro',
    text: `Tu peux écrire le nom d'un monsieur, d'une entreprise ou d'une ville dans la grande loupe. La carte va te montrer tous les gentils pros qui correspondent !`,
  },
  {
    icon: '❤️',
    title: 'Ajoute à tes favoris',
    text: `Si tu aimes beaucoup un pro, clique sur le petit cœur. Il devient tout rose ! Tu pourras le retrouver plus tard dans ta liste de favoris, comme ton doudou préféré.`,
  },
  {
    icon: '⭐',
    title: 'Garde ta recherche préférée',
    text: `Quand tu fais une super recherche, tu peux appuyer sur "Sauvegarder cette recherche". Comme ça, tu la retrouves plus tard, sans tout retaper !`,
  },
  {
    icon: '🧩',
    title: 'Filtre les pros',
    text: `Tu peux choisir des métiers ou des mots rigolos (comme "B2B" ou "Innovation") pour voir seulement les pros qui font ça.`,
  },
  {
    icon: '📋',
    title: 'Regarde la liste',
    text: `Tu peux voir tous les pros dans une grande liste, avec leur photo et leur nom. Clique sur un pro pour le voir sur la carte !`,
  },
  {
    icon: '🟣',
    title: 'Gros points magiques',
    text: `Quand il y a beaucoup de pros au même endroit, la carte fait un gros point avec un nombre. Clique dessus pour zoomer et voir tous les copains cachés !`,
  },
  {
    icon: '✨',
    title: `Découvre la fiche d'un pro`,
    text: `Quand tu cliques sur un pro, une jolie boîte apparaît avec sa photo, son nom, son métier, et des boutons pour en savoir plus ou aller le voir sur la carte.`,
  },
  {
    icon: '🗺️',
    title: `Voir la carte ou l'itinéraire`,
    text: `Appuie sur "Voir la carte" pour tout savoir sur le pro, ou sur "Mon itinéraire" pour que la carte t'explique comment y aller !`,
  },
  {
    icon: '🏅',
    title: 'Gagne des badges',
    text: `Plus tu explores la carte, plus tu gagnes des médailles ! Par exemple, si tu découvres plein de pros ou de villes différentes, tu débloques des surprises.`,
  },
  {
    icon: '💫',
    title: 'Des animations partout',
    text: `Quand tu bouges la carte ou cliques sur un pro, il y a des petites animations et des lumières qui rendent tout plus joli !`,
  },
  {
    icon: '⏳',
    title: 'Chargement tout doux',
    text: `Quand la carte charge, tu vois des formes qui bougent, comme un dessin animé, pour patienter sans t'ennuyer.`,
  },
  {
    icon: '🎨',
    title: 'Change la couleur de la carte',
    text: `Tu peux choisir si tu veux une carte sombre, claire, ou même avec des photos satellites. C'est toi le chef !`,
  },
  {
    icon: '📍',
    title: 'Où suis-je ?',
    text: `Appuie sur le bouton "Ma position" et la carte te montre où tu es, comme un petit GPS magique.`,
  },
  {
    icon: '🧠',
    title: 'La carte a de la mémoire',
    text: `Quand tu reviens, la carte se souvient de l'endroit où tu étais et du style que tu préfères.`,
  },
  {
    icon: '📱💻',
    title: 'Ça marche partout',
    text: `La carte est super facile à utiliser, que tu sois sur un grand ordinateur ou sur le téléphone de papa/maman.`,
  },
];

export const MapOnboarding: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <div className="fixed inset-0 z-[99999] bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center gap-6 relative animate-fade-in-up">
        <div className="text-5xl mb-2">{STEPS[step].icon}</div>
        <h2 className="text-xl font-bold text-blue-900 mb-1 text-center">{STEPS[step].title}</h2>
        <div className="text-blue-900 text-base text-center mb-2">{STEPS[step].text}</div>
        <div className="flex gap-3 mt-2">
          {!isFirst && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-xl px-6 py-2">Précédent</Button>
          )}
          {!isLast ? (
            <Button onClick={() => setStep(s => s + 1)} className="rounded-xl px-6 py-2 bg-blue-700 text-white font-bold shadow-lg hover:bg-blue-800 transition">Suivant</Button>
          ) : (
            <Button onClick={onClose} className="rounded-xl px-6 py-2 bg-blue-700 text-white font-bold shadow-lg hover:bg-blue-800 transition">Terminer</Button>
          )}
        </div>
        <div className="absolute top-2 right-4 text-xs text-blue-400">{step + 1} / {STEPS.length}</div>
      </div>
    </div>
  );
};

export default MapOnboarding; 