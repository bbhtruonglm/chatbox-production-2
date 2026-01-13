<template>
  <div
    class="w-[400px] flex-shrink-0 h-full flex flex-col gap-2 overflow-hidden"
  >
    <div
      v-for="i in 3"
      :key="i"
      class="rounded-lg bg-white overflow-hidden flex-shrink-0 flex flex-col border border-slate-100"
    >
      <div
        class="w-full py-2.5 px-3 flex items-center justify-between bg-white border-b border-slate-50"
      >
        <div class="w-32 h-4 bg-slate-200 rounded-full animate-pulse"></div>
        <div class="flex gap-3">
          <div class="w-5 h-5 bg-slate-200 rounded-full animate-pulse"></div>
          <div class="w-4 h-4 bg-slate-200 rounded-full animate-pulse"></div>
        </div>
      </div>
      <div class="w-full h-[300px] bg-slate-50 animate-pulse"></div>
    </div>
  </div>
</template>
