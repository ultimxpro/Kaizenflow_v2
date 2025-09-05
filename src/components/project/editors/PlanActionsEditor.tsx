// src/components/project/editors/PlanActionsEditor.tsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { A3Module, User } from '../../../types/database';
import { useDatabase } from '../../../contexts/DatabaseContext';
import { useAuth } from '../../../contexts/AuthContext';
import { HelpCircle, X, Layers, User as UserIcon, Table, GanttChartSquare, Plus, Users, Check, Calendar, Tag, Activity } from 'lucide-react';

// --- TYPES & INTERFACES ---
type ActionType = 'simple' | 'securisation' | 'poka-yoke';
type ActionStatus = 'À faire' | 'Fait';

interface Action {
    id: string;
    title: string;
    description?: string;
    status: ActionStatus;
    due_date: string;
    start_date: string;
    type: ActionType;
    assignee_ids: string[];
    leader_id?: string;
    effort: number;
    gain: number;
}

interface PlanActionsEditorProps {
    module: A3Module;
    onClose: () => void;
}

// --- CONFIGURATION VISUELLE ---
const actionTypeConfig = {
    simple: { name: 'Action Simple', icon: '💡', color: 'border-emerald-500', textColor: 'text-emerald-600', barBg: 'bg-emerald-500', a3Color: 'bg-emerald-100 text-emerald-800', lightBg: 'bg-gradient-to-br from-emerald-50 to-green-100' },
    securisation: { name: 'Sécurisation', icon: '🛡️', color: 'border-amber-500', textColor: 'text-amber-600', barBg: 'bg-amber-500', a3Color: 'bg-amber-100 text-amber-800', lightBg: 'bg-gradient-to-br from-amber-50 to-orange-100' },
    'poka-yoke': { name: 'Poka-Yoke', icon: '🧩', color: 'border-teal-500', textColor: 'text-teal-600', barBg: 'bg-teal-500', a3Color: 'bg-teal-100 text-teal-800', lightBg: 'bg-gradient-to-br from-teal-50 to-cyan-100' },
};

// --- COMPOSANTS UTILITAIRES ---
const Tooltip = ({ content, children }: { content: string, children: React.ReactNode }) => (
    <div className="relative group">
        {children}
        <div className="absolute bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
             dangerouslySetInnerHTML={{ __html: content }}
        />
    </div>
);

