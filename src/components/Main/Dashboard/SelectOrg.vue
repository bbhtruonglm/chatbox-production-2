<template>
  <div class="flex items-center gap-3">
    <div
      v-if="orgStore.list_org?.length"
      class="w-full min-w-16 text-slate-700 relative h-full"
      ref="select_ref"
    >
      <div class="absolute right-4 top-1/2 -translate-y-2/4 z-10">
        <ArrowDownIcon
          :class="{
            'rotate-180': is_show_option,
          }"
          class="w-3 h-3 text-slate-500"
        />
      </div>
      <button
        v-show="!is_show_option"
        @click="showOption"
        class="rounded-lg w-full h-full py-2 px-3 pr-8 bg-white flex items-center text-sm gap-2.5"
      >
        <template v-if="is_allow_all && orgStore.is_selected_all_org">
          {{ $t('v1.view.main.dashboard.select_page.all_org') }}
        </template>
        <template
          v-else-if="!orgStore.is_first_select_org && is_require_select"
        >
          <span class="text-gray-400 text-sm">
            {{ $t('v1.view.main.dashboard.select_page.select_org') }}
          </span>
        </template>
        <template v-else>
          <Badge
            v-if="
              orgStore.selected_org_info?.org_package?.org_package_type !==
              'FREE'
            "
          />
          <span
            v-if="orgStore.selected_org_id"
            class="w-[inherit] text-left text-ellipsis overflow-hidden whitespace-nowrap"
          >
            {{ orgStore.selected_org_info?.org_info?.org_name }}
          </span>
          <span
            v-else="!orgStore.selected_org_id"
            class="text-gray-400 text-sm"
            >{{ $t('v1.view.main.dashboard.select_page.select_org') }}</span
          >
        </template>
      </button>
      <div
        v-show="is_show_option"
        class="w-full h-full relative"
      >
        <input
          ref="select_input_ref"
          type="text"
          class="rounded-lg w-full pl-8 pr-8 h-9 focus:outline-none text-sm"
          :placeholder="$t('v1.view.main.dashboard.select_page.select_org')"
          v-model.trim="search"
        />
        <img
          src="@/assets/icons/search.svg"
          class="absolute left-2 w-5 h-5 top-1/2 -translate-y-2/4"
        />
      </div>
      <div
        v-show="is_show_option"
        class="p-2 rounded-lg shadow-lg bg-white mt-1 h-auto max-h-52 overflow-y-auto absolute z-40 w-[-webkit-fill-available] flex flex-col gap-1"
      >
        <div
          v-if="is_allow_all"
          @click="selectAllOrg()"
          :class="{ 'bg-slate-100': orgStore.is_selected_all_org }"
          class="custom-option"
        >
          {{ $t('v1.view.main.dashboard.select_page.all_org') }}
        </div>
        <template
          v-for="org of is_filter_admin
            ? orgStore.admin_orgs
            : orgStore.list_org"
        >
          <div
            v-if="filterOrg(org)"
            @click="selectOption(org)"
            :value="org.org_id"
            :class="{
              'bg-slate-100':
                org?.org_id === orgStore.selected_org_id &&
                !orgStore.is_selected_all_org,
            }"
            class="custom-option"
          >
            <span>{{ org?.org_info?.org_name }}</span>
            <Badge v-if="org?.org_package?.org_package_type !== 'FREE'" />
          </div>
        </template>
        <!-- <span class="text-gray-400 text-sm">
          {{ $t('v1.view.main.dashboard.select_page.select_org') }}
        </span> -->
      </div>
    </div>
    <div
      v-else
      class="rounded-lg w-60 h-9 bg-white flex items-center justify-between p-3 text-sm"
    >
      <div>
        {{ $t('v1.common.loading') }}
      </div>
      <Loading />
    </div>
  </div>
</template>
<script setup lang="ts">
import { useOrgStore, usePageStore } from '@/stores'
import { getCurrentOrgInfo } from '@/service/function'
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { nonAccentVn } from '@/service/helper/format'

import Loading from '@/components/Loading.vue'
import Badge from '@/components/Main/Dashboard/SelectOrg/Badge.vue'

