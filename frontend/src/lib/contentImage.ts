const allowed=['image/jpeg','image/png','image/webp'];
export async function prepareContentImage(file:File,diagram=false){
  if(!allowed.includes(file.type))throw new Error('Choose a JPG, PNG or WebP image. SVG is not accepted.');
  if(file.size>20*1024*1024)throw new Error('Choose an image under 20 MB.');
  const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
  try{const max=diagram?2600:2000,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Image processing is unavailable.');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);const type=diagram&&file.type==='image/png'?'image/png':'image/webp';const blob=await new Promise<Blob|null>(resolve=>canvas.toBlob(resolve,type,diagram?0.95:0.86));if(!blob)throw new Error('Could not optimize this image.');return new File([blob],file.name.replace(/\.[^.]+$/,type==='image/png'?'.png':'.webp'),{type});}finally{bitmap.close()}
}
