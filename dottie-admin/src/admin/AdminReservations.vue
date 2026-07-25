<template>
  <div class="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-xl sm:text-2xl font-bold text-white tracking-tight">Product <span class="text-blue-500">Reservations</span></h2>
      <button @click="fetchReservations" class="self-start sm:self-auto p-2 text-slate-500 hover:text-white transition-colors">
        <svg class="w-5 h-5 focus:animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <div class="bg-zinc-900/50 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      <div class="overflow-x-auto">
        <table class="min-w-[820px] w-full text-left border-collapse">
          <thead>
            <tr class="bg-black/50 border-b border-slate-800">
              <th class="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Customer</th>
              <th class="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Product / Details</th>
              <th class="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Status</th>
              <th class="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Date</th>
              <th class="px-4 sm:px-6 py-4 text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/30">
            <template v-if="reservations.length > 0">
              <tr v-for="res in reservations" :key="res.id" class="hover:bg-slate-800/30 transition-colors group">
                <td class="px-4 sm:px-6 py-5">
                  <div class="font-bold text-slate-100">{{ getCustomerName(res) }}</div>
                  <div class="text-xs text-slate-500 mt-0.5 break-all">{{ getCustomerEmail(res) }}</div>
                  <div class="text-[10px] text-slate-600 font-mono mt-1 break-all" v-if="getCustomerPhone(res)">{{ getCustomerPhone(res) }}</div>
                </td>
                <td class="px-4 sm:px-6 py-5">
                  <div class="flex items-start gap-3 sm:gap-4 min-w-[220px]">
                    <div class="w-10 h-12 bg-zinc-800 border border-slate-700 overflow-hidden flex-shrink-0">
                      <img v-if="getProductImage(res)" :src="getProductImage(res)" class="w-full h-full object-cover">
                      <div v-else class="w-full h-full flex items-center justify-center text-[8px] text-slate-600">NO IMG</div>
                    </div>
                    <div class="min-w-0">
                      <div class="text-sm font-medium text-slate-300">{{ getProductName(res) }}</div>
                      <div class="flex flex-wrap gap-2 mt-1">
                        <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">Size: {{ res.size }}</span>
                        <span v-if="getProductQuality(res)" class="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">Quality: {{ getProductQuality(res) }}</span>
                        <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded">Qty: {{ res.quantity }}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-4 sm:px-6 py-5 text-xs whitespace-nowrap">
                  <span :class="getStatusClass(res.status)">{{ res.status }}</span>
                </td>
                <td class="px-4 sm:px-6 py-5 text-xs text-slate-500 font-mono whitespace-nowrap">
                  {{ formatDate(res.created_at || res.createdAt) }}
                </td>
                <td class="px-4 sm:px-6 py-5 text-right">
                  <div class="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <select 
                      @change="updateStatus(res.id, $event.target.value)"
                      :value="res.status"
                      class="bg-black border border-slate-800 text-[10px] uppercase tracking-widest px-2 py-1.5 focus:border-blue-500 outline-none rounded-lg"
                    >
                      <option v-for="s in reservationStatuses" :key="s" :value="s">{{ s }}</option>
                    </select>
                  </div>
                </td>
              </tr>
            </template>
            <tr v-else>
              <td colspan="5" class="px-4 sm:px-6 py-16 sm:py-20 text-center">
                <div class="text-slate-600 space-y-2">
                  <svg class="w-10 h-10 mx-auto opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p class="text-sm uppercase tracking-widest font-bold opacity-50">No reservations found</p>
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
import { ref, onMounted } from 'vue';
import DropService from './DropService';

const reservations = ref([]);
const emit = defineEmits(['updated']);
const reservationStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

const fetchReservations = async () => {
  try {
    reservations.value = await DropService.getReservations();
  } catch (error) {
    console.error('Failed to load reservations');
  }
};

const updateStatus = async (id, status) => {
  try {
    await DropService.updateReservationStatus(id, status);
    emit('updated', { message: 'Reservation status updated!', type: 'success' });
    await fetchReservations();
  } catch (error) {
    emit('updated', { message: 'Failed to update status.', type: 'error' });
  }
};

const getCustomerName = (reservation) => reservation.user?.name || reservation.fullName || reservation.userName || 'Guest';
const getCustomerEmail = (reservation) => reservation.user?.email || reservation.email || reservation.userEmail || 'N/A';
const getCustomerPhone = (reservation) => reservation.user?.phone || reservation.phone || '';
const getProductName = (reservation) => reservation.product?.name || reservation.productName || 'Unknown Product';
const getProductQuality = (reservation) => reservation.quality?.name || reservation.quality_name || '';

const getProductImage = (reservation) => {
  const rawImages = reservation.product?.image_urls || reservation.productImageUrls;

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

  return reservation.product?.image_url || null;
};

const getStatusClass = (status) => {
  const base = 'px-2 py-0.5 rounded-full font-bold uppercase tracking-widest text-[9px] ';
  switch (status) {
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

onMounted(fetchReservations);
</script>