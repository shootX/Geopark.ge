<!DOCTYPE html>
<html lang="ka">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name') }} — ვებ ვერსია</title>
    @fonts
    @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @endif
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin="">
</head>
<body class="bg-[#F5F5F4] text-[#1c1917] min-h-screen antialiased flex flex-col">
    <header class="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between gap-4 shadow-sm shrink-0">
        <div class="flex items-center gap-2">
            <span class="text-xl font-semibold tracking-tight text-[#ea580c]">{{ config('app.name') }}</span>
            <span class="hidden sm:inline text-sm text-stone-500">პარკინგები რუკაზე</span>
        </div>
        <button type="button" id="btn-refresh" class="text-sm px-3 py-1.5 rounded-md bg-stone-900 text-white hover:bg-stone-800 transition-colors">
            განახლება
        </button>
    </header>

    <main class="flex-1 flex flex-col lg:flex-row min-h-0">
        <div id="map" class="h-[42vh] lg:h-auto lg:flex-1 min-h-[240px] z-0"></div>
        <aside class="w-full lg:w-[22rem] xl:w-[26rem] bg-white border-t lg:border-t-0 lg:border-l border-stone-200 flex flex-col max-h-[58vh] lg:max-h-none lg:h-auto shrink-0">
            <div class="p-3 border-b border-stone-100 text-sm text-stone-600" id="list-meta">იტვირთება…</div>
            <div id="list" class="overflow-y-auto flex-1 p-2 space-y-2"></div>
        </aside>
    </main>

    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>
    <script>
(function () {
    const apiBase = '{{ url('/api/v1') }}';
    const defaultCenter = [41.7151, 44.8271];
    const map = L.map('map', { scrollWheelZoom: true }).setView(defaultCenter, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap',
    }).addTo(map);
    const markers = L.layerGroup().addTo(map);
    const listEl = document.getElementById('list');
    const metaEl = document.getElementById('list-meta');

    function esc(s) {
        const d = document.createElement('div');
        d.textContent = s == null ? '' : String(s);
        return d.innerHTML;
    }

    async function loadParkings() {
        metaEl.textContent = 'იტვირთება…';
        listEl.innerHTML = '';
        markers.clearLayers();

        let all = [];
        let page = 1;
        let lastPage = 1;
        try {
            do {
                const url = apiBase + '/parkings?per_page=50&page=' + page;
                const res = await fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
                const json = await res.json();
                if (!json.success || !json.data) throw new Error(json.message || 'უცნობი შეცდომა');
                const chunk = json.data.parkings || [];
                const meta = json.data.meta || {};
                lastPage = meta.last_page || 1;
                all = all.concat(chunk);
                page++;
            } while (page <= lastPage);

            metaEl.textContent = all.length
                ? 'ნაპოვნია ' + all.length + ' სადგომი'
                : 'მონაცემები ჯერ არ არის — დაამატეთ სადგომები ან გაუშვით seeder';

            if (all.length === 0) {
                listEl.innerHTML = '<p class="text-sm text-stone-500 p-3">სია ცარიელია.</p>';
                return;
            }

            const bounds = [];
            all.forEach(function (p) {
                const lat = Number(p.latitude);
                const lng = Number(p.longitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
                bounds.push([lat, lng]);

                const title = esc(p.title || 'სადგომი');
                const addr = esc(p.address || '');
                const slots = esc(String(p.available_slots ?? '—')) + ' / ' + esc(String(p.total_slots ?? '—'));
                const price = esc(String(p.base_price ?? '—')) + ' ₾';

                const m = L.marker([lat, lng]).bindPopup(
                    '<strong>' + title + '</strong><br>' + addr + '<br>თავისუფალი: ' + slots + '<br>საბაზისო: ' + price
                );
                m.on('click', function () {
                    document.getElementById('card-' + p.id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
                markers.addLayer(m);

                const card = document.createElement('article');
                card.id = 'card-' + p.id;
                card.className = 'rounded-lg border border-stone-200 p-3 hover:border-orange-300 transition-colors cursor-pointer bg-stone-50/80';
                card.innerHTML =
                    '<h2 class="font-medium text-stone-900 text-sm">' + title + '</h2>' +
                    '<p class="text-xs text-stone-600 mt-1">' + addr + '</p>' +
                    '<p class="text-xs text-stone-500 mt-2">თავისუფალი ადგილები: ' + slots + ' · ფასი: ' + price + '</p>';
                card.addEventListener('click', function () {
                    map.setView([lat, lng], Math.max(map.getZoom(), 15));
                    m.openPopup();
                });
                listEl.appendChild(card);
            });

            if (bounds.length) map.fitBounds(bounds, { padding: [36, 36], maxZoom: 15 });
        } catch (e) {
            metaEl.textContent = 'შეცდომა ჩატვირთვისას';
            listEl.innerHTML = '<p class="text-sm text-red-600 p-3">' + esc(e.message) + '</p>';
        }
    }

    document.getElementById('btn-refresh').addEventListener('click', loadParkings);
    loadParkings();
})();
    </script>
</body>
</html>
