self.addEventListener('push',event=>{
 let data;try{data=event.data.json();}catch{data={};}
 event.waitUntil(self.registration.showNotification(data.title||'Abspann Kinoalarm',{body:data.body||'Ein neuer Kinotermin wurde gefunden.',tag:data.tag||'abspann',icon:'/watchlist/icon.svg',data:{url:'/watchlist/'}}));
});
self.addEventListener('notificationclick',event=>{event.notification.close();event.waitUntil(clients.openWindow('/watchlist/'));});
