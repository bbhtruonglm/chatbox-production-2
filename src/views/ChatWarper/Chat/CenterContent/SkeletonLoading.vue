<template>
  <div class="h-full flex flex-col flex-grow min-w-0 gap-1">
    <div class="flex flex-col flex-grow min-h-0">
      <!-- User Info Skeleton -->
      <div
        class="h-14 flex items-center px-3 py-2 gap-3 bg-white rounded-t-lg flex-shrink-0"
      >
        <div class="w-10 h-10 rounded-oval bg-slate-200 animate-pulse"></div>
        <div class="flex flex-col gap-2">
          <div class="w-32 h-3 bg-slate-200 rounded-full animate-pulse"></div>
          <div class="w-20 h-2 bg-slate-200 rounded-full animate-pulse"></div>
        </div>
      </div>

      <!-- MessageList Skeleton -->
      <div
        class="flex-grow pt-14 pb-5 pl-2 pr-5 overflow-hidden flex flex-col justify-end gap-6 bg-[#f4f5fa] rounded-b-xl min-h-0"
      >
        <div class="flex gap-2.5">
          <div
            class="w-8 h-8 rounded-oval bg-slate-200 flex-shrink-0 animate-pulse"
          ></div>
          <div class="flex flex-col gap-1">
            <div class="w-[200px] h-10 bg-white rounded-lg animate-pulse"></div>
            <div
              class="w-[100px] h-3 bg-white rounded-full animate-pulse"
            ></div>
          </div>
        </div>

        <div class="flex gap-2.5 flex-row-reverse">
          <div
            class="w-8 h-8 rounded-oval bg-slate-200 flex-shrink-0 animate-pulse"
          ></div>
          <div class="flex flex-col gap-1 items-end">
            <div
              class="w-[240px] h-16 bg-yellow-50 rounded-lg animate-pulse"
            ></div>
            <div class="w-[80px] h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>

        <div class="flex gap-2.5">
          <div
            class="w-8 h-8 rounded-oval bg-slate-200 flex-shrink-0 animate-pulse"
          ></div>
          <div class="flex flex-col gap-1">
            <div class="w-[180px] h-14 bg-white rounded-lg animate-pulse"></div>
            <div class="w-[60px] h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-col gap-1 flex-shrink-0">
      <div class="flex gap-1">
        <div
          class="h-6 w-24 flex items-center gap-0.5 bg-white rounded-md flex-shrink-0 animate-pulse"
        ></div>
        <div
          class="h-6 w-24 flex items-center gap-0.5 bg-white rounded-md flex-shrink-0 animate-pulse"
        ></div>
        <div
          class="h-6 w-24 flex items-center gap-0.5 bg-white rounded-md flex-shrink-0 animate-pulse"
        ></div>
      </div>
      <!-- Input Chat Skeleton -->
      <div class="flex flex-col gap-1 transition-all">
        <div class="bg-white rounded-3xl h-12 w-full animate-pulse"></div>
      </div>
    </div>
  </div>
</template>
