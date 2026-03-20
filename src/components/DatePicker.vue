<template>
    <div class="bg-white p-2 text-[13px]">
        <div class="grid grid-cols-2 gap-4">
            <div class="flex items-center justify-between">
                <div @click="changeDate('MONTH', 'MINUS')" class="hover:bg-slate-100 rounded py-2 cursor-pointer w-[30px]"><img class="mx-auto"
                        src="@/assets/icons/arrow-left.svg" width="7" height="7" />
                </div>
                <div class="font-medium text-center">
                    {{ $t('v1.view.datepicker.month') }}
                    {{ current_month + 1 }}
                </div>
                <div @click="changeDate('MONTH', 'ADD')" class="hover:bg-slate-100 rounded py-2 cursor-pointer w-[30px]"><img class="mx-auto"
                        src="@/assets/icons/arrow-right.svg" width="7" height="7" />
                </div>
            </div>
            <div class="flex items-center justify-between">
                <div @click="changeDate('YEAR', 'MINUS')" class="hover:bg-slate-100 rounded py-2 cursor-pointer w-[30px]"><img class="mx-auto"
                        src="@/assets/icons/arrow-left.svg" width="7" height="7" />
                </div>
                <div class="font-medium text-center">
                    {{ $t('v1.view.datepicker.year') }}
                    {{ current_year }}
                </div>
                <div @click="changeDate('YEAR', 'ADD')" class="hover:bg-slate-100 rounded py-2 cursor-pointer w-[30px]"><img class="mx-auto"
                        src="@/assets/icons/arrow-right.svg" width="7" height="7" />
                </div>
            </div>
        </div>
        <div class="mt-2 grid grid-cols-7">
            <div v-for="day of 7" :class="[1, 7].includes(day) ? 'text-orange-600' : 'text-slate-500'" class="text-center">
                {{ $t(`v1.view.datepicker.day.${day - 1}`) }}
            </div>
        </div>
        <div v-for="(value, index_row) of TOTAL_ROW" class="grid grid-cols-7">
            <div @click="selectThisDate(getDayInfo(index_row, index_col))" v-for="(day, index_col) of TOTAL_COL"
                :class="getDayInfo(index_row, index_col)?.index_month === 0 ? 'font-medium' : 'text-slate-300'"
                class="text-center flex justify-center">
                <div :class="{
                    'text-orange-600': isToday(getDayInfo(index_row, index_col)?.timestamp),
                    '!bg-orange-600 text-white': select_date.year === getDayInfo(index_row, index_col)?.year && select_date.month === getDayInfo(index_row, index_col)?.month && select_date.date === getDayInfo(index_row, index_col)?.date,
                    'hover:bg-orange-600 hover:text-white cursor-pointer': !max || getDayInfo(index_row, index_col)?.timestamp < max,
                    'text-slate-400 cursor-not-allowed': (max && getDayInfo(index_row, index_col)?.timestamp >= max) || (min && getDayInfo(index_row, index_col)?.timestamp < min),
                    'bg-orange-100': (modelValue && min_another_range && getDayInfo(index_row, index_col)?.timestamp < modelValue && getDayInfo(index_row, index_col)?.timestamp > min_another_range) || (modelValue && max_another_range && getDayInfo(index_row, index_col)?.timestamp > modelValue && getDayInfo(index_row, index_col)?.timestamp <  max_another_range)
                }" class="w-[18px] h-[18px] rounded-full flex justify-center items-center">
                    {{ getDayInfo(index_row, index_col)?.date }}
                </div>
            </div>
        </div>
        <div class="flex justify-center">
            <select @change="changeTime" v-model="select_date.hour">
                <option v-for="i of 25" :value="i - 1">
                    {{ i - 1 }}
                    {{ $t('v1.view.datepicker.hour') }}
                </option>
            </select>
            <div class="mx-1">:</div>
            <select @change="changeTime" v-model="select_date.minute">
                <option v-for="i of 60" :value="i - 1">
                    {{ i - 1 }}
                    {{ $t('v1.view.datepicker.minute') }}
                </option>
            </select>
        </div>
    </div>
</template>
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { isToday } from 'date-fns'

/**Thông tin của 1 ngày trong bảng lịch */
interface ADayInfo {
    /**ngày chính xác trên lịch */
    date: number
    /**tháng chính xác trên lịch */
    month: number
    /**năm chính xác trên lịch */
    year: number
    /**ngày trong tuần */
    day: number
    /**độ lệch của tháng của ngày này so với tháng hiện tại */
    index_month: -1 | 0 | 1
    /**mốc thời gian ở lúc 00:00 */
    timestamp: number
    /**vị trí của hàng trên lịch */
    index_row: number
    /**vị trí của cột trên lịch */
    index_col: number
}

const $emit = defineEmits(['update:modelValue'])

const $props = withDefaults(defineProps<{
    /**giá trị của v-model được truyền vào dưới dạng timestamp */
    modelValue?: number
    /**giá trị thời gian tối đa data có thể chọn được */
    max?: number
    /**giá trị thời gian tối thiểu data có thể chọn được */
    min?: number

    /**
     * 2 giá trị dưới đây chỉ được prop 1, sử dụng khi làm time range
     */
    /**giá trị của range min => range hiện tại là max */
    min_another_range?: number
    /**giá trị của range max => đang là range min */
    max_another_range?: number
}>(), {})

