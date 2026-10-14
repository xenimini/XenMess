<script setup lang="ts">
import type { User } from "./types/user.ts";
import type { Message } from "./types/messages.ts";
import type { Reaction } from "./types/reactions.ts";
import type { Theme } from "./themes.ts";
import Database from "@tauri-apps/plugin-sql";

import MessageList from "./components/MessageList.vue";
import MessageComposer from "./components/MessageComposer.vue";
import EmojiPanel from "./components/EmojiPanel.vue";
import AppHeader from "./components/AppHeader.vue";
import ThemeSwitcher from "./components/ThemeSwitcher.vue";

import { computed, onMounted, onUnmounted, ref } from "vue";

const currentTheme = ref<Theme>("green");

const applyTheme = (theme: Theme) => {
  currentTheme.value = theme;
  document.documentElement.setAttribute("data-theme", theme);
};

// C:\Users\Komp7\Documents\koval\Proj\Proj\xenimini
type EmojiTarget =
  | { kind: "composer" }
  | { kind: "reaction"; messageId: number };

const AVATARS_KEY = "avatars";
const users = ref<User[]>([
  { id: 1, name: "Oleg", avatar: "" },
  { id: 2, name: "Kirill", avatar: "" },
]);

const currentUser = ref<User>(users.value[0]);

const profileUser = ref<User | null>(null);

function openProfile(author: string) {
  profileUser.value = users.value.find((u) => u.name === author) ?? null;
}

function closeProfile() {
  profileUser.value = null;
}

const editingMessage = ref<Message | null>(null);

const showCelebration = ref(false);

const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

const confettiColors = ['#146ff5', '#dd1a8f', '#ee6f40', '#3adcc8', '#8154e2', '#8b4513'];
const coinColors = ['#ffd700', '#daa520', '#c0c0c0', '#dcdcdc'];

// Генерируем массивы для v-for (оптимизировано: 100 конфетти вместо 400 для производительности)
const confettiItems = Array.from({ length: 100 }, (_, i) => ({
  id: `c-${i}`,
  left: random(0, 100),
  width: random(5, 15),
  height: random(3, 6),
  color: confettiColors[random(0, 5)],
  delay: randomFloat(0, 2),
  duration: randomFloat(3, 5),
  rotation: random(0, 360)
}));

const coinItems = Array.from({ length: 30 }, (_, i) => ({
  id: `coin-${i}`,
  left: random(0, 100),
  size: random(20, 28),
  color: coinColors[random(0, 3)],
  delay: randomFloat(0, 3),
  duration: randomFloat(2, 4)
}));

const dollarItems = Array.from({ length: 50 }, (_, i) => ({
  id: `d-${i}`,
  left: random(0, 100),
  size: random(40, 80),
  delay: randomFloat(0, 3.5),
  duration: randomFloat(4, 8),
  rotationOrigin: `right ${random(-45, -15)}px`
}));

function triggerCelebration() {
  showCelebration.value = true;
  // Скрываем эффект через 6 секунд, чтобы он не работал вечно и не грузил память
  setTimeout(() => {
    showCelebration.value = false;
  }, 6000);
}

function startEditing(message: Message) {
  editingMessage.value = { ...message };
}

function cancelEditing() {
  editingMessage.value = null;
}

async function updateMessage(id: number, body: string) {
  if (!db) return;
  try {
    await db.execute("UPDATE messages SET body = $1 WHERE id = $2", [
      body,
      id,
    ]);
    editingMessage.value = null;
    await loadChat();
  } catch (e) {
    console.error(e);
  }
}

async function sendMessage(body: string) {
  if (!db) return;
  try {
    await db.execute("INSERT INTO messages (author, body) VALUES ($1, $2)", [
      currentUser.value.name,
      body,
    ]);
    await loadChat();
  } catch (e) {
    console.error(e);
  }
}

function onSend(body: string) {
  void sendMessage(body);
}
function loadAvatars() {
  try {
    const saved = JSON.parse(localStorage.getItem(AVATARS_KEY) ?? "{}") as Record<
      string,
      string
    >;

    for (const user of users.value) {
      const avatar = saved[user.id];
      if (typeof avatar === "string") user.avatar = avatar;
    }
  } catch {
    return;
  }
}

function selectUser(user: User) {
  currentUser.value = user;
}

function setAvatar(user: User, path: string) {
  user.avatar = path;

  const saved: Record<number, string> = {};
  for (const item of users.value) {
    saved[item.id] = item.avatar;
  }
  localStorage.setItem(AVATARS_KEY, JSON.stringify(saved));
}

