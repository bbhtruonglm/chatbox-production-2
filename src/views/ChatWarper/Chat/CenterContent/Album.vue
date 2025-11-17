<template>
  <Modal
    ref="album_ref"
    class_modal="h-[85dvh]"
    class_body="flex gap-2"
  >
    <template #header>
      {{ $t('v1.view.main.dashboard.chat.album.title') }}
    </template>
    <template #body>
      <div
        class="w-[65dvw] bg-white rounded-lg p-2 flex flex-col relative gap-2"
      >
        <div class="absolute top-8 left-[50%] translate-x-[-50%]">
          <Loading v-if="is_loading" />
        </div>
        <div class="flex justify-between">
          <div class="flex flex-shrink-0 p-1 rounded-md bg-gray-100 w-fit">
            <button
              @click="selectCategory('NEW')"
              :class="{ 'bg-white': selected_category === 'NEW' }"
              class="font-medium text-xs py-1 px-4 rounded"
            >
              {{ $t('v1.view.main.dashboard.chat.album.category.new') }}
            </button>
            <button
              @click="selectCategory('FOLDER')"
              :class="{ 'bg-white': selected_category === 'FOLDER' }"
              class="font-medium text-xs py-1 px-4 rounded"
            >
              {{ $t('v1.view.main.dashboard.chat.album.category.folder') }}
            </button>
          </div>

          <input
            v-model="search_text"
            @input="handleInput"
            class="border rounded-lg px-3 py-1 text-sm"
            :placeholder="$t('v1.view.main.dashboard.chat.album.search')"
          />

          <div class="flex gap-2 items-center text-sm">
            {{
              $t(
                'v1.view.main.dashboard.chat.album.select_album_from_other_page'
              )
            }}

            <button
              v-tooltip="$t('Lấy danh sách album từ trang khác')"
              @click="modal_change_album_ref?.toggleModal"
            >
              <ChangeIcon
                v-if="
                  page_id === conversationStore.select_conversation?.fb_page_id
                "
                class="size-4 text-black m-0.5"
              />
              <PageAvatar
                v-else
                :page_info="
                  orgStore.list_os?.find(item => item.page_id === page_id)
                    ?.page_info
                "
                class="size-5"
              />
            </button>
          </div>
        </div>
        <div class="flex flex-shrink-0">
          <div
            class="w-full flex justify-between"
            v-if="selected_category === 'NEW' || selected_folder_id"
          >
            <div class="flex items-center">
              <button
                v-if="selected_folder_id"
                class="flex gap-2 items-center text-sm font-medium"
                @click="selectCategory('FOLDER')"
              >
                <ArrowLeftIcon class="size-4" />
                {{ selected_folder?.title }}
              </button>
            </div>
            <div class="flex gap-2 items-center">
              <button
                class="bg-red-100 p-2 rounded-md"
                v-tooltip="$t('v1.common.delete')"
                @click="confirmDeleteFile()"
                :class="{
                  invisible: !countSelectFile(),
                }"
              >
                <TrashIcon class="w-5 h-5 text-red-500 cursor-pointer" />
              </button>

              <button
                @click="selectAllFile(false)"
                class="custom-btn bg-slate-300 !text-black font-medium"
                :class="{
                  invisible: !countSelectFile(),
                }"
              >
                {{ $t('v1.common.deselect') }}
              </button>

              <label
                v-if="file_list?.length"
                class="font-medium flex items-center cursor-pointer gap-1 bg-blue-100 py-1.5 px-3 rounded-md text-blue-700"
              >
                <Checkbox
                  v-model="is_select_all"
                  :checkbox_class="'checked:!bg-blue-700 !border-blue-700'"
                />
                <span>{{
                  $t('v1.view.main.dashboard.chat.album.select_all')
                }}</span>
              </label>
              <button
                @click="uploadFileFromDevice"
                class="custom-btn bg-blue-700"
              >
                <ArrowUpIcon class="w-4 h-4" />
                {{ $t('v1.common.upload') }}
              </button>
            </div>
          </div>
          <div
            class="w-full flex justify-end"
            v-else
          >
            <button
              @click="createFolder"
              class="custom-btn bg-blue-700"
            >
              <PlusCircleIcon class="w-4 h-4" />
              {{ $t('v1.view.main.dashboard.chat.album.create_folder') }}
            </button>
          </div>
        </div>
        <!-- @scroll="loadMore" -->
        <div
          class="flex-grow overflow-y-auto grid content-start gap-3"
          :class="{
            'grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7':
              selected_category === 'FOLDER',
            'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6':
              selected_category === 'NEW',
          }"
        >
          <div
            v-for="folder of folder_list"
            @click="selectFolder(folder)"
            :class="{ 'border-blue-700': folder._id === selected_folder?._id }"
            class="w-full overflow-hidden relative cursor-pointer border-[3px] rounded-xl flex flex-col group items-center"
          >
            <div
              @click.stop="$event => openFolderMenu($event, folder)"
              class="absolute top-1 right-1 px-0.5 bg-slate-200 border border-slate-500 rounded-md hidden group-hover:block"
            >
              <DotIcon class="w-4 h-4 text-slate-500" />
            </div>
            <FolderIcon class="w-12 h-12 text-slate-700" />
            <div
              class="truncate w-full text-center text-xs font-medium h-6 flex-shrink-0 px-2"
            >
              <input
                :id="`edit-folder-title-${folder._id}`"
                v-if="folder.is_edit"
                @click.stop
                @keyup.enter="updateFolderInfo(folder)"
                @blur="updateFolderInfo(folder)"
                v-model="folder.title"
                type="text"
                class="border w-full rounded text-center px-2 bg-slate-50 py-0.5"
              />
              <template v-else>
                {{ folder.title }}
              </template>
            </div>
          </div>
          <div
            v-for="file of file_list"
            @click="selectFile(file)"
            :class="{ 'border-blue-700': file.is_select }"
            class="relative h-44 cursor-pointer border-[3px] rounded-xl overflow-hidden flex flex-col group"
          >
            <div
              @click.stop="deleteFile(file)"
              class="absolute top-1 left-1 p-1 rounded bg-red-100 border border-red-500 hidden group-hover:block"
            >
              <BinIcon class="w-4 h-4 text-red-500" />
            </div>
            <div
              class="absolute top-1 right-1 p-1 rounded bg-blue-100 border border-blue-500 hidden group-hover:block"
              @click.stop="copyLink(file)"
            >
              <LinkIcon class="w-4 h-4 text-blue-700" />
            </div>
            <div
              v-if="file.is_select"
              class="absolute top-1 right-1 p-0.5 bg-blue-100 border border-blue-700 rounded-full"
            >
              <CheckCircleIcon class="w-6 h-6 text-blue-700" />
            </div>
            <div class="flex-grow min-h-0 flex justify-center items-center">
              <img
                v-if="file.mimetype?.includes('image')"
                :src="file.url"
                class="w-full h-full object-contain bg-slate-100"
              />
              <img
                v-else-if="file.mimetype?.includes('video')"
                src="@/assets/icons/play.svg"
                class="w-1/2 h-1/2"
              />
              <img
                v-else-if="file.mimetype?.includes('audio')"
                src="@/assets/icons/audio.svg"
                class="w-1/2 h-1/2"
              />
              <img
                v-else
                src="@/assets/icons/file.svg"
                class="w-1/2 h-1/2"
              />
            </div>
            <div
              :class="{ 'text-blue-700': file.is_select }"
              class="truncate text-center text-xs font-medium h-6 flex-shrink-0 p-1 border-t"
            >
              {{ file.original_name }}
            </div>
          </div>
        </div>
        <div class="w-full text-right">
          <Pagination
            :current-page-parent="current_page + 1"
            :is-next-page="!is_done"
            :is-loading="is_loading"
            :on-page-change="handlePageChange"
          />
        </div>
        <div class="mx-auto text-xs text-slate-800">
          <p
            v-if="countSelectFile()"
            class="text-sm text-blue-700 font-medium text-center"
          >
            {{ $t('Đã chọn') }} {{ countSelectFile() }} / {{ size(file_list) }}
            {{ $t('v1.view.main.dashboard.chat.album.file') }}
          </p>
          <p>
            {{
              size(file_list) >= 80
                ? $t('v1.view.main.dashboard.chat.album.album_desc')
                : ''
            }}
          </p>
          <p>
            {{
              size(file_list) >= 80
                ? $t('v1.view.main.dashboard.chat.album.album_desc_2')
                : ''
            }}
          </p>
        </div>
      </div>
    </template>
    <template v-slot:footer>
      <div class="flex justify-between">
        <button
          @click="album_ref?.toggleModal()"
          class="custom-btn bg-slate-700"
        >
          {{ $t('Đóng') }}
        </button>
        <button
          @click="pickFile"
          :class="countSelectFile() ? 'bg-blue-700' : 'bg-slate-500'"
          class="custom-btn"
        >
          {{ $t('v1.view.main.dashboard.chat.album.select') }}
          <span v-if="countSelectFile()"> ({{ countSelectFile() }}) </span>
        </button>
      </div>
    </template>
  </Modal>
  <Dropdown
    ref="folder_menu_ref"
    width="142px"
    height="auto"
    :is_fit="false"
    position="BOTTOM"
    class_content="flex flex-col gap-1 border rounded-md p-1 gap-1"
  >
    <button
      @click="editFolderName"
      class="py-1.5 px-2 flex items-center gap-3 rounded-md text-sm font-medium"
    >
      <div class="bg-slate-100 rounded-full p-2">
        <EditIcon class="w-5 h-5" />
      </div>
      {{ $t('v1.view.main.dashboard.chat.album.edit_name') }}
    </button>
    <button
      @click="deleteFolder"
      class="py-1.5 px-2 flex items-center gap-3 rounded-md text-sm font-medium"
    >
      <div class="bg-red-100 rounded-full p-2">
        <BinBoldIcon class="w-5 h-5 text-red-500" />
      </div>
      {{ $t('v1.common.delete') }}
    </button>
  </Dropdown>
  <ModalChangeAlbumSource
    ref="modal_change_album_ref"
    v-model:page_ids="page_ids"
    v-on:update:page_ids="onChangePageIds"
  />
