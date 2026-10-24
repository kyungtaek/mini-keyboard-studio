// Only presence information crosses this event channel; device data stays in explicit requests.
export function connectionView(status={}){
 const state=['connected','disconnected','unknown'].includes(status.connectionState)?status.connectionState:status.connected?'connected':'disconnected';
 return {connected:status.connected===true&&state==='connected',connectionState:state,
  connectionRevision:Number.isSafeInteger(status.connectionRevision)&&status.connectionRevision>=0?status.connectionRevision:0,
  connectionError:typeof status.connectionError==='string'?status.connectionError.slice(0,256):null};
}