const messages = ref<Message[]>([]);
const reactions = ref<Reaction[]>([]);
const status = ref("Подключение...");
const emojiTarget = ref<EmojiTarget | null>(null);
const composerInsertEmoji = ref<string | null>(null);

let db: Database | null = null;

const emojiPanelTitle = computed(() => {
  if (emojiTarget.value?.kind === "reaction") {
    return "Реакция на сообщение";
  }

  return "Вставить в сообщение";
});

async function loadMessages() {
  if (!db) return;

  messages.value = await db.select<Message[]>(
      "SELECT id, author, body, created_at FROM messages ORDER BY id ASC"
  );
}

async function loadReactions() {
  if (!db) return;

  reactions.value = await db.select<Reaction[]>(
    "SELECT id, message_id, emoji, author FROM message_reactions ORDER BY id ASC",
  );
}

async function loadChat() {
  await Promise.all([loadMessages(), loadReactions()]);
}

async function toggleReaction(messageId: number, emoji: string) {
  if (!db) return;

  const existing = reactions.value.find(
    (reaction) =>
      reaction.message_id === messageId &&
      reaction.emoji === emoji &&
      reaction.author === currentUser.value.name,
  );

  if (existing) {
    await db.execute("DELETE FROM message_reactions WHERE id = $1", [
      existing.id,
    ]);
  } else {
    try {
      await db.execute(
          "INSERT INTO message_reactions (message_id, emoji, author) VALUES ($1, $2, $3)",
        [messageId, emoji, currentUser.value.name],
      );
    } catch (error) {
      console.error(error);
    }
  }

  await loadReactions();
}

function closeEmojiPanel() {
  emojiTarget.value = null;
}

function openComposerEmoji() {
  if (emojiTarget.value?.kind === "composer") {
    closeEmojiPanel();
    return;
  }

  emojiTarget.value = { kind: "composer" };
}

function openReactionEmoji(messageId: number) {
  if (
    emojiTarget.value?.kind === "reaction" &&
    emojiTarget.value.messageId === messageId
  ) {
    closeEmojiPanel();
    return;
  }

  emojiTarget.value = { kind: "reaction", messageId };
}

function onEmojiSelect(emoji: string) {
  const target = emojiTarget.value;
  if (!target) return;

  if (target.kind === "composer") {
    composerInsertEmoji.value = emoji;
    return;
  }

  closeEmojiPanel();
  void toggleReaction(target.messageId, emoji);
}

function onEmojiInserted() {
  composerInsertEmoji.value = null;
}


function onDocumentPointerDown(event: PointerEvent) {
  if (!emojiTarget.value) return;

  const target = event.target;
  if (!(target instanceof Element)) return;

  if (
    target.closest(".emoji-panel, .composer, .quick-reactions, .reaction")
  ) {
    return;
  }

  closeEmojiPanel();
}

onMounted(async () => {
  loadAvatars();
  window.addEventListener("pointerdown", onDocumentPointerDown);

  try {
    db = await Database.load("sqlite:messanger.db");
    await db.execute("PRAGMA foreign_keys = ON");
    await loadChat();
    status.value = "История сохраняется локально";
  } catch (error) {
    console.error(error);
    status.value = "Ошибка подключения к базе";
  }
});

onUnmounted(() => {
  window.removeEventListener("pointerdown", onDocumentPointerDown);
});
</script>

