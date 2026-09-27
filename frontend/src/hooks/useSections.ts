import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/api';

export type Sections = { lab:boolean; journal:boolean };
export function useSections() {
  const [sections,setSections]=useState<Sections>({lab:false,journal:false});
  useEffect(()=>{const controller=new AbortController(); fetch(apiUrl('sections'),{signal:controller.signal})
    .then(r=>r.ok?r.json():Promise.reject()).then(setSections).catch(()=>{}); return()=>controller.abort();},[]);
  return sections;
}
