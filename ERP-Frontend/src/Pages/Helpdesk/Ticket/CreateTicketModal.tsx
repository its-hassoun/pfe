import { useState, useRef, useEffect } from 'react';
import { Select } from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { CategorieAction, PrioriteTicket, StatutTicket, type Intervention } from '../../../types/helpdesk';
import { interventionService } from '../../../Services/helpdesk/interventionService';
import { clientService, type CompanyDto, type ContactDto } from '../../../Services/helpdesk/clientService';
import { useAuth } from '../../../contexts/AuthContext';
import { X, Upload, File } from 'lucide-react';

interface CreateTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (ticket: any) => void;
}

export function CreateTicketModal({ isOpen, onClose, onSubmit }: CreateTicketModalProps) {
  const { user } = useAuth();
  const isStaff = user?.role === 'Admin' || user?.role === 'Agent';

  const [formData, setFormData] = useState({
    clientId: user && !isStaff ? user.id : '',
    sousClientId: '',
    interventionId: '',
    customTitle: '',
    priorite: PrioriteTicket.Moyenne,
    categorie: CategorieAction.HelpDesk,
    description: '',
  });

  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [clients, setClients] = useState<CompanyDto[]>([]);
  const [subClients, setSubClients] = useState<ContactDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    Promise.all([
      interventionService.getAll().catch(() => []),
      isStaff ? clientService.list().catch(() => []) : Promise.resolve([] as CompanyDto[]),
    ])
      .then(([i, cl]) => { setInterventions(i); setClients(cl); })
      .finally(() => setLoading(false));
  }, [isOpen, isStaff]);

  useEffect(() => {
    if (!formData.clientId || !isStaff) {
      setSubClients([]);
      return;
    }
    const numericId = Number(formData.clientId);
    if (Number.isNaN(numericId)) return;
    clientService.contacts(numericId).then(setSubClients).catch(() => setSubClients([]));
  }, [formData.clientId, isStaff]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const isCustom = formData.interventionId === 'other';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFiles([...files, ...Array.from(e.target.files)]);
  };
  const removeFile = (index: number) => setFiles(files.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const selectedIntervention = interventions.find((i) => String(i.id) === formData.interventionId);
    const titre = isCustom ? formData.customTitle.trim() : selectedIntervention?.nom?.trim() ?? '';
    if (!titre || !formData.clientId || !formData.description.trim()) {
      setError('Titre, client et description sont requis.');
      return;
    }
    onSubmit({
      titre,
      description: formData.description,
      clientId: String(formData.clientId),
      sousClientId: formData.sousClientId || undefined,
      statut: StatutTicket.Nouveau,
      priorite: formData.priorite,
      categorie: formData.categorie,
      dateCreation: new Date().toISOString(),
      dureeReelleMinutes: 0,
      coutFinal: 0,
      imagesUrls: [],
      interventionId: isCustom ? undefined : Number(formData.interventionId) || undefined,
    });
    setFormData({
      clientId: user && !isStaff ? user.id : '',
      sousClientId: '',
      interventionId: '',
      customTitle: '',
      priorite: PrioriteTicket.Moyenne,
      categorie: CategorieAction.HelpDesk,
      description: '',
    });
    setFiles([]);
    onClose();
  };

  const interventionOptions = () => {
    if (loading) return [{ value: '', label: 'Chargement…' }];
    return [
      { value: '', label: 'Sélectionner une intervention…' },
      ...interventions.map((i) => ({ value: String(i.id), label: i.nom })),
      { value: 'other', label: 'Autre… (saisie manuelle)' },
    ];
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Nouveau Ticket</h2>
            <p className="text-sm text-slate-500 font-medium">Ouverture manuelle d'un incident.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {error && <p className="mb-3 text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <form id="create-ticket-form" onSubmit={handleSubmit} className="space-y-6">
            {isStaff && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Select
                  label="Client Principal"
                  required
                  options={[
                    { value: '', label: 'Sélectionner un client…' },
                    ...clients.map((c) => ({ value: String(c.id), label: c.raisonSociale })),
                  ]}
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value, sousClientId: '' })}
                />
                <Select
                  label="Sous-Client / Contact"
                  disabled={!formData.clientId}
                  options={[
                    { value: '', label: 'Aucun' },
                    ...subClients.map((s) => ({ value: String(s.id), label: `${s.prenom} ${s.nom}` })),
                  ]}
                  value={formData.sousClientId}
                  onChange={(e) => setFormData({ ...formData, sousClientId: e.target.value })}
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Objet (catalogue)"
                  options={interventionOptions()}
                  value={formData.interventionId}
                  onChange={(e) => setFormData({ ...formData, interventionId: e.target.value, customTitle: '' })}
                />
                <Select
                  label="Priorité"
                  options={[
                    { value: String(PrioriteTicket.Basse), label: 'Basse' },
                    { value: String(PrioriteTicket.Moyenne), label: 'Moyenne' },
                    { value: String(PrioriteTicket.Haute), label: 'Haute' },
                    { value: String(PrioriteTicket.Critique), label: 'Critique' },
                  ]}
                  value={String(formData.priorite)}
                  onChange={(e) => setFormData({ ...formData, priorite: Number(e.target.value) as PrioriteTicket })}
                />
              </div>

              {isCustom && (
                <Input
                  label="Précisez l'objet du ticket"
                  placeholder="Saisissez l'objet manuellement…"
                  required
                  value={formData.customTitle}
                  onChange={(e) => setFormData({ ...formData, customTitle: e.target.value })}
                  className="border-[#ef7c21] bg-orange-50/30"
                />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Catégorie"
                options={[
                  { value: String(CategorieAction.HelpDesk), label: 'Helpdesk' },
                  { value: String(CategorieAction.Developpement), label: 'Développement' },
                  { value: String(CategorieAction.Windows), label: 'Windows' },
                ]}
                value={String(formData.categorie)}
                onChange={(e) => setFormData({ ...formData, categorie: Number(e.target.value) as CategorieAction })}
              />
            </div>

            <div>
              <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-widest opacity-70">Description</label>
              <textarea
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:border-[#ef7c21] min-h-[100px] font-medium resize-none"
                placeholder="Détaillez l'incident…"
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-black text-slate-700 uppercase tracking-widest opacity-70">Pièces jointes</label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-orange-50 hover:border-[#ef7c21] cursor-pointer group"
              >
                <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                <div className="h-10 w-10 bg-white rounded-xl shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Upload className="text-[#ef7c21] h-4 w-4" />
                </div>
                <p className="text-xs font-bold text-slate-700">Déposer des fichiers ou cliquer ici</p>
              </div>

              {files.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-xl">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <File className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                        <span className="text-[11px] font-bold text-slate-600 truncate">{file.name}</span>
                      </div>
                      <button type="button" onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="p-1 text-slate-300 hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 shrink-0">
          <Button type="button" variant="outline" onClick={onClose} className="rounded-xl px-6 h-11 font-bold">
            Annuler
          </Button>
          <Button type="submit" form="create-ticket-form" className="bg-[#ef7c21] hover:bg-orange-600 text-white rounded-xl px-8 h-11 font-black shadow-lg shadow-orange-100">
            Créer le ticket
          </Button>
        </div>
      </div>
    </div>
  );
}
