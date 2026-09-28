import { forwardRef, useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { cva } from 'class-variance-authority';
import { ArrowLeft, ArrowUpRight, Inbox, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '../../utils/cn';

const buttonVariants = cva('btn', {variants:{variant:{primary:'btn-primary',secondary:'btn-secondary',ghost:'btn-ghost',danger:'btn-danger'},size:{sm:'btn-sm',icon:'btn-icon'}},defaultVariants:{variant:'primary'}});
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {variant?:'primary'|'secondary'|'ghost'|'danger';size?:'sm'|'icon'};
export const Button = forwardRef<HTMLButtonElement,ButtonProps>(({className,variant,size,type='button',...props},ref)=><button ref={ref} type={type} className={cn(buttonVariants({variant,size}),className)} {...props}/>);
Button.displayName='Button';
export const IconButton = forwardRef<HTMLButtonElement,ButtonHTMLAttributes<HTMLButtonElement>&{label:string}>(({label,className,...props},ref)=><Button ref={ref} variant="ghost" size="icon" aria-label={label} title={label} className={className} {...props}/>);
IconButton.displayName='IconButton';
interface OverlayProps {open:boolean;onOpenChange:(open:boolean)=>void;title:string;description?:string;children:ReactNode;wide?:boolean;}
export function Sheet({open,onOpenChange,title,description,children,wide}:OverlayProps){return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className={cn('sheet',wide&&'sheet-wide')}><div className="sheet-handle"/><div className="sheet-heading"><div><Dialog.Title>{title}</Dialog.Title>{description&&<Dialog.Description>{description}</Dialog.Description>}</div><Dialog.Close asChild><IconButton label="Fechar"><X size={20}/></IconButton></Dialog.Close></div><div className="sheet-body">{children}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;}
export function ConfirmDialog({open,onOpenChange,title,description,children}:OverlayProps){return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="overlay"/><Dialog.Content className="confirm-dialog"><div className="row between"><Dialog.Title>{title}</Dialog.Title><Dialog.Close asChild><IconButton label="Fechar"><X size={19}/></IconButton></Dialog.Close></div>{description&&<Dialog.Description>{description}</Dialog.Description>}<div>{children}</div></Dialog.Content></Dialog.Portal></Dialog.Root>;}
export function SegmentedControl({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}){const id=useId();return <div className="segmented" role="tablist">{options.map(o=><button role="tab" aria-selected={value===o.value} key={o.value} onClick={()=>onChange(o.value)}>{value===o.value&&<motion.span className="segment-indicator" layoutId={id} transition={{duration:.2}}/>}<span>{o.label}</span></button>)}</div>;}
export function EmptyState({icon,title,description,action}:{icon?:ReactNode;title:string;description:string;action?:ReactNode}){return <div className="empty-state"><div className="empty-symbol">{icon||<Inbox size={28}/>}</div><h2>{title}</h2><p>{description}</p>{action}</div>;}
export function TopBar({title,eyebrow,back,action}:{title:string;eyebrow?:string;back?:string;action?:ReactNode}){return <header className="page-header">{back&&<Link className="back-link" to={back}><ArrowLeft size={17}/> Voltar</Link>}<div className="row between"><div>{eyebrow&&<p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1></div>{action}</div></header>;}
export function Badge({children,tone='neutral'}:{children:ReactNode;tone?:'accent'|'success'|'neutral'}){return <span className={`badge badge-${tone}`}>{children}</span>;}
export function StickyActionBar({children}:{children:ReactNode}){return <div className="sticky-actions">{children}</div>;}
export function Skeleton({className}:{className?:string}){return <div aria-hidden="true" className={cn('skeleton',className)}/>;}
export function PageSkeleton(){return <div className="page" aria-label="Carregando tela" role="status"><Skeleton className="skeleton-heading"/><Skeleton className="skeleton-hero"/><div className="grid-2"><Skeleton className="skeleton-card"/><Skeleton className="skeleton-card"/></div><span className="sr-only">Carregando</span></div>;}
export function TextLink({to,children}:{to:string;children:ReactNode}){return <Link className="text-link" to={to}>{children}<ArrowUpRight size={15}/></Link>;}
