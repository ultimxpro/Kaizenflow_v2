import React from 'react';
import { A3Module } from '../../types/database';
import { X } from 'lucide-react';
import { FiveWhyEditor } from './editors/FiveWhyEditor';
import { IshikawaEditor } from './editors/IshikawaEditor';
// MODIFICATION ICI : L'import de FiveWOneHEditor a été supprimé
import { OplEditor } from './editors/OplEditor';
import { FiveSEditorNew } from './editors/FiveSEditorNew';
import { VSMEditor } from './editors/VSMEditor';
import { IframeEditor } from './editors/IframeEditor';
import { CroquisEditor } from './editors/CroquisEditor';
import { PlanActionsEditor } from './editors/PlanActionsEditor';
import { IndicatorsEditor } from './editors/IndicatorsEditor';
import { SOPEditor } from './editors/SOPEditor';
interface ModuleEditModalProps {
  module: A3Module;
  onClose: () => void;
}
export const ModuleEditModal: React.FC<ModuleEditModalProps> = ({ module, onClose }) => {
  const renderEditor = () => {
    switch (module.tool_type) {
      case '5Pourquoi':
        return <FiveWhyEditor module={module} onClose={onClose} />;
      case '4M':
        return <IshikawaEditor module={module} onClose={onClose} />;
      // MODIFICATION ICI : Le cas pour '5W1H' a été supprimé
      case 'OPL':
        return <OplEditor module={module} onClose={onClose}/>;
      case '5S':
        return <FiveSEditorNew module={module} onClose={onClose}/>;
      case 'VSM':
        return <VSMEditor module={module} onClose={onClose}/>;
      case 'Iframe':
        return <IframeEditor module={module} onClose={onClose}/>;
      case 'Croquis':
        return <CroquisEditor module={module} onClose={onClose}/>;
      case 'PlanActions':
        return <PlanActionsEditor module={module} onClose={onClose}/>;
      case 'Indicateurs':
        return <IndicatorsEditor module={module} onClose={onClose} />;
      case 'SOP':
        return <SOPEditor module={module} onClose={onClose} />;
      default:
        return (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Type de module non reconnu
              </h3>
              <p className="text-gray-600">
                Le type "{module.tool_type}" n'est pas encore supporté.
              </p>
            </div>
          </div>
        );
    }
  };
  const isVsmEditor = module.tool_type === 'VSM';
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-lg shadow-xl w-full flex flex-col ${isVsmEditor ? 'max-w-7xl h-5/6' : 'max-w-6xl h-5/6'}`}>
        {/* Header (masqué pour l'éditeur VSM qui a son propre header) */}
        {!isVsmEditor && (
            <div className="flex items-center justify-between p-6 border-b flex-shrink-0">
                <h2 className="text-xl font-semibold text-gray-900">
                    Édition du module: {module.tool_type}
                </h2>
                <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
        )}
        {/* Content */}
        <div className={`flex-1 overflow-hidden ${isVsmEditor ? '' : 'p-6'}`}>
          {renderEditor()}
        </div>
      </div>
    </div>
  );
};