import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, CircleHelp, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { SegmentedControl, TopBar } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import type { Preferences } from '../../types';
import { number, toDisplayWeight } from '../../utils/format';
import { dateKey } from '../history/analytics';
import HelpSheet from './HelpSheet';
import '../history/history.css';
import './profile.css';
import { cloudEnabled } from '../../services/cloud';

const toggles = [
  { key: 'showPrevious', title: 'Histórico durante o treino', description: 'Mostrar as cargas e repetições anteriores.' },
  { key: 'trackDuration', title: 'Mostrar duração', description: 'Exibir os cronômetros. O tempo continua salvo no histórico.' },
  { key: 'autoRest', title: 'Descanso automático', description: 'Iniciar o descanso ao concluir uma série.' },
  { key: 'showVideos', title: 'Vídeos de execução', description: 'Mostrar vídeos quando o exercício tiver uma demonstração.' },
] as const;

export default function SettingsPage() {
  const preferences = useAppStore(s => s.preferences);
  const setPreferences = useAppStore(s => s.setPreferences);

  const [help, setHelp] = useState(false);
  const [exporting, setExporting] = useState(false);
  const update = (patch: Partial<Preferences>) => { setPreferences(patch); };
  const exportData = () => {
    setExporting(true);
    let url: string | undefined;
    try {
      const { user, exercises, workouts, cycles, programs, sources: savedSources, activeAgenda, agendaChoices, history, activeSession, preferences: savedPreferences } = useAppStore.getState();
      const data = { schemaVersion: 1, exportedAt: new Date().toISOString(), app: 'forma-training', storage: cloudEnabled?'cloud-and-local':'local-only',
        user, exercises, workouts, cycles, programs, sources: savedSources, activeAgenda, agendaChoices, history, activeSession, preferences: savedPreferences };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
      url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `forma-dados-${dateKey(new Date())}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download JSON iniciado. Inclui seu histórico e treino em andamento.');
    } catch {
      toast.error('Não foi possível exportar agora. Seus dados continuam salvos.');
    } finally {
      if (url) { const exportedUrl = url; window.setTimeout(() => URL.revokeObjectURL(exportedUrl), 1000); }
      setExporting(false);
    }
  };
  return <div className="page profile-page">
    <TopBar title="Configurações" back="/app/profile" eyebrow="Pequenos ajustes, seu ritmo" />
    <section className="profile-settings-section"><h2>Aparência e unidade</h2>
      <SegmentedControl label="Aparência" value={preferences.theme} onChange={value => update({ theme: value as Preferences['theme'] })}
        options={[{ value: 'system', label: 'Sistema' }, { value: 'light', label: 'Claro' }, { value: 'dark', label: 'Escuro' }]} />
      <p className="profile-theme-note">Sistema acompanha a aparência do seu dispositivo.</p>
      <div className="profile-settings-unit"><div><strong>Unidade de carga</strong><p>100 kg = {number(toDisplayWeight(100, 'lb'))} lb</p></div>
        <SegmentedControl label="Unidade de carga" value={preferences.unit} onChange={value => update({ unit: value as Preferences['unit'] })}
          options={[{ value: 'kg', label: 'kg' }, { value: 'lb', label: 'lb' }]} /></div>
      <p className="profile-theme-note">A conversão muda a exibição, sem alterar as cargas originais salvas em kg.</p>
    </section>
    <section className="profile-settings-section"><h2>Durante o treino</h2>
      {toggles.map(({ key, title, description }) => <div className="profile-settings-row" key={key}>
        <div><strong id={`pref-${key}`}>{title}</strong><p id={`pref-${key}-description`}>{description}</p></div>
        <button className="profile-switch" role="switch" aria-checked={preferences[key]} aria-labelledby={`pref-${key}`} aria-describedby={`pref-${key}-description`}
          onClick={() => update({ [key]: !preferences[key] })}><span /></button>
      </div>)}
    </section>
    <section className="profile-settings-section"><h2>Treinos</h2><div className="profile-menu">
      <Link className="profile-menu-item" to="/app/workouts/import"><Upload size={20} /><span><strong>Importar PDF</strong><small>Adicionar treino ou agenda</small></span><ChevronRight size={16} /></Link>
    </div></section>
    <section className="profile-settings-section"><h2>Seus dados</h2><div className="profile-menu">
      <button className="profile-menu-item" onClick={exportData} disabled={exporting}><Download size={20} /><span><strong>{exporting ? 'Preparando arquivo…' : 'Exportar dados'}</strong><small>Perfil, treinos, ciclos e registros em JSON</small></span><ChevronRight size={16} /></button>
      <button className="profile-menu-item" onClick={() => setHelp(true)}><CircleHelp size={20} /><span><strong>Sobre o app</strong><small>{cloudEnabled?'Conta, sincronização e PDFs privados':'Dados locais e limitações de publicação'}</small></span><ChevronRight size={16} /></button>
    </div><p className="profile-theme-note">{cloudEnabled?'Os dados sincronizados ficam na sua conta. Alterações pendentes dependem deste navegador.':'Dados e agendas ficam neste navegador. Limpar os dados do site apaga os registros locais.'} A exportação contém seu perfil: compartilhe com cuidado.</p></section>
    <HelpSheet open={help} onOpenChange={setHelp} />
  </div>;
}