</template>
<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { eachOfLimit, waterfall } from 'async'
import {
  read_file_album,
  upload_file_album,
  delete_file_album,
  read_folder_album,
  update_folder_album,
  delete_folder_album,
  create_folder_album,
} from '@/service/api/chatbox/n6-static'
import { useConversationStore, useOrgStore } from '@/stores'
import { confirm, toast, toastError } from '@/service/helper/alert'
import { useI18n } from 'vue-i18n'
import {
  debounce,
  first,
  get,
  isArray,
  isEmpty,
  keys,
  remove,
  size,
} from 'lodash'

import Modal from '@/components/Modal.vue'
import Loading from '@/components/Loading.vue'
import Checkbox from '@/components/Checkbox.vue'
import Dropdown from '@/components/Dropdown.vue'

import ArrowUpIcon from '@/components/Icons/ArrowUp.vue'
import PlusCircleIcon from '@/components/Icons/PlusCircle.vue'
import BinIcon from '@/components/Icons/Bin.vue'
import BinBoldIcon from '@/components/Icons/BinBold.vue'
import CheckCircleIcon from '@/components/Icons/CheckCircel.vue'
import FolderIcon from '@/components/Icons/Folder.vue'
import DotIcon from '@/components/Icons/Dot.vue'
import EditIcon from '@/components/Icons/Edit.vue'

