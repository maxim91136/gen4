"""Rechnung zu Idee A1 (Lichtpass), A Lauf 3.

Frage: Mit welchem Anteil zufaelliger Punkte der Erde teilt ein Ort an einem Tag
die Sonnenhoehe, und wie oft steht die Sonne dabei ueber dem Horizont?
Modell: Kugel, Sonnenpunkt laeuft auf fester Deklination einmal um die Erde,
Schritt eine Minute, keine Refraktion. Zufallspunkte gleichmaessig auf der Kugel
(also meist Meer), fester Startwert. Aufruf: python3 werkzeug/lichtpass_rechnung.py
"""
import math, random
random.seed(1)
def alt(lat,lon,dec,slon):
    a=math.radians(lat);d=math.radians(dec);h=math.radians(lon-slon)
    return math.degrees(math.asin(math.sin(a)*math.sin(d)+math.cos(a)*math.cos(d)*math.cos(h)))
def stats(me,dec,pts,thr):
    n_any=n_day=0; mins=[]
    for p in pts:
        prev=None; any_=False; day=False; m=0
        for i in range(1441):
            sl=180-i*0.25
            a1=alt(me[0],me[1],dec,sl); a2=alt(p[0],p[1],dec,sl); df=a1-a2
            if abs(df)<0.5 and a1>thr: m+=1
            if prev is not None and prev[0]*df<=0:
                any_=True
                if (a1+a2)/2>thr: day=True
            prev=(df,)
        n_any+=any_; n_day+=day
        if day: mins.append(m)
    mins.sort()
    return n_any/len(pts), n_day/len(pts), mins[len(mins)//2] if mins else 0
pts=[]
while len(pts)<1500:
    z=random.uniform(-1,1); pts.append((math.degrees(math.asin(z)),random.uniform(-180,180)))
for name,me in [("Berlin",(52.5,13.4)),("Quito",(-0.2,-78.5)),("Sydney",(-33.9,151.2))]:
    for dec in (23.44,0.0,-23.44):
        for thr in (0,5):
            a,d,m=stats(me,dec,pts,thr)
            print(name,dec,"thr",thr,"kreuzt %.0f%%"%(a*100),"bei Tag %.0f%%"%(d*100),"Median Min. innerhalb 0,5 Grad:",m)
