// Service Worker para IA-JW-Talks
// Gerencia notificações push e cache offline

const CACHE_NAME = 'ia-jw-talks-v2.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/login.html',
    '/cadastro.html',
    '/admin.html',
    '/style.css',
    '/auth.css',
    '/home.css',
    '/utils.css',
    '/script.js',
    '/auth.js',
    '/firebase-init.js'
];

// Instalação do Service Worker
self.addEventListener('install', event => {
    console.log('Service Worker instalando...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Cache aberto');
                return cache.addAll(urlsToCache);
            })
            .catch(error => {
                console.error('Erro ao instalar cache:', error);
            })
    );
});

// Ativação do Service Worker
self.addEventListener('activate', event => {
    console.log('Service Worker ativando...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Removendo cache antigo:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Interceptação de requisições
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Retorna do cache se disponível
                if (response) {
                    return response;
                }
                
                // Se não estiver no cache, busca da rede
                return fetch(event.request)
                    .then(response => {
                        // Verifica se a resposta é válida
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clona a resposta para salvar no cache
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch(() => {
                        // Fallback para páginas HTML
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// Gerenciamento de notificações push
self.addEventListener('push', event => {
    console.log('Notificação push recebida:', event);
    
    let notificationData = {
        title: 'IA-JW-Talks',
        body: 'Você tem uma nova notificação!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        data: {
            url: '/'
        }
    };
    
    if (event.data) {
        try {
            const data = event.data.json();
            notificationData = {
                ...notificationData,
                ...data
            };
        } catch (error) {
            console.error('Erro ao processar dados da notificação:', error);
        }
    }
    
    const options = {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        data: notificationData.data,
        actions: [
            {
                action: 'open',
                title: 'Abrir',
                icon: '/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Fechar',
                icon: '/icon-192x192.png'
            }
        ],
        requireInteraction: true,
        silent: false,
        tag: 'ia-jw-talks-notification'
    };
    
    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Clique em notificação
self.addEventListener('notificationclick', event => {
    console.log('Notificação clicada:', event);
    
    event.notification.close();
    
    if (event.action === 'close') {
        return;
    }
    
    const urlToOpen = event.notification.data?.url || '/';
    
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(windowClients => {
            // Verifica se já existe uma janela aberta
            for (let i = 0; i < windowClients.length; i++) {
                const client = windowClients[i];
                if (client.url.includes(urlToOpen) && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Se não existe, abre uma nova janela
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

// Fechamento de notificação
self.addEventListener('notificationclose', event => {
    console.log('Notificação fechada:', event);
    
    // Registra o fechamento da notificação
    event.waitUntil(
        fetch('/api/notification-closed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                notificationId: event.notification.tag,
                timestamp: new Date().toISOString()
            })
        }).catch(error => {
            console.error('Erro ao registrar fechamento da notificação:', error);
        })
    );
});

// Sincronização em background
self.addEventListener('sync', event => {
    console.log('Sincronização em background:', event);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(
            syncData()
        );
    }
});

async function syncData() {
    try {
        // Sincroniza dados offline quando a conexão for restaurada
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();
        
        for (const request of requests) {
            if (request.url.includes('/api/')) {
                // Reenvia requisições da API que falharam
                try {
                    const response = await fetch(request);
                    if (response.ok) {
                        await cache.delete(request);
                    }
                } catch (error) {
                    console.error('Erro ao sincronizar:', error);
                }
            }
        }
    } catch (error) {
        console.error('Erro na sincronização em background:', error);
    }
}

// Mensagens do cliente
self.addEventListener('message', event => {
    console.log('Mensagem recebida no Service Worker:', event);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({
            version: CACHE_NAME,
            timestamp: new Date().toISOString()
        });
    }
});

// Tratamento de erros
self.addEventListener('error', event => {
    console.error('Erro no Service Worker:', event);
});

self.addEventListener('unhandledrejection', event => {
    console.error('Promise rejeitada no Service Worker:', event);
}); 