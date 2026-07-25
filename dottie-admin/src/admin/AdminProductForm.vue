<template>
  <div class="bg-slate-800/50 rounded-xl border border-slate-700 p-6 space-y-6">
    <div class="flex justify-between items-center">
      <h3 class="text-lg font-semibold text-white">{{ isEditing ? 'Edit Product' : 'Add Product to Collection' }}</h3>
      <button @click="$emit('cancel')" class="text-slate-400 hover:text-white transition-colors">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-400">Product Name</label>
        <input 
          type="text"
          v-model="productData.name"
          :class="['w-full bg-slate-900 border text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all', errors.name ? 'border-red-500' : 'border-slate-700']"
          placeholder="E.g., Heavyweight Tee"
        />
      </div>
      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-400">Base Price ($)</label>
        <input 
          type="number"
          step="0.01"
          v-model="productData.price"
          :class="['w-full bg-slate-900 border text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all', errors.price ? 'border-red-500' : 'border-slate-700']"
          placeholder="0.00"
        />
        <p class="text-[10px] text-slate-500">Used as a fallback. The three quality inputs below are what the admin portal sends in <code>quality_prices</code>.</p>
      </div>
    </div>

    <div class="space-y-3">
      <label class="text-sm font-medium text-slate-400">Default Quality Level</label>
      <div class="flex gap-3">
        <button type="button" @click="productData.default_quality_level = 'basic'"
          :class="productData.default_quality_level === 'basic' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'"
          class="flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all">
          Basic
        </button>
        <button type="button" @click="productData.default_quality_level = 'premium'"
          :class="productData.default_quality_level === 'premium' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'"
          class="flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all">
          Premium
        </button>
        <button type="button" @click="productData.default_quality_level = 'luxe'"
          :class="productData.default_quality_level === 'luxe' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-600'"
          class="flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all">
          Luxe
        </button>
      </div>
    </div>

    <div class="space-y-3">
      <label class="text-sm font-medium text-slate-400">Quality Level Prices (FRW)</label>
      <div class="grid grid-cols-3 gap-4">
        <div v-for="level in qualityLevels" :key="level.id" class="space-y-1">
          <label class="text-xs font-bold uppercase tracking-widest text-slate-500">{{ level.name }}</label>
          <input
            type="number"
            step="0.01"
            min="0"
            :placeholder="level.name + ' price'"
            :value="getQualityPrice(level.id)"
            @input="setQualityPrice(level.id, $event.target.value)"
            class="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
        </div>
      </div>
    </div>

    <div class="space-y-2">
      <label class="text-sm font-medium text-slate-400">Description</label>
      <textarea 
        v-model="productData.description"
        rows="2"
        class="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
        placeholder="Product details..."
      ></textarea>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="space-y-2">
        <label class="text-sm font-medium text-slate-400">Colors (Comma separated)</label>
        <input 
          type="text"
          v-model="colorsInput"
          class="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          placeholder="Black, White, Beige"
        />
      </div>
      <div class="flex items-end pb-2">
        <label class="flex items-center gap-3 cursor-pointer group">
          <input 
            type="checkbox"
            v-model="productData.is_active"
            class="w-5 h-5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all"
          />
          <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Active</span>
        </label>
      </div>
    </div>

    <SizeSelector v-model="productData.sizes" />

    <ImageUploader v-model:images="productData.image_urls" />

    <div class="flex justify-end gap-3 pt-4 border-t border-slate-700">
      <button 
        type="button" 
        @click="$emit('cancel')"
        class="px-6 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all font-medium text-sm"
      >
        Cancel
      </button>
      <button 
        type="button" 
        @click="handleSave"
        class="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all text-sm shadow-lg shadow-blue-600/20"
      >
        {{ isEditing ? 'Update Item' : 'Add Item' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';
import SizeSelector from './SizeSelector.vue';
import ImageUploader from './ImageUploader.vue';

const props = defineProps({
  initialData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['save', 'cancel']);

const productData = reactive({
  name: '',
  price: 0,
  description: '',
  sizes: ['S', 'M', 'L', 'XL'],
  colors: [],
  image_urls: [],
  is_active: true,
  default_quality_level: 'basic'
});

const colorsInput = ref('');
const errors = reactive({});
const isEditing = ref(false);

const qualityLevels = [
  { id: 1, name: 'Basic' },
  { id: 2, name: 'Premium' },
  { id: 3, name: 'Luxe' }
];

const qualityPrices = ref([]);

const getQualityPrice = (levelId) => {
  const entry = qualityPrices.value.find(q => q.quality_level_id === levelId);
  return entry ? entry.price : '';
};

const setQualityPrice = (levelId, value) => {
  const price = parseFloat(value);
  qualityPrices.value = qualityPrices.value.filter(q => q.quality_level_id !== levelId);
  if (price > 0) qualityPrices.value.push({ quality_level_id: levelId, price });
};

const nameToId = { 'Basic': 1, 'Premium': 2, 'Luxe': 3 };

const applyInitialData = (initialData) => {
  Object.assign(productData, {
    name: '',
    price: 0,
    description: '',
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [],
    image_urls: [],
    is_active: true,
    default_quality_level: 'basic',
    ...(initialData || {})
  });

  isEditing.value = !!initialData?.id || !!initialData?.tempId;
  productData.default_quality_level = initialData?.default_quality_level || (initialData?.default_quality_level_id === 2 ? 'premium' : initialData?.default_quality_level_id === 3 ? 'luxe' : 'basic');
  colorsInput.value = Array.isArray(productData.colors) ? productData.colors.join(', ') : '';
  qualityPrices.value = (initialData?.quality_prices || []).map(q => ({
    quality_level_id: q.quality_level_id || nameToId[q.quality_name],
    price: parseFloat(q.price)
  })).filter(q => q.quality_level_id && q.price > 0);
};

watch(() => props.initialData, applyInitialData, { immediate: true });

const handleSave = () => {
  errors.name = !productData.name ? 'Required' : '';
  const hasQualityPrices = qualityPrices.value.length > 0;
  errors.price = (!hasQualityPrices && productData.price <= 0) ? 'Invalid' : '';
  
  if (errors.name || errors.price) return;

  productData.colors = colorsInput.value.split(',').map(c => c.trim()).filter(Boolean);
  const essentialQp = qualityPrices.value.find(q => q.quality_level_id === 1);
  if (essentialQp && productData.price <= 0) productData.price = essentialQp.price;
  const levelId = nameToId[productData.default_quality_level] || 1;
  emit('save', { ...productData, default_quality_level_id: levelId, quality_prices: qualityPrices.value });
};
</script>
