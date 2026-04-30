import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import type { TicketPriority } from '../types';
import { ArrowLeft, Upload, X, File } from 'lucide-react';

const CLIENTS_DATA = [
  { id: 'c1', name: 'Groupe Renault', subClients: ['Usine Flins', 'Siège Boulogne', 'Logistique'] },
  { id: 'c2', name: 'TotalEnergies', subClients: ['Raffinage France', 'Secteur IT', 'Plateforme Mer'] }
];

const COMMON_ISSUES = [
  { value: 'vpn_access', label: 'Problème Accès VPN' },
  { value: 'password_reset', label: 'Réinitialisation de mot de passe' },
  { value: 'hardware_fault', label: 'Panne Matérielle (PC/Écran)' },
  { value: 'email_issue', label: 'Problème Outlook / Messagerie' },
  { value: 'other', label: 'Autre... (Saisir manuellement)' }
];

interface CreateTicketProps {
  onSubmit: (ticket: any) => void;
}

export function CreateTicket({ onSubmit }: CreateTicketProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    clientName: '',
    subClient: '',
    title: '',
    customTitle: '',
    priority: 'medium' as TicketPriority,
    team: 'helpdesk' as string,
    description: ''
  });

  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedClientData = CLIENTS_DATA.find((c) => c.name === formData.clientName);
  const subClientOptions = selectedClientData
    ? selectedClientData.subClients.map((sc) => ({ value: sc, label: sc }))
    : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles([...files, ...Array.from(e.target.files)]);
  };

  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = formData.title === 'other'
      ? formData.customTitle
      : COMMON_ISSUES.find((i) => i.value === formData.title)?.label || formData.title;

    onSubmit({ ...formData, title: finalTitle, attachments: files });
    navigate('/tickets');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="pl-0 hover:bg-transparent hover:text-[#ef7c21] transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Retour aux tickets
      </Button>

      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Nouveau Ticket</h1>
          <p className="text-slate-500 mt-1 font-medium">Ouverture manuelle d'un incident.</p>
        </div>
      </div>

      <Card className="border-none shadow-2xl rounded-[2.5rem] p-8 md:p-10 bg-white">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <Select
              label="Client Principal"
              required
              options={[
                { value: '', label: 'Select a client...' },
                ...CLIENTS_DATA.map((c) => ({ value: c.name, label: c.name }))
              ]}
              value={formData.clientName}
              onChange={(e) =>
                setFormData({ ...formData, clientName: e.target.value, subClient: '' })
              }
            />
            <Select
              label="Sous-Client / Site"
              required
              disabled={!formData.clientName}
              options={[
                { value: '', label: 'Select a sub-client...' },
                ...subClientOptions
              ]}
              value={formData.subClient}
              onChange={(e) => setFormData({ ...formData, subClient: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Objet du ticket (Type)"
                required
                options={[{ value: '', label: 'Select an issue...' }, ...COMMON_ISSUES]}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
              <Select
                label="Priorité"
                options={[
                  { value: 'low', label: 'Basse' },
                  { value: 'medium', label: 'Moyenne' },
                  { value: 'high', label: 'Haute' },
                  { value: 'critical', label: 'Critique' }
                ]}
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as TicketPriority })
                }
              />
            </div>

            {formData.title === 'other' && (
              <div>
                <Input
                  label="Précisez l'objet du ticket"
                  placeholder="Saisissez l'objet manuellement..."
                  required
                  value={formData.customTitle}
                  onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                  className="border-[#ef7c21] bg-orange-50/30"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select
              label="Équipe assignée"
              options={[
                { value: 'developpement', label: 'Développement' },
                { value: 'helpdesk', label: 'Helpdesk' },
                { value: 'windows', label: 'Infrastructure Windows' }
              ]}
              value={formData.team}
              onChange={(e) => setFormData({ ...formData, team: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest opacity-70">
              Description
            </label>
            <textarea
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm focus:outline-none focus:border-[#ef7c21] transition-all min-h-[120px] font-medium"
              placeholder="Détaillez l'incident..."
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-black text-slate-700 uppercase tracking-widest opacity-70">
              Pièces jointes
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-[2rem] p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-orange-50 hover:border-[#ef7c21] transition-all cursor-pointer group"
            >
              <input
                type="file"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Upload className="text-[#ef7c21] h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-slate-700">Déposer des fichiers ou cliquer ici</p>
            </div>

            {files.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <File className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                      <span className="text-[11px] font-bold text-slate-600 truncate">
                        {file.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="p-1 text-slate-300 hover:text-red-500"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="rounded-xl px-8 h-12 font-bold"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className="bg-[#ef7c21] hover:bg-orange-600 text-white rounded-xl px-10 h-12 font-black shadow-lg shadow-orange-100 transition-all active:scale-95"
            >
              Créer le ticket
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