const DateIndicator = ({ dueDate, status }: { dueDate: string, status: ActionStatus }) => {
    if (status === 'Fait') {
        return (
            <div className="flex items-center text-xs font-semibold text-green-600">
                <Check size={14} className="mr-1" />
                <span>Terminé</span>
            </div>
        );
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    const diffDays = Math.round((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let color = 'text-gray-500';
    let text = "À l'heure";
    if (diffDays < 0) { color = 'text-red-600'; text = `En retard de ${Math.abs(diffDays)}j`; }
    else if (diffDays <= 7) { color = 'text-yellow-600'; text = `Échéance proche (${diffDays}j)`; }

    return (
        <div className={`flex items-center text-xs font-semibold ${color}`}>
            <span className="w-1.5 h-1.5 rounded-full mr-2" style={{ backgroundColor: 'currentColor' }}></span>
            <span>{text}</span>
        </div>
    );
};

const AssigneeAvatars = ({ assignee_ids, users }: { assignee_ids: string[], users: User[] }) => (
    <div className="flex items-center -space-x-2">
        {assignee_ids.map(id => {
            const user = users.find(u => u.id === id);
            if (!user) return null;
            return (
                <Tooltip key={id} content={user.nom}>
                    <img
                        src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`}
                        alt={user.nom}
                        className="w-6 h-6 rounded-full border-2 border-white"
                    />
                </Tooltip>
            );
        })}
    </div>
);

const ActionCard = ({ action, users, onDragStart, onClick }: { action: Action, users: User[], onDragStart: (e: React.DragEvent, action: Action) => void, onClick: (action: Action) => void }) => {
    const config = actionTypeConfig[action.type];

    return (
        <div
            draggable="true"
            onDragStart={(e) => onDragStart(e, action)}
            onClick={() => onClick(action)}
            className={`bg-white/90 backdrop-blur-sm border-2 border-gray-200/50 rounded-xl shadow-lg mb-3 border-l-4 ${config.color} p-4 hover:shadow-xl hover:border-gray-300/70 cursor-pointer transition-all duration-200 hover:scale-105`}
        >
            <div className="flex justify-between items-start mb-3">
                <AssigneeAvatars assignee_ids={action.assignee_ids} users={users} />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.a3Color}`}>
                    {config.icon}
                </span>
            </div>
            <h3 className="font-bold text-gray-800 text-sm mb-2">{action.title}</h3>
            <div className="mt-3">
                <DateIndicator dueDate={action.due_date} status={action.status} />
            </div>
        </div>
    );
};

const PDCASection = ({ title, icon, children }: { title: string, icon: React.ReactNode, children: React.ReactNode }) => (
    <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200/50 rounded-xl p-6 shadow-lg">
        <h3 className="font-bold text-green-800 mb-4 flex items-center text-lg">
            {icon} <span className="ml-3">{title}</span>
        </h3>
        {children}
    </div>
);

// Helper pour convertir une string "YYYY-W##" en date du lundi correspondant
const getDateOfISOWeek = (weekString: string): Date => {
    if (!weekString) return new Date();
    const [year, week] = weekString.split('-W').map(Number);
    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
    const dayOfWeek = simple.getUTCDay();
    const isoWeekStart = simple;
    if (dayOfWeek <= 4) {
        isoWeekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
    } else {
        isoWeekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
    }
    return isoWeekStart;
};

const ActionModal = React.memo(({ isOpen, onClose, onSave, action, projectMembers }: { 
    isOpen: boolean, 
    onClose: () => void, 
    onSave: (action: Action) => void, 
    action: Action | null, 
    projectMembers: User[]
}) => {
    if (!isOpen) return null;

    const [formData, setFormData] = useState<Partial<Action>>({});
    const [duration, setDuration] = useState(7);
    const [durationUnit, setDurationUnit] = useState<'days' | 'weeks' | 'months'>('days');
    
    const [weekValue, setWeekValue] = useState('');
    const [monthValue, setMonthValue] = useState('');

    useEffect(() => {
        const initialStartDate = action?.start_date || new Date().toISOString().split('T')[0];
        const initialData = action || { 
            title: '', description: '', assignee_ids: [], status: 'À faire', 
            type: 'simple', due_date: '', start_date: initialStartDate, 
            effort: 5, gain: 5 
        };
        setFormData(initialData);

        if (action && action.start_date && action.due_date) {
            const start = new Date(action.start_date);
            const end = new Date(action.due_date);
            const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            if (diffDays > 0 && diffDays % 30 === 0 && diffDays / 30 > 0) {
                setDuration(diffDays / 30);
                setDurationUnit('months');
            } else if (diffDays > 0 && diffDays % 7 === 0 && diffDays / 7 > 0) {
                setDuration(diffDays / 7);
                setDurationUnit('weeks');
            } else {
                setDuration(diffDays);
                setDurationUnit('days');
            }
        }
    }, [action]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRangeChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: parseInt(value) }));
    };

    const formatDateToWeek = (date: Date): string => {
        const year = date.getFullYear();
        const startOfYear = new Date(year, 0, 1);
        const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
        const week = Math.ceil((days + startOfYear.getDay() + 1) / 7);
        return `${year}-W${week.toString().padStart(2, '0')}`;
    };

    const handleDurationChange = () => {
        const startDate = new Date(formData.start_date || new Date().toISOString().split('T')[0]);
        let endDate = new Date(startDate);

        switch (durationUnit) {
            case 'days':
                endDate.setDate(startDate.getDate() + duration - 1);
                break;
            case 'weeks':
                endDate.setDate(startDate.getDate() + (duration * 7) - 1);
                break;
            case 'months':
                endDate.setMonth(startDate.getMonth() + duration);
                endDate.setDate(endDate.getDate() - 1);
                break;
        }

        setFormData(prev => ({ ...prev, due_date: endDate.toISOString().split('T')[0] }));
    };

    useEffect(() => {
        if (formData.start_date && duration > 0) {
            handleDurationChange();
        }
    }, [formData.start_date, duration, durationUnit]);

    const toggleAssignee = (userId: string) => {
        setFormData(prev => {
            const currentAssignees = prev.assignee_ids || [];
            const newAssignees = currentAssignees.includes(userId) ? 
                currentAssignees.filter(id => id !== userId) : [...currentAssignees, userId];
            let newLeaderId = newAssignees.includes(prev.leader_id) ? prev.leader_id : (newAssignees[0] || undefined);
            if(newAssignees.length === 0) newLeaderId = undefined;
            return { ...prev, assignee_ids: newAssignees, leader_id: newLeaderId };
        });
    };

    const getQuadrant = (gain: number, effort: number) => {
        if (gain >= 5 && effort < 5) return { name: "Quick Win 🔥", color: "bg-gradient-to-br from-green-200 to-emerald-300 text-green-800" };
        if (gain >= 5 && effort >= 5) return { name: "Gros projet 🗓️", color: "bg-gradient-to-br from-blue-200 to-cyan-300 text-blue-800" };
        if (gain < 5 && effort < 5) return { name: "Tâche de fond 👌", color: "bg-gradient-to-br from-yellow-200 to-amber-300 text-yellow-800" };
        return { name: "À éviter 🤔", color: "bg-gradient-to-br from-red-200 to-rose-300 text-red-800" };
    };
    const currentQuadrant = getQuadrant(formData.gain || 5, formData.effort || 5);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-green-50 rounded-2xl shadow-2xl p-6 md:p-8 w-full max-w-3xl text-gray-800 max-h-[90vh] overflow-y-auto border-2 border-green-200/30">
                <h2 className="text-2xl font-bold mb-6 text-green-800">{action ? "Modifier l'action" : "Créer une action"}</h2>
                <form onSubmit={(e) => { e.preventDefault(); onSave(formData as Action); }} className="space-y-6">
                    <PDCASection title="Description" icon={<Layers size={20} />}>
                        <div className="space-y-4">
                            <input name="title" value={formData.title || ''} onChange={handleChange} placeholder="Titre de l'action" className="p-3 w-full border-2 bg-white border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" required />
                            <textarea name="description" value={formData.description || ''} onChange={handleChange} placeholder="Description détaillée de l'action..." className="p-3 w-full border-2 bg-white border-green-200 rounded-xl h-24 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"></textarea>
                        </div>
                    </PDCASection>

                    <PDCASection title="Équipe" icon={<Users size={20} />}>
                        <div className="flex flex-wrap gap-4">
                            {projectMembers.map(user => {
                                const isSelected = (formData.assignee_ids || []).includes(user.id);
                                return (
                                    <div key={user.id} className="flex flex-col items-center">
                                        <div onClick={() => toggleAssignee(user.id)} className={`p-2 rounded-xl cursor-pointer transition-all ${isSelected ? 'ring-4 ring-green-400 bg-green-100' : 'hover:bg-green-50 hover:ring-2 hover:ring-green-200'}`}>
                                            <img src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`} alt={user.nom} className="w-14 h-14 rounded-full" />
                                        </div>
                                        <span className="text-xs mt-2 font-semibold text-gray-700">{user.nom}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </PDCASection>

                    <PDCASection title="Détails" icon={<Table size={20} />}>
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-semibold text-green-700 flex items-center mb-3"><Activity size={14} className="mr-2"/> Statut</label>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setFormData(p => ({...p, status: 'À faire'}))} className={`py-3 px-6 rounded-xl flex-1 font-semibold transition-all ${formData.status === 'À faire' ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-lg' : 'bg-white border-2 border-orange-200 text-orange-600 hover:bg-orange-50'}`}>À faire</button>
                                    <button type="button" onClick={() => setFormData(p => ({...p, status: 'Fait'}))} className={`py-3 px-6 rounded-xl flex-1 font-semibold transition-all ${formData.status === 'Fait' ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' : 'bg-white border-2 border-green-200 text-green-600 hover:bg-green-50'}`}>Fait</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-green-700 flex items-center mb-3"><Tag size={14} className="mr-2"/> Type d'action</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {Object.entries(actionTypeConfig).map(([key, config]) => (
                                        <button type="button" key={key} onClick={() => setFormData(p => ({...p, type: key as ActionType}))} className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-medium transition-all ${formData.type === key ? config.a3Color + ' shadow-lg ring-2 ring-offset-2 ring-green-300' : 'bg-white border-2 border-gray-200 text-gray-600 hover:border-green-300'}`}>
                                            <span className="text-lg">{config.icon}</span>
                                            <span className="text-xs">{config.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </PDCASection>

                    <PDCASection title="Planification" icon={<Calendar size={20} />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="text-sm font-semibold text-green-700 mb-3 block">Date de début</label>
                                <input type="date" name="start_date" value={formData.start_date || ''} onChange={handleChange} className="p-3 w-full border-2 bg-white border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" required />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-green-700 mb-3 block">Durée</label>
                                <div className="flex gap-3">
                                    <input type="number" min="1" value={duration} onChange={(e) => setDuration(parseInt(e.target.value) || 1)} className="p-3 w-20 border-2 bg-white border-green-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all" />
                                    <select value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as 'days' | 'weeks' | 'months')} className="p-3 border-2 bg-white border-green-200 rounded-xl flex-1 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all">
                                        <option value="days">Jour(s)</option>
                                        <option value="weeks">Semaine(s)</option>
                                        <option value="months">Mois</option>
                                    </select>
                                </div>
                                {formData.due_date && formData.start_date && <p className="text-xs text-green-600 mt-3 bg-green-50 p-2 rounded-lg">Période : <span className="font-semibold">{new Date(formData.start_date + 'T00:00:00').toLocaleDateString('fr-FR')} au {new Date(formData.due_date + 'T00:00:00').toLocaleDateString('fr-FR')}</span></p>}
                            </div>
                        </div>
                    </PDCASection>

                    <PDCASection title="Priorisation" icon={<GanttChartSquare size={20} />}>
                        <div className="grid grid-cols-2 gap-6 items-center">
                            <div className="space-y-4">
                                <div><label className="text-green-700 font-semibold">Effort (Complexité): {formData.effort || 5}</label><input type="range" name="effort" min="1" max="10" value={formData.effort || 5} onChange={e => handleRangeChange('effort', e.target.value)} className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider-thumb" /></div>
                                <div><label className="text-green-700 font-semibold">Gain (Impact): {formData.gain || 5}</label><input type="range" name="gain" min="1" max="10" value={formData.gain || 5} onChange={e => handleRangeChange('gain', e.target.value)} className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer slider-thumb" /></div>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-green-600 font-medium mb-2">Position dans la matrice :</p>
                                <div className={`mt-2 p-4 rounded-xl font-bold transition-colors shadow-lg ${currentQuadrant.color}`}>{currentQuadrant.name}</div>
                            </div>
                        </div>
                    </PDCASection>

                    <div className="mt-8 flex justify-end gap-4">
                        <button type="button" onClick={onClose} className="py-3 px-6 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 font-semibold transition-all">Annuler</button>
                        <button type="submit" className="py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 font-semibold shadow-lg hover:shadow-xl transition-all">Sauvegarder l'Action</button>
                    </div>
                </form>
            </div>
        </div>
    );
});

// --- VUES SPÉCIFIQUES ---
const HomeView = ({ actions, setActions, users, onCardClick }: { actions: Action[], setActions: (actions: Action[], changedItem: Action) => void, users: User[], onCardClick: (action: Action) => void }) => {
    const [draggedItem, setDraggedItem] = useState<Action | null>(null);
    const columns = useMemo(() => {
        const grouped: { [key in ActionType]: Action[] } = { securisation: [], simple: [], 'poka-yoke': [] };
        actions.forEach(action => { if (grouped[action.type]) grouped[action.type].push(action); });
        return grouped;
    }, [actions]);

    const handleDrop = (e: React.DragEvent, targetType: ActionType) => {
        e.preventDefault();
        (e.currentTarget as HTMLDivElement).classList.remove('bg-blue-50', 'border-blue-300');
        if (!draggedItem || draggedItem.type === targetType) return;
        setActions(actions.map(act => act.id === draggedItem.id ? { ...act, type: targetType } : act), { ...draggedItem, type: targetType });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full" onDragEnd={() => setDraggedItem(null)}>
            {Object.entries(columns).map(([type, items]) => {
                const config = actionTypeConfig[type as ActionType];
                return (
                    <div key={type} className={`flex flex-col rounded-2xl transition-colors ${config.lightBg} h-full overflow-hidden shadow-lg border-2 border-gray-200/50`}
                         onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, type as ActionType)}
                         onDragEnter={(e) => (e.currentTarget as HTMLDivElement).classList.add('bg-blue-50', 'border-blue-300', 'scale-105')}
                         onDragLeave={(e) => (e.currentTarget as HTMLDivElement).classList.remove('bg-blue-50', 'border-blue-300', 'scale-105')}>
                        <h2 className={`font-bold p-5 flex items-center gap-3 ${config.textColor} bg-white/80 backdrop-blur-sm`}>
                            <span className="text-2xl">{config.icon}</span> 
                            <span className="text-lg">{config.name}</span>
                            <span className="text-sm font-normal text-gray-500 ml-auto bg-white/80 rounded-full px-3 py-1 shadow-sm">{items.length}</span>
                        </h2>
                        <div className="overflow-y-auto flex-1 px-4 pb-4">
                            {items.map(item => <ActionCard key={item.id} action={item} users={users} onDragStart={(e, action) => setDraggedItem(action)} onClick={onCardClick} />)}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const KanbanByPersonView = ({ actions, setActions, users, onCardClick }: { actions: Action[], setActions: (actions: Action[], changedItem: Action) => void, users: User[], onCardClick: (action: Action) => void }) => {
    const [selectedUser, setSelectedUser] = useState(users[0]?.id || '');
    const [draggedItem, setDraggedItem] = useState<Action | null>(null);

    const filteredActions = useMemo(() => actions.filter(a => a.assignee_ids.includes(selectedUser)), [actions, selectedUser]);
    const columns = useMemo(() => {
        const grouped: { [key in ActionStatus]: Action[] } = { 'À faire': [], 'Fait': [] };
        filteredActions.forEach(action => { if (grouped[action.status]) grouped[action.status].push(action); });
        return grouped;
    }, [filteredActions]);

    const handleDrop = (e: React.DragEvent, targetStatus: ActionStatus) => {
        e.preventDefault();
        (e.currentTarget as HTMLDivElement).classList.remove('bg-blue-50', 'ring-2', 'ring-blue-400', 'scale-105');
        if (!draggedItem || draggedItem.status === targetStatus) return;
        setActions(actions.map(act => act.id === draggedItem.id ? { ...act, status: targetStatus } : act), { ...draggedItem, status: targetStatus });
    };

    const selectedUserData = users.find(u => u.id === selectedUser);

    return (
        <div className="h-full flex flex-col">
            {/* Sélecteur d'utilisateur */}
            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    {users.map(user => (
                        <button
                            key={user.id}
                            onClick={() => setSelectedUser(user.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                                selectedUser === user.id
                                    ? 'bg-blue-600 text-white shadow-lg'
                                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blue-300'
                            }`}
                        >
                            <img
                                src={user.avatarUrl || `https://i.pravatar.cc/150?u=${user.id}`}
                                alt={user.nom}
                                className="w-6 h-6 rounded-full"
                            />
                            <span className="font-medium">{user.nom}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                selectedUser === user.id ? 'bg-white/20' : 'bg-gray-100'
                            }`}>
                                {actions.filter(a => a.assignee_ids.includes(user.id)).length}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Kanban columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1" onDragEnd={() => setDraggedItem(null)}>
                {(['À faire', 'Fait'] as ActionStatus[]).map(status => {
                    const items = columns[status];
                    const isCompleted = status === 'Fait';
                    
                    return (
                        <div
                            key={status}
                            className={`flex flex-col rounded-2xl border-2 transition-all duration-200 shadow-lg ${
                                isCompleted 
                                    ? 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-300' 
                                    : 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-300'
                            } h-full overflow-hidden`}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, status)}
                            onDragEnter={(e) => (e.currentTarget as HTMLDivElement).classList.add('bg-blue-50', 'ring-2', 'ring-blue-400', 'scale-105')}
                            onDragLeave={(e) => (e.currentTarget as HTMLDivElement).classList.remove('bg-blue-50', 'ring-2', 'ring-blue-400', 'scale-105')}
                        >
                            <div className={`p-5 ${isCompleted ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-amber-600'} flex items-center justify-between`}>
                                <h3 className="font-bold text-xl text-white">
                                    {status}
                                </h3>
                                <span className={`px-4 py-2 rounded-full text-sm font-bold ${
                                    isCompleted ? 'bg-white/20 text-white' : 'bg-white/20 text-white'
                                }`}>
                                    {items.length}
                                </span>
                            </div>
                            
                            <div className="flex-1 p-4 overflow-y-auto">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-32 text-gray-400">
                                        <div className={`w-16 h-16 ${isCompleted ? 'bg-green-100' : 'bg-orange-100'} rounded-2xl flex items-center justify-center mb-4`}>
                                            <span className="text-2xl">{status === 'À faire' ? '📝' : '🎉'}</span>
                                        </div>
                                        <p className={`text-sm font-medium ${
                                            status === 'À faire' ? 'text-orange-600' : 'text-green-600'
                                        }`}>
                                            {status === 'À faire' ? 'Aucune tâche en attente' : 'Aucune tâche terminée'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {status === 'À faire' ? 'Les nouvelles tâches apparaîtront ici' : 'Glissez les tâches terminées ici'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {items.map(item => (
                                            <ActionCard 
                                                key={item.id} 
                                                action={item} 
                                                users={users} 
                                                onDragStart={(e, action) => setDraggedItem(action)} 
                                                onClick={onCardClick} 
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {/* Footer avec progression */}
            <div className="mt-4 flex-shrink-0 bg-white rounded-xl p-4 shadow-lg border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Progression de {selectedUserData?.nom}</span>
                    <span className="text-sm font-bold text-gray-900">
                        {filteredActions.length > 0 ? Math.round((columns['Fait'].length / filteredActions.length) * 100) : 0}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                        className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ 
                            width: `${filteredActions.length > 0 ? (columns['Fait'].length / filteredActions.length) * 100 : 0}%` 
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

const MatrixView = ({ actions, setActions, users, onCardClick }: { actions: Action[], setActions: (actions: Action[], changedItem: Action) => void, users: User[], onCardClick: (action: Action) => void }) => {
    const [draggedItem, setDraggedItem] = useState<Action | null>(null);
    const matrix = useMemo(() => {
        const q: { [key: string]: Action[] } = { 'quick-wins': [], 'major-projects': [], 'fill-ins': [], 'thankless-tasks': [] };
        actions.forEach(a => {
            if (a.gain >= 5 && a.effort < 5) q['quick-wins'].push(a);
            else if (a.gain >= 5 && a.effort >= 5) q['major-projects'].push(a);
            else if (a.gain < 5 && a.effort < 5) q['fill-ins'].push(a);
            else q['thankless-tasks'].push(a);
        });
        return q;
    }, [actions]);

    const handleDrop = (e: React.DragEvent, quadrant: string) => {
        e.preventDefault();
        (e.currentTarget as HTMLDivElement).classList.remove('ring-2', 'ring-blue-400');
        if(!draggedItem) return;
        const newValues = {
            'quick-wins': { gain: 8, effort: 3 },
            'major-projects': { gain: 8, effort: 8 },
            'fill-ins': { gain: 3, effort: 3 },
            'thankless-tasks': { gain: 3, effort: 8 }
        }[quadrant] || { gain: 5, effort: 5 };
        setActions(actions.map(a => a.id === draggedItem.id ? { ...a, ...newValues } : a), { ...draggedItem, ...newValues });
    };

    const Quadrant = ({ title, emoji, items, bgColor, quadrantName }: { title: string, emoji: string, items: Action[], bgColor: string, quadrantName: string }) => (
        <div className={`${bgColor} rounded-2xl border-2 border-dashed border-gray-300 p-6 h-64 overflow-y-auto transition-all shadow-lg hover:shadow-xl`}
             onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, quadrantName)}
             onDragEnter={(e) => (e.currentTarget as HTMLDivElement).classList.add('ring-4', 'ring-green-400')}
             onDragLeave={(e) => (e.currentTarget as HTMLDivElement).classList.remove('ring-4', 'ring-green-400')}>
            <h3 className="font-bold text-center mb-6 text-gray-800 text-lg">{emoji} {title} <span className="bg-white/80 px-3 py-1 rounded-full text-sm ml-2">({items.length})</span></h3>
            {items.map(item => <ActionCard key={item.id} action={item} users={users} onDragStart={(e, action) => setDraggedItem(action)} onClick={onCardClick} />)}
        </div>
    );

    return (
        <div className="h-full" onDragEnd={() => setDraggedItem(null)}>
            <div className="grid grid-cols-2 gap-6 h-full">
                <Quadrant title="Quick Win" emoji="🔥" items={matrix['quick-wins']} bgColor="bg-gradient-to-br from-green-200 to-emerald-300" quadrantName="quick-wins" />
                <Quadrant title="Gros projet" emoji="🗓️" items={matrix['major-projects']} bgColor="bg-gradient-to-br from-blue-200 to-cyan-300" quadrantName="major-projects" />
                <Quadrant title="Tâche de fond" emoji="👌" items={matrix['fill-ins']} bgColor="bg-gradient-to-br from-yellow-200 to-amber-300" quadrantName="fill-ins" />
                <Quadrant title="À éviter" emoji="🤔" items={matrix['thankless-tasks']} bgColor="bg-gradient-to-br from-red-200 to-rose-300" quadrantName="thankless-tasks" />
            </div>
        </div>
    );
};

const GanttView = ({ actions, users, onUpdateAction, onCardClick }: { actions: Action[], users: User[], onUpdateAction: (id: string, updates: Partial<Action>) => void, onCardClick: (action: Action) => void }) => {
  const [ganttScale, setGanttScale] = useState<'day' | 'week' | 'month'>('week');
  const ganttRef = useRef<HTMLDivElement>(null);
  
  const [confirmationModal, setConfirmationModal] = useState<{
    action: Action;
    newStartDate: string;
    newEndDate: string;
    originalStartDate: string;
    originalEndDate: string;
  } | null>(null);

  const [dragState, setDragState] = useState<{
    actionId: string;
    mode: 'move' | 'resize-right';
    startX: number;
    originalStartDate: Date;
    originalEndDate: Date;
    scale: 'day' | 'week' | 'month';
  } | null>(null);

  const validActions = useMemo(() => actions
    .filter(a => a.start_date && a.due_date && !isNaN(new Date(a.start_date).getTime()) && !isNaN(new Date(a.due_date).getTime()))
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()),
    [actions]
  );

  const getGanttDateRange = useCallback(() => {
    if (validActions.length === 0) {
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - 30);
      const end = new Date(today);
      end.setDate(today.getDate() + 60);
      return { start, end };
    }
    const allDates = validActions.flatMap(a => [new Date(a.start_date), new Date(a.due_date)]);
    const minDate = new Date(Math.min(...allDates.map(d => d.getTime())));
    const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())));
    
    minDate.setDate(minDate.getDate() - 7);
    maxDate.setDate(maxDate.getDate() + 14);
    return { start: minDate, end: maxDate };
  }, [validActions]);

  const { start: ganttStartDate, end: ganttEndDate } = getGanttDateRange();

  const getISOWeekNumber = (date: Date): number => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  };
  
  const timelineColumns = useMemo(() => {
    const columns = [];
    let current = new Date(ganttStartDate);
    while (current <= ganttEndDate) {
      let label = '';
      let nextDate = new Date(current);
      switch (ganttScale) {
        case 'day':
          label = current.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          nextDate.setDate(current.getDate() + 1);
          break;
        case 'week':
          label = `S${getISOWeekNumber(current)}`;
          nextDate.setDate(current.getDate() + 7);
          break;
        case 'month':
          label = current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
          nextDate.setMonth(current.getMonth() + 1);
          break;
      }
      columns.push({
        date: new Date(current),
        label,
        width: ganttScale === 'day' ? 50 : ganttScale === 'week' ? 80 : 150
      });
      current = nextDate;
    }
    return columns;
  }, [ganttStartDate, ganttEndDate, ganttScale]);
  
  const calculateBarPosition = (action: Action) => {
    const totalDuration = ganttEndDate.getTime() - ganttStartDate.getTime();
    if (totalDuration <= 0) return { left: 0, width: 0 };
    
    const actionStart = new Date(action.start_date).getTime();
    const actionEnd = new Date(action.due_date).getTime();
    const startOffset = actionStart - ganttStartDate.getTime();
    const actionDuration = actionEnd - actionStart;
    const left = (startOffset / totalDuration) * 100;
    const width = (actionDuration / totalDuration) * 100;
    return { left: Math.max(0, left), width: Math.max(0.5, width) };
  };

  const snapDateToScale = (date: Date, scale: 'day' | 'week' | 'month') => {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    switch (scale) {
      case 'day':
        break;
      case 'week':
        const day = newDate.getDay();
        const diff = newDate.getDate() - day + (day === 0 ? -6 : 1);
        newDate.setDate(diff);
        break;
      case 'month':
        newDate.setDate(1);
        break;
    }
    return newDate;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !ganttRef.current) return;
      
      const rect = ganttRef.current.getBoundingClientRect();
      const currentX = e.clientX;
      const deltaX = currentX - dragState.startX;
      const timelineWidth = rect.width;
      const totalDuration = ganttEndDate.getTime() - ganttStartDate.getTime();
      const timeDelta = (deltaX / timelineWidth) * totalDuration;
      
      let newStartDate = new Date(dragState.originalStartDate.getTime() + timeDelta);
      let newEndDate = new Date(dragState.originalEndDate);
      
      if (dragState.mode === 'move') {
        const actionDuration = dragState.originalEndDate.getTime() - dragState.originalStartDate.getTime();
        newEndDate = new Date(newStartDate.getTime() + actionDuration);
      } else if (dragState.mode === 'resize-right') {
        newEndDate = new Date(dragState.originalEndDate.getTime() + timeDelta);
        const minDuration = dragState.scale === 'day' ? 1 : dragState.scale === 'week' ? 7 : 30;
        const minEndDate = new Date(newStartDate);
        minEndDate.setDate(newStartDate.getDate() + minDuration);
        if (newEndDate < minEndDate) newEndDate = minEndDate;
      }
      
      newStartDate = snapDateToScale(newStartDate, dragState.scale);
      newEndDate = snapDateToScale(newEndDate, dragState.scale);
      
      if (dragState.mode === 'resize-right') {
          const minDuration = dragState.scale === 'day' ? 1 : dragState.scale === 'week' ? 7 : 30;
          newEndDate.setDate(newStartDate.getDate() + minDuration);
      }
      onUpdateAction(dragState.actionId, {
        start_date: newStartDate.toISOString().split('T')[0],
        due_date: newEndDate.toISOString().split('T')[0],
      });
    };

    const handleMouseUp = () => {
      if (!dragState) return;
      const action = validActions.find(a => a.id === dragState.actionId);
      if (!action) {
        setDragState(null);
        return;
      };
      const originalStartDateStr = dragState.originalStartDate.toISOString().split('T')[0];
      const originalEndDateStr = dragState.originalEndDate.toISOString().split('T')[0];
      if (action.start_date !== originalStartDateStr || action.due_date !== originalEndDateStr) {
        setConfirmationModal({
          action: action,
          newStartDate: action.start_date,
          newEndDate: action.due_date,
          originalStartDate: originalStartDateStr,
          originalEndDate: originalEndDateStr
        });
      }
      setDragState(null);
    };

    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, onUpdateAction, validActions, ganttStartDate, ganttEndDate]);

  const handleConfirm = () => {
    if (!confirmationModal) return;
    setConfirmationModal(null);
  };

  const handleCancel = () => {
    if (!confirmationModal) return;
    onUpdateAction(confirmationModal.action.id, {
      start_date: confirmationModal.originalStartDate,
      due_date: confirmationModal.originalEndDate,
    });
    setConfirmationModal(null);
  };

  if (validActions.length === 0) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-50 rounded-lg">
            <GanttChartSquare className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">Aucune action planifiée</h3>
            <p className="text-sm">Créez des actions avec des dates pour voir le Gantt.</p>
        </div>
    );
  }

  const totalWidth = timelineColumns.reduce((acc, col) => acc + col.width, 0);

  return (
    <div className="h-full flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900">Diagramme de Gantt</h3>
            <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-lg">
                <button onClick={() => setGanttScale('day')} className={`px-3 py-1 text-sm rounded ${ganttScale === 'day' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>Jour</button>
                <button onClick={() => setGanttScale('week')} className={`px-3 py-1 text-sm rounded ${ganttScale === 'week' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>Semaine</button>
                <button onClick={() => setGanttScale('month')} className={`px-3 py-1 text-sm rounded ${ganttScale === 'month' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}>Mois</button>
            </div>
        </div>
        
        <div className="flex-1 overflow-auto">
            <div className="min-w-full">
                {/* Timeline header */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
                    <div className="flex">
                        <div className="w-64 p-3 border-r bg-gray-50 font-semibold text-gray-700 flex-shrink-0">Actions</div>
                        <div className="flex" style={{ width: `${totalWidth}px` }}>
                            {timelineColumns.map((col, idx) => (
                                <div key={idx} className="border-r border-gray-200 p-3 text-center bg-gray-50 text-xs font-medium text-gray-600 flex-shrink-0" 
                                     style={{ width: `${col.width}px` }}>
                                    {col.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Gantt rows */}
                <div ref={ganttRef} className="relative">
                    {validActions.map((action, rowIdx) => {
                        const { left, width } = calculateBarPosition(action);
                        const config = actionTypeConfig[action.type];
                        
                        return (
                            <div key={action.id} className={`flex border-b border-gray-100 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}>
                                <div className="w-64 p-3 border-r flex-shrink-0 flex items-center">
                                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                                        <span className="text-lg flex-shrink-0">{config.icon}</span>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-medium text-gray-900 truncate text-sm">{action.title}</div>
                                            <AssigneeAvatars assignee_ids={action.assignee_ids} users={users} />
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="relative flex items-center" style={{ width: `${totalWidth}px`, height: '60px' }}>
                                    {timelineColumns.map((_, idx) => (
                                        <div key={idx} className="border-r border-gray-200 h-full flex-shrink-0" style={{ width: `${timelineColumns[idx].width}px` }}></div>
                                    ))}
                                    
                                    <div 
                                        className={`absolute top-1/2 transform -translate-y-1/2 h-6 ${config.barBg} rounded cursor-move flex items-center justify-between shadow-sm hover:shadow-md transition-shadow`}
                                        style={{ left: `${left}%`, width: `${width}%`, minWidth: '20px' }}
                                        onMouseDown={(e) => setDragState({
                                            actionId: action.id,
                                            mode: 'move',
                                            startX: e.clientX,
                                            originalStartDate: new Date(action.start_date),
                                            originalEndDate: new Date(action.due_date),
                                            scale: ganttScale
                                        })}
                                        onClick={(e) => { e.stopPropagation(); onCardClick(action); }}
                                    >
                                        <div className="flex-1 text-white text-xs font-medium px-2 truncate">
                                            {action.title}
                                        </div>
                                        <div 
                                            className="w-2 h-full bg-white bg-opacity-30 cursor-e-resize flex-shrink-0"
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                setDragState({
                                                    actionId: action.id,
                                                    mode: 'resize-right',
                                                    startX: e.clientX,
                                                    originalStartDate: new Date(action.start_date),
                                                    originalEndDate: new Date(action.due_date),
                                                    scale: ganttScale
                                                });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
        
        {/* Modal de confirmation */}
        {confirmationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirmer la modification</h3>
              <p className="text-gray-600 mb-4">
                Voulez-vous modifier les dates de l'action "<strong>{confirmationModal.action.title}</strong>" ?
              </p>
              <div className="text-xs mt-4 space-y-1">
                  <p>Date d'origine : {new Date(confirmationModal.originalStartDate + 'T00:00:00').toLocaleDateString('fr-FR')} → {new Date(confirmationModal.originalEndDate + 'T00:00:00').toLocaleDateString('fr-FR')}</p>
                  <p className="font-bold">Nouvelle date : {new Date(confirmationModal.newStartDate + 'T00:00:00').toLocaleDateString('fr-FR')} → {new Date(confirmationModal.newEndDate + 'T00:00:00').toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button onClick={handleCancel} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold">
                  Annuler
                </button>
                <button onClick={handleConfirm} className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold">
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};

// --- COMPOSANT PRINCIPAL ---
const ViewButton: React.FC<{ children: React.ReactNode; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = 
    ({ children, icon, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 font-medium shadow-lg ${
            isActive ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-green-200' : 'bg-white/80 backdrop-blur-sm text-gray-600 hover:bg-white/90 border border-gray-200'}`}>
        {icon} {children}
    </button>
);

export const PlanActionsEditor: React.FC<PlanActionsEditorProps> = ({ module, onClose }) => {
    const { users: allUsersInApp } = useAuth();
    const { 
    projectMembers, 
    updateA3Module, 
    actions: allActions, 
    actionAssignees, 
    createAction, 
    updateAction, 
    deleteAction, 
    addActionAssignee, 
    removeActionAssignee 
} = useDatabase();

    const [view, setView] = useState('gantt');

    const [loading, setLoading] = useState(true);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [editingAction, setEditingAction] = useState<Action | null>(null);
    const [showHelp, setShowHelp] = useState(false);
    
    const [ganttScale, setGanttScale] = useState<'day' | 'week' | 'month'>('week');

    const currentProjectMembers = useMemo(() => {
        const memberIds = projectMembers
            .filter(pm => pm.project === module.project)
            .map(pm => pm.user);
        return allUsersInApp.filter(user => memberIds.includes(user.id));
    }, [projectMembers, allUsersInApp, module.project]);

// Récupérer les actions depuis la vraie base de données
const actions = useMemo(() => {
    return allActions.filter(action => action.project_id === module.project_id);
}, [allActions, module.project_id]);

useEffect(() => {
    setLoading(false);
}, []);

  

    const handleSaveAction = useCallback(async (actionData: Action) => {
    try {
        if (actionData.id && actions.some(a => a.id === actionData.id)) {
            // Modifier une action existante
            await updateAction(actionData.id, {
                title: actionData.title,
                description: actionData.description,
                type: actionData.type,
                start_date: actionData.start_date,
                due_date: actionData.due_date,
                status: actionData.status,
                effort: actionData.effort,
                gain: actionData.gain
            });
        } else {
            // Créer une nouvelle action
            const newActionId = await createAction({
                project_id: module.project_id,
                title: actionData.title,
                description: actionData.description,
                type: actionData.type,
                start_date: actionData.start_date,
                due_date: actionData.due_date,
                status: actionData.status,
                effort: actionData.effort,
                gain: actionData.gain,
                position: actions.length
            });
            
            // Ajouter les assignations
            if (actionData.assignee_ids && actionData.assignee_ids.length > 0) {
                for (const userId of actionData.assignee_ids) {
                    await addActionAssignee(newActionId, userId, userId === actionData.leader_id);
                }
            }
        }
        
        setIsActionModalOpen(false);
        setEditingAction(null);
    } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
    }
}, [actions, createAction, updateAction, addActionAssignee, module.project_id]);

   {view === 'home' && <HomeView actions={actions} onUpdateAction={handleDragAction} users={currentProjectMembers} onCardClick={openActionModal} />}
{view === 'kanban' && <KanbanByPersonView actions={actions} onUpdateAction={handleDragAction} users={currentProjectMembers} onCardClick={openActionModal} />}
{view === 'matrix' && <MatrixView actions={actions} onUpdateAction={handleDragAction} users={currentProjectMembers} onCardClick={openActionModal} />}
    
const handleDragAction = useCallback(async (actionId: string, updates: Partial<Action>) => {
    try {
        await updateAction(actionId, updates);
    } catch (error) {
        console.error('Erreur lors du drag:', error);
    }
}, [updateAction]);



    const openActionModal = (action: Action | null = null) => {
        setEditingAction(action);
        setIsActionModalOpen(true);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50">
            <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl shadow-2xl flex flex-col w-full h-full overflow-hidden">
                {/* Header avec dégradé moderne */}
                <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 border-b border-white/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                                <GanttChartSquare className="w-7 h-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-white">Plan d'Actions</h1>
                                <p className="text-white/80 text-sm">Gestion des actions et matrice Gain/Effort</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowHelp(true)}
                                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                                title="Aide"
                            >
                                <HelpCircle className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={onClose}
                                className="w-10 h-10 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl"
                                title="Fermer"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Zone de contenu avec dégradé subtle */}
                <div className="flex-1 flex flex-col overflow-hidden bg-gradient-to-br from-white via-slate-50 to-blue-50">
                    {/* Barre d'outils moderne */}
                    <div className="p-6 border-b border-gray-200/50 flex-shrink-0">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center gap-3 bg-white/70 backdrop-blur-sm border border-gray-200/50 p-2 rounded-xl shadow-lg">
                                <ViewButton
                                    icon={<Layers className="w-4 h-4" />}
                                    isActive={view === 'home'}
                                    onClick={() => setView('home')}
                                >
                                    Vue d'ensemble
                                </ViewButton>
                                <ViewButton
                                    icon={<UserIcon className="w-4 h-4" />}
                                    isActive={view === 'kanban'}
                                    onClick={() => setView('kanban')}
                                >
                                    Par personne
                                </ViewButton>
                                <ViewButton
                                    icon={<Table className="w-4 h-4" />}
                                    isActive={view === 'matrix'}
                                    onClick={() => setView('matrix')}
                                >
                                    Matrice
                                </ViewButton>
                                <ViewButton
                                    icon={<GanttChartSquare className="w-4 h-4" />}
                                    isActive={view === 'gantt'}
                                    onClick={() => setView('gantt')}
                                >
                                    Gantt
                                </ViewButton>
                            </div>
                            
                            <button
                                onClick={() => openActionModal()}
                                className="flex items-center space-x-3 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="font-medium">Nouvelle action</span>
                            </button>
                        </div>
                    </div>

                    {/* Contenu principal avec scroll */}
                    <div className="flex-1 overflow-y-auto p-6" style={{ maxHeight: 'calc(100vh - 280px)' }}>
                        {loading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Activity className="w-8 h-8 text-gray-400 animate-pulse" />
                                    </div>
                                    <p className="text-gray-500">Chargement des actions...</p>
                                </div>
                            </div>
                        ) : actions.length === 0 ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center max-w-md mx-auto">
                                    <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <GanttChartSquare className="w-10 h-10 text-green-600" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune action créée</h3>
                                    <p className="text-gray-600 mb-6">Commencez par créer votre première action pour organiser votre plan.</p>
                                    <button
                                        onClick={() => openActionModal()}
                                        className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                    >
                                        <Plus className="w-5 h-5" />
                                        <span>Créer ma première action</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                {view === 'home' && <HomeView actions={actions} onUpdateAction={handleDragAction} users={currentProjectMembers} onCardClick={openActionModal} />}
                                {view === 'kanban' && <KanbanByPersonView actions={actions} onUpdateAction={handleDragAction} users={currentProjectMembers} onCardClick={openActionModal} />}
                                {view === 'matrix' && <MatrixView actions={actions} onUpdateAction={handleDragAction} users={currentProjectMembers} onCardClick={openActionModal} />}
                                {view === 'gantt' && <GanttView 
                                    actions={actions} 
                                    users={currentProjectMembers} 
                                    onUpdateAction={handleUpdateAction} 
                                    onCardClick={openActionModal}
                                />}
                            </>
                        )}
                    </div>
                </div>

                {/* Modal d'aide avec style moderne */}
                {showHelp && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-[60]">
                        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden">
                            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-6 border-b border-white/10">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-bold text-white">Plan d'Actions - Guide d'utilisation</h3>
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
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                                <GanttChartSquare className="w-5 h-5 mr-2 text-green-600" />
                                                Principe
                                            </h4>
                                            <p className="text-gray-600 leading-relaxed">
                                                Le Plan d'Actions est le cœur de votre projet Kaizen. Il permet de planifier, 
                                                organiser et suivre toutes les actions nécessaires à la résolution du problème 
                                                identifié dans la phase PLAN.
                                            </p>
                                        </div>
                                        
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Vues disponibles</h4>
                                            <div className="space-y-3 text-sm text-gray-600">
                                                <div>
                                                    <strong className="text-gray-700">Vue d'ensemble :</strong> Vision globale de toutes les actions
                                                </div>
                                                <div>
                                                    <strong className="text-gray-700">Par personne :</strong> Kanban organisé par assigné
                                                </div>
                                                <div>
                                                    <strong className="text-gray-700">Matrice :</strong> Matrice Gain/Effort pour prioriser
                                                </div>
                                                <div>
                                                    <strong className="text-gray-700">Gantt :</strong> Planning temporel des actions
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Types d'actions</h4>
                                            <div className="space-y-3 text-sm text-gray-600">
                                                <div className="flex items-start">
                                                    <div className="w-3 h-3 bg-emerald-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                                                    <div>
                                                        <strong className="text-gray-700">Simple :</strong> Action standard
                                                    </div>
                                                </div>
                                                <div className="flex items-start">
                                                    <div className="w-3 h-3 bg-amber-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                                                    <div>
                                                        <strong className="text-gray-700">Sécurisation :</strong> Action de sécurisation temporaire
                                                    </div>
                                                </div>
                                                <div className="flex items-start">
                                                    <div className="w-3 h-3 bg-teal-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                                                    <div>
                                                        <strong className="text-gray-700">Poka-yoke :</strong> Action de détrompeur permanent
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-xl border border-yellow-200">
                                            <h4 className="text-lg font-semibold text-gray-900 mb-3">Conseils d'utilisation</h4>
                                            <ul className="text-gray-600 space-y-2">
                                                <li className="flex items-start">
                                                    <span className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                    Définissez des actions SMART (Spécifiques, Mesurables, Atteignables, Réalistes, Temporelles)
                                                </li>
                                                <li className="flex items-start">
                                                    <span className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                    Assignez un responsable et une échéance à chaque action
                                                </li>
                                                <li className="flex items-start">
                                                    <span className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                    Utilisez la matrice Gain/Effort pour prioriser vos actions
                                                </li>
                                                <li className="flex items-start">
                                                    <span className="w-2 h-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                                                    Suivez régulièrement l'avancement dans la vue Gantt
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                                        <Users className="w-5 h-5 mr-2 text-green-600" />
                                        Travail en équipe
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed">
                                        Le Plan d'Actions favorise la collaboration en permettant d'assigner plusieurs personnes 
                                        à une action, de désigner un responsable principal, et de suivre l'avancement en temps réel. 
                                        Chaque membre de l'équipe peut visualiser ses actions et leur priorité.
                                    </p>
                                </div>
                                
                                <div className="mt-6 flex justify-end">
                                    <button 
                                        onClick={() => setShowHelp(false)} 
                                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-xl hover:from-green-700 hover:to-emerald-800 font-semibold shadow-lg hover:shadow-xl transition-all"
                                    >
                                        Compris
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal d'action */}
                {isActionModalOpen && (
                    <ActionModal
                        isOpen={isActionModalOpen}
                        onClose={() => { setIsActionModalOpen(false); setEditingAction(null); }}
                        onSave={handleSaveAction}
                        action={editingAction}
                        projectMembers={currentProjectMembers}
                    />
                )}
            </div>
        </div>
    );
};