import PageAvatar from '@/components/Avatar/PageAvatar.vue'
import ChangeIcon from '@/components/Icons/ChangeIcon.vue'

import type { ComponentRef } from '@/service/interface/vue'
import type { FileInfo, FolderInfo } from '@/service/interface/app/album'
import type { CbError } from '@/service/interface/function'
import { ArrowLeftIcon, LinkIcon, TrashIcon } from '@heroicons/vue/24/outline'

import { getItem, setItem } from '@/service/helper/localStorage'
import ModalChangeAlbumSource from './ModalChangeAlbumSource.vue'
import Pagination from './Pagination.vue'
import { normalizeFileName, normalizePageIds } from '@/utils/helper/Validate'

/**các giá tị của danh mục */
type CategoryType = 'NEW' | 'FOLDER'

const $emit = defineEmits(['pick_file'])

const $t = useI18n().t
/** thoong tin conversation trong store */
const conversationStore = useConversationStore()
/** Thoong tin org trong store*/
const orgStore = useOrgStore()

/**cache câu trả lời, hạnc chế gọi API liên tục mỗi lần click */
const CACHE_LIST_ALBUM = new Map<string, any[]>()

/**số bản ghi một thời điểm */
const LIMIT = 80

/** Trang hiện tại (bắt đầu từ 0 hoặc 1, tùy backend) */
const current_page = ref(0)

/**
 *  Xác định `page_id` hợp lệ để thao tác album
 *
 * @description
 * Hàm này tìm ra `page_id` ưu tiên sử dụng theo thứ tự:
 * 1. Nếu localStorage (`album_page_id`) có chứa mảng tương ứng với `fb_page_id` hiện tại → lấy phần tử đầu tiên.
 * 2. Nếu không có `fb_page_id` trong map → lấy key đầu tiên trong map và dùng phần tử đầu tiên trong mảng đó.
 * 3. Nếu map trống → trả về ID mặc định (fb_page_id hoặc chuỗi rỗng).
 *
 * @returns {string} `new_page_id` — ID trang hợp lệ để thao tác.
 *
 * @example
 * const pageId = resolvePageIdForAlbum();
 * create_folder_album({ page_id: pageId, title: "New Folder" });
 */
function resolvePageIdForAlbum(): string {
  /** Lấy dữ liệu map page_id từ localStorage */
  const PAGE_ID_MAP = getItem('album_page_id') || {}

  /** Lấy store hội thoại hiện tại */
  const conversationStore = useConversationStore()

  /** ID mặc định từ store (hoặc chuỗi rỗng nếu chưa có) */
  const DEFAULT_ID: string =
    conversationStore.select_conversation?.fb_page_id || ''

  /** Biến kết quả khởi tạo bằng DEFAULT_ID */
  let new_page_id: string = DEFAULT_ID

  /** Kiểm tra map có dữ liệu không */
  if (size(PAGE_ID_MAP) > 0) {
    /** Lấy danh sách page tương ứng với DEFAULT_ID (nếu có) */
    const DEFAULT_PAGE_LIST = get(PAGE_ID_MAP, DEFAULT_ID, [])

    /** Nếu có danh sách hợp lệ → lấy phần tử đầu tiên */
    if (isArray(DEFAULT_PAGE_LIST) && size(DEFAULT_PAGE_LIST) > 0) {
      new_page_id = first(DEFAULT_PAGE_LIST) as string
    } else {
      /** Nếu không có DEFAULT_ID → chọn phần tử đầu tiên trong toàn bộ map */
      const FIRST_KEY = first(keys(PAGE_ID_MAP))
      if (FIRST_KEY) {
        const FIRST_ARRAY = get(PAGE_ID_MAP, FIRST_KEY, [])
        if (isArray(FIRST_ARRAY) && size(FIRST_ARRAY) > 0) {
          new_page_id = first(FIRST_ARRAY) as string
        }
      }
    }
  }

  /** Trả về ID hợp lệ */
  return new_page_id
}

