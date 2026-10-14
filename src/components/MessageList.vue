<script setup lang="ts">
import {
  nextTick,
  onMounted,
  useTemplateRef,
  watch,
} from "vue";

import MessageBubble from "./MessageBubble.vue";

import type { Message } from "../types/messages.ts";
import type { Reaction } from "../types/reactions.ts";
import type { User } from "../types/user.ts";

const props = defineProps<{
  messages: Message[];
  reactions: Reaction[];
  users: User[];
  currentUserName: string;
  reactionMessageId: number | null;
  editingMessageId: number | null;
}>();

const emit = defineEmits<{
  toggleReaction: [messageId: number, emoji: string];
  requestReaction: [messageId: number];
  requestEdit: [message: Message];
  viewProfile: [author: string];
}>();

const bottomAnchor = useTemplateRef<HTMLDivElement>("bottom-anchor");

async function scrollToBottom() {
  await nextTick();

  bottomAnchor.value?.scrollIntoView({
    behavior: "smooth",
    block: "end",
  });
}

function getMessageCount() {
  return props.messages.length;
}

function reactionsFor(messageId: number) {
  return props.reactions.filter((reaction) => reaction.message_id === messageId);
}

function avatarFor(author: string) {
  return props.users.find((user: User) => user.name === author)?.avatar ?? "";
}

watch(getMessageCount, scrollToBottom);

onMounted(scrollToBottom);
</script>

<template>
  <div class="messages">
    <div class="messages-inner">
      <div
        v-if="messages.length === 0"
        class="empty"
      >
        <strong> Здесь пока пусто </strong>
        <span> Напишите первое сообщение</span>
      </div>

      <MessageBubble
        v-for="message in messages"
        :key="message.id"
        :message="message"
        :avatar="avatarFor(message.author)"
        :is-own="message.author === 'Oleg'"
        :reactions="reactionsFor(message.id)"
        :current-user-name="currentUserName"
        :reaction-picker-open="reactionMessageId === message.id"
        @toggle-reaction="(emoji) => emit('toggleReaction', message.id, emoji)"
        @request-reaction="emit('requestReaction', message.id)"
        @request-edit="emit('requestEdit', message)"
        @view-profile="(author) => emit('viewProfile', author)"
      />
      <div
        ref="bottom-anchor"
        class="bottom-anchor"
        aria-hidden="true"
      />
    </div>
  </div>
</template>

<style scoped>
.bottom-anchor {
  height: 1px;
  flex-shrink: 0;
}

.messages {
  flex: 1;
  width: 100%;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px 20px;
  box-sizing: border-box;
}

.messages-inner {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 12px;
  width: 100%;
  min-height: 100%;
}

.empty {
  margin: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
  color: #858c98;
}
</style>
