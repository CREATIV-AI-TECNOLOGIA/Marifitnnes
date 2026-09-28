import { Database, FileText, ShieldCheck } from 'lucide-react';
import { Sheet } from '../../components/ui';
import './profile.css';

export default function HelpSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Sheet open={open} onOpenChange={onOpenChange} title="Sobre o app" description="Como suas agendas e treinos são usados.">
    <div className="profile-help stack">
      <section><Database size={21} /><div><h3>Dados salvos neste dispositivo</h3><p>Agendas importadas, escolha de frequência, calendário, exercícios e histórico ficam no armazenamento local do navegador. Limpar os dados do site pode apagá-los.</p></div></section>
      <section><FileText size={21} /><div><h3>Importação de agenda em PDF</h3><p>O app lê localmente o texto selecionável para identificar frequências e dias de treino. Os PDFs fornecidos não contêm a lista de exercícios; ela deve ser cadastrada manualmente.</p></div></section>
      <section><ShieldCheck size={21} /><div><h3>Conta e publicação</h3><p>O nome identifica o perfil apenas neste aparelho. Esta versão ainda não tem servidor para a responsável publicar uma agenda e sincronizá-la com os telefones dos alunos.</p></div></section>
      <p className="profile-local-note">Use “Exportar dados” em Configurações para baixar uma cópia local das suas informações.</p>
    </div>
  </Sheet>;
}
