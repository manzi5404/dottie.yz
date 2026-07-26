<template>
  <div class="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
    <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
      <div :class="['w-2 h-2 rounded-full', initialData ? 'bg-blue-500' : 'bg-emerald-500']"></div>
      {{ isDropMode ? (initialData ? 'Edit Drop' : 'Create New Drop') : (initialData ? 'Edit Collection' : 'Create New Collection') }}
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-8">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-400">{{ isDropMode ? 'Drop Name' : 'Collection Name' }}</label>
          <input
            type="text"
            v-model="formData.name"
            :class="['w-full bg-slate-800 border text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all', errors.name ? 'border-red-500' : 'border-slate-700']"
            :placeholder="isDropMode ? 'E.g., Origins Summer 2026' : 'E.g., Summer Essentials'"
          />
          <p v-if="errors.name" class="text-red-500 text-xs mt-1">{{ errors.name }}</p>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-400">Description</label>
          <input
            type="text"
            v-model="formData.description"
            class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Short description"
          />
        </div>
      </div>

      <!-- Drop-specific fields -->
      <div v-if="isDropMode" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-400">Drop Image</label>
          <div class="space-y-3">
            <div v-if="formData.image_url" class="relative w-full h-32 rounded-lg overflow-hidden border border-slate-700">
              <img :src="formData.image_url" alt="Preview" class="w-full h-full object-cover" />
              <button @click="formData.image_url = ''" type="button" class="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div class="flex items-center gap-3">
              <label class="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-700 transition-all text-sm font-medium">
                <input type="file" accept="image/*" class="hidden" @change="handleImageUpload" />
                Upload Image
              </label>
              <span v-if="uploadingImage" class="text-xs text-slate-400">Uploading...</span>
            </div>
            <input
              type="text"
              v-model="formData.image_url"
              class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              placeholder="Or paste image URL directly"
            />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-400">Type</label>
          <select
            v-model="formData.type"
            class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          >
            <option value="new-drop">New Arrival</option>
            <option value="recent-drop">Lookbook / Recent</option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-400">Release Date</label>
          <input
            type="datetime-local"
            v-model="formData.release_date"
            class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-400">Close Date (optional)</label>
          <input
            type="datetime-local"
            v-model="formData.close_date"
            class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <div class="flex items-center gap-6">
        <label class="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            v-model="formData.status"
            :true-value="'live'"
            :false-value="'upcoming'"
            class="w-5 h-5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 transition-all"
          />
          <span class="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Published</span>
        </label>
      </div>

      <!-- Products Section (Drop mode only) -->
      <div v-if="isDropMode" class="space-y-4 pt-6 border-t border-slate-800">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-white flex items-center gap-2">
            Products In This Drop
            <span class="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700">{{ formData.products.length }}</span>
          </h3>
          <button
            type="button"
            @click="addProduct"
            class="text-xs font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400 flex items-center gap-1.5 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        <!-- Products List -->
        <div v-if="formData.products.length > 0" class="space-y-4">
          <div
            v-for="(product, index) in formData.products"
            :key="product.tempId || index"
            class="bg-slate-800/30 border border-slate-800 rounded-lg p-4 space-y-4"
          >
            <div class="flex justify-between items-start">
              <h4 class="text-sm font-bold text-white">Product {{ index + 1 }}</h4>
              <button @click="removeProduct(index)" type="button" class="text-slate-400 hover:text-red-400 transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 3h.01" />
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-xs font-medium text-slate-400">Product Name</label>
                <input
                  type="text"
                  v-model="product.name"
                  class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="E.g., Origins Tee"
                />
              </div>

              <div class="space-y-2">
                <label class="text-xs font-medium text-slate-400">Base Price (FRW)</label>
                <input
                  type="number"
                  v-model="product.price"
                  class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="15000"
                />
              </div>

              <div class="space-y-2 md:col-span-2">
                <label class="text-xs font-medium text-slate-400">Sizes Available</label>
                <div class="flex flex-wrap gap-3">
                  <label v-for="s in ['XS', 'S', 'M', 'L', 'XL', 'XXL']" :key="s" class="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" :value="s" v-model="product.sizes" class="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900" />
                    <span class="text-sm text-slate-300 group-hover:text-white transition-colors">{{ s }}</span>
                  </label>
                </div>
              </div>

              <div class="space-y-2 md:col-span-2">
                <label class="text-xs font-medium text-slate-400">Colors Available (comma separated)</label>
                <input
                  type="text"
                  v-model="product.colorsInput"
                  class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Black, White, Beige"
                />
              </div>

              <div class="space-y-2">
                <label class="text-xs font-medium text-slate-400">Quantity</label>
                <input
                  type="number"
                  v-model="product.quantity"
                  class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="10"
                />
              </div>

              <div class="space-y-2 md:col-span-2">
                <label class="text-xs font-medium text-slate-400">Description</label>
                <input
                  type="text"
                  v-model="product.description"
                  class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Premium heavyweight tee"
                />
              </div>

              <!-- Multiple Images -->
              <div class="space-y-2 md:col-span-2">
                <label class="text-xs font-medium text-slate-400">Product Images (front, back, etc.)</label>
                <div class="flex flex-wrap gap-3 mb-3">
                  <label v-for="(img, imgIndex) in product.image_urls" :key="imgIndex" class="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-700 group">
                    <img :src="img" class="w-full h-full object-cover" />
                    <button type="button" @click="product.image_urls.splice(imgIndex, 1)" class="absolute inset-0 bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold">Remove</button>
                  </label>
                  <label v-if="product.image_urls.length === 0" class="w-20 h-20 rounded-lg border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-[10px] cursor-pointer hover:border-slate-500 transition-colors">
                    <input type="file" accept="image/*" multiple class="hidden" @change="(e) => handleMultipleImageUpload(e, index)" />
                    + Add
                  </label>
                </div>
                <div class="flex gap-2">
                  <label class="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-700 transition-all text-xs font-medium">
                    <input type="file" accept="image/*" multiple class="hidden" @change="(e) => handleMultipleImageUpload(e, index)" />
                    Upload Images
                  </label>
                  <span v-if="product.uploading" class="text-xs text-slate-400 self-center">Uploading...</span>
                </div>
                <div class="space-y-2 mt-2">
                  <div v-for="(img, imgIndex) in product.image_urls" :key="'url-' + imgIndex" class="flex gap-2">
                    <input type="text" v-model="product.image_urls[imgIndex]" class="flex-1 bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Image URL" />
                    <button type="button" @click="product.image_urls.splice(imgIndex, 1)" class="text-xs text-red-400 hover:text-red-300 px-2">Remove</button>
                  </div>
                  <button type="button" @click="product.image_urls.push('')" class="text-xs text-blue-500 hover:text-blue-400 font-medium">+ Add Image URL</button>
                </div>
              </div>

              <!-- Quality Level Selector -->
              <div class="space-y-2 md:col-span-2">
                <label class="text-xs font-medium text-slate-400">Default Quality Level</label>
                <div class="flex gap-3">
                  <button type="button" @click="product.default_quality_level = 'basic'"
                    :class="product.default_quality_level === 'basic' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'"
                    class="flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all">
                    Basic
                  </button>
                  <button type="button" @click="product.default_quality_level = 'premium'"
                    :class="product.default_quality_level === 'premium' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'"
                    class="flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all">
                    Premium
                  </button>
                  <button type="button" @click="product.default_quality_level = 'luxe'"
                    :class="product.default_quality_level === 'luxe' ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600'"
                    class="flex-1 px-4 py-2.5 rounded-lg border text-xs font-bold uppercase tracking-widest transition-all">
                    Luxe
                  </button>
                </div>
              </div>

              <!-- Quality Prices -->
              <div class="space-y-2 md:col-span-2">
                <label class="text-xs font-medium text-slate-400">Quality Prices (FRW)</label>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                     <span class="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Basic</span>
                    <input type="number" v-model="product.quality_prices.essential" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" placeholder="15000" />
                  </div>
                  <div>
                    <span class="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Premium</span>
                    <input type="number" v-model="product.quality_prices.premium" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" placeholder="25000" />
                  </div>
                  <div>
                    <span class="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Luxe</span>
                    <input type="number" v-model="product.quality_prices.luxe" class="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1" placeholder="40000" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="border-2 border-dashed border-slate-800 rounded-xl py-12 text-center text-slate-600">
          <p class="text-sm italic">No products added to this drop yet.</p>
          <button @click="addProduct" type="button" class="mt-2 text-blue-500 hover:text-blue-400 font-bold hover:underline">Click here to add products</button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex justify-end gap-3 pt-6 border-t border-slate-800">
        <button
          type="button"
          @click="$emit('cancel')"
          class="px-8 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all font-medium"
        >
          Discard
        </button>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="px-8 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95 disabled:opacity-50"
        >
          <span v-if="isSubmitting" class="flex items-center gap-2">
             <svg class="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
               <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
               <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
             </svg>
             Processing...
          </span>
          <span v-else>{{ initialData ? (isDropMode ? 'Update Drop' : 'Update Collection') : (isDropMode ? 'Create Drop' : 'Create Collection') }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';

const props = defineProps({
  mode: {
    type: String,
    default: 'collection'
  },
  initialData: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['submit', 'cancel']);

const isDropMode = computed(() => props.mode === 'drop');

const formData = reactive({
  name: '',
  description: '',
  status: 'live',
  type: 'recent-drop',
  image_url: '',
  release_date: '',
  close_date: '',
  products: []
});

const errors = reactive({});
const isSubmitting = ref(false);
const uploadingImage = ref(false);

const emptyProduct = () => ({
  name: '',
  description: '',
  price: '',
  sizes: [],
  colors: [],
  colorsInput: '',
  quantity: 1,
  image_urls: [],
  quality_prices: { essential: '', premium: '', luxe: '' },
  default_quality_level: 'basic',
  tempId: Date.now() + Math.random(),
  uploading: false
});

onMounted(async () => {
  if (props.initialData) {
    const normalizeProduct = (p) => {
      const sizes = Array.isArray(p.sizes) ? p.sizes : (p.size ? [p.size] : []);
      const colors = Array.isArray(p.colors) ? p.colors : (p.colorsInput ? p.colorsInput.split(',').map(c => c.trim()).filter(Boolean) : []);
      const image_urls = Array.isArray(p.image_urls) ? p.image_urls : (p.image_url ? [p.image_url] : []);
      const quality_prices = p.quality_prices || { essential: '', premium: '', luxe: '' };
      const default_quality_level = p.default_quality_level || (p.default_quality_level_id ? (p.default_quality_level_id === 2 ? 'premium' : p.default_quality_level_id === 3 ? 'luxe' : 'basic') : 'basic');
      return { ...p, sizes, colors, colorsInput: colors.join(', '), image_urls, quality_prices, default_quality_level, uploading: false };
    };
    Object.assign(formData, {
      name: props.initialData.title || props.initialData.name || '',
      description: props.initialData.description || '',
      status: props.initialData.status || (props.initialData.type === 'new-drop' || props.initialData.type === 'recent-drop' ? 'live' : 'upcoming'),
      type: props.initialData.type || 'recent-drop',
      image_url: props.initialData.image_url || '',
      release_date: props.initialData.release_date || '',
      close_date: props.initialData.close_date || '',
      products: props.initialData.products ? props.initialData.products.map(normalizeProduct) : []
    });
  } else if (isDropMode.value) {
    formData.release_date = new Date().toISOString().slice(0, 16);
  }
});

const addProduct = () => {
  formData.products.push(emptyProduct());
};

const removeProduct = (index) => {
  if (confirm('Remove this product from the drop?')) {
    formData.products.splice(index, 1);
  }
};

const handleImageUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  uploadingImage.value = true;
  try {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    const token = localStorage.getItem('dottie_token');
    const uploadUrl = 'https://dottie-backend.onrender.com/api/upload';
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: uploadFormData
    });

    const result = await response.json();
    if (result.success) {
      formData.image_url = result.url;
    } else {
      alert('Failed to upload image: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload image');
  } finally {
    uploadingImage.value = false;
  }
};

