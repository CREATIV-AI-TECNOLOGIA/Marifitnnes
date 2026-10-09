import { Database, ShieldCheck } from 'lucide-react';
import { Sheet } from '../../components/ui';
import './profile.css';
import { cloudEnabled } from '../../services/cloud';

export default function HelpSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Sheet open={open} onOpenChange={onOpenChange} title="Sobre o app" description="Como suas agendas e treinos são usados.">
    <div className="profile-help stack">
      <section><Database size={21} /><div><h3>{cloudEnabled?'Dados da sua conta':'Dados salvos neste dispositivo'}</h3><p>{cloudEnabled?'Treinos, agenda e histórico são sincronizados na sua conta. Alterações sem conexão permanecem neste navegador até conseguir salvar. Confira o estado de sincronização antes de trocar de aparelho.':'A agenda ativa, a frequência escolhida, o calendário, os exercícios e o histórico ficam no armazenamento local do navegador. Limpar os dados do site pode apagá-los.'}</p></div></section>
      <section><ShieldCheck size={21} /><div><h3>Conta e publicação</h3><p>{cloudEnabled?'Os PDFs são privados e acessíveis pela sua conta. A IA interpreta arquivos novos, e você confere o resultado antes de adicionar.':'O nome identifica o perfil apenas neste aparelho. Esta versão ainda não tem servidor para a responsável publicar uma agenda e sincronizá-la com os telefones dos alunos.'}</p></div></section>
      <p className="profile-local-note">Use “Exportar dados” em Configurações para baixar uma cópia local das suas informações.</p>
    </div>
  </Sheet>;
}