/** Hàm xử lý khi chuyển trang
 * @param page
 * @param direction
 */
const handlePageChange = (page: number, direction: 'next' | 'prev') => {
  /** Đang loading thì return */
  if (is_loading.value) return
  /** Nếu ấn next hoặc prev thì fix skip chuẩn theo số trang*/
  if (direction === 'next') {
    skip.value += LIMIT * current_page.value
  } else if (direction === 'prev') {
    skip.value =
      LIMIT * (current_page.value - 1 > 0 ? current_page.value - 1 : 0)
  }
  /** Trang hiện tại (-1 vì index) */
  current_page.value = page - 1
  getFiles()
}

/**ref của menu thiết lập folder */
const folder_menu_ref = ref<InstanceType<typeof Dropdown>>()
/**đánh dấu có kích hoạt loading hay không */
const is_loading = ref(false)
/**ref của quản lý album */
const album_ref = ref<ComponentRef>()
/**chọn danh mục nào */
const selected_category = ref<CategoryType>('NEW')
/**id của thư mục đang chọn nếu có */
const selected_folder_id = ref<string>()
/**danh sách tập tin */
const file_list = ref<FileInfo[]>([])
/**danh sách tập tin */
const file_list_root = ref<FileInfo[]>([])
/**danh sách thư mục */
const folder_list = ref<FolderInfo[]>([])
/**đánh dấu đã đọc hết dữ liệu */
const is_done = ref(false)
/**số bản ghi bỏ qua */
const skip = ref(0)
/**thư mục được chọn để cài đặt */
const selected_folder = ref<FolderInfo>()

/**id trang đang được chọn */
const page_id = ref<string>('')
/** Danh sách page_id */
const page_ids = ref<string[] | undefined>([])

/** modal thay đổi danh sách câu trả lời nhanh */
const modal_change_album_ref = ref<InstanceType<
  typeof ModalChangeAlbumSource
> | null>(null)

/** --- state search */
const search_text = ref('')

/**
 * Lọc danh sách album theo từ khóa tìm kiếm
 *
 * @description
 * Hàm này tạm thời thực hiện lọc dữ liệu cục bộ (local filter) trên danh sách `file_list_root`,
 * tương ứng với danh sách ảnh hoặc album gốc. Sau này có thể thay bằng API tìm kiếm thực tế.
 *
 * - Nếu `query` có giá trị → lọc danh sách theo tên gốc (`original_name`), không phân biệt hoa thường.
 * - Nếu `query` rỗng → trả lại toàn bộ danh sách gốc.
 *
 * @param {string} query - Từ khóa tìm kiếm nhập vào từ người dùng.
 *
 * @returns {Promise<void>} Không trả về giá trị, chỉ cập nhật `file_list`.
 */
const fetchAlbums = async (query: string): Promise<void> => {
  /** Kiểm tra có từ khóa tìm kiếm không */
  if (query) {
    /** Lọc danh sách file theo tên, chuyển về lowercase để so sánh không phân biệt hoa thường */
    const DATA = file_list_root.value?.filter(item =>
      item.original_name.toLowerCase().includes(query.toLowerCase())
    )

    /** Gán lại danh sách file hiển thị sau khi lọc */
    file_list.value = DATA
  } else {
    /** Nếu không có từ khóa → hiển thị lại toàn bộ danh sách gốc */
    file_list.value = file_list_root.value
  }
}

/** handle debounce input */
const handleInput = debounce(e => {
  /** Gọi album */
  fetchAlbums(e.target.value)
}, 500)

/**đánh dấu có đang chọn tất cả file không */
const is_select_all = computed({
  get() {
    /** kiểm tra xem có phải đang chọn toàn bộ file không */
    return (
      !!size(file_list.value) && size(file_list.value) === countSelectFile()
    )
  },
  set(val) {
    /** gắn cờ cho các file */
    file_list.value?.forEach(file => (file.is_select = val))
    file_list_root.value?.forEach(file => (file.is_select = val))
  },
})

function onChangePageIds(ids: string[]) {
  /** Nếu không có ids thì return */
  if (!ids?.length || !conversationStore.select_conversation?.fb_page_id) return
  /** Lưu giá trị page_ids từ props đầu vào */
  page_ids.value = ids

  /** Lưu vào local storage (nếu bạn muốn) */
  const PAGE_ID_MAP = getItem('album_page_id') || {}
  /** Lưu vào local */
  setItem('album_page_id', {
    ...PAGE_ID_MAP,
    [conversationStore.select_conversation.fb_page_id]: ids,
  })
  /** Reset skip */
  skip.value = 0
  /** Chọn trạng thái file hoặc folder */
  if (selected_category.value === 'NEW') {
    folder_list.value = []
    getFiles(true, ids)
  } else {
    file_list.value = []
    getFolders(true, ids)
  }
}

