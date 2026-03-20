<template>
  <Teleport
    to="body"
    v-if="is_open"
  >
    <Transition
      enter-active-class="transition ease-in-out duration-500"
      leave-active-class="transition ease-in-out duration-500"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        @click="toggleModal"
        class="absolute top-0 left-0 w-screen h-screen bg-black/10 z-20"
      >
        <div
          @click.stop
          class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white py-2 px-5 shadow-lg border border-gray-200 modal flex flex-col"
        >
          <div
            class="flex items-center justify-between border-b py-2 flex-shrink-0"
          >
            <div />
            <div class="text-lg font-semibold">
              {{ $t('v1.view.main.dashboard.header.menu.user_info') }}
            </div>
            <div
              @click="toggleModal"
              class="cursor-pointer w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center"
            >
              <CloseIcon class="w-3 h-3" />
            </div>
          </div>
          <div class="overflow-y-auto flex-grow min-h-0">
            <div class="section border-b">
              <div class="title">
                {{ $t('v1.view.main.dashboard.org.pay.account') }}
              </div>
              <div class="flex items-center gap-3">
                <div class="relative">
                  <StaffAvatar
                    :id="chatbotUserStore.chatbot_user?.user_id"
                    class="rounded-oval w-11 h-11"
                  />
                  <div
                    @click="$main.handleUpload()"
                    class="p-1 rounded-full bg-slate-300 absolute -bottom-1 -right-1 cursor-pointer"
                  >
                    <CameraIcon class="size-4" />
                  </div>
                  <div
                    v-if="is_loading_avatar"
                    class="absolute top-0 left-0 rounded-oval w-11 h-11 bg-black/30 flex items-center justify-center"
                  >
                    <Loading class="fill-blue-700 text-white !size-5" />
                  </div>
                </div>
                <div>
                  <div class="text-sm font-semibold">
                    {{ chatbotUserStore.chatbot_user?.full_name }}
                  </div>
                  <div class="text-sm font-medium text-slate-500">
                    {{
                      chatbotUserStore.chatbot_user?.email ||
                      chatbotUserStore.chatbot_user?.user_id ||
                      chatbotUserStore.chatbot_user?.fb_staff_id
                    }}
                  </div>
                </div>
              </div>
            </div>
            <div class="section">
              <div class="title">
                {{ $t('v1.view.main.dashboard.user.general') }}
              </div>
              <Item
                :icon="BellIcon"
                :title="$t('v1.view.main.dashboard.user.noti')"
                :description="
                  $t('v1.view.main.dashboard.user.noti_description')
                "
              >
                <Toggle class_toggle="peer-checked:bg-black" />
              </Item>
              <Item
                :icon="GlobalBoldIcon"
                :title="
                  $t('v1.view.main.dashboard.chat.client.field.languages')
                "
                :description="
                  $t('v1.view.main.dashboard.user.lang_description')
                "
              >
                <Lang />
              </Item>
              <!-- <Item
                :icon="MoonIcon"
                :title="$t('v1.view.main.dashboard.user.ui')"
                :description="$t('v1.view.main.dashboard.user.ui_description')"
              >
                <Theme />
              </Item>
              <Item
                :icon="TranslateIcon"
                :title="$t('v1.view.main.dashboard.user.translate')"
                :description="
                  $t('v1.view.main.dashboard.user.translate_description')
                "
              >
                <Translate />
              </Item> -->
            </div>
            <div class="section">
              <div class="title">
                {{ $t('v1.view.main.dashboard.user.chat') }}
              </div>
              <Item
                :icon="CogBoldIcon"
                :title="$t('v1.view.main.dashboard.user.allow_overide')"
                :description="
                  $t('v1.view.main.dashboard.user.allow_overide_description')
                "
              >
                <Toggle
                  v-model="
                    chatbotUserStore.personal_settings
                      .is_enable_personal_setting
                  "
                  class_toggle="peer-checked:bg-black"
                />
              </Item>
              <template
                v-if="
                  chatbotUserStore.personal_settings.is_enable_personal_setting
                "
              >
                <Item
                  :icon="UserCircleIcon"
                  :title="$t('v1.view.main.dashboard.user.show_page_avatar')"
                  :description="
                    chatbotUserStore.personal_settings.is_hide_page_avatar
                      ? $t('Ẩn toàn bộ ảnh đại diện của trang trên hội thoại')
                      : $t('Hiện toàn bộ ảnh đại diện của trang trên hội thoại')
                  "
                >
                  <Toggle
                    v-model="
                      chatbotUserStore.personal_settings.is_hide_page_avatar
                    "
                    class_toggle="peer-checked:bg-black"
                  />
                </Item>
                <Item
                  :icon="TagIcon"
                  :title="$t('v1.view.main.dashboard.user.label')"
                  :description="
                    $t('v1.view.main.dashboard.user.label_description')
                  "
                >
                  <select
                    v-model="
                      chatbotUserStore.personal_settings.display_label_type
                    "
                    class="py-2 rounded-md focus:outline-none border px-3 text-sm cursor-pointer max-w-44 truncate pr-0"
                  >
                    <option
                      v-for="(title, key) of SELECT_LABEL_TYPE"
                      :value="key"
                    >
                      {{ title }}
                    </option>
                  </select>
                </Item>
              </template>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useChatbotUserStore } from '@/stores'
