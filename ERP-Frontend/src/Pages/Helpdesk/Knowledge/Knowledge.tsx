import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { KnowledgeDetail } from './KnowledgeDetail';
import { knowledgeService } from '../../../Services/helpdesk/knowledgeService';
import type { KnowledgeBase } from '../../../types/helpdesk';
import { CategorieAction } from '../../../types/helpdesk';
import {
  BookOpen,
  Layers,
  Users,
  Search,
  User as UserIcon,
  Calendar,
  ChevronDown,
  Plus,
  X,
  Upload,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

const CATEGORY_LABEL: Record<number, string> = {
  [CategorieAction.HelpDesk]: 'Help Desk',
  [CategorieAction.Developpement]: 'Développement',
  [CategorieAction.Windows]: 'Windows',
};

export function Knowledge() {
  const [articles, setArticles] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<'all' | CategorieAction>('all');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    nomErreur: '',
    descriptionErreur: '',
    categorie: CategorieAction.HelpDesk,
  });

  const fetchAll = () => {
    setLoading(true);
    setError(false);
    knowledgeService.getAll()
      .then(setArticles)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(fetchAll, []);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      const matchesSearch =
        a.nomErreur.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.descriptionErreur.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'all' || a.categorie === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [articles, searchQuery, activeCategory]);

  const selected = articles.find((a) => a.id === selectedId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#ef7c21]" />
        <span className="ml-3 text-slate-500 font-medium">Chargement…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-slate-500 font-medium">Impossible de charger la base de connaissances.</p>
        <Button variant="outline" onClick={fetchAll}>Réessayer</Button>
      </div>
    );
  }

  if (selected) {
    return <KnowledgeDetail article={selected as any} onBack={() => { setSelectedId(null); fetchAll(); }} />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.nomErreur.trim() || !createForm.descriptionErreur.trim()) return;
    setCreating(true);
    try {
      const created = await knowledgeService.create({
        nomErreur: createForm.nomErreur,
        descriptionErreur: createForm.descriptionErreur,
        categorie: createForm.categorie,
      });
      setArticles((p) => [created, ...p]);
      setCreateForm({ nomErreur: '', descriptionErreur: '', categorie: CategorieAction.HelpDesk });
      setIsCreateOpen(false);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-8">
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 shadow-2xl border-none">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Nouvel Article</h2>
                <p className="text-slate-500 text-sm font-medium">Documentez une nouvelle problématique</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="p-2 hover:bg-slate-100 rounded-full">
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>
            <form className="space-y-6" onSubmit={handleCreate}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom du problème</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#ef7c21]/20 font-medium"
                    placeholder="Titre…"
                    value={createForm.nomErreur}
                    onChange={(e) => setCreateForm({ ...createForm, nomErreur: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Catégorie</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#ef7c21]/20 font-medium"
                    value={createForm.categorie}
                    onChange={(e) => setCreateForm({ ...createForm, categorie: Number(e.target.value) as CategorieAction })}
                  >
                    <option value={CategorieAction.HelpDesk}>Help Desk</option>
                    <option value={CategorieAction.Developpement}>Développement</option>
                    <option value={CategorieAction.Windows}>Windows</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Description</label>
                <textarea
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-[#ef7c21]/20 font-medium resize-none"
                  placeholder="Résumé…"
                  value={createForm.descriptionErreur}
                  onChange={(e) => setCreateForm({ ...createForm, descriptionErreur: e.target.value })}
                  required
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="flex-1 py-4 rounded-xl font-black text-xs uppercase text-slate-500 bg-slate-100 hover:bg-slate-200">
                  Annuler
                </button>
                <button type="submit" disabled={creating} className="flex-[2] py-4 rounded-xl font-black text-xs uppercase text-white bg-[#ef7c21] hover:bg-[#d96a1a] shadow-lg shadow-orange-100">
                  {creating ? 'Création…' : "Créer l'article"}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Knowledge Base</h1>
          <p className="text-slate-500 font-medium mt-1">Exploitez le savoir-faire technique partagé par l'équipe</p>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-[#ef7c21] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#d96a1a] transition-all shadow-lg active:scale-95"
        >
          <Plus size={16} /> Nouvel Article
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher…"
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#ef7c21]/10 outline-none font-medium shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="appearance-none pl-11 pr-12 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none cursor-pointer shadow-sm min-w-[240px]"
            value={activeCategory === 'all' ? 'all' : String(activeCategory)}
            onChange={(e) => setActiveCategory(e.target.value === 'all' ? 'all' : (Number(e.target.value) as CategorieAction))}
          >
            <option value="all">Toutes catégories</option>
            <option value={CategorieAction.HelpDesk}>Help Desk</option>
            <option value={CategorieAction.Developpement}>Développement</option>
            <option value={CategorieAction.Windows}>Windows</option>
          </select>
          <Layers className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Articles', value: articles.length, icon: BookOpen, color: 'bg-[#ef7c21]' },
          { label: 'Catégories', value: 3, icon: Layers, color: 'bg-blue-600' },
          { label: 'Solutions', value: articles.reduce((acc, a) => acc + (a.solutions?.length ?? 0), 0), icon: Users, color: 'bg-[#00b341]' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.color} p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden group`}>
            <div className="relative z-10">
              <stat.icon className="h-10 w-10 mb-4 opacity-80" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70">{stat.label}</p>
              <p className="text-5xl font-black mt-2">{stat.value}</p>
            </div>
            <stat.icon className="absolute -right-6 -bottom-6 h-40 w-40 opacity-10 group-hover:scale-110 transition-transform" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filtered.map((article) => (
          <Card
            key={article.id}
            className="group hover:border-[#ef7c21]/40 transition-all shadow-sm cursor-pointer"
            noPadding
            onClick={() => setSelectedId(article.id)}
          >
            <div className="p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#ef7c21] group-hover:bg-[#ef7c21] group-hover:text-white transition-colors">
                    <BookOpen size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 group-hover:text-[#ef7c21] transition-colors">
                      {article.nomErreur}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-black uppercase">
                        {CATEGORY_LABEL[article.categorie]}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-slate-300">#{article.id}</span>
              </div>
              <p className="text-slate-500 font-medium mb-8 line-clamp-2 leading-relaxed">{article.descriptionErreur}</p>
              <div className="flex flex-wrap gap-6 items-center justify-between pt-6 border-t border-slate-50">
                <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                    <UserIcon size={14} /> {article.solutions?.[0]?.agentId ?? '—'}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                    <Calendar size={14} /> {new Date(article.dateCreation).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-[#00b341] bg-green-50 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase">
                  <CheckCircle2 size={14} /> {(article.solutions?.length ?? 0)} solution(s)
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-24 bg-white rounded-[2rem] border-2 border-dashed border-slate-100">
          <Search size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-500 font-bold">Aucun article ne correspond à votre recherche.</p>
        </div>
      )}
    </div>
  );
}