/**
 * Lấy danh sách file (ảnh/video) từ album của một hoặc nhiều trang.
 *
 * @function getFiles
 * @param {boolean} [is_change_page=false] - Có phải đang chuyển trang (thay đổi page_id)?
 *   - `true` → thay thế toàn bộ danh sách file hiện tại.
 *   - `false` → thêm dữ liệu (ví dụ khi load thêm).
 * @param {string[]} [ids=[]] - Danh sách `page_id` được truyền thủ công (override dữ liệu local).
 *
 * @description
 * Quy trình:
 * 1. Lấy danh sách `page_id` từ localStorage (`album_page_id`) dựa theo trang hiện tại.
 * 2. Chuẩn hóa dữ liệu (dạng chuỗi, mảng, hoặc ký tự rời) thành `string[]` hợp lệ.
 * 3. Gọi API `read_file_album()` để lấy danh sách file.
 * 4. Cập nhật danh sách file, trạng thái tải (loading/done), và hỗ trợ phân trang.
 */
function getFiles(is_change_page = false, ids: string[] = []) {
  /** Lấy dữ liệu map page_id từ localStorage */
  const PAGE_ID_MAP = getItem('album_page_id') || {}

  /** Lấy page_id của cuộc hội thoại hiện tại */
  const CURRENT_PAGE_ID =
    conversationStore.select_conversation?.fb_page_id || ''

  /** Lấy danh sách page_id đã lưu trong localStorage (có thể là chuỗi hoặc mảng) */
  let stored_page_ids = PAGE_ID_MAP?.[CURRENT_PAGE_ID] || CURRENT_PAGE_ID

  /** Áp dụng normalize để luôn có mảng string[] chuẩn */
  const NORMALIZED = normalizePageIds(stored_page_ids)

  /** Gán vào reactive state (page_ids) */
  page_ids.value = NORMALIZED

  /** Nếu không có page_id hợp lệ thì dừng */
  if (!page_ids.value?.length) return

  /** Đặt trạng thái tải */
  is_loading.value = true
  is_done.value = false

  /**
   * Thực hiện tuần tự 2 bước bằng async.waterfall:
   *
   * Gọi API `read_file_album` để lấy dữ liệu file.
   * Sau khi hoàn tất → cập nhật trạng thái tải và danh sách.
   */
  waterfall(
    [
      /**
       * Bước 1: Gọi API đọc dữ liệu file theo page_id.
       */
      (cb: CbError) =>
        read_file_album(
          {
            /**
             * Danh sách page_id cần lấy:
             * - Nếu có `ids` truyền vào → ưu tiên dùng.
             * - Ngược lại dùng `page_ids.value` từ local.
             */
            page_id: !isEmpty(ids) ? ids : page_ids.value || [],
            folder_id: selected_folder_id.value,
            limit: LIMIT,
            skip: skip.value /** offset được handle bởi handlePageChange */,
          },
          (e, r) => {
            if (e) return cb(e)

            /** Nếu dữ liệu ít hơn LIMIT => không còn trang tiếp theo */
            is_done.value = !r?.length || r.length < LIMIT

            /** Cập nhật giá trị skip để load tiếp lần sau */
            skip.value = skip.value + Number(r?.length) || 0

            if (is_change_page) {
              /**
               * Khi chuyển sang trang mới → replace toàn bộ file cũ.
               */
              file_list.value = (r as FileInfo[]).map(file => ({
                ...file,
                is_select: is_select_all.value,
              }))
              file_list_root.value = (r as FileInfo[]).map(file => ({
                ...file,
                is_select: is_select_all.value,
              }))
            } else {
              /**
               * Khi load thêm (scroll xuống cuối danh sách) → append dữ liệu.
               */
              addDataToFileList(r)
            }

            cb()
          }
        ),
      /** Bước 2: Callback kết thúc waterfall */
      (cb: any) => cb(),
    ],
    /**
     *  Hoàn tất toàn bộ luồng (thành công hoặc lỗi)
     */
    e => {
      is_loading.value = false
      if (e) toastError(e)
    }
  )
}

/**
 * Lấy danh sách thư mục (album folder) từ các trang được chọn.
 *
 * @function getFolders
 * @param {boolean} [is_change_page=false] - Cờ báo hiệu có phải đang chuyển trang hay không.
 *   - `true`: Thay thế toàn bộ danh sách thư mục hiện tại.
 *   - `false`: Thêm dữ liệu mới vào danh sách hiện tại.
 * @param {string[]} [ids=[]] - Danh sách `page_id` được truyền thủ công (nếu cần override dữ liệu từ local).
 *
 * @description
 * Quy trình:
 * 1. Đọc danh sách `page_id` từ localStorage (`album_page_id`).
 * 2. Chuẩn hóa dữ liệu để đảm bảo luôn là `string[]` hợp lệ.
 * 3. Gọi API `read_folder_album()` để lấy danh sách folder (album).
 * 4. Cập nhật `folder_list`, trạng thái tải (`is_loading`, `is_done`) và phân trang (`skip`).
 */
