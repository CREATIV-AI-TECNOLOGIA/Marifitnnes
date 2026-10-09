import { Component,type ReactNode } from 'react';
export default class LoadBoundary extends Component<{children:ReactNode},{failed:boolean}>{
  state={failed:false};
  static getDerivedStateFromError(){return{failed:true};}
  render(){return this.state.failed?<div className="page"><h1>Não foi possível abrir esta tela</h1><p>Confira sua conexão e tente carregar o app novamente.</p><button className="btn btn-primary" onClick={()=>window.location.reload()}>Carregar novamente</button></div>:this.props.children;}
}
