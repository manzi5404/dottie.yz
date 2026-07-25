<template>
  <div class="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">Payment <span class="text-blue-500">Orders</span></h2>
        <p class="text-sm text-slate-500 mt-1 max-w-2xl">Track WhatsApp payment verification without changing checkout logic.</p>
      </div>
      <button @click="fetchOrders" class="self-start sm:self-auto p-2 text-slate-500 hover:text-white transition-colors" title="Refresh orders">
        <svg class="w-5 h-5 focus:animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <div v-if="error" class="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
      {{ error }}
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div
        v-for="status in orderStatuses"
        :key="status"
        class="bg-zinc-900/50 border border-slate-800 rounded-2xl p-5 shadow-xl"
      >
        <p class="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">{{ status }}</p>
        <p class="text-3xl font-bold text-white mt-2">{{ getStatusCount(status) }}</p>
      </div>
    </div>

    <div class="bg-zinc-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table class="min-w-[860px] w-full text-left border-collapse">
          <thead>
            <tr class="bg-black/50 border-b border-slate-800">
              <th class="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Customer</th>
              <th class="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Order</th>
              <th class="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Payment</th>
              <th class="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Status</th>
              <th class="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Date</th>
              <th class="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/30">
            <template v-if="orders.length > 0">
              <tr v-for="order in orders" :key="order.id" class="hover:bg-slate-800/30 transition-colors group">
                <td class="px-4 sm:px-6 py-5">
                  <div class="font-bold text-slate-100">{{ getCustomerName(order) }}</div>
                  <div class="text-xs text-slate-500 mt-0.5 break-all">{{ getCustomerEmail(order) }}</div>
                  <div v-if="getCustomerPhone(order)" class="text-[10px] text-slate-600 font-mono mt-1 break-all">{{ getCustomerPhone(order) }}</div>
                </td>
                <td class="px-4 sm:px-6 py-5">
                  <div class="flex items-start gap-3 sm:gap-4 min-w-[220px]">
                    <div class="w-10 h-12 bg-zinc-800 border border-slate-700 overflow-hidden flex-shrink-0">
                      <img v-if="getProductImage(order)" :src="getProductImage(order)" class="w-full h-full object-cover">
                      <div v-else class="w-full h-full flex items-center justify-center text-[8px] text-slate-600">NO IMG</div>
                    </div>
                    <div class="min-w-0">
                      <div class="text-sm font-medium text-slate-300">{{ getProductName(order) }}</div>
                      <div class="flex flex-wrap gap-2 mt-1">
                        <span v-if="order.size" class="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">Size: {{ order.size }}</span>
                        <span v-if="order.color" class="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">Color: {{ order.color }}</span>
                        <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">Qty: {{ order.quantity || 1 }}</span>
                        <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">#{{ order.id }}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-4 sm:px-6 py-5 whitespace-nowrap">
                  <div class="text-sm font-bold text-fof-accent">{{ formatCurrency(order.total_price) }}</div>
                  <div class="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{{ order.payment_method || 'momo' }}</div>
                </td>
                <td class="px-4 sm:px-6 py-5 text-xs whitespace-nowrap">
                  <span :class="getStatusClass(order.status)">{{ order.status }}</span>
                </td>
                <td class="px-4 sm:px-6 py-5 text-xs text-slate-500 font-mono whitespace-nowrap">
                  {{ formatDate(order.created_at || order.createdAt) }}
                </td>
                <td class="px-4 sm:px-6 py-5 text-right">
                  <div class="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <select
                      @change="updateStatus(order.id, $event.target.value)"
                      :value="order.status"
                      class="bg-black border border-slate-800 text-[10px] uppercase tracking-widest px-2 py-1.5 focus:border-blue-500 outline-none rounded-lg"
                    >
                      <option v-for="status in orderStatuses" :key="status" :value="status">{{ status }}</option>
                    </select>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="6" class="px-4 sm:px-6 py-16 sm:py-20 text-center">
                <div class="text-slate-600 space-y-2">
                  <svg class="w-10 h-10 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 14l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p class="text-sm uppercase tracking-widest font-bold opacity-50">No orders found</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import DropService from './DropService';

const orders = ref([]);
const emit = defineEmits(['updated']);
const error = ref('');
const orderStatuses = ['pending_payment', 'pending', 'confirmed', 'completed', 'cancelled'];

const fetchOrders = async () => {
  error.value = '';
  try {
    const data = await DropService.getOrders();
    orders.value = Array.isArray(data) ? data.filter(order => (order.payment_method || '').toLowerCase() === 'momo') : [];
  } catch (err) {
    console.error('Failed to load orders:', err);
    error.value = err?.response?.data?.message || err?.message || 'Failed to load orders. Check console for details.';
  }
};

const updateStatus = async (id, status) => {
  console.log('[FRONTEND] Updating order status:', { id, status });
  try {
    await DropService.updateOrderStatus(id, status);
    emit('updated', { message: 'Order status updated!', type: 'success' });
    await fetchOrders();
  } catch (error) {
    console.error('[FRONTEND] Status update failed:', error);
    const msg = error?.response?.data?.error || error?.message || 'Failed to update order status.';
    emit('updated', { message: msg, type: 'error' });
  }
};

const getStatusCount = (status) => orders.value.filter(order => order.status === status).length;

const getCustomerName = (order) => order.customer_name || order.user_display_name || 'Guest';
const getCustomerEmail = (order) => order.customer_email || order.user_display_email || 'N/A';
const getCustomerPhone = (order) => order.phone_number || '';

const getProductName = (order) => order.product_name || 'Multiple Products';

const getProductImage = (order) => {
  const items = order.order_items || [];
  const firstItem = items[0] || {};
  const rawImages = firstItem.product_image_urls || order.product_image_urls;

  if (Array.isArray(rawImages) && rawImages.length > 0) {
    return rawImages[0];
  }

  if (typeof rawImages === 'string' && rawImages.trim() !== '') {
    try {
      const parsed = JSON.parse(rawImages);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed[0];
      }
    } catch {
      return rawImages;
    }
  }

  return null;
};

const getStatusClass = (status) => {
  const base = 'px-2 py-0.5 rounded-full font-bold uppercase tracking-widest text-[9px] ';
  switch (status) {
    case 'pending_payment': return base + 'bg-orange-500/10 text-orange-400 border border-orange-500/20';
    case 'pending': return base + 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    case 'confirmed': return base + 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
    case 'completed': return base + 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    case 'cancelled': return base + 'bg-red-500/10 text-red-500 border border-red-500/20';
    default: return base + 'bg-slate-800 text-slate-400';
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const formatCurrency = (value) => `${Number(value || 0).toFixed(2)} FRW`;

onMounted(fetchOrders);
</script>