function getFolders(is_change_page = false, ids: string[] = []) {
  /**  Lấy dữ liệu map page_id từ localStorage */
  const PAGE_ID_MAP = getItem('album_page_id') || {}

  /**  Lấy page_id của cuộc hội thoại hiện tại */
  const CURRENT_PAGE_ID =
    conversationStore.select_conversation?.fb_page_id || ''

  /**  Lấy dữ liệu page_id đã lưu trong localStorage (có thể là chuỗi hoặc mảng) */
  let stored_page_ids = PAGE_ID_MAP?.[CURRENT_PAGE_ID] || CURRENT_PAGE_ID

  /**  Chuẩn hóa dữ liệu page_id */
  const NORMALIZED = normalizePageIds(stored_page_ids)

  /**  Gán lại vào reactive state */
  page_ids.value = NORMALIZED

  /**  Nếu không có id hợp lệ thì dừng */
  if (!page_ids.value?.length) return

  /**  Bắt đầu tải dữ liệu */
  is_loading.value = true
  is_done.value = false

  /**
   *  Dùng waterfall để thực hiện tuần tự:
   *  Gọi API lấy folder album.
   *  Cập nhật danh sách và trạng thái tải.
   */
  waterfall(
    [
      /**
       * Bước 1: Gọi API đọc danh sách folder.
       */
      (cb: any) =>
        read_folder_album(
          {
            /**
             * Nếu có `ids` truyền vào → dùng nó,
             * ngược lại dùng `page_ids.value` từ local.
             */
            page_id: !isEmpty(ids) ? ids : page_ids.value || [],
            limit: LIMIT,
            skip: skip.value,
          },
          (e, r) => {
            if (e) return cb(e)

            console.log(r, 'rrrrrr')

            /** Nếu dữ liệu ít hơn LIMIT => không còn trang kế tiếp */
            if (!r?.length || r.length < LIMIT) is_done.value = true

            if (is_change_page) {
              /**
               * Khi chuyển trang → thay toàn bộ danh sách cũ.
               */
              folder_list.value = r as FolderInfo[]
            } else {
              /**
               * Khi load thêm → nối thêm dữ liệu vào danh sách cũ.
               */
              folder_list.value.push(...(r as FolderInfo[]))
            }

            cb()
          }
        ),

      /**
       * Bước 2: Sau khi thành công → cập nhật skip.
       */
      (cb: any) => {
        skip.value += LIMIT
        cb()
      },
    ],

    /**
     * Hoàn tất toàn bộ quá trình (có thể thành công hoặc lỗi).
     */
    e => {
      is_loading.value = false
      if (e) toastError(e)
    }
  )
}

/**đổi chế độ sửa tên thư mục */
function editFolderName() {
  /** nếu chưa chọn thư mục thì thôi */
  if (!selected_folder.value) return

  /** bật chế độ sửa */
  selected_folder.value.is_edit = true

  /** tắt menu */
  folder_menu_ref.value?.toggleDropdown()

  /** focus vào input */
  nextTick(() =>
    document
      .getElementById(`edit-folder-title-${selected_folder.value?._id}`)
      ?.focus()
  )
}
/** Mở menu */
function openFolderMenu($event: MouseEvent, folder: FolderInfo) {
  /** chọn thư mục */
  selected_folder.value = folder

  /** mở menu */
  folder_menu_ref.value?.toggleDropdown($event)
}
/**đếm số file được chọn */
function countSelectFile() {
  return size(file_list.value?.filter(file => file.is_select))
}
/**click chọn file để gửi */
function selectFile(file: FileInfo) {
  file.is_select = !file.is_select
}
/**chọn thư mục */
function selectFolder(folder: FolderInfo) {
  /** Lưu folder id */
  selected_folder_id.value = folder._id
  /** Lưu folder đã chọn */
  selected_folder.value = folder
  /** Reset file */
  resetFileData()
  /** call api lấy file */
  getFiles()
}

/**chọn danh mục */
function selectCategory(type: CategoryType) {
  /** chọn danh mục */
  selected_category.value = type

  /** xoá thư mục đã chọn */
  selected_folder_id.value = undefined
  /** clar file dữ liệu */
  resetFileData()
  /** type File thì lấy file */
  if (type === 'NEW') getFiles()
  /** Type folder thì lấy data folder */
  if (type === 'FOLDER') getFolders()
}

