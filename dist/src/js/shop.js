const API_BASE_URL = window.API_BASE_URL || document.body?.dataset?.apiBaseUrl || (() => {
    const host = window.location.hostname;
    if (host === 'localhost') return 'http://localhost:5000';
    if (host === '127.0.0.1') return 'http://localhost:5000';
    return 'https://fof-backend-production.up.railway.app';
})();

const shopLogic = () => ({
    products: [],
    drops: [],
    loading: false,
    activeDrop: null,
    selectedDrop: null,
    storeSettings: {
        purchasingDisabled: false,
        isRestocking: false
    },
    filters: { category: [], minPrice: 0, maxPrice: 300000 },
    sortBy: "newest",
    selectedProduct: null,
    activeProduct: null,
    scrolled: false,
    user: null,
    showMomoModal: false,
    modalQuantity: 1,
    modalSize: "M",
    modalColor: null,
    modalQuality: null,
    reservationModalOpen: false,
    reservationData: {
        fullName: '',
        email: '',
        phone: '',
        size: 'M',
        color: '',
        quantity: 1
    },
    senderPhone: "",
    senderName: "",
    senderEmail: "",
    copyFeedback: "",
    paymentModalOpen: false,
    configLoading: true,
    storeConfig: {
        store_mode: 'live',
        announcement: '',
        reservation_enabled: false
    },
    cartItems: [],

    contactName: '',
    contactEmail: '',
    contactPhone: '',
    contactSubject: '',
    contactMessage: '',

    async submitContact() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: this.contactName,
                    email: this.contactEmail,
                    phone: this.contactPhone,
                    subject: this.contactSubject,
                    message: this.contactMessage
                })
            });
            const data = await res.json();
            if (data.success) {
                this.contactName = '';
                this.contactEmail = '';
                this.contactPhone = '';
                this.contactSubject = '';
                this.contactMessage = '';
                window.dispatchEvent(new CustomEvent('notify', { detail: { message: 'Message sent successfully!', type: 'success' } }));
            } else {
                window.dispatchEvent(new CustomEvent('notify', { detail: { message: data.error || 'Failed to send message', type: 'error' } }));
            }
        } catch (err) {
            window.dispatchEvent(new CustomEvent('notify', { detail: { message: 'Failed to send message', type: 'error' } }));
        }
    },

    selectDrop(drop) {
        this.selectedDrop = drop;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    clearSelection() {
        this.selectedDrop = null;
    },

    get selectedDropProducts() {
        if (!this.selectedDrop) return [];
        return this.selectedDrop.products || [];
    },
    get currentDropTitle() {
        const params = new URLSearchParams(window.location.search);
        const dropSlug = params.get('drop');
        if (!dropSlug) return null;
        const drop = this.drops.find(d => d.slug === dropSlug);
        return drop ? drop.title : null;
    },

    normalizeStoreMode(mode) {
        const normalized = String(mode || '').trim().toLowerCase();
        if (normalized === 'reservation') return 'reserve';
        if (['live', 'reserve', 'closed'].includes(normalized)) return normalized;
        return 'closed';
    },

    applyStoreConfig(rawConfig = {}) {
        const normalizedMode = this.normalizeStoreMode(
            rawConfig.store_mode || rawConfig.mode || (rawConfig.reservation_enabled ? 'reserve' : '')
        );

        this.storeConfig = {
            ...rawConfig,
            store_mode: normalizedMode,
            reservation_enabled: rawConfig.reservation_enabled === true || normalizedMode === 'reserve'
        };

        console.log('[Reservation Debug] store config API response:', rawConfig);
        console.log('[Reservation Debug] normalized frontend mode:', this.storeConfig.store_mode);
    },

    isReservationMode() {
        return this.storeConfig.reservation_enabled === true || this.normalizeStoreMode(this.storeConfig.store_mode) === 'reserve';
    },

    isLiveMode() {
        return this.normalizeStoreMode(this.storeConfig.store_mode) === 'live';
    },

    isClosedMode() {
        return this.normalizeStoreMode(this.storeConfig.store_mode) === 'closed';
    },

    resolveImage(product) {
        if (!product) return '/placeholder.jpg';
        
        // Handle images stored as stringified JSON or raw arrays
        let imgList = [];
        try {
            if (typeof product.image === 'string' && product.image.startsWith('[')) {
                imgList = JSON.parse(product.image);
            } else if (Array.isArray(product.images)) {
                imgList = product.images;
            } else if (product.image) {
                imgList = [product.image];
            }
        } catch (e) {
            console.error("Image resolution failed for product:", product.id, e);
        }

        return (imgList && imgList.length > 0) ? imgList[0] : '/placeholder.jpg';
    },

    async init() {
        this.user = JSON.parse(localStorage.getItem('fof_user') || 'null');
        if (!this.requireLoginForProductPages()) return;

        this.loading = true;
        this.configLoading = true;
        
        try {
            // Fetch store config FIRST to ensure UI mode is correct
            await this.fetchStoreConfig();
            
            await Promise.all([
                this.fetchProducts(),
                this.initCart()
            ]);
        } catch (error) {
            console.error("Initialization failed:", error);
        } finally {
            this.loading = false;
            this.configLoading = false;
        }
        window.addEventListener('cart-updated', () => this.initCart());
    },

    async fetchStoreConfig() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/store-config`);
            const data = await res.json();
            if (data.success && data.config) {
                this.applyStoreConfig(data.config);
            } else {
                console.warn('[Reservation Debug] unexpected store config payload:', data);
            }
        } catch (err) {
            console.error('❌ Failed to fetch store config:', err);
        }
    },

    ensureLoggedIn() {
        const token = localStorage.getItem('fof_token');
        if (!token) {
            window.dispatchEvent(new CustomEvent('notify', {
                detail: {
                    message: 'Please login or sign up before reserving.',
                    type: 'error'
                }
            }));
            window.location.href = '/login.html';
            return false;
        }
        return true;
    },

    getSessionId() {
        let sessionId = localStorage.getItem('fof_session_id');
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('fof_session_id', sessionId);
        }
        return sessionId;
    },

    requireLoginForProductPages() {
        const path = window.location.pathname.toLowerCase();
        const protectedPaths = ['/', '/index.html', '/shop.html', '/product.html', '/lookbook.html'];
        if (protectedPaths.some(p => path === p || path.startsWith(p))) {
            const token = localStorage.getItem('fof_token');
            if (!token) {
                window.location.href = '/login.html';
                return false;
            }
        }
        return true;
    },

    async fetchProducts() {
        try {
            const isLookbook = document.body && document.body.dataset.page === 'lookbook';
            const typeFilter = isLookbook ? 'recent-drop' : 'new-drop';
            const res = await fetch(`${API_BASE_URL}/api/drops?includeProducts=true&type=${typeFilter}`);
            const data = await res.json();
            if (data.success) {
                this.drops = (data.drops || []).map(drop => ({
                    ...drop,
                    image: this.resolveDropImage(drop)
                }));

                let allProducts = [];
                data.drops.forEach(drop => {
                    if (drop.products && Array.isArray(drop.products)) {
                        drop.products.forEach(p => {
                            const variants = p.product_variants || [];
                            const variantColors = [...new Set(variants.map(v => v.color).filter(Boolean))];
                            const variantSizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
                            allProducts.push({
                                ...p,
                                dropName: drop.title || drop.name || '',
                                dropType: drop.type || 'new-drop',
                                dropSlug: drop.slug || '',
                                showDetails: false,
                                uiQuantity: 1,
                                uiSize: p.sizes && p.sizes.length > 0 ? p.sizes[0] : "M",
                                images: p.images || p.image_urls || [],
                                quality_prices: p.product_quality_prices || p.quality_prices || [],
                                status: drop.status || "live",
                                colors: variantColors.length > 0 ? variantColors : (Array.isArray(p.colors) ? p.colors : []),
                                sizes: variantSizes.length > 0 ? variantSizes : (Array.isArray(p.sizes) ? p.sizes : [])
                            });
                        });
                    }
                });
                this.products = allProducts;
            }
        } catch (err) {
            console.error("Failed to fetch products:", err);
            this.products = [];
            this.drops = [];
        }
    },

    resolveDropImage(drop) {
        if (!drop) return '/placeholder.jpg';
        if (drop.image_url) return drop.image_url;
        if (drop.products && drop.products.length > 0) {
            const firstProduct = drop.products[0];
            if (firstProduct.images && firstProduct.images.length > 0) return firstProduct.images[0];
            if (firstProduct.image_urls && firstProduct.image_urls.length > 0) return firstProduct.image_urls[0];
        }
        return '/placeholder.jpg';
    },

    async fetchSettings() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/settings`); // Assuming this endpoint exists or will be added
            const data = await res.json();
            if (data.success) {
                this.storeSettings = data.settings;
            }
        } catch (err) {
            console.warn("Using default store settings");
        }
    },

    get filteredProducts() {
        return this.products.filter(r => {
            const t = this.filters.category.length === 0 || this.filters.category.includes(r.category);
            const e = r.price >= this.filters.minPrice && r.price <= this.filters.maxPrice;
            return t && e;
        }).sort((r, t) => this.sortBy === "price-asc" ? r.price - t.price : this.sortBy === "price-desc" ? t.price - r.price : t.id > r.id ? 1 : -1);
    },

    get newDrops() { 
        const params = new URLSearchParams(window.location.search);
        const dropSlug = params.get('drop');
        if (dropSlug) {
            return this.products.filter(r => r.dropType === "new-drop" && r.dropSlug === dropSlug);
        }
        return this.products.filter(r => r.dropType === "new-drop"); 
    },
    get recentDrops() { return this.products.filter(r => r.dropType === "recent-drop"); },
    get newDropObjects() { return this.drops.filter(d => d.type === "new-drop"); },
    get recentDropObjects() { return this.drops.filter(d => d.type === "recent-drop"); },

    get totalPrice() {
        if (!this.selectedProduct) return "0.00";
        const basePrice = this.modalQuality ? parseFloat(this.modalQuality.price) : parseFloat(this.selectedProduct.price);
        return (basePrice * parseInt(this.modalQuantity)).toFixed(2);
    },

    get momoQuickPayAmount() {
        if (!this.activeProduct) return "0.00";
        const basePrice = this.modalQuality ? parseFloat(this.modalQuality.price) : parseFloat(this.activeProduct.price);
        return (basePrice * parseInt(this.modalQuantity || 1)).toFixed(2);
    },

    toggleCategory(r) {
        this.filters.category.includes(r)
            ? this.filters.category = this.filters.category.filter(t => t !== r)
            : this.filters.category.push(r);
    },

    initPayment(product, qty = 1, size = "M", qualityLevel = null) {
        console.log('MoMo Button Clicked', product ? product.id : 'cart');
        if (this.storeSettings.purchasingDisabled) {
            window.dispatchEvent(new CustomEvent("notify", {
                detail: { message: "Purchasing is currently disabled.", type: "error" }
            }));
            return;
        }
        this.selectedProduct = product;
        this.modalQuantity = product ? (parseInt(qty) || 1) : 0;
        this.modalSize = product ? (size || product.uiSize || "M") : "";
        this.modalQuality = qualityLevel;
        this.paymentModalOpen = true;
    },

    initCart() { this.cartItems = JSON.parse(localStorage.getItem("fof_cart")) || []; },

    openMomoQuickPay(product, qty = 1, size = "M", color = null, qualityLevel = null) {
        if (this.storeSettings.purchasingDisabled) {
            window.dispatchEvent(new CustomEvent("notify", {
                detail: { message: "Purchasing is currently disabled.", type: "error" }
            }));
            return;
        }
        this.activeProduct = product;
        this.selectedProduct = product;
        this.modalQuantity = product ? (parseInt(qty) || 1) : 1;
        this.modalSize = product ? (size || product.uiSize || "M") : "M";
        this.modalColor = color || (product && this.colorsOf(product)[0]) || null;
        this.modalQuality = qualityLevel;
        this.showMomoModal = true;
    },

    closeMomoQuickPay() {
        this.showMomoModal = false;
        this.activeProduct = null;
    },

    isValidMomoPhone(phone) {
        if (!phone) return false;
        // Strip spaces, dashes, and ensure it's a string
        const normalizedPhone = String(phone).replace(/[\s\-]/g, "");
        // Support with or without 250 prefix, focusing on standard 10-digit RW numbers starting with 07...
        // Supported 07 prefixes: 2, 3, 8, 9
        return /^07(?:2|3|8|9)\d{7}$/.test(normalizedPhone);
    },

    colorsOf(product) {
        if (!product) return [];
        const variants = product.product_variants || product.variants || [];
        const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
        if (colors.length === 0 && Array.isArray(product.colors)) return product.colors;
        return colors;
    },

    async processMomoPayment() {
        return this.verifyPayment();
    },

    get cartTotal() { return this.grandTotal; },
    get cartTotalRaw() {
        return this.cartItems.reduce((acc, item) => acc + (parseFloat(item.price) * parseInt(item.quantity)), 0);
    },
    get grandTotal() { return this.cartTotalRaw.toFixed(2); },

    persistCart() {
        localStorage.setItem("fof_cart", JSON.stringify(this.cartItems));
        window.dispatchEvent(new CustomEvent("cart-updated"));
    },

    updateQuantity(index, delta) {
        if (this.cartItems[index]) {
            const newQty = this.cartItems[index].quantity + delta;
            if (newQty > 0) {
                this.cartItems[index].quantity = newQty;
                this.cartItems[index].totalPrice = this.cartItems[index].price * newQty;
                this.persistCart();
            } else if (newQty === 0) {
                this.removeFromCart(index);
            }
        }
    },

    updateSize(index, newSize) {
        if (this.cartItems[index]) {
            this.cartItems[index].selectedSize = newSize;
            this.persistCart();
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: `Size updated to ${newSize}`, type: "success" } }));
        }
    },

    removeFromCart(index) {
        if (this.cartItems[index]) {
            const itemName = this.cartItems[index].name;
            this.cartItems.splice(index, 1);
            this.persistCart();
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: `${itemName} removed from cart`, type: "success" } }));
        }
    },

    async verifyPayment() {
        if (!this.senderName || !this.senderPhone) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Please fill in your name and phone.", type: "error" } }));
            return;
        }

        if (!this.isValidMomoPhone(this.senderPhone)) {
            window.dispatchEvent(new CustomEvent("notify", {
                detail: { message: "Use a valid MoMo number with a supported 07 prefix.", type: "error" }
            }));
            return;
        }

        const checkoutProduct = this.activeProduct || this.selectedProduct;
        const isCartCheckout = !checkoutProduct;
        const total = isCartCheckout ? this.grandTotal : this.totalPrice;

        this.loading = true;

        const token = localStorage.getItem('fof_token');
        const sessionId = this.getSessionId();

        // Prepare WhatsApp message components
        let itemsList = isCartCheckout
            ? this.cartItems.map(item => {
                const colorStr = item.selectedColor ? ` / ${item.selectedColor}` : '';
                const qualityStr = item.selectedQuality ? ` (${item.selectedQuality})` : '';
                return `- ${item.name}${colorStr}${qualityStr} (${item.selectedSize}) x${item.quantity} [${(item.price * item.quantity).toLocaleString()} FRW]`;
            }).join("\n")
            : (() => {
                const colorStr = this.modalColor ? ` / ${this.modalColor}` : '';
                const qualityStr = this.modalQuality ? ` (${this.modalQuality.quality_name})` : '';
                const basePrice = this.modalQuality ? parseFloat(this.modalQuality.price) : parseFloat(checkoutProduct.price);
                return `- ${checkoutProduct.name}${colorStr}${qualityStr} (${this.modalSize}) x${this.modalQuantity} [${(basePrice * this.modalQuantity).toLocaleString()} FRW]`;
            })();

        let createdOrderIds = [];

        try {
            if (isCartCheckout) {
                // Create one order per cart item
                for (const item of this.cartItems) {
                    const effectivePrice = item.price;
                    const response = await fetch(`${API_BASE_URL}/api/orders`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': token ? `Bearer ${token}` : '',
                            'X-Session-Id': sessionId
                        },
                        body: JSON.stringify({
                            product_id: item.id,
                            product_name: item.name,
                            size: item.selectedSize,
                            color: item.selectedColor,
                            quantity: item.quantity,
                            total_price: parseFloat(effectivePrice) * parseInt(item.quantity),
                            quality_level_id: item.qualityLevelId || null,
                            payment_method: 'momo',
                            customer_name: this.senderName,
                            customer_email: this.senderEmail || null,
                            customer_phone: this.senderPhone
                        })
                    });
                    const result = await response.json();
                    if (result.success && result.order) {
                        createdOrderIds.push(result.order.id);
                    } else {
                        const errorMsg = result?.error || result?.message || `HTTP ${response.status}: ${response.statusText}`;
                        throw new Error(errorMsg);
                    }
                }
            } else {
                const basePrice = this.modalQuality ? parseFloat(this.modalQuality.price) : parseFloat(checkoutProduct.price);
                const response = await fetch(`${API_BASE_URL}/api/orders`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : '',
                        'X-Session-Id': sessionId
                    },
                    body: JSON.stringify({
                        product_id: checkoutProduct.id,
                        product_name: checkoutProduct.name,
                        size: this.modalSize,
                        color: this.modalColor,
                        quantity: this.modalQuantity,
                        total_price: parseFloat(basePrice) * parseInt(this.modalQuantity),
                        quality_level_id: this.modalQuality ? this.modalQuality.quality_level_id : null,
                        payment_method: 'momo',
                        customer_name: this.senderName,
                        customer_email: this.senderEmail || null,
                        customer_phone: this.senderPhone
                    })
                });
                const result = await response.json();
                if (result.success) {
                    createdOrderIds.push(result.orderId);
                } else {
                    throw new Error(result.error || result.message || "Failed to create order");
                }
            }

            const orderIdStr = createdOrderIds.length > 0 ? createdOrderIds.join(', ') : 'N/A';
            const message = `F>F PAYMENT VERIFICATION\n----------------------------\nOrder ID: ${orderIdStr}\nCustomer: ${this.senderName}\nPhone: ${this.senderPhone}\n\nItems:\n${itemsList}\n\nTOTAL: ${total} FRW\n----------------------------\nI have already sent the payment. Please verify this order.`;

            window.open(`https://wa.me/250791832523?text=${encodeURIComponent(message)}`, "_blank");

            if (isCartCheckout) {
                this.cartItems = [];
                this.persistCart();
            }
            setTimeout(() => {
                this.paymentModalOpen = false;
                this.showMomoModal = false;
                this.activeProduct = null;
            }, 500);
            window.dispatchEvent(new CustomEvent("notify", { 
                detail: { 
                    message: `Order #${orderIdStr} placed successfully!`, 
                    type: "success" 
                } 
            }));
        } catch (err) {
            console.error("Order creation failed:", err);
            const errorMessage = err?.message || "Failed to create order";
            const detailedError = `Order creation failed: ${errorMessage}`;
            
            window.dispatchEvent(new CustomEvent("notify", { 
                detail: { message: detailedError, type: "error" } 
            }));

            const fallbackMessage = `F>F PAYMENT VERIFICATION (Direct)\n----------------------------\nCustomer: ${this.senderName}\nPhone: ${this.senderPhone}\n\nItems:\n${itemsList}\n\nTOTAL: ${total} FRW\n----------------------------\nI have already sent the payment for these items. Please verify and process my order.\nNote: Order creation encountered an issue. Please contact support with your order details.`;

            window.open(`https://wa.me/250791832523?text=${encodeURIComponent(fallbackMessage)}`, "_blank");

            if (isCartCheckout) {
                this.cartItems = [];
                this.persistCart();
            }
            setTimeout(() => {
                this.paymentModalOpen = false;
                this.showMomoModal = false;
                this.activeProduct = null;
            }, 500);
        } finally {
            this.loading = false;
        }
    },

    async copyToClipboard(text, type) {
        try {
            await navigator.clipboard.writeText(text);
            this.copyFeedback = type;
            setTimeout(() => this.copyFeedback = "", 2000);
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: `Copied ${type} to clipboard`, type: "success" } }));
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    },

    addToCart(product, qty = 1, size = "M", qualityLevel = null, color = null) {
        if (this.storeSettings.purchasingDisabled) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Purchasing is currently disabled.", type: "error" } }));
            return;
        }

        const effectivePrice = qualityLevel ? parseFloat(qualityLevel.price) : parseFloat(product.price);
        const qualityName = qualityLevel ? qualityLevel.quality_name : null;
        const qualityLevelId = qualityLevel ? qualityLevel.quality_level_id : null;

        const existingItemIndex = this.cartItems.findIndex(item =>
            item.id === product.id &&
            item.selectedSize === size &&
            item.selectedColor === color &&
            item.qualityLevelId === qualityLevelId
        );

        if (existingItemIndex > -1) {
            this.cartItems[existingItemIndex].quantity += parseInt(qty);
            this.cartItems[existingItemIndex].totalPrice = this.cartItems[existingItemIndex].price * this.cartItems[existingItemIndex].quantity;
        } else {
            this.cartItems.push({
                ...product,
                selectedSize: size,
                selectedColor: color,
                selectedQuality: qualityName,
                qualityLevelId: qualityLevelId,
                price: effectivePrice,
                quantity: parseInt(qty),
                totalPrice: effectivePrice * parseInt(qty)
            });
        }

        this.persistCart();
        window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Added to cart successfully", type: "success" } }));
    },

    incrementQty(product) { product.uiQuantity++; },
    decrementQty(product) { if (product.uiQuantity > 1) product.uiQuantity--; },

    initReservation(product, size = "M", color = null, qualityLevel = null) {
        if (!this.ensureLoggedIn()) return;
        console.log('[Reservation Debug] frontend mode before opening form:', this.storeConfig.store_mode);
        this.selectedProduct = product;
        this.reservationData = {
            fullName: this.senderName || '',
            email: this.senderEmail || '',
            phone: this.senderPhone || '',
            size: size || product.uiSize || "M",
            color: color || (product.colors && product.colors.length > 0 ? product.colors[0] : ''),
            quantity: product.uiQuantity || 1,
            selectedQuality: qualityLevel ? qualityLevel.quality_name : null,
            qualityLevelId: qualityLevel ? qualityLevel.quality_level_id : null
        };
        this.reservationModalOpen = true;
    },

    async submitReservation() {
        if (!this.ensureLoggedIn()) return;
        if (!this.reservationData.fullName || !this.reservationData.email) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Please fill in your name and email.", type: "error" } }));
            return;
        }

        this.loading = true;

        const user = JSON.parse(localStorage.getItem('fof_user'));
        const token = localStorage.getItem('fof_token');
        const payload = {
            ...this.reservationData,
            productId: this.selectedProduct.id,
            userId: user ? user.id : null
        };

        console.log("Submitting Reservation Payload:", payload);

        try {
            const response = await fetch(`${API_BASE_URL}/api/reservations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({
                    productId: this.selectedProduct.id,
                    fullName: this.reservationData.fullName,
                    email: this.reservationData.email,
                    phone: this.reservationData.phone,
                    size: this.reservationData.size,
                    color: this.reservationData.color,
                    quantity: this.reservationData.quantity,
                    quality_level_id: this.reservationData.qualityLevelId || null,
                    storeMode: this.storeConfig.store_mode || 'live'
                })
            });

            const result = await response.json();
            console.log('[Reservation Debug] reservation submit response:', result);

            if (result.success) {
                window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Reservation confirmed! We'll contact you soon.", type: "success" } }));
                this.reservationModalOpen = false;
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            window.dispatchEvent(new CustomEvent("notify", { detail: { message: "Failed to submit reservation. Please try again.", type: "error" } }));
        } finally {
            this.loading = false;
        }
    }
});

export default shopLogic;