import { useI18n } from 'vue-i18n'
import { container } from 'tsyringe'
import { UploadFile } from '@/utils/helper/Upload'
import { error } from '@/utils/decorator/Error'
import { Toast } from '@/utils/helper/Alert/Toast'

import StaffAvatar from '@/components/Avatar/StaffAvatar.vue'
import Item from '@/components/User/UserInfo/Item.vue'
import Toggle from '@/components/Toggle.vue'
import Lang from '@/components/User/UserInfo/Lang.vue'
import Theme from '@/components/User/UserInfo/Theme.vue'
import Translate from '@/components/User/UserInfo/Translate.vue'

import CloseIcon from '@/components/Icons/Close.vue'
import BellIcon from '@/components/Icons/Bell.vue'
import GlobalBoldIcon from '@/components/Icons/GlobalBold.vue'
import MoonIcon from '@/components/Icons/Moon.vue'
import TranslateIcon from '@/components/Icons/Translate.vue'
import UserIcon from '@/components/Icons/User.vue'
import CogBoldIcon from '@/components/Icons/CogBold.vue'
import UserCircleIcon from '@/components/Icons/UserCircle.vue'
import TagIcon from '@/components/Icons/Tag.vue'
import { CameraIcon } from 'lucide-vue-next'
import Loading from '@/components/Icons/Loading.vue'
import { loading } from '@/utils/decorator/Loading'
import { N4SerivceAppUser } from '@/utils/api/N4Service/User'

const { t: $t } = useI18n()

const $emit = defineEmits(['close_modal'])

const $upload = container.resolve(UploadFile)
const $toast = container.resolve(Toast)
const $user = container.resolve(N4SerivceAppUser)

const chatbotUserStore = useChatbotUserStore()

/**các lựa chọn chế độ hiển thị nhãn */
const SELECT_LABEL_TYPE = {
  // hiển thị văn bản
  FULL: $t('v1.view.main.dashboard.user.text'),
  // hiển thị chấm màu
  ICON: $t('v1.view.main.dashboard.user.dot'),
  // hiển thị icon và chú thích
  ICON_TOOLTIP: $t('v1.view.main.dashboard.user.dot_tooltip'),
}

/**ẩn hiện modal */
const is_open = ref(false)

/** cờ check loading tải ảnh đại diện */
const is_loading_avatar = ref(false)

/**ẩn hiện modal */
function toggleModal() {
  // toggle modal
  is_open.value = !is_open.value

  // bắn sự kiện ra ngoài khi modal đã tắt
  if (!is_open.value) $emit('close_modal')
}

class Main {
  /** hàm update avatar */
  handleUpload() {
    // mở cửa sổ chọn file
    $upload.exec(
      // gửi file ra ngoài
      files => {
        /**file hình ảnh */
        const FILE = files?.[0]

        // nếu không có file thì thôi
        if (!FILE) return

        // tải lên ảnh đại diện của nhân sự
        this.uploadOrgAvatar(FILE)
      },
      // chỉ cho chọn 1 file
      false,
      // chỉ chọn file ảnh
      'image/*',
    )
  }

  /**upload ảnh avt mới của nhân sự */
  @loading(is_loading_avatar)
  @error($toast)
  async uploadOrgAvatar(file: File) {
    /** link ảnh của nhân sự */
    const AVATAR = await $user.uploadUserAvatar(file)

    /** dữ liệu nhân sự được cập nhật */
    await $user.updateUserInfo({
      avatar: AVATAR,
    })
  }
}

const $main = new Main()

// public chức năng ẩn hiện modal để có thể được gọi từ bên ngoài component
defineExpose({ toggleModal })
</script>
<style lang="scss" scoped>
.modal {
  @apply w-[548px] max-w-[95%] max-h-[95%];
}
.section {
  @apply py-5 flex flex-col gap-2;
}
.title {
  @apply text-sm font-semibold text-slate-500;
}
</style>
