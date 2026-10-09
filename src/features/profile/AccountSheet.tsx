import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button, Sheet } from '../../components/ui';
import { useAppStore } from '../../stores/use-app-store';
import type { User } from '../../types';
import { api, cloudEnabled } from '../../services/cloud';

const schema = z.object({
  name: z.string().trim().min(2, 'Use pelo menos 2 caracteres.').max(70, 'Use até 70 caracteres.'),
  email: z.string().trim().max(254, 'E-mail muito longo.').refine(value => !value || z.email().safeParse(value).success, 'Informe um e-mail válido.'),
});

export default function AccountSheet({ user, onOpenChange }: { user: User; onOpenChange: (open: boolean) => void }) {
  const setUser = useAppStore(s => s.setUser);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<User>({ resolver: zodResolver(schema), defaultValues: { ...user, email: user.email ?? '' } });
  return <Sheet open onOpenChange={onOpenChange} title="Minha conta" description={cloudEnabled?'Seus dados de acesso e perfil.':'Um perfil local para deixar o treino com a sua cara.'}>
    <form className="stack profile-account" noValidate onSubmit={handleSubmit(async values => {
      try{if(cloudEnabled){const result=await api<{user:User}>('/auth/profile',{method:'PUT',body:JSON.stringify({name:values.name})});setUser(result.user);}else setUser(values);toast.success('Perfil atualizado.');onOpenChange(false);}
      catch(error){toast.error(error instanceof Error?error.message:'Não foi possível atualizar.');}
    })}>
      <label className="field" htmlFor="profile-name">Seu nome<input id="profile-name" className="input" autoComplete="name" maxLength={70} {...register('name')} aria-invalid={!!errors.name} aria-describedby={errors.name ? 'profile-name-error' : undefined} />
        {errors.name && <span className="profile-error" id="profile-name-error" role="alert">{errors.name.message}</span>}</label>
      <label className="field" htmlFor="profile-email">E-mail<input id="profile-email" className="input" type="email" autoComplete="email" readOnly={cloudEnabled} maxLength={254} {...register('email')} aria-invalid={!!errors.email} aria-describedby={errors.email ? 'profile-email-error' : undefined} />
        {errors.email && <span className="profile-error" id="profile-email-error" role="alert">{errors.email.message}</span>}</label>
      <p className="muted small">{cloudEnabled?'O e-mail identifica sua conta e não pode ser alterado nesta tela.':'Sem senha, verificação de e-mail ou conta online. Estas informações ficam apenas neste navegador.'}</p>
      <Button type="submit" disabled={isSubmitting}>Salvar alterações</Button>
    </form>
  </Sheet>;
}
