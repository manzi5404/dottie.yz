<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h2 class="text-xl font-bold text-white">Contact Messages</h2>
        <p class="text-slate-500 text-sm">Manage customer inquiries and feedback</p>
      </div>
      <div class="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
        <select
          v-model="statusFilter"
          @change="fetchMessages"
          class="w-full sm:w-auto bg-black border border-slate-800 text-slate-300 text-sm px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="">All Status</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
          <option value="replied">Replied</option>
        </select>
        <button
          @click="fetchMessages"
          class="self-start sm:self-auto p-2 text-slate-500 hover:text-white transition-colors"
          title="Refresh"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Messages Table -->
    <div class="bg-zinc-900/50 border border-slate-800 rounded-xl overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-[760px] w-full">
          <thead class="bg-black/50">
            <tr class="text-left text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              <th class="px-4 sm:px-6 py-4">Status</th>
              <th class="px-4 sm:px-6 py-4">From</th>
              <th class="px-4 sm:px-6 py-4">Subject</th>
              <th class="px-4 sm:px-6 py-4">Date</th>
              <th class="px-4 sm:px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800">
            <tr
              v-for="msg in messages"
              :key="msg.id"
              :class="[
                'hover:bg-slate-800/30 transition-colors cursor-pointer',
                msg.status === 'unread' ? 'bg-blue-500/5' : ''
              ]"
              @click="openMessage(msg)"
            >
              <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                <span
                  :class="[
                    'inline-flex items-center px-2 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold',
                    msg.status === 'unread' ? 'bg-blue-500/20 text-blue-400' :
                    msg.status === 'read' ? 'bg-slate-700 text-slate-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  ]"
                >
                  {{ msg.status }}
                </span>
              </td>
              <td class="px-4 sm:px-6 py-4">
                <p class="text-sm font-medium text-white">{{ msg.name }}</p>
                <p class="text-xs text-slate-500 break-all">{{ msg.email }}</p>
              </td>
              <td class="px-4 sm:px-6 py-4">
                <p class="text-sm text-slate-300">{{ msg.subject || 'General Inquiry' }}</p>
              </td>
              <td class="px-4 sm:px-6 py-4 whitespace-nowrap">
                <p class="text-sm text-slate-500">{{ formatDate(msg.created_at) }}</p>
              </td>
              <td class="px-4 sm:px-6 py-4 text-right" @click.stop>
                <select
                  :value="msg.status"
                  @change="updateStatus(msg.id, $event.target.value)"
                  class="bg-black border border-slate-800 text-slate-300 text-xs px-3 py-1.5 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="unread">Unread</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                </select>
              </td>
            </tr>
            <tr v-if="messages.length === 0">
              <td colspan="5" class="px-4 sm:px-6 py-12 text-center text-slate-500">
                No messages found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Message Detail Modal -->
    <div
      v-if="selectedMessage"
      class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      @click.self="selectedMessage = null"
    >
      <div class="bg-zinc-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden">
        <!-- Modal Header -->
        <div class="flex items-start justify-between gap-4 px-4 sm:px-6 py-4 border-b border-slate-800">
          <div class="min-w-0">
            <h3 class="text-base sm:text-lg font-bold text-white break-words">{{ selectedMessage.subject || 'General Inquiry' }}</h3>
            <p class="text-sm text-slate-500 break-all">From: {{ selectedMessage.name }} <{{ selectedMessage.email }}></p>
          </div>
          <button
            @click="selectedMessage = null"
            class="p-2 text-slate-500 hover:text-white transition-colors flex-shrink-0"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="px-4 sm:px-6 py-4 overflow-y-auto max-h-[65vh]">
          <div class="flex flex-wrap items-center gap-3 sm:gap-4 mb-4">
            <span
              :class="[
                'inline-flex items-center px-2 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold',
                selectedMessage.status === 'unread' ? 'bg-blue-500/20 text-blue-400' :
                selectedMessage.status === 'read' ? 'bg-slate-700 text-slate-400' :
                'bg-emerald-500/20 text-emerald-400'
              ]"
            >
              {{ selectedMessage.status }}
            </span>
            <span class="text-xs text-slate-500">{{ formatDate(selectedMessage.created_at) }}</span>
          </div>

          <div class="bg-black/30 rounded-xl p-4">
            <p class="text-slate-300 whitespace-pre-wrap break-words">{{ selectedMessage.message }}</p>
          </div>

          <!-- Quick Actions -->
          <div class="flex flex-col sm:flex-row gap-3 mt-6 pt-4 border-t border-slate-800">
            <a
              :href="`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject || 'General Inquiry'}`"
              class="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold uppercase tracking-widest py-3 rounded-xl text-center transition-colors"
            >
              Reply via Email
            </a>
            <button
              v-if="selectedMessage.status !== 'read'"
              @click="updateStatus(selectedMessage.id, 'read'); selectedMessage = null"
              class="w-full sm:w-auto px-6 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold uppercase tracking-widest py-3 rounded-xl transition-colors"
            >
              Mark as Read
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DropService from './DropService';

const messages = ref([]);
const statusFilter = ref('');
const selectedMessage = ref(null);
const loading = ref(false);

const emit = defineEmits(['updated']);

const fetchMessages = async () => {
  loading.value = true;
  try {
    const data = await DropService.getMessages(statusFilter.value);
    messages.value = data.messages || [];
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    emit('updated', { message: 'Failed to load messages', type: 'error' });
  } finally {
    loading.value = false;
  }
};

const openMessage = (msg) => {
  selectedMessage.value = msg;
  if (msg.status === 'unread') {
    updateStatus(msg.id, 'read');
  }
};

const updateStatus = async (id, status) => {
  try {
    await DropService.updateMessageStatus(id, status);
    const msgIndex = messages.value.findIndex(m => m.id === id);
    if (msgIndex !== -1) {
      messages.value[msgIndex].status = status;
    }
    if (selectedMessage.value && selectedMessage.value.id === id) {
      selectedMessage.value.status = status;
    }
    emit('updated', { message: 'Status updated', type: 'success' });
  } catch (error) {
    console.error('Failed to update status:', error);
    emit('updated', { message: 'Failed to update status', type: 'error' });
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

onMounted(fetchMessages);
</script>