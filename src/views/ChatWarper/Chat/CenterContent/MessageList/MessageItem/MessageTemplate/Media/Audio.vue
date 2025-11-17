<template>
  <div class="flex text-sm gap-2 rounded-lg shadow-md h-fit">
    <button
      @click.stop="tooglePlay()"
      class="flex-shrink-0"
    >
      <PlayIcon
        v-if="!is_playing"
        class="w-12 h-12"
      />
      <PauseIcon
        v-else
        class="w-12 h-12"
      />
    </button>
    <div class="flex flex-col w-full justify-center gap-1">
      <div
        class="bg-slate-300 mt-2 h-1 w-full cursor-pointer py-px rounded-full"
        @click.stop="skipToTime"
      >
        <div
          class="progress bg-black h-full rounded-full w-0"
          ref="progress_bar_ref"
        ></div>
      </div>
      <div>{{ current_time }} / {{ secondsToHms(audio_duration) }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { onMounted } from 'vue'
import { format as format_date, addSeconds } from 'date-fns'

import PlayIcon from '@/components/Icons/Play.vue'
import PauseIcon from '@/components/Icons/Pause.vue'

const $props = withDefaults(
  defineProps<{
    /** link đoạn ghi âm */
    src: string
  }>(),
  {}
)

/**id của interval check nhạc đã dừng hay chưa */
const interval_id = ref<number>()
/** thời gian hiện tại của đoạn ghi âm */
const current_time = ref<string>('0:00')
/** thanh hiển thị thời gian đã chơi của đoạn ghi âm */
const progress_bar_ref = ref<HTMLDivElement>()
/** đoạn ghi âm */
const audio_element = ref<HTMLAudioElement>(new Audio($props.src))
/** trạng thái đang chơi nhạc */
const is_playing = ref(false)
/** thời lượng của đoạn ghi âm */
const audio_duration = ref(0)

// lắng nghe sự kiện khi đoạn ghi âm được nạp khi component được render
onMounted(onSoundLoaded)

/**lắng nghe âm thanh được nạp */
function onSoundLoaded() {
  // lắng nghe sự kiện khi âm thanh được nạp
  audio_element.value?.addEventListener(
    'loadeddata',
    () => {
      // lưu lại thời lượng của đoạn ghi âm
      audio_duration.value = audio_element.value.duration

      // thiết lập âm lượng mặc định
      audio_element.value.volume = 1
    },
    false
  )
}
/** hiển thị thời gian đang chạy tới */
function showCurrentTime() {
  // nếu không có thanh progress_bar thì thôi
  if (!progress_bar_ref.value) return

  /** thời gian hiện tại */
  const CURRENT_TIME = audio_element.value.currentTime

  // hiển thị độ dài của thanh timeline
  progress_bar_ref.value.style.width =
    (CURRENT_TIME / audio_duration.value) * 100 + '%'

  // hiện thị thời gian hiện tại
  current_time.value = secondsToHms(CURRENT_TIME)
}
/** chuyển tới thời gian click trong timeline */
function skipToTime($event: MouseEvent) {
  /** thanh timeline */
  const PROCESS_BAR = $event.target as HTMLDivElement

  // nếu không có thanh timeline thì thôi
  if (!PROCESS_BAR) return

  /** chiều rộng của thanh timeline */
  const PROCESS_BAR_WIDTH = PROCESS_BAR.offsetWidth
  /** vị trí click */
  const CLICK_POSITION = $event.offsetX

  // tua đến vị trí click
  audio_element.value.currentTime =
    (CLICK_POSITION / PROCESS_BAR_WIDTH) * audio_duration.value

  // update hiển thị thời gian hiện tại
  showCurrentTime()
}
/** chuyển đổi trạng thái chơi nhạc và tạm dừng */
function tooglePlay() {
  // -> nếu đang chơi thì tạm dừng
  if (!audio_element.value.paused) {
    // đổi cờ trạng thái thành dừng
    is_playing.value = false

    // dừng audio
    audio_element.value.pause()

    // dừng interval theo dõi thời gian
    clearInterval(interval_id.value)

    return
  }

  // -> nếu dừng thì cho chơi

  // đổi cờ trạng thái thành chơi
  is_playing.value = true

  // chơi audio
  audio_element.value.play()

  interval_id.value = setInterval(() => {
    if (audio_element.value.ended) {
      is_playing.value = false
      audio_element.value.currentTime = 0
      clearInterval(interval_id.value)
    }
    showCurrentTime()
  }, 500)
}
/** chuyển đổi số giây -> HMS | VD: 130s -> 02:10 */
function secondsToHms(seconds: number): string {
  /**thời gian */
  const DATE = addSeconds(new Date(0), seconds)

  /**
   * định dạng thời gian
   * - nếu thời gian lớn hơn 1 giờ thì hiển thị giờ
   * - ngược lại hiển thị phút
   */
  const FORMAT = seconds >= 3600 ? 'H:mm:ss' : 'm:ss'

  // trả về thời gian đã định dạng
  return format_date(DATE, FORMAT)
}
</script>
