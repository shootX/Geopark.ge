<!DOCTYPE html>
<html lang="ka">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ config('app.name', 'Geopark') }}</title>
        @fonts
        @if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot')))
            @vite(['resources/css/app.css', 'resources/js/app.js'])
        @else
            <style>
                body { font-family: system-ui, sans-serif; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
                    background: #fdfdfc; color: #1b1b18; }
                .card { max-width: 36rem; padding: 2rem; background: #fff; border-radius: 0.5rem;
                    box-shadow: inset 0 0 0 1px rgba(26,26,0,0.16); }
                h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 0.5rem; }
                p { color: #706f6c; font-size: 0.875rem; line-height: 1.5; margin: 0 0 1rem; }
                ul { list-style: none; padding: 0; margin: 0 0 1rem; }
                li { font-size: 0.875rem; padding: 0.35rem 0; border-bottom: 1px solid #e3e3e0; }
                li:last-child { border-bottom: none; }
                a { color: #f53003; font-weight: 500; }
                .btn { display: inline-block; margin-top: 0.5rem; padding: 0.5rem 1rem; background: #1b1b18; color: #fff;
                    border-radius: 0.25rem; text-decoration: none; font-size: 0.875rem; }
                .btn:hover { background: #000; }
                .muted { font-size: 0.75rem; color: #706f6c; margin-top: 1.25rem; }
            </style>
        @endif
    </head>
    <body class="@if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot'))) bg-[#FDFDFC] dark:bg-[#0a0a0a] text-[#1b1b18] dark:text-[#EDEDEC] min-h-screen flex items-center justify-center p-6 antialiased @endif">
        <main class="@if (file_exists(public_path('build/manifest.json')) || file_exists(public_path('hot'))) max-w-lg w-full rounded-lg bg-white dark:bg-[#161615] shadow-[inset_0px_0px_0px_1px_rgba(26,26,0,0.16)] dark:shadow-[inset_0px_0px_0px_1px_#fffaed2d] p-8 lg:p-10 @else card @endif">
            <div class="flex items-start gap-4 mb-6">
                <div class="shrink-0 text-[#F53003] dark:text-[#FF4433]" aria-hidden="true">
                    <svg viewBox="0 0 64 64" class="w-14 h-14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 8h28l12 12v28a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6V14a6 6 0 0 1 6-6z" stroke="currentColor" stroke-width="3" fill="none"/>
                        <path d="M40 8v12h12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                        <text x="22" y="46" fill="currentColor" font-size="22" font-weight="700" font-family="system-ui,sans-serif">P</text>
                    </svg>
                </div>
                <div>
                    <h1 class="text-lg font-semibold m-0">{{ config('app.name') }}</h1>
                    <p class="text-sm text-[#706f6c] dark:text-[#A1A09A] mt-1 mb-0 leading-normal">
                        პარკინგების სერვისი მუშაობს ამ დომენზე. მომხმარებლის სრული ინტერფეისი უნდა იყოს მობილური/ვებ აპი, რომელიც იძახებს REST API-ს.
                    </p>
                </div>
            </div>

            <p class="text-[13px] text-[#706f6c] dark:text-[#A1A09A] mb-3">სასარგებლო ბმულები:</p>
            <ul class="space-y-2 text-[13px] m-0 p-0 list-none">
                <li class="flex flex-wrap items-baseline gap-x-2 border-b border-[#e3e3e0] dark:border-[#3E3E3A] pb-2">
                    <span class="text-[#1b1b18] dark:text-[#EDEDEC]">სტატუსი</span>
                    <a href="{{ url('/health') }}" class="font-medium underline underline-offset-2 text-[#f53003] dark:text-[#FF4433]">/health</a>
                </li>
                <li class="flex flex-wrap items-baseline gap-x-2 border-b border-[#e3e3e0] dark:border-[#3E3E3A] pb-2 pt-1">
                    <span class="text-[#1b1b18] dark:text-[#EDEDEC]">საჯარო სადგომები (JSON)</span>
                    <a href="{{ url('/api/v1/parkings') }}" class="font-medium underline underline-offset-2 text-[#f53003] dark:text-[#FF4433] break-all">/api/v1/parkings</a>
                </li>
                <li class="flex flex-wrap items-baseline gap-x-2 pt-1">
                    <span class="text-[#1b1b18] dark:text-[#EDEDEC]">API პრეფიქსი</span>
                    <code class="text-xs bg-[#FDFDFC] dark:bg-[#0a0a0a] px-1.5 py-0.5 rounded border border-[#e3e3e0] dark:border-[#3E3E3A]">/api/v1</code>
                </li>
            </ul>

            <a href="{{ url('/health') }}" class="inline-block mt-6 px-5 py-2 bg-[#1b1b18] dark:bg-[#eeeeec] dark:text-[#1C1C1A] rounded-sm text-sm text-white dark:border dark:border-[#eeeeec] hover:opacity-90">
                შემოწმება
            </a>

            <p class="mt-8 text-[12px] text-[#706f6c] dark:text-[#A1A09A]">
                Laravel {{ app()->version() }} · API v1
            </p>
        </main>
    </body>
</html>