const handleMultipleImageUpload = async (event, index) => {
  const files = Array.from(event.target.files || []);
  if (!files.length) return;

  formData.products[index].uploading = true;
  try {
    const token = localStorage.getItem('dottie_token');
    const uploadUrl = 'https://dottie-backend.onrender.com/api/upload';
    for (const file of files) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: uploadFormData
      });

      const result = await response.json();
      if (result.success) {
        formData.products[index].image_urls.push(result.url);
      } else {
        alert('Failed to upload image: ' + (result.error || 'Unknown error'));
      }
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Failed to upload images');
  } finally {
    formData.products[index].uploading = false;
    event.target.value = '';
  }
};

const validate = () => {
  Object.keys(errors).forEach(key => delete errors[key]);
  if (!formData.name.trim()) errors.name = isDropMode.value ? 'Drop Name is required' : 'Collection Name is required';

  if (isDropMode.value && formData.products.length === 0) {
    errors.products = 'Add at least one product to this drop';
  }

  return Object.keys(errors).length === 0;
};

const handleSubmit = async () => {
  if (!validate()) return;

  const payload = {
    ...formData,
    products: (formData.products || []).map(p => ({
      ...p,
      colors: p.colorsInput ? p.colorsInput.split(',').map(c => c.trim()).filter(Boolean) : (Array.isArray(p.colors) ? p.colors : [])
    }))
  };

  isSubmitting.value = true;
  try {
    await emit('submit', payload);
  } finally {
    isSubmitting.value = false;
  }
};
</script>