/**tổng số hàng của lịch */
const TOTAL_ROW = 6
/**tổng số cột của lịch */
const TOTAL_COL = 7
/**tháng được chọn */
const current_month = ref(5)
/**năm được chọn */
const current_year = ref(2023)
/**danh sách các ngày trên lịch */
const day_list = ref<{
    [index: string]: ADayInfo
}>({})

/**computed v-model truyền vào, và format dữ liệu thành dạng có thể xử dụng được */
const select_date = computed<{
    /**mốc thời gan chính xác được chọn trên lịch */
    timestamp: number
    /**ngày được chọn */
    date: number
    /**tháng được chọn */
    month: number
    /**năm được chọn */
    year: number
    /**giờ được chọn */
    hour: number
    /**phút được chọn */
    minute: number
}>({
    // parser v-model thành giá trị date
    get() {
        // nếu không tồn tại thì chọn ngày hôm nay
        if (!$props.modelValue) return getDateInfo()

        return getDateInfo($props.modelValue)
    },
    // khi có thay đổi thì emit ra v-model bên ngoài
    set(val) {
        $emit('update:modelValue', val.timestamp)
    }
})

// theo dõi sự thay đổi của v-model bên ngoài, để update lại tháng, năm và bảng lịch hiện tại
watch(() => select_date.value.timestamp, () => calcMonthYear())

// update lại tháng, năm và bảng lịch hiện tại theo v-modal init
onMounted(() => calcMonthYear())

