import {createInterface} from 'node:readline';
const lines=createInterface({input:process.stdin});
lines.on('line',line=>{const request=JSON.parse(line);process.stdout.write(JSON.stringify({id:request.id,ok:true,result:{connected:false,backupDir:process.env.MINI_KEYBOARD_BACKUP_DIR,command:request.command}})+'\n');});
lines.on('close',()=>setTimeout(()=>process.exit(0),Number(process.argv[2]||75)));
