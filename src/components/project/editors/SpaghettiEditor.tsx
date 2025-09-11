import React, { useEffect, useMemo, useRef, useState } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import {
  Route,
  HelpCircle,
  Upload,
  Save,
  Trash2,
  X,
  Eye,
  EyeOff,
  Plus,
  Edit2,
  MapPin,
  Zap
} from 'lucide-react';

// Types de données pour le Spaghetti Chart
type SpagCategory = {
  id: string;
  name: string;
  color: string;
  lineWidth: number;
  showNumbers?: boolean;
};

type SpagPoint = {
  id: string;
  x: number; // 0..1
  y: number; // 0..1
  label?: string; // bref titre
  desc?: string; // brève description
  timeSeconds?: number; // temps
  distanceMeters?: number; // distance
};

type SpagPath = {
  id: string;
  name?: string;
  categoryId: string;
  visible: boolean;
  points: SpagPoint[];
};

type SpagMap = {
  id: string;
  name: string;
  background?: string; // image (data URL)
  paths: SpagPath[];
  activePathId?: string;
};

type SpagContent = {
  categories: SpagCategory[];
  maps: SpagMap[];
  activeMapId?: string;
};

const makeId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

interface SpaghettiEditorProps {
  module: A3Module;
  onClose?: () => void;
}

// Détection et conversion du format ancien (une image + un chemin rouge)
function convertLegacyContent(content: any): SpagContent {
  const defaultCat: SpagCategory = {
    id: makeId(),
    name: 'Opérateur',
    color: content?.color || '#ef4444',
    lineWidth: content?.lineWidth ?? 3,
    showNumbers: content?.showNumbers ?? true,
  };

  const legacyPoints: SpagPoint[] = Array.isArray(content?.points)
    ? content.points.map((p: any) => ({
        id: makeId(),
        x: typeof p.x === 'number' ? p.x : 0,
        y: typeof p.y === 'number' ? p.y : 0,
        label: p.label || '',
      }))
    : [];

  const legacyPath: SpagPath = {
    id: makeId(),
    name: 'Chemin 1',
    categoryId: defaultCat.id,
    visible: true,
    points: legacyPoints,
  };

  const map: SpagMap = {
    id: makeId(),
    name: 'Carte 1',
    background: content?.background || '',
    paths: [legacyPath],
    activePathId: legacyPath.id,
  };

  return {
    categories: [defaultCat],
    maps: [map],
    activeMapId: map.id,
  };
}

