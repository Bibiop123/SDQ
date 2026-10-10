#!/usr/bin/env python3
"""Construit fleches/mots.json à partir des fichiers de fleches/source/*.txt
Format d'une ligne :  [?]MOT | indice 1 | indice 2 | ...
 - « ? » devant le mot : à faire relire (noms de joueurs, faits récents ou incertains)
 - les lignes « ## Titre » donnent la catégorie des lignes suivantes."""
import glob,json,re,unicodedata,collections,os
here=os.path.dirname(os.path.abspath(__file__))
def norm(x): return re.sub(r'[^A-Z0-9]','',unicodedata.normalize('NFD',x.upper()))
entries={}; problems=[]
for f in sorted(glob.glob(here+'/source/*.txt')):
    cat='?'
    for n,line in enumerate(open(f,encoding='utf-8'),1):
        line=line.strip()
        if not line or line.startswith('#') and not line.startswith('##'): continue
        if line.startswith('##'): cat=line[2:].strip(); continue
        parts=[p.strip() for p in line.split('|')]
        raw=parts[0]; review=raw.startswith('?'); raw=raw.lstrip('?').strip()
        w=norm(raw); clues=[c for c in parts[1:] if c]
        where=f"{os.path.basename(f)}:{n}"
        if not (2<=len(w)<=15): problems.append(f"{where} longueur {w}"); continue
        if not clues: problems.append(f"{where} {w} sans indice"); continue
        good=[]
        for c in clues:
            toks=[norm(t) for t in re.split(r"[\s'’.,;:!?()«»/-]+",c) if t]
            if any(t==w or (len(w)>=6 and t[:6]==w[:6]) for t in toks): problems.append(f"{where} {w}: indice contient le mot « {c} »"); continue
            if len(c)>40: problems.append(f"{where} {w}: indice trop long ({len(c)}) « {c} »"); continue
            good.append(c)
        if not good: continue
        e=entries.setdefault(w,{'w':w,'c':[],'cat':cat,'r':1})
        for c in good:
            if c not in e['c']: e['c'].append(c)
        if not review: e['r']=0
out=sorted(entries.values(),key=lambda e:(len(e['w']),e['w']))
json.dump(out,open(here+'/mots.json','w',encoding='utf-8'),ensure_ascii=False,indent=0)
L=collections.Counter(len(e['w']) for e in out)
print('mots :',len(out),'| à relire :',sum(e['r'] for e in out),'| avec 2 indices ou plus :',sum(len(e['c'])>1 for e in out))
print('longueurs :',dict(sorted(L.items())))
print('utilisables en 10x10 (<=10 lettres) :',sum(v for k,v in L.items() if k<=10),'| courts (2-4) :',sum(v for k,v in L.items() if k<=4))
print('catégories :',dict(collections.Counter(e['cat'] for e in out)))
print('problèmes :',len(problems))
for p in problems[:60]: print(' -',p)