/**tính toán tháng và năm được chọn dựa trên v-model truyền vào */
function calcMonthYear() {
    const THIS_DATE = new Date(select_date.value.timestamp)

    const THIS_MONTH = new Date(THIS_DATE).getMonth()
    const THIS_YEAR = new Date(THIS_DATE).getFullYear()

    // khi giá trị v-model thay đổi thì ghi đè lại tháng và năm
    current_month.value = THIS_MONTH
    current_year.value = THIS_YEAR

    // vẽ lịch
    createDayOfMonth()
}
/**thay đổi giờ phút của lịch */
function changeTime() {
    // mốc thời gian chính xác
    const TIMESTAMP = new Date(
        select_date.value.year,
        select_date.value.month,
        select_date.value.date,
        select_date.value.hour,
        select_date.value.minute
    ).getTime()

    // ghi đè lại toàn bộ để chạy computed set
    select_date.value = {
        timestamp: TIMESTAMP,
        date: select_date.value.date,
        month: select_date.value.month,
        year: select_date.value.year,
        hour: select_date.value.hour,
        minute: select_date.value.minute
    }
}
/**chọn ngày trong lịch */
function selectThisDate(time_info: ADayInfo) {
    // nếu quá limit thì không cho chọn thời gian
    if ($props.max && time_info.timestamp >= $props.max) return

    // nếu quá limit min thì không cho chọn thời gian
    if($props.min && time_info.timestamp < $props.min) return

    /**
     * tính toán thời gian được chọn + giờ được chọn để trả về kết quả cuối cùng
     */
    // giờ được chọn - đã format
    const HOUR = Number(select_date.value.hour)
    // phút được chọn - đã format
    const MINUTE = Number(select_date.value.minute)

    // mốc thời gian chính xác
    const TIMESTAMP = new Date(
        time_info.year,
        time_info.month,
        time_info.date,
        HOUR,
        MINUTE,
        // nếu là time range, và là range cuối, thì set số giây và mili giây ở mức cao nhất
        $props.min_another_range ? 59 : 0,
        $props.min_another_range ? 999 : 0,
    ).getTime()

    // chọn thời gian
    select_date.value = {
        year: time_info.year,
        month: time_info.month,
        date: time_info.date,
        hour: HOUR,
        minute: MINUTE,
        timestamp: TIMESTAMP
    }
}
/**parser date thành giá trị để sử dụng */
function getDateInfo(value?: number) {
    const CURRENT_TIME = value ? new Date(value) : new Date()

    return {
        timestamp: CURRENT_TIME.getTime(),
        date: CURRENT_TIME.getDate(),
        month: CURRENT_TIME.getMonth(),
        year: CURRENT_TIME.getFullYear(),
        hour: CURRENT_TIME.getHours(),
        minute: CURRENT_TIME.getMinutes()
    }
}
/**thay đổi tháng, năm */
function changeDate(object: 'MONTH' | 'YEAR', action: 'ADD' | 'MINUS') {
    if (object === 'MONTH') {
        if (action === 'ADD') current_month.value++
        if (action === 'MINUS') current_month.value--

        // nếu tháng lớn hơn 12
        if (current_month.value > 11) {
          current_month.value = 0
          current_year.value++
        }

        // nếu tháng nhỏ hơn 1
        if (current_month.value < 0) {
          current_month.value = 11
          current_year.value--
        }
    }

    if (object === 'YEAR') {
        if (action === 'ADD') current_year.value++
        if (action === 'MINUS') current_year.value--
    }

    createDayOfMonth()
}
/**lấy dữ liệu của 1 ngày trong bảng lịch */
function getDayInfo(index_row: number, index_col: number) {
    return day_list.value?.[`${index_row}_${index_col}`]
}
/**tính toán xem ngày đầu tiên trong tháng là thứ mấy trong tuần */
function getStartDayOfMonth(year: number, month: number) {
    return new Date(year, month).getDay()
}
/**tính toán xem tháng có bao nhiêu ngày */
function countDayOfMonth(year: number, month: number) {
    const PICK_NUMBER = 40

    return PICK_NUMBER - new Date(year, month, PICK_NUMBER).getDate()
}
// tính toán index của ngày trên bảng lịch 7x6 (0 -> 41)
function getCalendarIndex(index_row: number, index_col: number) {
    return Number(index_row) * 7 + Number(index_col)
}
/**tính toán ra thông tin của 1 ngày trong bảng lịch */
function createDayInfo(
    index_row: number,
    index_col: number,
    count_day_of_month: number,
    start_day_of_month: number
) {
    // tính toán index của ngày trên bảng lịch 7x6 (0 -> 41)
    const INDEX = getCalendarIndex(index_row, index_col)

    /**
     * tính ra ngày chưa chính xác bằng cachs lấy vị trí trong bảng trừ đi tổng 
     * số ngày trong tháng
     */
    const FAKE_DATE = INDEX - start_day_of_month

    // tính toán xem ngày này thuộc thứ mấy bằng cách lấy phần dư của 7
    const DAY_OF_WEEK = INDEX % 7

    // -1 để lấy giá trị của tháng trước
    let pre_month = current_month.value - 1

    // gán giá trị năm trước = năm nay
    let pre_year = current_year.value

    // nếu tháng trước nhỏ hơn 0
    if (pre_month < 0) {
        // tháng trước bằng tháng cuối của năm trước
        pre_month = 11
        // giảm năm đi 1
        pre_year--
    }

    // tính tổng số ngày của tháng trước
    const COUNT_DAY_PRE_MONTH = countDayOfMonth(pre_year, pre_month)

    /**
     * tính toán ngày chính xác trong lịch
     * - nếu fake_date < 0 -> ngày này của tháng trước
     *      => ngày thực tế = tổng số ngày tháng trước + fake_date (số âm)
     * - nếu fake_date >= 0 -> ngày này của tháng hiện tại hoặc tháng sau
     *      => ngày thưc tế =  số dư của fake_date và tổng số ngày hiện tại
     * 
     * - cộng 1 của kết quả để ra ngày chính xác
     */
    const REAL_DATE = (
        FAKE_DATE < 0 ?
            COUNT_DAY_PRE_MONTH + FAKE_DATE :
            FAKE_DATE % count_day_of_month
    ) + 1

    /**
     * tính toán vị trí của tháng của ngày hiện tại
     * -1: tháng trước
     * 0: tháng hiện tại
     * 1: tháng sau
     * 
     * nếu fake_date < 0 -> là tháng trước
     * nếu fake_date > tổng số ngày trong tháng -> là tháng sau
     * còn lại là trong tháng này
     */
    const INDEX_MONTH = FAKE_DATE < 0 ? -1 : FAKE_DATE >= count_day_of_month ? 1 : 0

    /**tính toán tháng chính xác của ngày này */
    let month = current_month.value + INDEX_MONTH
    /**tính toán năm chính xác của ngày này */
    let year = current_year.value

    // nếu tháng bị âm là tháng 11 của năm trước
    if (month < 0) {
        month = 11
        year--
    }
    // nếu tháng quá 11 là tháng 1 của năm sau
    if (month > 11) {
        month = 0
        year++
    }

    // tính toán mốc thời gian ở 0:0:0 của ngày này
    const TIMESTAMP = new Date(
        year,
        month,
        REAL_DATE,
    ).getTime()

    day_list.value[`${index_row}_${index_col}`] = {
        date: REAL_DATE,
        month,
        year,
        day: DAY_OF_WEEK,
        index_month: INDEX_MONTH,
        timestamp: TIMESTAMP,
        index_row,
        index_col
    }
}
/**tính toán thông tin của các ngày trong bảng lịch */
function createDayOfMonth() {
    // reset danh sách các ngày trong bảng lịch
    day_list.value = {}

    // tính toán ngày đầu tiên của tháng thuộc thứ mấy
    const START_DAY_OF_MONTH = getStartDayOfMonth(
        current_year.value,
        current_month.value
    )
    // đếm tổng số ngày trong tháng
    const COUNT_DAY_OF_MONTH = countDayOfMonth(
        current_year.value,
        current_month.value
    )

    // vẽ bảng lịch 7 cột 6 hàng
    for (let index_row = 0; index_row < TOTAL_ROW; index_row++)
        for (let index_col = 0; index_col < TOTAL_COL; index_col++)
            createDayInfo(
                index_row,
                index_col,
                COUNT_DAY_OF_MONTH,
                START_DAY_OF_MONTH
            )
}
</script>