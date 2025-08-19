import React, { useState, useEffect, useRef } from 'react';
import { A3Module } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import {
  FileText, Plus, X, Save, Download, Upload, Eye, Edit3, Trash2,
  ChevronRight, ChevronDown, Clock, User, AlertTriangle, CheckCircle,
  Camera, Video, File, Link, Settings, HelpCircle, Search, Filter,
  BookOpen, Shield, Target, Zap, Package, Wrench, Users, ClipboardCheck,
  History, Archive, Copy, Printer, Share2, Lock, Unlock, Tag, Calendar
} from 'lucide-react';

// Types
interface SOPStep {
  id: string;
  number: number;
  title: string;
  description: string;
  duration: number; // en minutes
  criticalPoint: boolean;
  safetyWarning?: string;
  qualityCheck?: string;
  tools: string[];
  materials: string[];
  images: string[];
  videos: string[];
  documents: string[];
  subSteps?: SOPSubStep[];
}

interface SOPSubStep {
  id: string;
  description: string;
  checkRequired: boolean;
  completed?: boolean;
}

interface SOPSection {
  id: string;
  title: string;
  order: number;
  steps: SOPStep[];
  expanded: boolean;
}

interface SOPRevision {
  id: string;
  version: string;
  date: Date;
  author: string;
  changes: string;
  approved: boolean;
  approvedBy?: string;
  approvalDate?: Date;
}

interface SOPContent {
  title: string;
  sopNumber: string;
  department: string;
  process: string;
  scope: string;
  objective: string;
  responsibilities: { role: string; tasks: string[] }[];
  sections: SOPSection[];
  totalDuration: number;
  requiredTraining: string[];
  ppe: string[]; // Personal Protective Equipment
  revisions: SOPRevision[];
  currentVersion: string;
  status: 'draft' | 'review' | 'approved' | 'obsolete';
  effectiveDate: Date;
  reviewDate: Date;
  keywords: string[];
  references: { title: string; link: string }[];
  relatedSOPs: string[];
}

// Composants internes
const DurationBadge: React.FC<{ duration: number }> = ({ duration }) => {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const displayTime = hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
  
  return (
    <span className="inline-flex items-center px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
      <Clock className="w-3 h-3 mr-1" />
      {displayTime}
    </span>
  );
};

