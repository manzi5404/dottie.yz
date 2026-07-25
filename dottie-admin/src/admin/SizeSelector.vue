<template>
  <div class="space-y-2">
    <label class="text-sm font-medium text-slate-400">Available Sizes</label>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="size in allSizes"
        :key="size"
        type="button"
        @click="toggleSize(size)"
        :class="[
          'px-4 py-2 rounded-lg text-sm font-bold transition-all border',
          modelValue.includes(size)
            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
        ]"
      >
        {{ size }}
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['update:modelValue']);

const allSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Uni'];

const toggleSize = (size) => {
  const newSizes = props.modelValue.includes(size)
    ? props.modelValue.filter(s => s !== size)
    : [...props.modelValue, size];
  emit('update:modelValue', newSizes);
};
</script>
