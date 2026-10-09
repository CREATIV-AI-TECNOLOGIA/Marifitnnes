export function recoverUpdate(storage:Pick<Storage,'getItem'|'setItem'>,reload:()=>void,now=Date.now()){
  const key='forma-update-reload';
  try{
    const previous=Number(storage.getItem(key));
    if(previous && now-previous<60000)return false;
    storage.setItem(key,String(now));reload();return true;
  }catch{return false;}
}
