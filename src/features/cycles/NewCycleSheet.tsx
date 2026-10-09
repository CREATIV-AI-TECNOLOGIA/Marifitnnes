import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, Sheet } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import { dateKey } from '../history/analytics';

const schema = z.object({
  name: z.string().trim().min(2, 'Use pelo menos 2 caracteres.').max(60, 'Use até 60 caracteres.'),
  weeks: z.number({ error: 'Informe a duração.' }).int('Use um número inteiro.').min(1, 'Mínimo de 1 semana.').max(52, 'Máximo de 52 semanas.'),
  frequency: z.number({ error: 'Informe a frequência.' }).int('Use um número inteiro.').min(2, 'Mínimo de 2 treinos.').max(7, 'Máximo de 7 treinos por semana.'),
});
type Fields = z.infer<typeof schema>;

export default function NewCycleSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const addCycle = useAppStore(s => s.addCycle);
  const navigate = useNavigate();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<Fields>({
    resolver: zodResolver(schema), defaultValues: { name: '', weeks: 4, frequency: 3 },
  });
  const submit = (values: Fields) => {
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + values.weeks * 7 - 1);
    const id = `cycle-${crypto.randomUUID()}`;
    addCycle({ id, name: values.name, weeks: values.weeks, frequency: values.frequency, start: dateKey(start), end: dateKey(end), current: true });
    toast.success('Novo ciclo criado. Seus ciclos anteriores foram preservados.');
    reset();
    onOpenChange(false);
    navigate(`/app/cycles/${id}`);
  };
  return <Sheet open={open} onOpenChange={onOpenChange} title="Um novo ciclo" description="Defina uma direção. Ajuste o ritmo ao seu dia a dia.">
    <form className="stack cycles-form" onSubmit={handleSubmit(submit)} noValidate>
      <label className="field" htmlFor="cycle-name">Nome do ciclo<input id="cycle-name" className="input" placeholder="Ex.: Força e constância" maxLength={60} autoComplete="off" {...register('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'cycle-name-error' : undefined} />
        {errors.name && <span id="cycle-name-error" className="cycles-error" role="alert">{errors.name.message}</span>}</label>
      <div className="grid-2"><label className="field" htmlFor="cycle-weeks">Duração · semanas<input id="cycle-weeks" className="input" type="number" inputMode="numeric" min={1} max={52} {...register('weeks', { valueAsNumber: true })} aria-invalid={!!errors.weeks} aria-describedby={errors.weeks ? 'cycle-weeks-error' : undefined} />
        {errors.weeks && <span id="cycle-weeks-error" className="cycles-error" role="alert">{errors.weeks.message}</span>}</label>
        <label className="field" htmlFor="cycle-frequency">Treinos por semana<input id="cycle-frequency" className="input" type="number" inputMode="numeric" min={2} max={7} {...register('frequency', { valueAsNumber: true })} aria-invalid={!!errors.frequency} aria-describedby={errors.frequency ? 'cycle-frequency-error' : undefined} />
          {errors.frequency && <span id="cycle-frequency-error" className="cycles-error" role="alert">{errors.frequency.message}</span>}</label></div>
      <p className="muted small">Começa hoje e se torna seu ciclo atual. Nenhum treino, histórico ou sessão em andamento será excluído.</p>
      <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Criando…' : 'Criar ciclo'}</Button>
    </form>
  </Sheet>;
}