<template>
  <main class="app" :data-theme="currentTheme">
    <div class="top-bar">
      <ThemeSwitcher @theme-changed="applyTheme" />
    </div>

    <AppHeader
        :status="status"
        :users="users"
        :current-user="currentUser"
        @select="selectUser"
        @set-avatar="setAvatar"
    />

    <section class="chat">
      <div class="chat-info">
        <h2>Первый чат</h2>
        <p>локальный мессенджер</p>
      </div>

      <MessageList
          :messages="messages"
          :reactions="reactions"
          :users="users"
          :current-user-name="currentUser.name"
          :reaction-message-id="emojiTarget?.kind === 'reaction' ? emojiTarget.messageId : null"
          :editing-message-id="editingMessage?.id ?? null"
          @toggle-reaction="toggleReaction"
          @request-reaction="openReactionEmoji"
          @request-edit="startEditing"
          @view-profile="openProfile"
      />

      <EmojiPanel
          v-if="emojiTarget"
          :title="emojiPanelTitle"
          @select="onEmojiSelect"
          @close="closeEmojiPanel"
      />

      <MessageComposer
          :insert-emoji="composerInsertEmoji"
          :emoji-open="emojiTarget?.kind === 'composer'"
          :editing-message="editingMessage"
          @send="onSend"
          @update="updateMessage"
          @cancel-edit="cancelEditing"
          @request-emoji="openComposerEmoji"
          @emoji-inserted="onEmojiInserted"
      />
    </section>

    <div v-if="profileUser" class="profile-modal" @click.self="closeProfile">
      <div class="profile-card">
        <button class="profile-close" @click="closeProfile">✕</button>
        <div class="profile-avatar">
          <img v-if="profileUser.avatar" :src="profileUser.avatar" alt="" />
          <span v-else>{{ profileUser.name[0] }}</span>
        </div>
        <h3>{{ profileUser.name }}</h3>
        <p>Участник чата</p>
      </div>
    </div>

    <div v-if="showCelebration" class="celebration-container">
      <div
          v-for="item in coinItems"
          :key="item.id"
          class="falling-coin"
          :style="{
          left: item.left + '%',
          width: item.size + 'px',
          height: item.size + 'px',
          backgroundColor: item.color,
          animationDelay: item.delay + 's',
          animationDuration: item.duration + 's'
        }"
      >
        <span>$</span>
      </div>

      <div
          v-for="item in dollarItems"
          :key="item.id"
          class="falling-dollar"
          :style="{
          left: item.left + '%',
          width: item.size + 'px',
          height: item.size + 'px',
          animationDelay: item.delay + 's',
          animationDuration: item.duration + 's',
          transformOrigin: item.rotationOrigin
        }"
      ></div>

      <div
          v-for="item in confettiItems"
          :key="item.id"
          class="falling-confetti"
          :style="{
          left: item.left + '%',
          width: item.width + 'px',
          height: item.height + 'px',
          backgroundColor: item.color,
          animationDelay: item.delay + 's',
          animationDuration: item.duration + 's',
          transform: `rotate(${item.rotation}deg)`
        }"
      ></div>
    </div>
  </main>
</template>

<style scoped>
:global(*) {
  box-sizing: border-box;
}
:global(html[data-theme="green"]) {
  background: linear-gradient(160deg, #0b1f14 0%, #0f2e1c 45%, #14532d 100%);
  background-attachment: fixed;
  color: #ffffff;
  --msg-own: #1b5e20;
  --msg-other: #2e7d32;
  --msg-text: #ffffff;
}

:global(html[data-theme="green"]) {
  background: linear-gradient(160deg, #0b1f14 0%, #0f2e1c 45%, #14532d 100%);
  background-attachment: fixed;
  color: #ffffff;
  --msg-own: #1b5e20;
  --msg-other: #2e7d32;
  --msg-text: #ffffff;
}

:global(html[data-theme="blue"]) {
  background: linear-gradient(160deg, #d6f0ff 0%, #b3e5fc 50%, #e1f5fe 100%);
  background-attachment: fixed;
  color: #0d1b2a;
  --msg-own: #4fc3f7;
  --msg-other: #e1f5fe;
  --msg-text: #0d1b2a;
}

:global(html[data-theme="orange"]) {
  background: linear-gradient(160deg, #7c6156 0%, #d16221 45%, #ff5e00 100%);
  background-attachment: fixed;
  color: #ffffff;
  --msg-own: #000000;
  --msg-other: #1a1a1a;
  --msg-text: #ffffff;
}

@keyframes rainbow-gradient {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

:global(body) {
  margin: 0;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  color: #f2f3f5;
}

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/*  ВЕРХНЯЯ ПАНЕЛЬ С ПЕРЕКЛЮЧАТЕЛЕМ ТЕМ */
.top-bar {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.chat {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chat-info {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(143, 150, 163, 0.5);
}

.chat-info h2 {
  margin: 0;
  font-size: 16px;
}

.chat-info p {
  margin: 5px 0 0;
  color: #cfd2d9;
  font-size: 13px;
}
.profile-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.profile-card {
  background: #1e1e2f;
  color: #fff;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
  min-width: 220px;
  position: relative;
}

.profile-close {
  position: absolute;
  top: 8px;
  right: 10px;
  background: none;
  border: none;
  color: #aaa;
  font-size: 18px;
  cursor: pointer;
}

.profile-avatar {
  width: 72px;
  height: 72px;
  margin: 0 auto 12px;
  border-radius: 50%;
  overflow: hidden;
  background: #343842;
  display: grid;
  place-items: center;
  font-size: 28px;
  font-weight: 600;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

</style>


