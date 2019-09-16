/*
 Service worker file for Disc Golf Scoring PWA
*/

var cache_version = '1.0';
var cache_name = 'dg-pwa-' + cache_version;
var files_to_cache = [
	'/',
	'/index.html',
	'/style.css',
	'/script.js',
	'/images/icon-dg-128.png',
        '/images/icon-dg-144.png',
        '/images/icon-dg-152.png',
        '/images/icon-dg-192.png',
        '/images/icon-dg-256.png',
	'/images/icon-dg-512.png'
];

self.addEventListener('install', function(event){
	event.waitUntil(
		caches.open(cache_name).then(function(cache){
                    return cache.addAll(files_to_cache);
		}).catch(function(error){
                    console.log('Service Worker Error' + error);
                })
	);
});

self.addEventListener('activate', function(event){
    event.waitUntil(
        // Remove all old cached data from storage.
        caches.keys().then(function(keyList){
            return Promise.all(keyList.map(function(key){
                if (key != cache_name){
                    console.log('Service Worker Removing old cache', key);
                    return caches.delete(key);
                }
            }));
        })
    );
});

self.addEventListener('fetch', function(event){
    try{
        event.respondWith(
            caches.open(cache_name).then(function(cache){
                return caches.match(event.request).then(function(response){
                    return response || fetch(event.request).then(function(response){
                        cache.put(event.request, response.clone());
                        return response;
                    });
                });
            })
	);
    }catch(error){
        console.log('well, that didnt work:' + error);
    }
});