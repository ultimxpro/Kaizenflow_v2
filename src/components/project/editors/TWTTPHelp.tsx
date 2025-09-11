import React from 'react';
import { Shield, HelpCircle } from 'lucide-react';

export const TWTTPHelp: React.FC = () => {
  return (
    <div className="space-y-4 text-sm text-gray-700">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <div className="font-semibold text-gray-900">TWTTP — Zéro Erreur Humaine</div>
          <div className="text-gray-600">Think What To Think Process (HERCA)</div>
        </div>
      </div>

      <p>
        Le TWTTP aide à prévenir les erreurs humaines en cartographiant l’activité, en identifiant les erreurs possibles,
        en qualifiant les causes (HERCA) et en définissant des dispositifs de prévention/détection (Poka‑Yoke).
      </p>

      <div className="space-y-2">
        <div className="font-semibold">Étapes conseillées</div>
        <ul className="list-disc ml-5 space-y-1">
          <li>Décrire l’étape/activité</li>
          <li>Identifier l’erreur potentielle et sa conséquence</li>
          <li>Qualifier la cause (HERCA) dominante</li>
          <li>Définir le contrôle visé: Prévention / Détection / Correction</li>
          <li>Concevoir un Poka‑Yoke simple, robuste et visuel</li>
          <li>Assigner, dater et suivre le statut</li>
        </ul>
      </div>

      <div className="space-y-2">
        <div className="font-semibold">Exemples de causes HERCA</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2 bg-gray-50 rounded border">Procédure / Standard</div>
          <div className="p-2 bg-gray-50 rounded border">Connaissance / Formation</div>
          <div className="p-2 bg-gray-50 rounded border">Outillage / Interface</div>
          <div className="p-2 bg-gray-50 rounded border">Communication</div>
          <div className="p-2 bg-gray-50 rounded border">Attention / Mémoire</div>
          <div className="p-2 bg-gray-50 rounded border">Environnement / Organisation</div>
        </div>
      </div>

      <div className="rounded-lg border bg-blue-50 text-blue-800 p-3 flex gap-2">
        <HelpCircle className="w-4 h-4 mt-0.5" />
        <div>
          Favorisez des contrôles de <span className="font-semibold">prévention</span> et des Poka‑Yoke
          <span className="font-semibold"> physiques/simples</span> avant les contrôles documentaires.
        </div>
      </div>
    </div>
  );
};