const StatusBadge: React.FC<{ status: SOPContent['status'] }> = ({ status }) => {
  const config = {
    draft: { color: 'bg-gray-100 text-gray-700', icon: Edit3 },
    review: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    obsolete: { color: 'bg-red-100 text-red-700', icon: Archive }
  };
  
  const { color, icon: Icon } = config[status];
  
  return (
    <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full ${color}`}>
      <Icon className="w-4 h-4 mr-1" />
      {status === 'draft' ? 'Brouillon' :
       status === 'review' ? 'En révision' :
       status === 'approved' ? 'Approuvé' : 'Obsolète'}
    </span>
  );
};

export const SOPEditor: React.FC<{ module: A3Module; onClose: () => void }> = ({ module, onClose }) => {
  const { updateA3Module } = useDatabase();
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'revisions'>('editor');
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [editingStep, setEditingStep] = useState<SOPStep | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showStepForm, setShowStepForm] = useState(false);
  
// Initialisation du contenu
  const initializeContent = (): SOPContent => {
    const defaults: SOPContent = {
      title: '',
      sopNumber: `SOP-${Date.now()}`,
      department: '',
      process: '',
      scope: '',
      objective: '',
      responsibilities: [],
      sections: [],
      totalDuration: 0,
      requiredTraining: [],
      ppe: [],
      revisions: [{
        id: `rev-${Date.now()}`,
        version: '1.0',
        date: new Date(),
        author: '',
        changes: 'Création initiale',
        approved: false
      }],
      currentVersion: '1.0',
      status: 'draft',
      effectiveDate: new Date(),
      reviewDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
      keywords: [],
      references: [],
      relatedSOPs: []
    };
    
    if (module.content && typeof module.content === 'object') {
      // Merge defaults with existing content to prevent missing properties
      return { ...defaults, ...module.content };
    }
    
    return defaults;
  };
  
  const [content, setContent] = useState<SOPContent>(initializeContent());
  
  // Sauvegarde
  const saveContent = async (newContent: SOPContent) => {
    // Recalcul de la durée totale
    const totalDuration = newContent.sections.reduce((total, section) => 
      total + section.steps.reduce((sectionTotal, step) => sectionTotal + step.duration, 0), 0
    );
    
    const updatedContent = { ...newContent, totalDuration };
    setContent(updatedContent);
    await updateA3Module(module.id, { content: updatedContent });
  };
  
  // Ajouter une section
  const addSection = () => {
    const newSection: SOPSection = {
      id: `section-${Date.now()}`,
      title: `Section ${content.sections.length + 1}`,
      order: content.sections.length + 1,
      steps: [],
      expanded: true
    };
    
    saveContent({
      ...content,
      sections: [...content.sections, newSection]
    });
    
    setSelectedSection(newSection.id);
  };
  
  // Ajouter une étape
  const addStep = (sectionId: string) => {
    const section = content.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const newStep: SOPStep = {
      id: `step-${Date.now()}`,
      number: section.steps.length + 1,
      title: '',
      description: '',
      duration: 5,
      criticalPoint: false,
      tools: [],
      materials: [],
      images: [],
      videos: [],
      documents: [],
      subSteps: []
    };
    
    setEditingStep(newStep);
    setSelectedSection(sectionId);
    setShowStepForm(true);
  };
  
  // Sauvegarder une étape
  const saveStep = (step: SOPStep) => {
    const updatedSections = content.sections.map(section => {
      if (section.id === selectedSection) {
        const existingStepIndex = section.steps.findIndex(s => s.id === step.id);
        if (existingStepIndex >= 0) {
          // Mise à jour
          const updatedSteps = [...section.steps];
          updatedSteps[existingStepIndex] = step;
          return { ...section, steps: updatedSteps };
        } else {
          // Nouvelle étape
          return { ...section, steps: [...section.steps, step] };
        }
      }
      return section;
    });
    
    saveContent({ ...content, sections: updatedSections });
    setEditingStep(null);
    setShowStepForm(false);
  };
  
  // Supprimer une étape
  const deleteStep = (sectionId: string, stepId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette étape ?')) return;
    
    const updatedSections = content.sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          steps: section.steps.filter(s => s.id !== stepId)
        };
      }
      return section;
    });
    
    saveContent({ ...content, sections: updatedSections });
  };
  
  // Dupliquer une section
  const duplicateSection = (sectionId: string) => {
    const section = content.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const newSection: SOPSection = {
      ...section,
      id: `section-${Date.now()}`,
      title: `${section.title} (Copie)`,
      order: content.sections.length + 1,
      steps: section.steps.map(step => ({
        ...step,
        id: `step-${Date.now()}-${Math.random()}`
      }))
    };
    
    saveContent({
      ...content,
      sections: [...content.sections, newSection]
    });
  };
  
  // Toggle expansion section
  const toggleSection = (sectionId: string) => {
    const updatedSections = content.sections.map(section => 
      section.id === sectionId 
        ? { ...section, expanded: !section.expanded }
        : section
    );
    saveContent({ ...content, sections: updatedSections });
  };
  
  // Filtrer les étapes par recherche
  const filteredSections = content.sections.map(section => ({
    ...section,
    steps: section.steps.filter(step => 
      step.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      step.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(section => 
    searchTerm === '' || 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    section.steps.length > 0
  );
  
  // Modal d'édition d'étape
  const StepEditModal = () => {
    if (!editingStep) return null;
    
    const [formData, setFormData] = useState({
      ...editingStep,
      tools: editingStep.tools || [],
      materials: editingStep.materials || [],
      subSteps: editingStep.subSteps || [],
      images: editingStep.images || [],
      videos: editingStep.videos || [],
      documents: editingStep.documents || []
    });
    const [newSubStep, setNewSubStep] = useState('');
    const [newTool, setNewTool] = useState('');
    const [newMaterial, setNewMaterial] = useState('');
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">
                {content.sections.find(s => s.id === selectedSection)?.steps.find(st => st.id === editingStep.id) 
                  ? 'Modifier l\'étape' 
                  : 'Nouvelle étape'}
              </h3>
              <button
                onClick={() => {
                  setEditingStep(null);
                  setShowStepForm(false);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              {/* Colonne gauche */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre de l'étape *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Ex: Préparation du poste de travail"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description détaillée *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2"
                    rows={4}
                    placeholder="Décrivez précisément les actions à effectuer..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Durée (minutes)
                    </label>
                    <input
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      className="w-full border rounded-lg px-3 py-2"
                      min="1"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.criticalPoint}
                        onChange={(e) => setFormData({ ...formData, criticalPoint: e.target.checked })}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">Point critique</span>
                      <Shield className="w-4 h-4 text-red-500" />
                    </label>
                  </div>
                </div>
                
                {formData.criticalPoint && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Avertissement sécurité
                      </label>
                      <div className="relative">
                        <AlertTriangle className="absolute left-3 top-3 w-4 h-4 text-yellow-500" />
                        <textarea
                          value={formData.safetyWarning || ''}
                          onChange={(e) => setFormData({ ...formData, safetyWarning: e.target.value })}
                          className="w-full border border-yellow-300 rounded-lg pl-10 pr-3 py-2 bg-yellow-50"
                          rows={2}
                          placeholder="Précisez les risques et mesures de sécurité..."
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contrôle qualité
                      </label>
                      <div className="relative">
                        <CheckCircle className="absolute left-3 top-3 w-4 h-4 text-green-500" />
                        <textarea
                          value={formData.qualityCheck || ''}
                          onChange={(e) => setFormData({ ...formData, qualityCheck: e.target.value })}
                          className="w-full border border-green-300 rounded-lg pl-10 pr-3 py-2 bg-green-50"
                          rows={2}
                          placeholder="Points de contrôle à vérifier..."
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              {/* Colonne droite */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sous-étapes
                  </label>
                  <div className="space-y-2">
                    {formData.subSteps?.map((subStep, index) => (
                      <div key={subStep.id} className="flex items-center space-x-2 p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium text-gray-500">{index + 1}.</span>
                        <span className="flex-1 text-sm">{subStep.description}</span>
                        {subStep.checkRequired && (
                          <ClipboardCheck className="w-4 h-4 text-blue-500" />
                        )}
                        <button
                          onClick={() => setFormData({
                            ...formData,
                            subSteps: formData.subSteps?.filter(s => s.id !== subStep.id)
                          })}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newSubStep}
                        onChange={(e) => setNewSubStep(e.target.value)}
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        placeholder="Ajouter une sous-étape..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newSubStep) {
                            setFormData({
                              ...formData,
                              subSteps: [...(formData.subSteps || []), {
                                id: `substep-${Date.now()}`,
                                description: newSubStep,
                                checkRequired: false
                              }]
                            });
                            setNewSubStep('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newSubStep) {
                            setFormData({
                              ...formData,
                              subSteps: [...(formData.subSteps || []), {
                                id: `substep-${Date.now()}`,
                                description: newSubStep,
                                checkRequired: false
                              }]
                            });
                            setNewSubStep('');
                          }
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Outils nécessaires
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {(formData.tools || []).map((tool, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                          <Wrench className="w-3 h-3 mr-1" />
                          {tool}
                          <button
                            onClick={() => setFormData({
                              ...formData,
                              tools: formData.tools.filter((_, i) => i !== index)
                            })}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newTool}
                        onChange={(e) => setNewTool(e.target.value)}
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        placeholder="Ajouter un outil..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newTool) {
                            setFormData({
                              ...formData,
                              tools: [...formData.tools, newTool]
                            });
                            setNewTool('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newTool) {
                            setFormData({
                              ...formData,
                              tools: [...formData.tools, newTool]
                            });
                            setNewTool('');
                          }
                        }}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matériaux nécessaires
                  </label>
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {(formData.materials || []).map((material, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          <Package className="w-3 h-3 mr-1" />
                          {material}
                          <button
                            onClick={() => setFormData({
                              ...formData,
                              materials: formData.materials.filter((_, i) => i !== index)
                            })}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={newMaterial}
                        onChange={(e) => setNewMaterial(e.target.value)}
                        className="flex-1 border rounded px-2 py-1 text-sm"
                        placeholder="Ajouter un matériau..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newMaterial) {
                            setFormData({
                              ...formData,
                              materials: [...formData.materials, newMaterial]
                            });
                            setNewMaterial('');
                          }
                        }}
                      />
                      <button
                        onClick={() => {
                          if (newMaterial) {
                            setFormData({
                              ...formData,
                              materials: [...formData.materials, newMaterial]
                            });
                            setNewMaterial('');
                          }
                        }}
                        className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Médias associés
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="p-3 border-2 border-dashed rounded-lg hover:bg-gray-50 flex flex-col items-center">
                      <Camera className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-600">Photo</span>
                    </button>
                    <button className="p-3 border-2 border-dashed rounded-lg hover:bg-gray-50 flex flex-col items-center">
                      <Video className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-600">Vidéo</span>
                    </button>
                    <button className="p-3 border-2 border-dashed rounded-lg hover:bg-gray-50 flex flex-col items-center">
                      <File className="w-5 h-5 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-600">Document</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  setEditingStep(null);
                  setShowStepForm(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Annuler
              </button>
              <button
                onClick={() => saveStep(formData)}
                disabled={!formData.title || !formData.description}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enregistrer l'étape
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Vue éditeur
  const EditorView = () => (
    <div className="flex h-full">
      {/* Sidebar gauche - Structure */}
      <div className="w-80 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-3">Structure du SOP</h3>
          <button
            onClick={addSection}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter une section</span>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {content.sections.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <BookOpen className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm">Aucune section</p>
              <p className="text-xs mt-1">Commencez par ajouter une section</p>
            </div>
          ) : (
            <div className="space-y-2">
              {content.sections.map((section, index) => (
                <div
                  key={section.id}
                  className={`border rounded-lg ${
                    selectedSection === section.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => setSelectedSection(section.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSection(section.id);
                          }}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          {section.expanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                        <span className="font-medium text-sm">{section.title}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {section.steps.length} étape(s)
                      </span>
                    </div>
                  </div>
                  
                  {section.expanded && section.steps.length > 0 && (
                    <div className="px-3 pb-2">
                      {section.steps.map((step, stepIndex) => (
                        <div
                          key={step.id}
                          className="ml-6 py-1 text-xs text-gray-600 hover:text-gray-900 cursor-pointer"
                          onClick={() => {
                            setSelectedSection(section.id);
                            setEditingStep(step);
                          }}
                        >
                          {stepIndex + 1}. {step.title || 'Sans titre'}
                          {step.criticalPoint && (
                            <Shield className="w-3 h-3 inline ml-1 text-red-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Zone principale - Détails */}
      <div className="flex-1 overflow-y-auto">
        {/* En-tête du document */}
        <div className="bg-white border-b p-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Titre du SOP
              </label>
              <input
                type="text"
                value={content.title}
                onChange={(e) => saveContent({ ...content, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Ex: Procédure de montage du produit X"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Numéro SOP
                </label>
                <input
                  type="text"
                  value={content.sopNumber}
                  onChange={(e) => saveContent({ ...content, sopNumber: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="SOP-001"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Version
                </label>
                <input
                  type="text"
                  value={content.currentVersion}
                  onChange={(e) => saveContent({ ...content, currentVersion: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="1.0"
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Département
              </label>
              <input
                type="text"
                value={content.department}
                onChange={(e) => saveContent({ ...content, department: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Production"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Processus
              </label>
              <input
                type="text"
                value={content.process}
                onChange={(e) => saveContent({ ...content, process: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Assemblage"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={content.status}
                onChange={(e) => saveContent({ ...content, status: e.target.value as SOPContent['status'] })}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="draft">Brouillon</option>
                <option value="review">En révision</option>
                <option value="approved">Approuvé</option>
                <option value="obsolete">Obsolète</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objectif
              </label>
              <textarea
                value={content.objective}
                onChange={(e) => saveContent({ ...content, objective: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
                placeholder="Décrire l'objectif de cette procédure..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Portée
              </label>
              <textarea
                value={content.scope}
                onChange={(e) => saveContent({ ...content, scope: e.target.value })}
                className="w-full border rounded-lg px-3 py-2"
                rows={2}
                placeholder="Définir le périmètre d'application..."
              />
            </div>
          </div>
        </div>
        
        {/* Contenu de la section sélectionnée */}
        {selectedSection && (
          <div className="p-6">
            {(() => {
              const section = content.sections.find(s => s.id === selectedSection);
              if (!section) return null;
              
              return (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-4">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) => {
                          const updatedSections = content.sections.map(s =>
                            s.id === selectedSection ? { ...s, title: e.target.value } : s
                          );
                          saveContent({ ...content, sections: updatedSections });
                        }}
                        className="text-xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 px-1"
                      />
                      <DurationBadge 
                        duration={section.steps.reduce((total, step) => total + step.duration, 0)} 
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => addStep(selectedSection)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Ajouter étape</span>
                      </button>
                      
                      <button
                        onClick={() => duplicateSection(selectedSection)}
                        className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                        title="Dupliquer la section"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          if (confirm('Supprimer cette section ?')) {
                            saveContent({
                              ...content,
                              sections: content.sections.filter(s => s.id !== selectedSection)
                            });
                            setSelectedSection(null);
                          }
                        }}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                        title="Supprimer la section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {section.steps.length === 0 ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">Cette section est vide</p>
                      <button
                        onClick={() => addStep(selectedSection)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Ajouter la première étape
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {section.steps.map((step, index) => (
                        <div
                          key={step.id}
                          className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-lg flex items-center space-x-2">
                                  <span>{step.title}</span>
                                  {step.criticalPoint && (
                                    <Shield className="w-5 h-5 text-red-500" title="Point critique" />
                                  )}
                                </h4>
                                <p className="text-gray-600 mt-1">{step.description}</p>
                                
                                {step.safetyWarning && (
                                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-yellow-800">{step.safetyWarning}</p>
                                  </div>
                                )}
                                
                                {step.qualityCheck && (
                                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
                                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-green-800">{step.qualityCheck}</p>
                                  </div>
                                )}
                                
                                {step.subSteps && step.subSteps.length > 0 && (
                                  <div className="mt-3 pl-4 border-l-2 border-gray-200">
                                    {step.subSteps.map((subStep, subIndex) => (
                                      <div key={subStep.id} className="flex items-center space-x-2 py-1">
                                        <input
                                          type="checkbox"
                                          checked={subStep.completed || false}
                                          onChange={(e) => {
                                            const updatedSections = content.sections.map(s => {
                                              if (s.id === selectedSection) {
                                                const updatedSteps = s.steps.map(st => {
                                                  if (st.id === step.id) {
                                                    const updatedSubSteps = st.subSteps?.map(ss =>
                                                      ss.id === subStep.id
                                                        ? { ...ss, completed: e.target.checked }
                                                        : ss
                                                    );
                                                    return { ...st, subSteps: updatedSubSteps };
                                                  }
                                                  return st;
                                                });
                                                return { ...s, steps: updatedSteps };
                                              }
                                              return s;
                                            });
                                            saveContent({ ...content, sections: updatedSections });
                                          }}
                                          className="rounded"
                                        />
                                        <span className={`text-sm ${subStep.completed ? 'line-through text-gray-400' : ''}`}>
                                          {subStep.description}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {step.tools && step.tools.length > 0 && (
                                    <div className="flex items-center space-x-2">
                                      <Wrench className="w-4 h-4 text-gray-500" />
                                      <div className="flex flex-wrap gap-1">
                                        {step.tools.map((tool, i) => (
                                          <span key={i} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                            {tool}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  
                                  {step.materials && step.materials.length > 0 && (
                                    <div className="flex items-center space-x-2">
                                      <Package className="w-4 h-4 text-gray-500" />
                                      <div className="flex flex-wrap gap-1">
                                        {step.materials.map((material, i) => (
                                          <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                            {material}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <DurationBadge duration={step.duration} />
                              
                              <button
                                onClick={() => setEditingStep(step)}
                                className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => deleteStep(selectedSection, step.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
        
        {!selectedSection && (
          <div className="flex items-center justify-center h-96 text-gray-400">
            <div className="text-center">
              <BookOpen className="w-16 h-16 mx-auto mb-4" />
              <p className="text-lg">Sélectionnez une section pour commencer</p>
              <p className="text-sm mt-2">Ou créez une nouvelle section depuis le menu de gauche</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  
  // Vue aperçu
  const PreviewView = () => (
    <div className="max-w-4xl mx-auto p-8 bg-white">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold">{content.title || 'Titre du SOP'}</h1>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
              <span>SOP: {content.sopNumber}</span>
              <span>Version: {content.currentVersion}</span>
              <span>Département: {content.department}</span>
            </div>
          </div>
          <StatusBadge status={content.status} />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-1">Objectif</h3>
            <p className="text-sm">{content.objective || 'Non défini'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-700 mb-1">Portée</h3>
            <p className="text-sm">{content.scope || 'Non défini'}</p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm">
                Durée totale: <strong>{Math.floor(content.totalDuration / 60)}h {content.totalDuration % 60}min</strong>
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <span className="text-sm">
                <strong>{content.sections.reduce((total, s) => total + s.steps.length, 0)}</strong> étapes
              </span>
            </div>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
            <Printer className="w-4 h-4" />
            <span>Imprimer</span>
          </button>
        </div>
      </div>
      
      {content.sections.map((section, sectionIndex) => (
        <div key={section.id} className="mb-8">
          <h2 className="text-2xl font-bold mb-4 pb-2 border-b">
            {sectionIndex + 1}. {section.title}
          </h2>
          
          {section.steps.map((step, stepIndex) => (
            <div key={step.id} className="mb-6 pl-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                  {sectionIndex + 1}.{stepIndex + 1}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2 flex items-center space-x-2">
                    <span>{step.title}</span>
                    {step.criticalPoint && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                        POINT CRITIQUE
                      </span>
                    )}
                    <DurationBadge duration={step.duration} />
                  </h3>
                  
                  <p className="text-gray-700 mb-3">{step.description}</p>
                  
                  {step.safetyWarning && (
                    <div className="mb-3 p-3 bg-yellow-50 border-l-4 border-yellow-400">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-yellow-800">Avertissement sécurité</p>
                          <p className="text-sm text-yellow-700">{step.safetyWarning}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {step.qualityCheck && (
                    <div className="mb-3 p-3 bg-green-50 border-l-4 border-green-400">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-green-800">Contrôle qualité</p>
                          <p className="text-sm text-green-700">{step.qualityCheck}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {step.subSteps && step.subSteps.length > 0 && (
                    <div className="mb-3">
                      <p className="font-semibold text-sm text-gray-700 mb-2">Sous-étapes:</p>
                      <ol className="list-decimal list-inside space-y-1 pl-4">
                        {step.subSteps.map((subStep) => (
                          <li key={subStep.id} className="text-sm text-gray-600">
                            {subStep.description}
                            {subStep.checkRequired && (
                              <span className="ml-2 text-blue-600">[Vérification requise]</span>
                            )}
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    {step.tools && step.tools.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-700">Outils:</span>
                        <span className="ml-2 text-gray-600">{step.tools.join(', ')}</span>
                      </div>
                    )}
                    
                    {step.materials && step.materials.length > 0 && (
                      <div>
                        <span className="font-semibold text-gray-700">Matériaux:</span>
                        <span className="ml-2 text-gray-600">{step.materials.join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold">Standard Operating Procedure (SOP)</h2>
              <StatusBadge status={content.status} />
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('editor')}
                  className={`px-3 py-1 rounded ${
                    activeTab === 'editor' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Éditeur
                </button>
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1 rounded ${
                    activeTab === 'preview' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Aperçu
                </button>
                <button
                  onClick={() => setActiveTab('revisions')}
                  className={`px-3 py-1 rounded ${
                    activeTab === 'revisions' ? 'bg-white shadow-sm' : 'text-gray-600'
                  }`}
                >
                  Révisions
                </button>
              </div>
              
              <div className="h-6 w-px bg-gray-300" />
              
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Download className="w-5 h-5" />
              </button>
              
              <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                <Share2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              
              <button
                onClick={onClose}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'editor' && <EditorView />}
        {activeTab === 'preview' && (
          <div className="h-full overflow-y-auto">
            <PreviewView />
          </div>
        )}
        {activeTab === 'revisions' && (
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Historique des révisions</h3>
            <div className="space-y-3">
              {content.revisions.map((revision) => (
                <div key={revision.id} className="bg-white border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold">Version {revision.version}</span>
                        {revision.approved && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Approuvé
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{revision.changes}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Par: {revision.author}</span>
                        <span>Date: {new Date(revision.date).toLocaleDateString('fr-FR')}</span>
                        {revision.approvedBy && (
                          <span>Approuvé par: {revision.approvedBy}</span>
                        )}
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm">
                      Voir détails
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Modals */}
      {showStepForm && <StepEditModal />}
      
      {/* Help Panel */}
      {showHelp && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-lg z-40 overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Aide - Module SOP</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">📋 Qu'est-ce qu'un SOP?</h4>
                <p className="text-gray-600">
                  Un Standard Operating Procedure (SOP) est un document détaillé qui décrit 
                  étape par étape comment réaliser une tâche ou un processus de manière 
                  standardisée et reproductible.
                </p>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">🎯 Structure recommandée</h4>
                <ul className="space-y-1 text-gray-600 ml-4">
                  <li>• <strong>Sections:</strong> Divisez le processus en grandes phases</li>
                  <li>• <strong>Étapes:</strong> Détaillez chaque action à réaliser</li>
                  <li>• <strong>Sous-étapes:</strong> Précisez les actions complexes</li>
                  <li>• <strong>Points critiques:</strong> Identifiez les étapes sensibles</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">⚠️ Points critiques</h4>
                <p className="text-gray-600">
                  Marquez comme "Point critique" les étapes qui:
                </p>
                <ul className="space-y-1 text-gray-600 ml-4 mt-2">
                  <li>• Impactent la sécurité</li>
                  <li>• Affectent la qualité du produit</li>
                  <li>• Présentent des risques d'erreur</li>
                  <li>• Nécessitent une validation</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">💡 Bonnes pratiques</h4>
                <ul className="space-y-1 text-gray-600 ml-4">
                  <li>• Utilisez un langage clair et précis</li>
                  <li>• Incluez des visuels (photos, schémas)</li>
                  <li>• Spécifiez les outils et matériaux</li>
                  <li>• Estimez la durée de chaque étape</li>
                  <li>• Ajoutez les contrôles qualité</li>
                  <li>• Maintenez le document à jour</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


