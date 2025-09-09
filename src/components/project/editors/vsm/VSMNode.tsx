// src/components/project/editors/vsm/VSMNode.tsx

import React, { useCallback, useMemo, memo, useState, useRef } from 'react';
import { VSMElement } from './VSMTypes';
import { elementColors } from './VSMUtils';
import { 
  User, Truck, Square, Triangle, Factory, Package, Zap, Type, Users
} from 'lucide-react';

interface VSMNodeProps {
  element: VSMElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<VSMElement>) => void;
  zoom: number;
  onAnchorClick: (elementId: string, anchor: 'top' | 'bottom' | 'left' | 'right') => void;
  isConnecting: boolean;
  connectingFrom: { elementId: string; anchor: 'top' | 'bottom' | 'left' | 'right' } | null;
  onConnectionStart?: (elementId: string, anchor: 'top' | 'bottom' | 'left' | 'right') => void;
}

export const VSMNode: React.FC<VSMNodeProps> = memo(({
  element,
  isSelected,
  onSelect,
  onUpdate,
  zoom,
  onAnchorClick,
  isConnecting,
  connectingFrom,
  onConnectionStart
}) => {
  // Refs pour optimiser les performances pendant le drag
  const dragRef = useRef<{ isDragging: boolean; lastUpdate: number; animationFrame: number | null }>({
    isDragging: false,
    lastUpdate: 0,
    animationFrame: null
  });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();

    const startX = e.clientX / zoom;
    const startY = e.clientY / zoom;
    const { x: startElX, y: startElY, width: startWidth, height: startHeight } = element;

    // Check if we're clicking on a resize handle
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    let currentResizeHandle: 'nw' | 'ne' | 'sw' | 'se' | null = null;

    // Check which resize handle was clicked
    if (clickX <= 10 && clickY <= 10) currentResizeHandle = 'nw';
    else if (clickX >= element.width - 10 && clickY <= 10) currentResizeHandle = 'ne';
    else if (clickX <= 10 && clickY >= element.height - 10) currentResizeHandle = 'sw';
    else if (clickX >= element.width - 10 && clickY >= element.height - 10) currentResizeHandle = 'se';

    // Indicateur de drag actif
    dragRef.current.isDragging = true;

    const handleMouseMove = (me: MouseEvent) => {
      // Annuler l'animation frame précédente si elle existe
      if (dragRef.current.animationFrame) {
        cancelAnimationFrame(dragRef.current.animationFrame);
      }

      // Utiliser requestAnimationFrame pour des mises à jour fluides
      dragRef.current.animationFrame = requestAnimationFrame(() => {
        const now = Date.now();

        // Throttling : ne mettre à jour que toutes les 16ms (~60fps)
        if (now - dragRef.current.lastUpdate < 16) return;

        dragRef.current.lastUpdate = now;

        if (currentResizeHandle) {
          // Resize logic
          const currentX = me.clientX / zoom;
          const currentY = me.clientY / zoom;
          const dx = currentX - startX;
          const dy = currentY - startY;

          let newWidth = startWidth;
          let newHeight = startHeight;
          let newX = startElX;
          let newY = startElY;

          switch (currentResizeHandle) {
            case 'se': // Bottom-right
              newWidth = Math.max(140, startWidth + dx);
              newHeight = Math.max(100, startHeight + dy);
              break;
            case 'sw': // Bottom-left
              newWidth = Math.max(140, startWidth - dx);
              newHeight = Math.max(100, startHeight + dy);
              newX = startElX + (startWidth - newWidth);
              break;
            case 'ne': // Top-right
              newWidth = Math.max(140, startWidth + dx);
              newHeight = Math.max(100, startHeight - dy);
              newY = startElY + (startHeight - newHeight);
              break;
            case 'nw': // Top-left
              newWidth = Math.max(140, startWidth - dx);
              newHeight = Math.max(100, startHeight - dy);
              newX = startElX + (startWidth - newWidth);
              newY = startElY + (startHeight - newHeight);
              break;
          }

          onUpdate({
            x: Math.round(newX / 10) * 10,
            y: Math.round(newY / 10) * 10,
            width: Math.round(newWidth / 10) * 10,
            height: Math.round(newHeight / 10) * 10
          });
        } else {
          // Move logic avec optimisation
          const dx = me.clientX / zoom - startX;
          const dy = me.clientY / zoom - startY;
          const newX = Math.round((startElX + dx) / 10) * 10;
          const newY = Math.round((startElY + dy) / 10) * 10;

          // Éviter les mises à jour inutiles si la position n'a pas changé
          if (newX !== element.x || newY !== element.y) {
            onUpdate({ x: newX, y: newY });
          }
        }
      });
    };

    const handleMouseUp = () => {
      // Nettoyer l'animation frame
      if (dragRef.current.animationFrame) {
        cancelAnimationFrame(dragRef.current.animationFrame);
        dragRef.current.animationFrame = null;
      }

      dragRef.current.isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [element, zoom, onSelect, onUpdate]);

  // Nettoyer les ressources au démontage
  React.useEffect(() => {
    return () => {
      if (dragRef.current.animationFrame) {
        cancelAnimationFrame(dragRef.current.animationFrame);
      }
    };
  }, []);

  const nodeContent = useMemo(() => {
    const colors = elementColors[element.type];

    switch (element.type) {
      case 'Processus':
        return (
          <div className="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 backdrop-blur-sm border-2 border-blue-200 rounded-xl shadow-lg flex flex-col p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-500/5 rounded-xl"></div>
            <div className="relative z-10 flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                    <Square className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-bold text-gray-900 truncate">{element.data.nom}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                <div className="bg-white/70 rounded px-2 py-1">
                  <span className="font-semibold text-blue-700">TC:</span> {element.data.tempsCycle || 0}s
                </div>
                <div className="bg-white/70 rounded px-2 py-1">
                  <span className="font-semibold text-blue-700">TCH:</span> {element.data.tempsChangt || 0}s
                </div>
                <div className="bg-white/70 rounded px-2 py-1">
                  <span className="font-semibold text-blue-700">Disp:</span> {element.data.tauxDispo || 100}%
                </div>
                <div className="bg-white/70 rounded px-2 py-1">
                  <span className="font-semibold text-blue-700">Rebut:</span> {element.data.rebut || 0}%
                </div>
              </div>
            </div>
            {element.data.nbOperateurs && (
              <div className="relative z-10 flex justify-center pb-1">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-2 border-white rounded-full px-3 py-1 flex items-center shadow-lg">
                  <Users className="w-3 h-3 mr-1" />
                  <span className="text-xs font-bold">{element.data.nbOperateurs}</span>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'Stock':
        return (
          <div className="w-full h-full bg-gradient-to-br from-orange-50 to-amber-50 backdrop-blur-sm border-2 border-orange-200 rounded-xl shadow-lg flex flex-col p-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-500/5 rounded-xl"></div>
            <div className="relative z-10 flex flex-col h-full">
              {/* Header avec icône et quantité */}
              <div className="flex items-center justify-center mb-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-600 rounded-lg flex items-center justify-center shadow-md">
                  <Triangle className="w-4 h-4 text-white" />
                </div>
              </div>

              {/* Quantité principale */}
              <div className="flex justify-center mb-2">
                <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm">
                  <span className="text-sm font-bold text-orange-700">{element.data.quantite || 0} jours</span>
                </div>
              </div>

              {/* Détails avec scroll si nécessaire */}
              {element.data.details && (
                <div className="flex-1 flex items-start justify-center min-h-0">
                  <div className="bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm max-w-full overflow-hidden">
                    <span className="text-xs text-orange-600 text-center break-words leading-tight block max-h-full overflow-y-auto">
                      {element.data.details}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'Fournisseur':
        return (
          <div className="w-full h-full bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur-sm border-2 border-green-200 rounded-xl shadow-lg flex flex-col items-center justify-center p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 rounded-xl"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md mb-2">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm mb-1">
                <span className="text-sm font-bold text-green-700">{element.data.nom}</span>
              </div>
              {element.data.frequence && (
                <div className="bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
                  <span className="text-xs text-green-600">{element.data.frequence}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'Client':
        return (
          <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur-sm border-2 border-purple-200 rounded-xl shadow-lg flex flex-col items-center justify-center p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-xl"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center shadow-md mb-2">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm mb-1">
                <span className="text-sm font-bold text-purple-700">{element.data.nom}</span>
              </div>
              {element.data.frequence && (
                <div className="bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
                  <span className="text-xs text-purple-600">{element.data.frequence}</span>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'ControleProduction':
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-slate-50 backdrop-blur-sm border-2 border-gray-200 rounded-xl shadow-lg flex flex-col items-center justify-center p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-slate-500/5 rounded-xl"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-slate-600 rounded-lg flex items-center justify-center shadow-md mb-2">
                <Factory className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm mb-1">
                <span className="text-sm font-bold text-gray-700">{element.data.nom}</span>
              </div>
              {element.data.details && (
                <div className="bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
                  <span className="text-xs text-gray-600 text-center">{element.data.details}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'Livraison':
        return (
          <div className="w-full h-full bg-gradient-to-br from-cyan-50 to-teal-50 backdrop-blur-sm border-2 border-cyan-200 rounded-xl shadow-lg flex flex-col items-center justify-center p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 rounded-xl"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md mb-2">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm mb-1">
                <span className="text-sm font-bold text-cyan-700">{element.data.nom}</span>
              </div>
              {element.data.frequence && (
                <div className="bg-white/70 backdrop-blur-sm rounded-lg px-2 py-1 shadow-sm">
                  <span className="text-xs text-cyan-600">{element.data.frequence}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 'Kaizen':
        return (
          <div className="w-full h-full bg-gradient-to-br from-yellow-50 to-orange-50 backdrop-blur-sm border-2 border-yellow-200 rounded-xl shadow-lg flex flex-col items-center justify-center p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 rounded-xl"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md mb-2">
                <Zap className="w-4 h-4 text-white" />
              </div>
              {element.data.details && (
                <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm">
                  <span className="text-xs text-center font-semibold text-yellow-700">{element.data.details}</span>
                </div>
              )}
            </div>
          </div>
        );
      
      case 'Texte':
        return (
          <div className="w-full h-full bg-gradient-to-br from-slate-50 to-gray-50 backdrop-blur-sm border-2 border-slate-200 rounded-xl shadow-lg p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 to-gray-500/5 rounded-xl"></div>
            <div className="relative z-10">
              <textarea
                className="w-full h-full bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg resize-none outline-none text-sm p-2 focus:ring-2 focus:ring-slate-400 focus:border-transparent"
                value={element.data.contenu || ''}
                onChange={(e) => onUpdate({ data: { ...element.data, contenu: e.target.value } })}
                placeholder="Saisissez votre texte..."
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        );

      default:
        return (
          <div className="w-full h-full bg-gradient-to-br from-gray-50 to-slate-50 backdrop-blur-sm border-2 border-gray-200 rounded-xl shadow-lg flex flex-col items-center justify-center p-3 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-slate-500/5 rounded-xl"></div>
            <div className="relative z-10 flex flex-col items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-gray-500 to-slate-600 rounded-lg flex items-center justify-center shadow-md mb-2">
                <Type className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1 shadow-sm">
                <span className="text-sm font-bold text-gray-700">{element.type}</span>
              </div>
            </div>
          </div>
        );
    }
  }, [element, onUpdate]);

  const anchors = ['top', 'bottom', 'left', 'right'] as const;
  const isConnectingFromThis = connectingFrom?.elementId === element.id;

  return (
    <div 
      className={`absolute group ${isSelected ? 'z-20' : 'z-10'}`}
      style={{ 
        left: element.x, 
        top: element.y, 
        width: element.width, 
        height: element.height 
      }}
      onMouseDown={handleMouseDown}
    >
      <div className={`w-full h-full relative ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
        {nodeContent}
      </div>
      
      {/* Connection anchors */}
      {isConnecting && anchors.map(anchor => (
        <div
          key={anchor}
          className={`absolute w-4 h-4 border-2 border-white rounded-full cursor-crosshair transition-all duration-200 ${
            isConnectingFromThis && connectingFrom?.anchor === anchor
              ? 'bg-red-500 scale-125'
              : 'bg-blue-500 opacity-0 group-hover:opacity-100'
          }`}
          style={{
            top: anchor === 'top' ? -8 : anchor === 'bottom' ? 'auto' : '50%',
            bottom: anchor === 'bottom' ? -8 : 'auto',
            left: anchor === 'left' ? -8 : anchor === 'right' ? 'auto' : '50%',
            right: anchor === 'right' ? -8 : 'auto',
            transform: anchor === 'top' || anchor === 'bottom' ? 'translateX(-50%)' : 'translateY(-50%)'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (onConnectionStart) {
              onConnectionStart(element.id, anchor);
            } else {
              onAnchorClick(element.id, anchor);
            }
          }}
          title={`Connecter ${anchor === 'top' ? 'en haut' : anchor === 'bottom' ? 'en bas' : anchor === 'left' ? 'à gauche' : 'à droite'}`}
        />
      ))}

      {/* Resize handles */}
      {isSelected && (
        <>
          {/* Corner resize handles */}
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-nw-resize opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ top: -6, left: -6 }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e);
            }}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-ne-resize opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ top: -6, right: -6 }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e);
            }}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-sw-resize opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ bottom: -6, left: -6 }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e);
            }}
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 border-2 border-white rounded-full cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ bottom: -6, right: -6 }}
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e);
            }}
          />
        </>
      )}
    </div>
  );
});

VSMNode.displayName = 'VSMNode';

// Fonction de comparaison optimisée pour React.memo
const arePropsEqual = (prevProps: VSMNodeProps, nextProps: VSMNodeProps) => {
  // Comparaisons optimisées pour éviter les re-renders inutiles
  return (
    prevProps.element.id === nextProps.element.id &&
    prevProps.element.x === nextProps.element.x &&
    prevProps.element.y === nextProps.element.y &&
    prevProps.element.width === nextProps.element.width &&
    prevProps.element.height === nextProps.element.height &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.zoom === nextProps.zoom &&
    prevProps.isConnecting === nextProps.isConnecting &&
    prevProps.connectingFrom?.elementId === nextProps.connectingFrom?.elementId &&
    prevProps.connectingFrom?.anchor === nextProps.connectingFrom?.anchor &&
    // Comparer seulement les propriétés essentielles des données
    JSON.stringify(prevProps.element.data) === JSON.stringify(nextProps.element.data)
  );
};

// Utiliser la comparaison optimisée
export const OptimizedVSMNode = React.memo(VSMNode, arePropsEqual);
OptimizedVSMNode.displayName = 'OptimizedVSMNode';