export const SpaghettiEditor: React.FC<SpaghettiEditorProps> = ({ module, onClose }) => {
  const { updateA3Module } = useDatabase();
  const [showHelp, setShowHelp] = useState(false);

  // Initialisation du contenu (avec rétrocompatibilité)
  const initial: SpagContent = useMemo(() => {
    const c: any = module.content || {};
    if (Array.isArray(c?.maps) && Array.isArray(c?.categories)) {
      return c as SpagContent;
    }
    // Ancien format → conversion
    return convertLegacyContent(c);
  }, [module.content]);

  const [categories, setCategories] = useState<SpagCategory[]>(initial.categories);
  const [maps, setMaps] = useState<SpagMap[]>(initial.maps);
  const [activeMapId, setActiveMapId] = useState<string | undefined>(initial.activeMapId || initial.maps[0]?.id);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(categories[0]?.id);

  // Sélection d'un point (pour édition dans le panneau)
  const [selected, setSelected] = useState<{ pathId: string; pointId: string } | null>(null);

  // Survol (tooltip)
  const [hover, setHover] = useState<{ pathId: string; point: SpagPoint; clientX: number; clientY: number } | null>(null);

  // Dragging d'un point
  const [dragging, setDragging] = useState<{ pathId: string; pointId: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeMap = useMemo(() => maps.find(m => m.id === activeMapId) || null, [maps, activeMapId]);
  const activePath = useMemo(() => {
    if (!activeMap) return null;
    const id = activeMap.activePathId;
    return id ? activeMap.paths.find(p => p.id === id) || null : null;
  }, [activeMap]);

  const saveContent = () => {
    const content: SpagContent = { categories, maps, activeMapId };
    updateA3Module(module.id, { content });
  };

  // Helpers UI
  const getCategory = (catId: string) => categories.find(c => c.id === catId);

  // Gestion Cartes
  const addMap = () => {
    const id = makeId();
    const newMap: SpagMap = { id, name: `Carte ${maps.length + 1}`, background: '', paths: [], activePathId: undefined };
    setMaps(prev => [...prev, newMap]);
    setActiveMapId(id);
  };

  const renameMap = (id: string, name: string) => {
    setMaps(prev => prev.map(m => (m.id === id ? { ...m, name } : m)));
  };

  const removeMap = (id: string) => {
    const next = maps.filter(m => m.id !== id);
    setMaps(next);
    if (activeMapId === id) setActiveMapId(next[0]?.id);
  };

  // Gestion Catégories
  const addCategory = () => {
    const newCat: SpagCategory = { id: makeId(), name: `Catégorie ${categories.length + 1}`, color: '#ef4444', lineWidth: 3, showNumbers: true };
    setCategories(prev => [...prev, newCat]);
    setSelectedCategoryId(newCat.id);
  };
  const updateCategory = (id: string, updates: Partial<SpagCategory>) => {
    setCategories(prev => prev.map(c => (c.id === id ? { ...c, ...updates } : c)));
  };
  const removeCategory = (id: string) => {
    // Empêcher la suppression si utilisée par un chemin
    if (maps.some(m => m.paths.some(p => p.categoryId === id))) return;
    setCategories(prev => prev.filter(c => c.id !== id));
    if (selectedCategoryId === id) setSelectedCategoryId(categories[0]?.id);
  };

  // Gestion Chemins
  const addPathToActiveMap = (categoryId?: string) => {
    if (!activeMap) return;
    const catId = categoryId || selectedCategoryId || categories[0]?.id;
    if (!catId) return;
    const path: SpagPath = { id: makeId(), name: `Chemin ${activeMap.paths.length + 1}`, categoryId: catId, visible: true, points: [] };
    setMaps(prev => prev.map(m => (m.id === activeMap.id ? { ...m, paths: [...m.paths, path], activePathId: path.id } : m)));
  };

  const setActivePathId = (pathId?: string) => {
    if (!activeMap) return;
    setMaps(prev => prev.map(m => (m.id === activeMap.id ? { ...m, activePathId: pathId } : m)));
  };

  const togglePathVisibility = (pathId: string) => {
    if (!activeMap) return;
    setMaps(prev => prev.map(m => (m.id === activeMap.id ? {
      ...m,
      paths: m.paths.map(p => (p.id === pathId ? { ...p, visible: !p.visible } : p))
    } : m)));
  };

  const removePath = (pathId: string) => {
    if (!activeMap) return;
    const nextPaths = activeMap.paths.filter(p => p.id !== pathId);
    setMaps(prev => prev.map(m => (m.id === activeMap.id ? { ...m, paths: nextPaths, activePathId: nextPaths[0]?.id } : m)));
    if (selected && selected.pathId === pathId) setSelected(null);
  };

  // Points
  const updatePoint = (pathId: string, pointId: string, updates: Partial<SpagPoint>) => {
    if (!activeMap) return;
    setMaps(prev => prev.map(m => (m.id === activeMap.id ? {
      ...m,
      paths: m.paths.map(p => (p.id === pathId ? {
        ...p,
        points: p.points.map(pt => (pt.id === pointId ? { ...pt, ...updates } : pt))
      } : p))
    } : m)));
  };

  const removePoint = (pathId: string, pointId: string) => {
    if (!activeMap) return;
    setMaps(prev => prev.map(m => (m.id === activeMap.id ? {
      ...m,
      paths: m.paths.map(p => (p.id === pathId ? { ...p, points: p.points.filter(pt => pt.id !== pointId) } : p))
    } : m)));
    if (selected && selected.pathId === pathId && selected.pointId === pointId) setSelected(null);
  };

  // Canvas utilities
  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(600, rect.width);
    const height = Math.max(440, rect.height - 8);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${Math.floor(width)}px`;
    canvas.style.height = `${Math.floor(height)}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  };

  useEffect(() => {
    resizeCanvas();
    const onResize = () => resizeCanvas();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { draw(); }, [activeMap, categories]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (!activeMap) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      return;
    }

    // Dessiner le background en "contain"
    if (activeMap.background) {
      const img = new Image();
      img.onload = () => {
        const imgRatio = img.width / img.height;
        const canvasRatio = w / h;
        let dw = w, dh = h, dx = 0, dy = 0;
        if (imgRatio > canvasRatio) {
          dw = w; dh = w / imgRatio; dy = (h - dh) / 2;
        } else { dh = h; dw = h * imgRatio; dx = (w - dw) / 2; }
        ctx.drawImage(img, dx, dy, dw, dh);
        drawPaths(ctx, w, h);
      };
      img.src = activeMap.background;
    } else {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, w, h);
      drawPaths(ctx, w, h);
    }
  };

  const drawPaths = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    if (!activeMap) return;

    activeMap.paths.forEach((path) => {
      if (!path.visible) return;
      const cat = getCategory(path.categoryId);
      const color = cat?.color || '#ef4444';
      const width = cat?.lineWidth ?? 3;
      const showNumbers = cat?.showNumbers ?? true;

      if (path.points.length > 0) {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        path.points.forEach((p, i) => {
          const px = p.x * w; const py = p.y * h;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        });
        ctx.stroke();
      }

      path.points.forEach((p, i) => {
        const px = p.x * w; const py = p.y * h;
        // point circle
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = color; ctx.stroke();

        if (showNumbers) {
          ctx.font = '12px ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial';
          ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
          ctx.fillStyle = color;
          ctx.fillText(String(i + 1), px, py - 14);
        }
      });
    });
  };

  // Interactions canvas
  const getNormPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    return { x: Math.max(0, Math.min(1, nx)), y: Math.max(0, Math.min(1, ny)), clientX: e.clientX, clientY: e.clientY };
  };

  const hitTestPoint = (x: number, y: number): { pathId: string; point: SpagPoint } | null => {
    const canvas = canvasRef.current!;
    const w = canvas.clientWidth; const h = canvas.clientHeight;
    const radiusPx = 10; const rx = radiusPx / w; const ry = radiusPx / h;
    if (!activeMap) return null;
    for (let pIndex = activeMap.paths.length - 1; pIndex >= 0; pIndex--) {
      const path = activeMap.paths[pIndex];
      if (!path.visible) continue;
      for (let i = path.points.length - 1; i >= 0; i--) {
        const pt = path.points[i];
        if (Math.abs(pt.x - x) <= rx && Math.abs(pt.y - y) <= ry) {
          return { pathId: path.id, point: pt };
        }
      }
    }
    return null;
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y, clientX, clientY } = getNormPos(e);
    if (dragging) {
      updatePoint(dragging.pathId, dragging.pointId, { x, y });
      return;
    }
    const hit = hitTestPoint(x, y);
    if (hit) setHover({ pathId: hit.pathId, point: hit.point, clientX, clientY }); else setHover(null);
  };

  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getNormPos(e);
    const hit = hitTestPoint(x, y);
    if (hit) {
      setSelected({ pathId: hit.pathId, pointId: hit.point.id });
      setDragging({ pathId: hit.pathId, pointId: hit.point.id });
      return;
    }
  };

  const onCanvasMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging) { setDragging(null); return; }
    const { x, y } = getNormPos(e);
    // Ajout d'un point sur le chemin actif
    if (!activeMap) return;
    let path = activePath;
    if (!path) {
      // créer un chemin par défaut si inexistant
      const catId = selectedCategoryId || categories[0]?.id;
      if (!catId) return;
      path = { id: makeId(), name: `Chemin ${activeMap.paths.length + 1}`, categoryId: catId, visible: true, points: [] };
      setMaps(prev => prev.map(m => (m.id === activeMap.id ? { ...m, paths: [...m.paths, path!], activePathId: path!.id } : m)));
    }
    const newPoint: SpagPoint = { id: makeId(), x, y };
    const pid = path.id;
    setMaps(prev => prev.map(m => (m.id === activeMap.id ? {
      ...m,
      paths: m.paths.map(p => (p.id === pid ? { ...p, points: [...p.points, newPoint] } : p))
    } : m)));
    setSelected({ pathId: pid, pointId: newPoint.id });
  };

  // Gestion de l'image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!activeMap) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const data = reader.result as string;
      setMaps(prev => prev.map(m => (m.id === activeMap.id ? { ...m, background: data } : m)));
    };
    reader.readAsDataURL(file);
  };

  // Rendu
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
        {/* Header rouge */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Route className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Spaghetti Chart</h2>
                <p className="text-white/80 text-sm">Multi-cartes, multi-chemins, catégories réutilisables</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button onClick={() => setShowHelp(true)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg" title="Aide">
                <HelpCircle className="w-5 h-5 text-white" />
              </button>
              {onClose && (
                <button onClick={onClose} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg" title="Fermer">
                  <X className="w-5 h-5 text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Contenu */}
        <div className="flex-1 flex min-h-0">
          {/* Sidebar gauche */}
          <div className="w-96 bg-white/70 backdrop-blur-sm border-r border-gray-200/50 p-6 overflow-y-auto space-y-6">
            {/* Cartes */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-lg">Cartes</h3>
                <button onClick={addMap} className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 flex items-center justify-center shadow">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {maps.map((m) => (
                  <div key={m.id} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${m.id === activeMapId ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300' : 'bg-white/80 hover:bg-white border-gray-200'}`} onClick={() => setActiveMapId(m.id)}>
                    <div className="flex items-center justify-between">
                      <input value={m.name} onChange={(e) => renameMap(m.id, e.target.value)} className="font-medium text-gray-900 bg-transparent outline-none" />
                      <button onClick={(e) => { e.stopPropagation(); removeMap(m.id); }} className="text-red-500 hover:text-red-700" title="Supprimer">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {/* Image */}
                    {m.id === activeMapId && (
                      <div className="mt-2 flex gap-2">
                        <label className="flex-1 flex items-center justify-center gap-2 py-1.5 px-2 bg-white/80 border border-gray-300 rounded-lg cursor-pointer hover:bg-white">
                          <Upload className="w-4 h-4" />
                          <span className="text-sm">Importer image</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                        {activeMap?.background && (
                          <button onClick={() => setMaps(prev => prev.map(mm => (mm.id === m.id ? { ...mm, background: '' } : mm)))} className="px-2 bg-gray-900 text-white rounded-lg hover:bg-black/90 text-sm">Supprimer</button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Catégories de chemin */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-800 text-lg">Catégories</h3>
                <button onClick={addCategory} className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 flex items-center justify-center shadow">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {categories.map((c) => (
                  <div key={c.id} className={`p-3 rounded-xl border ${selectedCategoryId === c.id ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white/80 hover:bg-white'}`} onClick={() => setSelectedCategoryId(c.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full border" style={{ background: c.color }} />
                        <input value={c.name} onChange={(e) => updateCategory(c.id, { name: e.target.value })} className="text-sm font-medium text-gray-900 bg-transparent outline-none" />
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); removeCategory(c.id); }} className="text-red-500 hover:text-red-700" title="Supprimer la catégorie si non utilisée"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    {selectedCategoryId === c.id && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <div className="col-span-1">
                          <label className="block text-xs text-gray-600">Couleur</label>
                          <input type="color" value={c.color} onChange={(e) => updateCategory(c.id, { color: e.target.value })} className="h-9 w-full p-1 bg-white/80 border border-gray-300 rounded" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">Épaisseur</label>
                          <input type="number" min={1} max={12} value={c.lineWidth} onChange={(e) => updateCategory(c.id, { lineWidth: parseInt(e.target.value || '1', 10) })} className="w-full px-2 py-1 border border-gray-300 rounded" />
                        </div>
                        <div className="flex items-end">
                          <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={!!c.showNumbers} onChange={(e) => updateCategory(c.id, { showNumbers: e.target.checked })} />
                            N° étapes
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Chemins de la carte active */}
            {activeMap && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-800 text-lg">Chemins</h3>
                  <button onClick={() => addPathToActiveMap()} className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-lg hover:from-red-600 hover:to-pink-700 flex items-center justify-center shadow" title="Ajouter un chemin avec la catégorie sélectionnée">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2">
                  {activeMap.paths.map((p) => {
                    const cat = getCategory(p.categoryId);
                    return (
                      <div key={p.id} className={`p-3 rounded-xl border-2 ${activeMap.activePathId === p.id ? 'bg-gradient-to-r from-red-50 to-pink-50 border-red-300' : 'bg-white/80 hover:bg-white border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button onClick={() => togglePathVisibility(p.id)} className="text-gray-700 hover:text-gray-900" title={p.visible ? 'Masquer' : 'Afficher'}>
                              {p.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            <span className="w-3.5 h-3.5 rounded-full border" style={{ background: cat?.color }} />
                            <input value={p.name || ''} onChange={(e) => setMaps(prev => prev.map(m => (m.id === activeMap.id ? { ...m, paths: m.paths.map(pp => (pp.id === p.id ? { ...pp, name: e.target.value } : pp)) } : m)))} className="text-sm font-medium text-gray-900 bg-transparent outline-none" />
                          </div>
                          <div className="flex items-center gap-2">
                            <select value={p.categoryId} onChange={(e) => setMaps(prev => prev.map(m => (m.id === activeMap.id ? { ...m, paths: m.paths.map(pp => (pp.id === p.id ? { ...pp, categoryId: e.target.value } : pp)) } : m)))} className="text-xs border border-gray-300 rounded px-1 py-0.5 bg-white/90">
                              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button onClick={() => setActivePathId(p.id)} className="text-gray-700 hover:text-gray-900" title="Activer pour ajout de points">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => removePath(p.id)} className="text-red-500 hover:text-red-700" title="Supprimer">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {activeMap.paths.length === 0 && (
                    <div className="text-sm text-gray-600">Aucun chemin. Sélectionnez une catégorie et cliquez sur + pour créer un chemin.</div>
                  )}
                </div>
              </div>
            )}

            {/* Point sélectionné */}
            {selected && activeMap && (
              (() => {
                const pth = activeMap.paths.find(p => p.id === selected.pathId);
                const pt = pth?.points.find(pt => pt.id === selected.pointId);
                if (!pth || !pt) return null;
                return (
                  <div>
                    <h3 className="font-bold text-gray-800 text-lg mb-2">Point sélectionné</h3>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Brève description</label>
                        <input value={pt.label || ''} onChange={(e) => updatePoint(pth.id, pt.id, { label: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/90" placeholder="Ex: Prise pièce" />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Détails</label>
                        <input value={pt.desc || ''} onChange={(e) => updatePoint(pth.id, pt.id, { desc: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/90" placeholder="Ex: Prise sur rack A, ergonomie..." />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Temps (s)</label>
                          <input type="number" min={0} step={0.1} value={pt.timeSeconds ?? ''} onChange={(e) => updatePoint(pth.id, pt.id, { timeSeconds: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/90" />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Distance (m)</label>
                          <input type="number" min={0} step={0.01} value={pt.distanceMeters ?? ''} onChange={(e) => updatePoint(pth.id, pt.id, { distanceMeters: e.target.value === '' ? undefined : parseFloat(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white/90" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-500">x: {pt.x.toFixed(3)} · y: {pt.y.toFixed(3)}</span>
                        <button onClick={() => removePoint(pth.id, pt.id)} className="px-3 py-2 bg-gray-900 text-white rounded-lg hover:bg-black/90 flex items-center gap-1 text-sm">
                          <Trash2 className="w-4 h-4" /> Supprimer le point
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-200/60">
              <button onClick={saveContent} className="w-full py-2.5 px-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white rounded-lg flex items-center justify-center gap-2 shadow-md">
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </div>
          </div>

          {/* Zone Canvas */}
          <div ref={containerRef} className="flex-1 overflow-hidden relative">
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full bg-white cursor-crosshair"
              onMouseMove={onCanvasMouseMove}
              onMouseDown={onCanvasMouseDown}
              onMouseUp={onCanvasMouseUp}
              onMouseLeave={() => setHover(null)}
            />

            {/* Hint */}
            <div className="absolute top-2 left-2 bg-white/80 backdrop-blur px-2 py-1 rounded text-xs text-gray-700 flex items-center gap-1 border border-gray-200 shadow">
              <MapPin className="w-3.5 h-3.5" /> Cliquez pour ajouter un point. Glissez pour déplacer.
            </div>

            {/* Tooltip survol */}
            {hover && (
              <div style={{ position: 'fixed', top: hover.clientY + 10, left: hover.clientX + 10 }} className="z-[60] max-w-xs">
                <div className="bg-white/95 border border-gray-200 shadow-lg rounded-lg px-3 py-2 text-xs text-gray-800">
                  {(hover.point.label || hover.point.desc) && (
                    <div className="font-medium text-gray-900">{hover.point.label || hover.point.desc}</div>
                  )}
                  {(hover.point.timeSeconds != null || hover.point.distanceMeters != null) && (
                    <div className="text-gray-600">
                      {hover.point.timeSeconds != null && <span>t: {hover.point.timeSeconds}s</span>}
                      {hover.point.timeSeconds != null && hover.point.distanceMeters != null && ' · '}
                      {hover.point.distanceMeters != null && <span>d: {hover.point.distanceMeters}m</span>}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Help modal (style 5S) */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[70]">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 via-rose-600 to-pink-600 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Spaghetti Chart - Guide d'utilisation</h3>
                  <button onClick={() => setShowHelp(false)} className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200">
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 180px)' }}>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Colonne 1 */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-rose-50 to-red-50 p-6 rounded-xl border border-rose-200">
                      <h4 className="text-lg font-semibold text-rose-800 mb-4 flex items-center">
                        <Route className="w-5 h-5 mr-2" />
                        Principe du Spaghetti Chart
                      </h4>
                      <p className="text-rose-700 text-sm">
                        Visualisez les déplacements d'un opérateur, d'une pièce ou d'un document
                        sur un plan. Identifiez les trajets inutiles et les boucles pour réduire
                        les gaspillages (Muda) et améliorer l'ergonomie et les flux.
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-pink-200">
                      <h4 className="text-lg font-semibold text-pink-800 mb-4 flex items-center">
                        <Edit2 className="w-5 h-5 mr-2" />
                        Catégories & chemins
                      </h4>
                      <ul className="text-pink-700 space-y-2 text-sm">
                        <li>Créez des catégories réutilisables (couleur, épaisseur, numéros).</li>
                        <li>Ajoutez plusieurs chemins par carte et attribuez-leur une catégorie.</li>
                        <li>Affichez/masquez chaque chemin pour comparer des scénarios.</li>
                      </ul>
                    </div>
                  </div>

                  {/* Colonne 2 */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-indigo-200">
                      <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                        <MapPin className="w-5 h-5 mr-2" />
                        Tracé & points
                      </h4>
                      <ul className="text-indigo-700 space-y-2 text-sm">
                        <li>Cliquez pour ajouter un point, glissez pour le déplacer.</li>
                        <li>Par point: description, temps (s) et distance (m).</li>
                        <li>Survol: tooltip avec les informations du point.</li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border border-amber-200">
                      <h4 className="text-lg font-semibold text-amber-800 mb-4 flex items-center">
                        <Zap className="w-5 h-5 mr-2" />
                        Conseils pour l'efficacité
                      </h4>
                      <ul className="text-amber-700 space-y-2 text-sm">
                        <li>Commencez par le flux actuel (état présent), puis comparez avec le flux cible.</li>
                        <li>Limitez le nombre de catégories pour garder une lecture claire.</li>
                        <li>Capturez des temps/distances aux points clés (prise, dépose, attente).</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                <button onClick={() => setShowHelp(false)} className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium">
                  Compris !
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