/**xoá tập tin */
function deleteFile(select_file: FileInfo) {
  /** nếu đang chạy thì thôi */
  if (is_loading.value) return

  /** gắn cờ đang chạy */
  is_loading.value = true

  /** Xác định page_id hợp lệ */
  const NEW_PAGE_ID = resolvePageIdForAlbum()

  /** xoá file */
  delete_file_album(
    {
      // page_id: conversationStore.select_conversation?.fb_page_id!,
      page_id: NEW_PAGE_ID,
      file_id: select_file._id,
    },
    (e, r) => {
      is_loading.value = false

      /** xoá khỏi danh sách tập tin */
      remove(file_list.value, file => file._id === select_file?._id)
      remove(file_list_root.value, file => file._id === select_file?._id)
    }
  )
}
/** xóa các tập tin đã chọn */
async function deleteSelectFile() {
  try {
    /** nếu đang chạy thì thôi */
    if (is_loading.value) return

    /** gắn cờ đang chạy */
    is_loading.value = true

    /** danh sách tập tin */
    const FILE_LIST = file_list.value

    /** lặp xóa từng tập tin đã chọn */
    for (let i = FILE_LIST?.length; i >= 0; i--) {
      /** dữ liệu của tập tin */
      const FILE = FILE_LIST[i]

      /** nếu đang được chọn thì xóa */
      if (FILE?.is_select) {
        await new Promise((resolve, reject) => {
          /** call api xóa tập tin */
          delete_file_album(
            {
              // page_id: conversationStore.select_conversation?.fb_page_id!,
              page_id: page_id.value,
              file_id: FILE._id,
            },
            (e, r) => {
              /** nếu thành công */
              if (r.code === 200) {
                resolve(r)
                /** xóa khoa khoi danh sach */
                file_list.value?.splice(i, 1)
                file_list_root.value?.splice(i, 1)
              }
            }
          )
        })
      }
    }
  } catch (e) {
    console.log(e)
  } finally {
    /** tắt cờ đang chạy */
    is_loading.value = false
  }
}

/** xác nhận xóa các tập tin */
function confirmDeleteFile() {
  confirm(
    'question',
    $t('v1.view.main.dashboard.chat.album.confirm_delete_file'),
    '',
    is_cancel => {
      /** nếu hủy thì thôi */
      if (is_cancel) return
      /** xóa các tập tin đã chọn */
      deleteSelectFile()
    }
  )
}

/**
 * Tạo mới một thư mục (album) cho trang Facebook đang được chọn.
 */
function createFolder(): void {
  /** Bật cờ đang chạy */
  is_loading.value = true

  /** Xác định page_id hợp lệ */
  const NEW_PAGE_ID = resolvePageIdForAlbum()

  /** Gọi API tạo mới thư mục */
  create_folder_album(
    {
      page_id: NEW_PAGE_ID,
      title: $t('v1.view.main.dashboard.chat.album.folder_new_name'),
    },
    (e, r) => {
      /** Tắt cờ đang chạy */
      is_loading.value = false

      /** Reset dữ liệu và gọi lại danh sách */
      folder_list.value = []
      skip.value = 0
      is_done.value = false
      getFolders()
    }
  )
}

/**xoá thư mục */
function deleteFolder() {
  /** nếu chưa chọn thư mục thì thôi */
  if (!selected_folder.value) return

  /** gắn cờ đang chạy */
  is_loading.value = true

  /** Xác định page_id hợp lệ */
  const NEW_PAGE_ID = resolvePageIdForAlbum()

  /** xoá thư mục */
  delete_folder_album(
    {
      // page_id: conversationStore.select_conversation?.fb_page_id!,
      page_id: NEW_PAGE_ID,
      folder_id: selected_folder.value?._id,
    },
    (e, r) => {
      /** tắt gắn cờ */
      is_loading.value = false

      /** xoá thư mục khỏi danh sách */
      remove(
        folder_list.value,
        folder => folder._id === selected_folder.value?._id
      )

      /** tắt menu */
      folder_menu_ref.value?.toggleDropdown()
    }
  )
}
/**cập nhật thông tin folder */
function updateFolderInfo(folder: FolderInfo) {
  /** nếu chưa chọn thư mục thì thôi */
  if (!folder) return

  /** gắn cờ đang chạy */
  is_loading.value = true

  /** Xác định page_id hợp lệ */
  const NEW_PAGE_ID = resolvePageIdForAlbum()

  /** cập nhật thông tin thư mục */
  update_folder_album(
    {
      // page_id: conversationStore.select_conversation?.fb_page_id as string,
      page_id: folder.fb_page_id || NEW_PAGE_ID,
      folder_id: folder?._id,
      title: folder?.title,
    },
    (e, r) => {
      // tắt gắn cờ
      is_loading.value = false

      // tắt chế độ sửa
      folder.is_edit = false
    }
  )
}
/**lấy các tập tin đưa vào danh sách gửi */
function pickFile() {
  /** đóng modal */
  album_ref.value.toggleModal()

  /** lấy dữ liệu của file được chọn */
  $emit(
    'pick_file',
    file_list.value?.filter(file => file.is_select)
  )

  /** huỷ bỏ file được chọn */
  selectAllFile(false)
}
/**chọn/huỷ chọn toàn bộ tập tin */
function selectAllFile(value: boolean) {
  file_list.value?.forEach(file => (file.is_select = value))
}
/**làm sạch dữ liệu file */
function resetFileData() {
  is_done.value = false
  skip.value = 0
  file_list.value = []
  file_list_root.value = []
  folder_list.value = []
}
/**mở album */
function toggleAlbum() {
  album_ref.value?.toggleModal()

  /** chuyển danh mục về all */
  selected_category.value = 'NEW'

  /** xoá thư mục đã chọn */
  selected_folder_id.value = undefined

  resetFileData()

  getFiles()
}

