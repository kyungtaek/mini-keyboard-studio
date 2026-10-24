export function publicPath(pathname){
 let decoded;try{decoded=decodeURIComponent(pathname);}catch{throw Error('Not found');}
 const segments=decoded.split('/');
 if(segments.some(x=>x==='.'||x==='..')||/[\\\0]/.test(decoded))throw Error('Not found');
 const name=decoded.replace(/^\//,'')||'index.html';
 if(name!=='index.html'&&!['src/','presets/','data/shortcuts/'].some(p=>name.startsWith(p)))throw Error('Not found');
 return name;
}