import ArrowDownIcon from '@/components/Icons/ArrowDown.vue'

import type { ComponentRef } from '@/service/interface/vue'
import type { OrgInfo } from '@/service/interface/app/billing'

const $props = withDefaults(
  defineProps<{
    /**có cho phép chọn tất cả tổ chức không */
    is_allow_all?: boolean
    /**bắt buộc phải chọn 1 tổ chức */
    is_require_select?: boolean
    /**chỉ hiện ra các tổ chức mà user là admin */
    is_filter_admin?: boolean
  }>(),
  {}
)

const orgStore = useOrgStore()
const pageStore = usePageStore()

/**ref tổng của select */
const select_ref = ref<ComponentRef>()
/**ref của input */
const select_input_ref = ref<ComponentRef>()
/**gắn cờ cho logic hiện danh sách lựa chọn của select */
const is_show_option = ref<boolean>()
/**giá trị của tìm kiếm */
const search = ref<string>()

// nạp dữ liệu tổ chức hiện tại khi component được mount
onMounted(getCurrentOrgInfo)
/**lắng nghe sự kiện khi click ra ngoài */
onMounted(() => document.body.addEventListener('click', clickOutSide, true))
/**lắng nghe sự kiện khi huỷ component */
onUnmounted(() => document.body.removeEventListener('click', clickOutSide))

// nạp dữ liệu tổ chức hiện tại khi load toàn bộ danh sách tổ chức
watch(() => orgStore.list_org, getCurrentOrgInfo)
// nạp lại dữ liệu tổ chức khi có sự thay đổi tổ chức được chọn
watch(
  () => orgStore.selected_org_id,
  () => {
    // reset chọn page nếu không chọn tất cả tổ chức
    if (!orgStore.is_selected_all_org) pageStore.selected_page_id_list = {}

    // nạp lại dữ liệu tổ chức
    getCurrentOrgInfo()
  }
)

/**chọn toàn bộ tổ chức */
function selectAllOrg() {
  // gán giá trị chọn toàn bộ tổ chức
  orgStore.is_selected_all_org = !orgStore.is_selected_all_org

  // ẩn danh sách option
  hideOption()
}
/**ẩn hiện org theo tìm kiếm */
function filterOrg(org: OrgInfo): boolean {
  // nếu không có giá trị tìm kiếm thì hiển thị tất cả
  if (!search.value) return true

  /**tên tổ chức */
  const NAME = nonAccentVn(org?.org_info?.org_name || '')
  /**nội dung tìm kiếm */
  const SEARCH = nonAccentVn(search.value || '')

  // nếu tên tổ chức chứa nội dung tìm kiếm thì hiển thị
  return NAME.includes(SEARCH)
}
/**sử lý sự kiện click ra ngoài */
function clickOutSide($event: MouseEvent) {
  if (
    select_ref.value == $event.target ||
    select_ref.value?.contains($event.target)
  )
    return

  hideOption()
}
/**xử lý sự kiện khi click vào một option */
function selectOption(org: OrgInfo) {
  // bỏ chọn toàn bộ tổ chức nếu đang ở chế độ cho phép chọn tất cả
  if ($props.is_allow_all) orgStore.is_selected_all_org = false

  // gán giá trị đã chọn lần đầu
  orgStore.is_first_select_org = true

  // gán tổ chức được chọn
  orgStore.selected_org_id = org?.org_id

  // xoá giá trị tìm kiếm
  search.value = ''

  // ẩn danh sách option
  hideOption()
}
/**hiển thị danh sách option */
function showOption() {
  // hiển thị danh sách option
  is_show_option.value = true

  // focus vào input
  nextTick((): void => select_input_ref.value.focus())
}
/**ẩn danh sách option */
function hideOption() {
  is_show_option.value = false
}
</script>
<style scoped lang="scss">
.custom-option {
  @apply text-sm cursor-pointer break-words whitespace-pre-line hover:bg-slate-100 rounded-md py-1.5 px-2 flex items-center gap-2.5 justify-between;
}
</style>
