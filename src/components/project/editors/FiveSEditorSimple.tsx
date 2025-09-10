// src/components/project/editors/FiveSEditorSimple.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { A3Module, FiveSItem as DBFiveSItem, FiveSPhoto, FiveSCategory } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../Lib/supabase';
import {
  Plus,
  HelpCircle,
  X,
  Camera,
  Users,
  BarChart3,
  CheckCircle2,
  Circle,
  Clock,
  User,
  Image as ImageIcon,
  Trash2,
  Edit3,
  Save,
  RotateCcw,
  Zap,
  List,
  ArrowRight,
  Play
} from 'lucide-react';
interface FiveSEditorSimpleProps {
  module: A3Module;
  onClose: () => void;
}
// Interfaces locales pour l'interface utilisateur
interface FiveSItem {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to?: string;
  due_date?: string;
  completed_at?: string;
  position: number;
  photos?: FiveSPhoto[];
  category: FiveSCategory;
}
interface FiveSChecklist {
  id: string;
  title: string;
  description?: string;
  area?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  items: FiveSItem[];
  created_at: string;
  updated_at: string;
}
const FIVE_S_PILLARS = [
  {
    key: 'seiri' as const,
    title: 'Seiri - Trier',
    description: 'Éliminer l\'inutile',
    color: 'from-red-500 to-pink-600',
    bgColor: 'from-red-50 to-pink-50',
    borderColor: 'border-red-200',
    icon: '🗂️'
  },
  {
    key: 'seiton' as const,
    title: 'Seiton - Ranger',
    description: 'Une place pour chaque chose',
    color: 'from-blue-500 to-indigo-600',
    bgColor: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-200',
    icon: '📍'
  },
  {
    key: 'seiso' as const,
    title: 'Seiso - Nettoyer',
    description: 'Nettoyer et inspecter',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    icon: '🧽'
  },
  {
    key: 'seiketsu' as const,
    title: 'Seiketsu - Standardiser',
    description: 'Maintenir la propreté',
    color: 'from-yellow-500 to-amber-600',
    bgColor: 'from-yellow-50 to-amber-50',
    borderColor: 'border-yellow-200',
    icon: '📋'
  },
  {
    key: 'shitsuke' as const,
    title: 'Shitsuke - Maintenir',
    description: 'Respecter les règles',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'from-purple-50 to-violet-50',
    borderColor: 'border-purple-200',
    icon: '🔄'
  }
];
export const FiveSEditorSimple: React.FC<FiveSEditorSimpleProps> = ({ module, onClose }) => {
  const { user } = useAuth();
  const {
    updateA3Module,
    getFiveSChecklists,
    createFiveSChecklist,
    updateFiveSChecklist,
    getFiveSItems,
    createFiveSItem,
    updateFiveSItem,
    deleteFiveSItem,
    createFiveSPhoto,
    getFiveSPhotos
  } = useDatabase();
  const [showHelp, setShowHelp] = useState(false);
  const [checklist, setChecklist] = useState<FiveSChecklist | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeView, setActiveView] = useState<'create' | 'list'>('create');
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FiveSItem | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<FiveSCategory>('seiri');
  const [isCreating, setIsCreating] = useState(false);
  const [beforePhotos, setBeforePhotos] = useState<{file: File, description: string}[]>([]);
  const [beforePhotoDescription, setBeforePhotoDescription] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [viewingPhotos, setViewingPhotos] = useState<FiveSPhoto[]>([]);
  const [viewingItemTitle, setViewingItemTitle] = useState('');
  const [photoUrls, setPhotoUrls] = useState<{[key: string]: string}>({});
  // Refs pour le debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedDataRef = useRef<string>('');
  // Refs pour la caméra
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // CHARGEMENT INITIAL
  useEffect(() => {
    if (!isLoaded) {
      const loadChecklist = async () => {
        try {
          // Charger les checklists 5S depuis Supabase
          const checklists = getFiveSChecklists(module.id);
          console.log('Checklists chargées:', checklists);
          
          if (checklists.length > 0) {
            const checklist = checklists[0]; // Prendre la première checklist
            console.log('Checklist sélectionnée:', checklist);
            
            // Charger les items
            const allItems = getFiveSItems(checklist.id);
            console.log('Items chargés:', allItems);
            
            // Charger les photos pour cette checklist
            const allPhotos = getFiveSPhotos(undefined, checklist.id);
            console.log('Photos chargées:', allPhotos);
            
            const items: FiveSItem[] = allItems.map(item => ({
              id: item.id,
              title: item.title,
              description: item.description || '',
              status: item.status,
              priority: item.priority,
              assigned_to: item.assigned_to || undefined,
              due_date: item.due_date || undefined,
              completed_at: item.completed_at || undefined,
              position: item.position,
              photos: allPhotos.filter(photo => photo.item_id === item.id),
              category: item.category
            }));
            
            console.log('Items avec photos:', items);
            
            const fullChecklist: FiveSChecklist = {
              ...checklist,
              items
            };
            setChecklist(fullChecklist);
          } else {
            // Créer une nouvelle checklist si aucune n'existe
            const checklistId = await createFiveSChecklist(module.id, 'Checklist 5S Action', 'Workflow orienté action pour l\'amélioration 5S');
            const newChecklist: FiveSChecklist = {
              id: checklistId,
              title: 'Checklist 5S Action',
              description: 'Workflow orienté action pour l\'amélioration 5S',
              status: 'draft',
              items: [],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            setChecklist(newChecklist);
          }
        } catch (error) {
          console.error('Erreur lors du chargement de la checklist:', error);
          // Fallback vers le stockage local si Supabase échoue
          const existingChecklist = module.content?.checklist;
          if (existingChecklist) {
            setChecklist(existingChecklist);
          }
        }
        setIsLoaded(true);
      };
      loadChecklist();
    }
  }, [module.id, module.content, isLoaded, getFiveSChecklists, getFiveSItems, getFiveSPhotos, createFiveSChecklist]);
  // Charger les URLs des photos pour les miniatures
  useEffect(() => {
    if (checklist && checklist.items.length > 0) {
      const allPhotos = checklist.items.flatMap(item => item.photos || []);
      if (allPhotos.length > 0) {
        loadPhotoUrls(allPhotos);
      }
    }
  }, [checklist]);
  // SAUVEGARDE OPTIMISÉE avec debouncing
  const debouncedSave = useCallback(async (checklistToSave: FiveSChecklist) => {
    const currentDataString = JSON.stringify(checklistToSave);
    if (currentDataString === lastSavedDataRef.current) {
      return;
    }
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateA3Module(module.id, {
          content: { ...module.content, checklist: checklistToSave }
        });
        lastSavedDataRef.current = currentDataString;
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
      }
    }, 1000);
  }, [updateA3Module, module.content, module.id]);
  const updateChecklist = useCallback((newChecklist: FiveSChecklist) => {
    setChecklist(newChecklist);
    debouncedSave(newChecklist);
  }, [debouncedSave]);
  // Fonctions pour gérer la caméra et les photos avant
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      alert('Impossible d\'accéder à la caméra.');
    }
  };
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };
  const takeBeforePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const filename = `before_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });
        setBeforePhotos(prev => [...prev, { file, description: beforePhotoDescription.trim() }]);
        setBeforePhotoDescription('');
        stopCamera();
        alert('Photo "avant" ajoutée !');
      }
    }, 'image/jpeg', 0.8);
  };
  const handleBeforeFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file && file.type.startsWith('image/')) {
          setBeforePhotos(prev => [...prev, { file, description: '' }]);
        }
      }
    }
    // Reset input
    event.target.value = '';
  };
  const removeBeforePhoto = (index: number) => {
    setBeforePhotos(prev => prev.filter((_, i) => i !== index));
  };
  const updateBeforePhotoDescription = (index: number, description: string) => {
    setBeforePhotos(prev => prev.map((photo, i) =>
      i === index ? { ...photo, description } : photo
    ));
  };
  // Fonction pour obtenir l'URL d'une photo
  const getPhotoUrl = async (photo: FiveSPhoto) => {
    try {
      const { data } = await supabase.storage
        .from('5s-photos')
        .createSignedUrl(photo.file_path, 3600);
      return data?.signedUrl || '';
    } catch (error) {
      console.error('Erreur lors de la génération de l\'URL:', error);
      return '';
    }
  };
  // Charger les URLs des photos pour les miniatures
  const loadPhotoUrls = async (photos: FiveSPhoto[]) => {
    const urls: {[key: string]: string} = {};
    for (const photo of photos) {
      urls[photo.id] = await getPhotoUrl(photo);
    }
    setPhotoUrls(prev => ({ ...prev, ...urls }));
  };
  // Créer un nouvel item avec photo avant optionnelle
  const createSimpleItem = async () => {
    if (!checklist || !user || !newItemTitle.trim()) return;
    setIsCreating(true);
    try {
      const itemId = await createFiveSItem(checklist.id, newItemCategory, newItemTitle.trim(), '');
      // Si des photos avant sont fournies, les uploader
      const beforePhotosData: FiveSPhoto[] = [];
      if (beforePhotos.length > 0) {
        for (const beforePhotoItem of beforePhotos) {
          const filename = `5s_${itemId}_before_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
          const filePath = `5s_photos/${filename}`;
          const { error: uploadError } = await supabase.storage
            .from('5s-photos')
            .upload(filePath, beforePhotoItem.file, {
              cacheControl: '3600',
              upsert: false
            });
          if (uploadError) throw uploadError;
          // Créer l'entrée photo dans la base
          await createFiveSPhoto({
            item_id: itemId,
            checklist_id: checklist.id,
            filename,
            original_filename: filename,
            file_path: filePath,
            file_size: beforePhotoItem.file.size,
            mime_type: 'image/jpeg',
            photo_type: 'before',
            description: beforePhotoItem.description || 'Photo de l\'état avant action',
            taken_at: new Date().toISOString(),
            uploaded_by: user.id
          });
          beforePhotosData.push({
            id: `temp_before_${Date.now()}_${beforePhotosData.length}`,
            item_id: itemId,
            checklist_id: checklist.id,
            filename,
            original_filename: filename,
            file_path: filePath,
            file_size: beforePhotoItem.file.size,
            mime_type: 'image/jpeg',
            photo_type: 'before' as const,
            description: beforePhotoItem.description || 'Photo de l\'état avant action',
            taken_at: new Date().toISOString(),
            uploaded_at: new Date().toISOString(),
            uploaded_by: user.id
          });
        }
      }
      const newItem: FiveSItem = {
        id: itemId,
        title: newItemTitle.trim(),
        description: '',
        status: 'pending',
        priority: 'medium',
        position: checklist.items.length,
        photos: beforePhotosData,
        category: newItemCategory
      };
      const updatedChecklist = {
        ...checklist,
        items: [...checklist.items, newItem],
        updated_at: new Date().toISOString()
      };
      updateChecklist(updatedChecklist);
      
      // Recharger les photos pour s'assurer qu'elles s'affichent
      if (beforePhotosData.length > 0) {
        setTimeout(() => loadPhotoUrls(beforePhotosData), 1000);
      }
      // Réinitialiser le formulaire
      setNewItemTitle('');
      setNewItemCategory('seiri');
      setBeforePhotos([]);
      setBeforePhotoDescription('');
      setActiveView('list');
      alert(beforePhotos.length > 0 ? `Item créé avec ${beforePhotos.length} photo(s) "avant" ! Vous pouvez maintenant réaliser l'action.` : 'Item créé avec succès ! Vous pouvez maintenant réaliser l\'action.');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      alert('Erreur lors de la création de l\'item.');
    } finally {
      setIsCreating(false);
    }
  };
  // Marquer un item comme terminé avec photo du résultat
  const completeItemWithPhoto = async (itemId: string, photoFile: File, description: string) => {
    if (!checklist || !user) return;
    try {
      // Uploader la photo du résultat
      const filename = `5s_${itemId}_result_${Date.now()}.jpg`;
      const filePath = `5s_photos/${filename}`;
      const { error: uploadError } = await supabase.storage
        .from('5s-photos')
        .upload(filePath, photoFile, {
          cacheControl: '3600',
          upsert: false
        });
      if (uploadError) throw uploadError;
      // Créer l'entrée photo dans la base
      await createFiveSPhoto({
        item_id: itemId,
        checklist_id: checklist.id,
        filename,
        original_filename: filename,
        file_path: filePath,
        file_size: photoFile.size,
        mime_type: 'image/jpeg',
        photo_type: 'after',
        description: description || 'Photo du résultat après action',
        taken_at: new Date().toISOString(),
        uploaded_by: user.id
      });
      // Mettre à jour le statut de l'item
      await updateFiveSItem(itemId, {
        status: 'completed',
        completed_at: new Date().toISOString()
      });
      // Mettre à jour la checklist localement
      const updatedItems = checklist.items.map(item =>
        item.id === itemId
          ? {
              ...item,
              status: 'completed' as const,
              completed_at: new Date().toISOString(),
              photos: [...(item.photos || []), {
                id: `temp_${Date.now()}`,
                item_id: itemId,
                checklist_id: checklist.id,
                filename,
                original_filename: filename,
                file_path: filePath,
                file_size: photoFile.size,
                mime_type: 'image/jpeg',
                photo_type: 'after' as const,
                description: description || 'Photo du résultat après action',
                taken_at: new Date().toISOString(),
                uploaded_at: new Date().toISOString(),
                uploaded_by: user.id
              }]
            }
          : item
      );
      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updated_at: new Date().toISOString()
      };
      updateChecklist(updatedChecklist);
      alert('Action terminée avec succès ! Photo du résultat enregistrée.');
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
      alert('Erreur lors de la finalisation de l\'action.');
    }
  };
  const updateItem = async (itemId: string, updates: Partial<FiveSItem>) => {
    if (!checklist) return;
    try {
      await updateFiveSItem(itemId, updates);
      const updatedItems = checklist.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      );
      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updated_at: new Date().toISOString()
      };
      updateChecklist(updatedChecklist);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'item:', error);
      alert('Erreur lors de la mise à jour de l\'item.');
    }
  };
  const removeItem = async (itemId: string) => {
    if (!checklist) return;
    try {
      await deleteFiveSItem(itemId);
      const updatedItems = checklist.items.filter(item => item.id !== itemId);
      const updatedChecklist = {
        ...checklist,
        items: updatedItems,
        updated_at: new Date().toISOString()
      };
      updateChecklist(updatedChecklist);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'item:', error);
      alert('Erreur lors de la suppression de l\'item.');
    }
  };
  // Calcul des statistiques
  const getStats = () => {
    if (!checklist) return { total: 0, completed: 0, inProgress: 0, percentage: 0 };
    const total = checklist.items.length;
    const completed = checklist.items.filter(item => item.status === 'completed').length;
    const inProgress = checklist.items.filter(item => item.status === 'in_progress').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, percentage };
  };
  const stats = getStats();
  if (!isLoaded || !checklist) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span className="text-gray-700">Chargement du module 5S action...</span>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
        {/* Header avec dégradé */}
        <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{checklist.title}</h2>
                <p className="text-white/80 text-sm">Workflow orienté action - Efficacité & Rapidité</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowHelp(true)}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 group"
                title="Aide"
              >
                <HelpCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              </button>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </div>
        {/* Navigation par vue */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveView('create')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeView === 'create'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Plus className="w-5 h-5" />
              <span>Créer un item</span>
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                activeView === 'list'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <List className="w-5 h-5" />
              <span>Actions à réaliser ({checklist.items.length})</span>
            </button>
          </div>
        </div>
        {/* Zone de contenu principal avec scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-8 space-y-8">
            {activeView === 'create' && (
              <div className="max-w-2xl mx-auto space-y-8">
                {/* Statistiques rapides */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/60 text-center">
                    <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                    <div className="text-sm text-gray-600">Actions créées</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/60 text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                    <div className="text-sm text-gray-600">Terminées</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/60 text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
                    <div className="text-sm text-gray-600">En cours</div>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-white/60 text-center">
                    <div className="text-2xl font-bold text-teal-600">{stats.percentage}%</div>
                    <div className="text-sm text-gray-600">Progression</div>
                  </div>
                </div>
                {/* Formulaire de création simple */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/60">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Créer une nouvelle action</h3>
                    <p className="text-gray-600">Définissez l'action à réaliser, puis exécutez-la et prenez une photo du résultat</p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Action à réaliser *
                      </label>
                      <input
                        type="text"
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        placeholder="Ex: Nettoyer l'établi principal"
                        onKeyDown={(e) => e.key === 'Enter' && createSimpleItem()}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Pilier 5S
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {FIVE_S_PILLARS.map((pillar) => (
                          <button
                            key={pillar.key}
                            onClick={() => setNewItemCategory(pillar.key)}
                            className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                              newItemCategory === pillar.key
                                ? `bg-gradient-to-r ${pillar.color} text-white border-transparent`
                                : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-center">
                              <span className="text-2xl mb-2 block">{pillar.icon}</span>
                              <div className="font-medium">{pillar.title.split(' - ')[0]}</div>
                              <div className={`text-sm ${newItemCategory === pillar.key ? 'text-white/80' : 'text-gray-500'}`}>
                                {pillar.description}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Section photo avant (optionnelle) */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-xl border border-amber-200">
                      <div className="flex items-center space-x-3 mb-4">
                        <Camera className="w-6 h-6 text-amber-600" />
                        <div>
                          <h4 className="text-lg font-semibold text-amber-800">Photo de l'état avant (optionnel)</h4>
                          <p className="text-sm text-amber-600">Documentez l'état actuel avant de réaliser l'action</p>
                        </div>
                      </div>
                      {/* Interface caméra */}
                      {isCameraOpen && (
                        <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                          <div className="flex flex-col items-center space-y-4">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              className="w-full max-w-md rounded-lg border border-gray-300"
                            />
                            <canvas ref={canvasRef} className="hidden" />
                            <div className="flex flex-col space-y-3 w-full max-w-md">
                              <textarea
                                value={beforePhotoDescription}
                                onChange={(e) => setBeforePhotoDescription(e.target.value)}
                                placeholder="Décrivez l'état actuel..."
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
                                rows={2}
                              />
                              <div className="flex space-x-3">
                                <button
                                  onClick={takeBeforePhoto}
                                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 rounded-lg hover:from-amber-600 hover:to-orange-700 transition-all duration-200"
                                >
                                  Prendre la photo
                                </button>
                                <button
                                  onClick={stopCamera}
                                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
                                >
                                  Annuler
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Boutons d'action photo */}
                      {!isCameraOpen && (
                        <div className="flex flex-wrap gap-3 mb-4">
                          <button
                            onClick={startCamera}
                            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                          >
                            <Camera className="w-5 h-5" />
                            <span>Prendre une photo</span>
                          </button>
                          <label className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 cursor-pointer">
                            <ImageIcon className="w-5 h-5" />
                            <span>Importer des photos</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={handleBeforeFileUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                      {/* Aperçu des photos avant */}
                      {beforePhotos.length > 0 && (
                        <div className="mb-4">
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-lg font-semibold text-gray-900">{beforePhotos.length} photo(s) "avant" sélectionnée(s)</h5>
                              <button
                                onClick={() => setBeforePhotos([])}
                                className="text-red-600 hover:text-red-800 font-medium"
                                title="Supprimer toutes les photos"
                              >
                                Tout supprimer
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {beforePhotos.map((beforePhoto, index) => (
                                <div key={index} className="relative">
                                  <div className="flex items-start justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">Photo {index + 1}</span>
                                    <button
                                      onClick={() => removeBeforePhoto(index)}
                                      className="w-6 h-6 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
                                      title="Supprimer cette photo"
                                    >
                                      <X className="w-3 h-3 text-red-600" />
                                    </button>
                                  </div>
                                  <img
                                    src={URL.createObjectURL(beforePhoto.file)}
                                    alt={`État avant action ${index + 1}`}
                                    className="w-full rounded-lg border border-gray-300 mb-2"
                                  />
                                  <textarea
                                    value={beforePhoto.description}
                                    onChange={(e) => updateBeforePhotoDescription(index, e.target.value)}
                                    placeholder={`Décrivez l'état actuel (photo ${index + 1})...`}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none text-sm"
                                    rows={2}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="text-sm text-amber-700 bg-amber-100 p-3 rounded-lg">
                        <strong>💡 Conseil :</strong> Une photo "avant" permet de mesurer visuellement l'impact de votre action d'amélioration 5S.
                      </div>
                    </div>
                    <button
                      onClick={createSimpleItem}
                      disabled={!newItemTitle.trim() || isCreating}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-4 rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>{isCreating ? 'Création...' : 'Créer l\'action'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
            {activeView === 'list' && (
              <div className="space-y-6">
                {/* Liste des actions */}
                <div className="space-y-4">
                  {checklist.items.length === 0 ? (
                    <div className="text-center py-16">
                      <Play className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-500 mb-2">Aucune action créée</h3>
                      <p className="text-gray-400 mb-6">Commencez par créer votre première action dans l'onglet "Créer un item".</p>
                      <button
                        onClick={() => setActiveView('create')}
                        className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all duration-200"
                      >
                        Créer la première action
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Actions en cours */}
                      {checklist.items.filter(item => item.status !== 'completed').length > 0 && (
                        <div className="space-y-4">
                          {checklist.items
                            .filter(item => item.status !== 'completed')
                            .map((item, index) => {
                      const pillar = FIVE_S_PILLARS.find(p => p.key === item.category);
                      // Couleur de fond selon la catégorie 5S (couleur douce + bordure colorée)
                      const cardBgClass = pillar 
                        ? `${pillar.bgColor} backdrop-blur-sm ${pillar.borderColor} border-2`
                        : 'bg-white/80 backdrop-blur-sm border-white/60 border';
                      return (
                        <div key={item.id} className={`${cardBgClass} rounded-2xl p-6 shadow-lg`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4 flex-1">
                              {/* Status */}
                              <div className="flex-shrink-0">
                                {item.status === 'completed' ? (
                                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                                ) : item.status === 'in_progress' ? (
                                  <Clock className="w-6 h-6 text-yellow-600" />
                                ) : (
                                  <Circle className="w-6 h-6 text-gray-400" />
                                )}
                              </div>
                              {/* Contenu */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center space-x-3">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
                                    item.category === 'seiri' ? 'bg-red-100 text-red-800' :
                                    item.category === 'seiton' ? 'bg-blue-100 text-blue-800' :
                                    item.category === 'seiso' ? 'bg-green-100 text-green-800' :
                                    item.category === 'seiketsu' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {pillar?.icon} {pillar?.title}
                                  </span>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                    className="flex-1 text-lg font-semibold bg-transparent border-0 focus:ring-0 p-0 placeholder-gray-400 text-gray-900"
                                  />
                                </div>
                                {item.photos && item.photos.length > 0 ? (
                                  <div className="mt-4">
                                    <div className="mb-2 text-sm text-gray-600">
                                      {item.photos.length} photo(s) trouvée(s)
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {item.photos.slice(0, 4).map((photo, photoIndex) => (
                                        <button
                                          key={photo.id}
                                          onClick={() => {
                                            setViewingPhotos(item.photos || []);
                                            setViewingItemTitle(item.title);
                                            setShowPhotoViewer(true);
                                          }}
                                          className="relative w-16 h-16 rounded-lg border-2 border-gray-200 hover:border-teal-400 transition-all duration-200 overflow-hidden group"
                                          title={`${photo.photo_type === 'before' ? 'Avant' : 'Après'}: ${photo.description || 'Sans description'}`}
                                        >
                                          <PhotoThumbnail 
                                            photo={photo} 
                                            photoIndex={photoIndex}
                                            photoUrls={photoUrls}
                                            loadPhotoUrls={loadPhotoUrls}
                                          />
                                          <div className={`absolute bottom-0 left-0 right-0 text-xs text-center py-1 font-medium ${
                                            photo.photo_type === 'before'
                                              ? 'bg-amber-500 text-white'
                                              : 'bg-green-500 text-white'
                                          }`}>
                                            {photo.photo_type === 'before' ? 'Avant' : 'Après'}
                                          </div>
                                        </button>
                                      ))}
                                      {item.photos.length > 4 && (
                                        <button
                                          onClick={() => {
                                            setViewingPhotos(item.photos || []);
                                            setViewingItemTitle(item.title);
                                            setShowPhotoViewer(true);
                                          }}
                                          className="w-16 h-16 rounded-lg border-2 border-gray-200 hover:border-teal-400 transition-all duration-200 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                                          title={`Voir toutes les ${item.photos.length} photos`}
                                        >
                                          <span className="text-sm font-medium text-gray-600">+{item.photos.length - 4}</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-4 text-sm text-gray-500 italic">
                                    Aucune photo attachée à cette action
                                  </div>
                                )}
                                {/* Métadonnées */}
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Créé le {new Date(item.completed_at || item.due_date || Date.now()).toLocaleDateString()} à {new Date(item.completed_at || item.due_date || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              {item.status !== 'completed' && (
                                <button
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setShowPhotoModal(true);
                                  }}
                                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2 text-sm"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Terminer</span>
                                </button>
                              )}
                              <button
                                onClick={() => removeItem(item.id)}
                                className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                        </div>
                      )}
                      
                      {/* Actions terminées */}
                      {checklist.items.filter(item => item.status === 'completed').length > 0 && (
                        <div className="mt-8">
                          <div className="flex items-center mb-6">
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                            <h3 className="mx-4 text-lg font-semibold text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                              <CheckCircle2 className="w-5 h-5 text-green-600 inline mr-2" />
                              Actions terminées ({checklist.items.filter(item => item.status === 'completed').length})
                            </h3>
                            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                          </div>
                          <div className="space-y-4">
                            {checklist.items
                              .filter(item => item.status === 'completed')
                              .map((item, index) => {
                      const pillar = FIVE_S_PILLARS.find(p => p.key === item.category);
                      // Couleur de fond selon la catégorie 5S (couleur douce + bordure colorée + opacité)
                      const cardBgClass = pillar 
                        ? `${pillar.bgColor} backdrop-blur-sm ${pillar.borderColor} border-2 opacity-75`
                        : 'bg-white/80 backdrop-blur-sm border-white/60 border opacity-75';
                      return (
                        <div key={item.id} className={`${cardBgClass} rounded-2xl p-6 shadow-lg`}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4 flex-1">
                              {/* Status */}
                              <div className="flex-shrink-0">
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              </div>
                              {/* Contenu */}
                              <div className="flex-1 space-y-3">
                                <div className="flex items-center space-x-3">
                                  <span className={`px-3 py-1 rounded-full text-sm font-medium w-fit ${
                                    item.category === 'seiri' ? 'bg-red-100 text-red-800' :
                                    item.category === 'seiton' ? 'bg-blue-100 text-blue-800' :
                                    item.category === 'seiso' ? 'bg-green-100 text-green-800' :
                                    item.category === 'seiketsu' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-purple-100 text-purple-800'
                                  }`}>
                                    {pillar?.icon} {pillar?.title}
                                  </span>
                                  <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                    className="flex-1 text-lg font-semibold bg-transparent border-0 focus:ring-0 p-0 placeholder-gray-400 text-gray-700"
                                    disabled
                                  />
                                </div>
                                {/* Photos miniatures */}
                                {item.photos && item.photos.length > 0 ? (
                                  <div className="mt-4">
                                    <div className="mb-2 text-sm text-gray-500">
                                      {item.photos.length} photo(s) trouvée(s)
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {item.photos.slice(0, 4).map((photo, photoIndex) => (
                                        <button
                                          key={photo.id}
                                          onClick={() => {
                                            setViewingPhotos(item.photos || []);
                                            setViewingItemTitle(item.title);
                                            setShowPhotoViewer(true);
                                          }}
                                          className="relative w-16 h-16 rounded-lg border-2 border-gray-200 hover:border-teal-400 transition-all duration-200 overflow-hidden group"
                                          title={`${photo.photo_type === 'before' ? 'Avant' : 'Après'}: ${photo.description || 'Sans description'}`}
                                        >
                                          <PhotoThumbnail 
                                            photo={photo} 
                                            photoIndex={photoIndex}
                                            photoUrls={photoUrls}
                                            loadPhotoUrls={loadPhotoUrls}
                                          />
                                          <div className={`absolute bottom-0 left-0 right-0 text-xs text-center py-1 font-medium ${
                                            photo.photo_type === 'before'
                                              ? 'bg-amber-500 text-white'
                                              : 'bg-green-500 text-white'
                                          }`}>
                                            {photo.photo_type === 'before' ? 'Avant' : 'Après'}
                                          </div>
                                        </button>
                                      ))}
                                      {item.photos.length > 4 && (
                                        <button
                                          onClick={() => {
                                            setViewingPhotos(item.photos || []);
                                            setViewingItemTitle(item.title);
                                            setShowPhotoViewer(true);
                                          }}
                                          className="w-16 h-16 rounded-lg border-2 border-gray-200 hover:border-teal-400 transition-all duration-200 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                                          title={`Voir toutes les ${item.photos.length} photos`}
                                        >
                                          <span className="text-sm font-medium text-gray-600">+{item.photos.length - 4}</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="mt-4 text-sm text-gray-500 italic">
                                    Aucune photo attachée à cette action
                                  </div>
                                )}
                                {/* Métadonnées */}
                                <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-4 h-4" />
                                    <span>Terminé le {new Date(item.completed_at || Date.now()).toLocaleDateString()} à {new Date(item.completed_at || Date.now()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <button
                                onClick={() => removeItem(item.id)}
                                className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Modal d'aide */}
        {showHelp && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
              <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">5S Action - Guide d'utilisation</h3>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(95vh - 180px)' }}>
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Colonne 1 : Principe et workflow */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-teal-50 to-cyan-50 p-6 rounded-xl border border-teal-200">
                      <h4 className="text-lg font-semibold text-teal-800 mb-4 flex items-center">
                        <Play className="w-5 h-5 mr-2" />
                        Principe du workflow 5S Action
                      </h4>
                      <p className="text-teal-700 text-sm mb-4">
                        Une approche orientée action pour améliorer l'efficacité et l'organisation avec la méthode 5S.
                        Créez rapidement des actions concrètes, documentez les résultats avec des photos avant/après.
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                      <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                        <ArrowRight className="w-5 h-5 mr-2" />
                        Workflow en 5 étapes
                      </h4>
                      <div className="space-y-3">
                        {[
                          { step: 1, title: "Créer l'action", desc: "Définir clairement l'action à réaliser", color: "bg-blue-600" },
                          { step: 2, title: "Photo avant (optionnel)", desc: "Documenter l'état actuel", color: "bg-blue-600" },
                          { step: 3, title: "Réaliser l'action", desc: "Exécuter concrètement l'amélioration", color: "bg-blue-600" },
                          { step: 4, title: "Photo du résultat", desc: "Documenter le résultat obtenu", color: "bg-blue-600" },
                          { step: 5, title: "Marquer terminé", desc: "Valider avec la photo du résultat", color: "bg-blue-600" }
                        ].map((item) => (
                          <div key={item.step} className="flex items-start">
                            <span className={`w-7 h-7 ${item.color} text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 flex-shrink-0`}>
                              {item.step}
                            </span>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{item.title}</div>
                              <div className="text-xs text-gray-600">{item.desc}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Colonne 2 : Piliers 5S et conseils */}
                  <div className="space-y-6">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                      <h4 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
                        <List className="w-5 h-5 mr-2" />
                        Les 5 piliers 5S
                      </h4>
                      <div className="space-y-3">
                        {FIVE_S_PILLARS.map((pillar) => (
                          <div key={pillar.key} className="flex items-center space-x-3">
                            <span className="text-lg">{pillar.icon}</span>
                            <div>
                              <div className="font-medium text-gray-900 text-sm">{pillar.title}</div>
                              <div className="text-xs text-gray-600">{pillar.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
                      <h4 className="text-lg font-semibold text-yellow-800 mb-4 flex items-center">
                        <Zap className="w-5 h-5 mr-2" />
                        Conseils pour l'efficacité
                      </h4>
                      <ul className="text-yellow-700 space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          Créez des actions concrètes et réalisables rapidement
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          Les photos "avant" sont optionnelles mais recommandées
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          Concentrez-vous sur l'exécution plutôt que la documentation
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          Prenez toujours une photo du résultat final
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          Les commentaires sur les photos capitalisent l'expérience
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          Comparez les photos avant/après pour mesurer l'impact
                        </li>
                      </ul>
                    </div>

                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                      <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                        <Camera className="w-5 h-5 mr-2" />
                        Documentation visuelle
                      </h4>
                      <div className="text-green-700 text-sm space-y-2">
                        <p><strong>Photos avant :</strong> Documentent l'état initial (optionnel)</p>
                        <p><strong>Photos après :</strong> Documentent le résultat (obligatoire)</p>
                        <p><strong>Miniatures :</strong> Aperçu rapide dans chaque carte d'action</p>
                        <p><strong>Visualisation :</strong> Cliquez sur les miniatures pour voir en grand</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50 to-white">
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-xl hover:from-teal-600 hover:to-cyan-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
                >
                  Compris !
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Modal de finalisation avec photo */}
        {showPhotoModal && selectedItem && (
          <PhotoCompletionModal
            item={selectedItem}
            checklistId={checklist.id}
            userId={user?.id}
            onComplete={completeItemWithPhoto}
            onCompleteWithoutPhoto={(itemId) => updateItem(itemId, {
              status: 'completed',
              completed_at: new Date().toISOString()
            })}
            onClose={() => {
              setShowPhotoModal(false);
              setSelectedItem(null);
            }}
          />
        )}
        {/* Modal de visualisation des photos */}
        {showPhotoViewer && (
          <PhotoViewerModal
            photos={viewingPhotos}
            itemTitle={viewingItemTitle}
            onClose={() => {
              setShowPhotoViewer(false);
              setViewingPhotos([]);
              setViewingItemTitle('');
            }}
          />
        )}
      </div>
    </div>
  );
};
// Composant pour les miniatures de photos
interface PhotoThumbnailProps {
  photo: FiveSPhoto;
  photoIndex: number;
  photoUrls: {[key: string]: string};
  loadPhotoUrls: (photos: FiveSPhoto[]) => Promise<void>;
}

const PhotoThumbnail: React.FC<PhotoThumbnailProps> = ({ 
  photo, 
  photoIndex, 
  photoUrls, 
  loadPhotoUrls 
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const loadUrl = async () => {
      setIsLoading(true);
      setHasError(false);
      
      try {
        // Vérifier si l'URL est déjà dans le cache
        if (photoUrls[photo.id]) {
          setImageUrl(photoUrls[photo.id]);
          setIsLoading(false);
          return;
        }

        // Charger l'URL depuis Supabase
        const { data } = await supabase.storage
          .from('5s-photos')
          .createSignedUrl(photo.file_path, 3600);
        
        if (data?.signedUrl) {
          setImageUrl(data.signedUrl);
          // Mettre à jour le cache global
          await loadPhotoUrls([photo]);
        } else {
          setHasError(true);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la photo:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadUrl();
  }, [photo, photoUrls, loadPhotoUrls]);

  if (isLoading) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
        <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (hasError || !imageUrl) {
    return (
      <div className="w-full h-full bg-red-50 flex items-center justify-center">
        <ImageIcon className="w-4 h-4 text-red-400" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={`Photo ${photoIndex + 1}`}
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
};

// Composant de finalisation avec photo du résultat
interface PhotoCompletionModalProps {
  item: FiveSItem;
  checklistId: string;
  userId?: string;
  onComplete: (itemId: string, photoFile: File, description: string) => Promise<void>;
  onCompleteWithoutPhoto: (itemId: string) => void;
  onClose: () => void;
}
const PhotoCompletionModal: React.FC<PhotoCompletionModalProps> = ({
  item,
  checklistId,
  userId,
  onComplete,
  onCompleteWithoutPhoto,
  onClose
}) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [photoDescription, setPhotoDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Erreur accès caméra:', error);
      alert('Impossible d\'accéder à la caméra.');
    }
  };
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraOpen(false);
  };
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) {
        const filename = `result_${Date.now()}.jpg`;
        const file = new File([blob], filename, { type: 'image/jpeg' });
        setCapturedPhoto(file);
        stopCamera();
        alert('Photo du résultat capturée !');
      }
    }, 'image/jpeg', 0.8);
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setCapturedPhoto(file);
    }
  };
  const completeAction = async () => {
    if (!capturedPhoto) {
      alert('Veuillez prendre ou importer une photo du résultat.');
      return;
    }
    setIsUploading(true);
    try {
      await onComplete(item.id, capturedPhoto, photoDescription);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la finalisation:', error);
    } finally {
      setIsUploading(false);
    }
  };
  const completeWithoutPhoto = () => {
    if (confirm('Êtes-vous sûr de vouloir terminer cette action sans photo du résultat ?')) {
      onCompleteWithoutPhoto(item.id);
      onClose();
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Finaliser l'action: {item.title}</h3>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="text-center mb-6">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">Action réalisée ?</h4>
            <p className="text-gray-600">Prenez une photo du résultat pour documenter l'amélioration</p>
          </div>
          {/* Interface caméra */}
          {isCameraOpen && (
            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <div className="flex flex-col items-center space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-md rounded-lg border border-gray-300"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex flex-col space-y-3 w-full max-w-md">
                  <textarea
                    value={photoDescription}
                    onChange={(e) => setPhotoDescription(e.target.value)}
                    placeholder="Décrivez le résultat obtenu..."
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                    rows={2}
                  />
                  <div className="flex space-x-3">
                    <button
                      onClick={takePhoto}
                      className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
                    >
                      Prendre la photo
                    </button>
                    <button
                      onClick={stopCamera}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Boutons d'action */}
          {!capturedPhoto && (
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={startCamera}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
              >
                <Camera className="w-5 h-5" />
                <span>Prendre une photo</span>
              </button>
              <label className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 cursor-pointer">
                <ImageIcon className="w-5 h-5" />
                <span>Importer une photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
          {/* Aperçu de la photo capturée */}
          {capturedPhoto && (
            <div className="mb-6">
              <h5 className="text-lg font-semibold text-gray-900 mb-4">Photo du résultat</h5>
              <div className="bg-gray-100 rounded-lg p-4">
                <img
                  src={URL.createObjectURL(capturedPhoto)}
                  alt="Résultat de l'action"
                  className="w-full max-w-md mx-auto rounded-lg border border-gray-300"
                />
                <div className="mt-4">
                  <textarea
                    value={photoDescription}
                    onChange={(e) => setPhotoDescription(e.target.value)}
                    placeholder="Décrivez le résultat obtenu..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
          {/* Boutons de finalisation */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200"
            >
              Annuler
            </button>
            <button
              onClick={completeWithoutPhoto}
              className="px-4 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-200"
            >
              Terminer sans photo
            </button>
            <button
              onClick={completeAction}
              disabled={!capturedPhoto || isUploading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Finalisation...' : 'Finaliser avec photo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
// Composant de visualisation des photos
interface PhotoViewerModalProps {
  photos: FiveSPhoto[];
  itemTitle: string;
  onClose: () => void;
}
const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  photos,
  itemTitle,
  onClose
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const nextPhoto = () => {
    setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
  };
  const prevPhoto = () => {
    setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
  };
  const getImageUrl = async (photo: FiveSPhoto) => {
    try {
      const { data } = await supabase.storage
        .from('5s-photos')
        .createSignedUrl(photo.file_path, 3600);
      return data?.signedUrl || '';
    } catch (error) {
      console.error('Erreur lors de la génération de l\'URL:', error);
      return '';
    }
  };
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  useEffect(() => {
    const loadImageUrls = async () => {
      const urls = await Promise.all(photos.map(photo => getImageUrl(photo)));
      setImageUrls(urls);
    };
    loadImageUrls();
  }, [photos]);
  if (photos.length === 0) return null;
  const currentPhoto = photos[currentPhotoIndex];
  const currentImageUrl = imageUrls[currentPhotoIndex];
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{itemTitle}</h3>
              <p className="text-sm text-gray-600">
                Photo {currentPhotoIndex + 1} sur {photos.length} - Type: {currentPhoto.photo_type === 'before' ? 'Avant' : 'Après'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-200"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="flex flex-col items-center">
            {currentImageUrl && (
              <div className="relative mb-4">
                <img
                  src={currentImageUrl}
                  alt={`Photo ${currentPhotoIndex + 1}`}
                  className="max-w-full max-h-[60vh] rounded-lg border border-gray-300 shadow-lg"
                />
                {/* Navigation entre les photos */}
                {photos.length > 1 && (
                  <>
                    <button
                      onClick={prevPhoto}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                    >
                      <ArrowRight className="w-6 h-6 transform rotate-180" />
                    </button>
                    <button
                      onClick={nextPhoto}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full flex items-center justify-center transition-all duration-200"
                    >
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            )}
            {/* Description de la photo */}
            {currentPhoto.description && (
              <div className="w-full max-w-2xl bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Description :</h4>
                <p className="text-gray-700">{currentPhoto.description}</p>
              </div>
            )}
            {/* Métadonnées */}
            <div className="w-full max-w-2xl bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Détails :</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                <div>
                  <strong>Type :</strong> {currentPhoto.photo_type === 'before' ? 'Photo avant' : 'Photo après'}
                </div>
                <div>
                  <strong>Taille :</strong> {currentPhoto.file_size ? (currentPhoto.file_size / 1024).toFixed(1) : 'N/A'} KB
                </div>
                <div>
                  <strong>Prise le :</strong> {currentPhoto.taken_at ? new Date(currentPhoto.taken_at).toLocaleString() : 'N/A'}
                </div>
                <div>
                  <strong>Uploadée le :</strong> {currentPhoto.uploaded_at ? new Date(currentPhoto.uploaded_at).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
            {/* Navigation par miniatures si plusieurs photos */}
            {photos.length > 1 && (
              <div className="w-full mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Toutes les photos :</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {photos.map((photo, index) => (
                    <button
                      key={photo.id}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`relative w-16 h-16 rounded-lg border-2 overflow-hidden transition-all duration-200 ${
                        index === currentPhotoIndex
                          ? 'border-teal-500 ring-2 ring-teal-200'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {imageUrls[index] && (
                        <img
                          src={imageUrls[index]}
                          alt={`Miniature ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <div className={`absolute bottom-0 left-0 right-0 text-xs text-center py-1 ${
                        photo.photo_type === 'before'
                          ? 'bg-amber-500 text-white'
                          : 'bg-green-500 text-white'
                      }`}>
                        {photo.photo_type === 'before' ? 'Avant' : 'Après'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};