/** Thêm dữ liệu vào đầu danh sách tập tin hiện tại */
/**
 * Thêm dữ liệu vào danh sách tập tin hiện tại
 * @param data - Danh sách FileInfo cần thêm
 * @param source - 'fetch' | 'upload' - nguồn dữ liệu
 */
function addDataToFileList(
  data?: FileInfo[],
  source: 'fetch' | 'upload' = 'fetch'
) {
  if (!Array.isArray(data) || data.length === 0) return

  /** Tạo new file từ data đầu vào */
  const NEW_FILES = data.map(file => ({
    ...file,
    is_select: is_select_all.value,
  }))
  if (data.length < LIMIT) {
    is_done.value = true
  }
  /** Check type action  */
  if (source === 'fetch') {
    /** fetch từ server → thêm cuối danh sách */
    file_list.value = [...NEW_FILES]
    file_list_root.value = [...NEW_FILES]
    // file_list.value = [...file_list.value, ...NEW_FILES]
    // file_list_root.value = [...file_list_root.value, ...NEW_FILES]
  } else {
    /** upload mới → thêm đầu danh sách */
    file_list.value = [...NEW_FILES, ...file_list.value]
    file_list_root.value = [...NEW_FILES, ...file_list_root.value]
  }
}

/**
 * Chọn file từ thiết bị để upload lên album.
 * ⚠️ @deprecated: Hàm này đã lỗi thời, nên dùng `UploadFile` trong `utils` thay thế.
 *
 * - Tạo thẻ `<input type="file">` tạm thời để mở hộp chọn file của thiết bị.
 * - Cho phép chọn nhiều file (multiple).
 * - Chuẩn hóa tên file, tạo FormData và upload từng file theo thứ tự.
 * - Tự động xác định `page_id` tương ứng để gửi file đúng album.
 * - Hiển thị thông báo khi upload hoàn tất.
 */
function uploadFileFromDevice() {
  /** Tạo phần tử input ẩn để người dùng chọn file từ thiết bị */
  const INPUT = document.createElement('input')
  /** Cho phép chọn file */
  INPUT.type = 'file'
  /** Cho phép chọn nhiều file cùng lúc */
  INPUT.multiple = true
  /** Ẩn khỏi giao diện người dùng */
  INPUT.style.display = 'none'

  /** Khi người dùng chọn file xong */
  INPUT.onchange = () => {
    /**  fix null here */
    if (!INPUT.files || INPUT.files.length === 0) return
    /** Hiển thị trạng thái loading trong giao diện */
    is_loading.value = true

    /**
     * Duyệt qua từng file theo giới hạn đồng thời là 1 (upload tuần tự),
     * dùng `eachOfLimit` để xử lý bất đồng bộ có kiểm soát.
     */
    eachOfLimit(
      Array.from(INPUT.files),
      1,
      (file: File, i, next) => {
        /** 🔹 Chuẩn hóa tên file để tránh lỗi ký tự đặc biệt */
        const CLEAN_NAME = normalizeFileName(file.name)

        /** Tạo lại đối tượng File mới với tên đã chuẩn hóa */
        const NEW_FILE = new File([file], CLEAN_NAME, { type: file.type })

        /** Tạo FormData chứa file để upload */
        const FORM = new FormData()
        FORM.append('file', NEW_FILE)

        /** Xác định page_id hợp lệ */
        const NEW_PAGE_ID = resolvePageIdForAlbum()

        /**
         * Gọi API upload_file_album để tải file lên server.
         * Truyền kèm page_id để xác định album đích.
         * Khi upload xong, thêm file mới vào danh sách hiển thị.
         */
        upload_file_album(
          { page_id: NEW_PAGE_ID, folder_id: selected_folder_id.value },
          FORM,
          (e, r) => {
            if (r)
              addDataToFileList([r], 'upload') /** Cập nhật UI sau upload */
            next() /** Tiếp tục upload file tiếp theo */
          }
        )
      },
      /** Callback sau khi tất cả file đã upload xong */
      e => {
        is_loading.value = false /** Tắt trạng thái loading */
        toast('success', $t('v1.common.success')) /** Thông báo thành công */
      }
    )

    /** Xóa thẻ input khỏi DOM để dọn dẹp bộ nhớ */
    if (INPUT && INPUT.parentNode) INPUT.parentNode.removeChild(INPUT)
  }

  /** Gắn thẻ input vào DOM tạm thời để trình duyệt nhận sự kiện click */
  document.body.appendChild(INPUT)

  /** Kích hoạt click() để mở hộp thoại chọn file của hệ thống */
  INPUT.click()
}

/** hàm copy link của file vào clipboard */
function copyLink(file: FileInfo) {
  navigator.clipboard.writeText(file.url)
  toast('success', $t('v1.common.success'))
}

defineExpose({ toggleAlbum })
</script>
<style scoped lang="scss">
.custom-btn {
  @apply py-2 px-5 flex items-center gap-1 rounded-lg text-white text-sm hover:brightness-90;
}
</style>
