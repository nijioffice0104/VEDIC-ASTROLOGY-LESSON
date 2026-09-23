import A from './astronomy-engine.mjs';
const DEG=Math.PI/180;
const norm=x=>((x%360)+360)%360;
// Public IAE1985 Lahiri definition: 23°15′00.658″ true ayanamsa at
// 1956-03-21 00:00 TT (JD2435553.5). No Swiss source, binaries or tables.
// Definition: https://www.astro.com/swisseph/swisseph.htm section 2.8.5.
// Propagate a reference direction with Astronomy Engine's precession/nutation.
// This uses AE's model, not a claim of bit-identical Swiss Lahiri results.
const anchorTime=A.AstroTime.FromTerrestrialTime(2435553.5-2451545);
const anchorAngle=(23+15/60+0.658/3600)*DEG;
const anchorVector=A.RotateVector(A.Rotation_ECT_EQJ(anchorTime),new A.Vector(Math.cos(anchorAngle),Math.sin(anchorAngle),0,anchorTime));
export function lahiriAyanamsa(time){
 const t=A.MakeTime(time);
 const p=A.RotateVector(A.Rotation_EQJ_ECT(t),new A.Vector(anchorVector.x,anchorVector.y,anchorVector.z,t));
 return norm(Math.atan2(p.y,p.x)/DEG);
}
export function tropicalAscendant(time,latitude,longitude){
 const t=A.MakeTime(time),theta=(A.SiderealTime(t)*15+longitude)*DEG,phi=latitude*DEG;
 const rot=A.Rotation_EQD_ECT(t);
 const up=A.RotateVector(rot,new A.Vector(Math.cos(phi)*Math.cos(theta),Math.cos(phi)*Math.sin(theta),Math.sin(phi),t));
 const east=A.RotateVector(rot,new A.Vector(-Math.sin(theta),Math.cos(theta),0,t));
 let x=-up.y,y=up.x;
 if(Math.hypot(x,y)<1e-12)throw Error('この地点・時刻ではラグナを確定できません。');
 if(x*east.x+y*east.y<0){x=-x;y=-y;}
 return norm(Math.atan2(y,x)/DEG);
}
export function trueNodeLongitude(time){
 const t=A.MakeTime(time),s=A.GeoMoonState(t),rot=A.Rotation_EQJ_ECT(t);
 const r=A.RotateVector(rot,new A.Vector(s.x,s.y,s.z,t));
 const v=A.RotateVector(rot,new A.Vector(s.vx,s.vy,s.vz,t));
 const hx=r.y*v.z-r.z*v.y,hy=r.z*v.x-r.x*v.z;
 if(Math.hypot(hx,hy)<1e-16)throw Error('月の交点を計算できません。');
 return norm(Math.atan2(hx,-hy)/DEG);
}
const bodies={Su:'Sun',Mo:'Moon',Ma:'Mars',Me:'Mercury',Ju:'Jupiter',Ve:'Venus',Sa:'Saturn'};
export function compute(date,latitude,longitude){
 if(!(date instanceof Date)||!Number.isFinite(date.getTime())||!Number.isFinite(latitude)||!Number.isFinite(longitude))throw Error('計算に必要な日時・座標が不正です。');
 const t=new A.AstroTime(date),ayanamsa=lahiriAyanamsa(t),longitudes={};
 for(const [key,body] of Object.entries(bodies))longitudes[key]=norm(A.Ecliptic(A.GeoVector(body,t,true)).elon-ayanamsa);
 longitudes.Ra=norm(trueNodeLongitude(t)-ayanamsa);
 longitudes.Ke=norm(longitudes.Ra+180);
 const lagnaLongitude=norm(tropicalAscendant(t,latitude,longitude)-ayanamsa);
 if(![ayanamsa,lagnaLongitude,...Object.values(longitudes)].every(Number.isFinite))throw Error('計算結果が不正です。');
 return {jd:t.ut+2451545,ayanamsa,lagnaLongitude,longitudes};
}
export async function initialize(){return {compute};}
