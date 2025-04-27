document.addEventListener('DOMContentLoaded', function() {
    // ========== LOADING SCREEN ==========
    const loadingScreen = document.getElementById('loading');
    window.addEventListener('load', function() {
        setTimeout(() => {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 1000);
        }, 1100);
    });

    // ========== MOBILE NAVIGATION ==========
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', function() {
    this.classList.toggle('active');
    navLinks.classList.toggle('active');
    document.body.style.overflow = navLinks.classList.contains('active') ? 'hidden' : 'auto';
});

// Close mobile menu when clicking a link
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = 'auto';
    });
});

    // ========== STICKY HEADER ==========
    const header = document.querySelector('.header');
    window.addEventListener('scroll', function() {
        header.classList.toggle('scrolled', window.scrollY > 100);
    });

    // ========== MENU SYSTEM ==========
    const tabBtns = document.querySelectorAll('.tab-btn');
    const menuCategories = document.querySelectorAll('.menu-category');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(btn => btn.classList.remove('active'));
            menuCategories.forEach(cat => cat.classList.remove('active'));
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            resetMenuItemsDisplay(tabId);
        });
    });

    // Show more/less functionality
    document.querySelectorAll('.show-more-btn').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.parentElement;
            toggleMenuItems(category, false);
            this.style.display = 'none';
            category.querySelector('.show-less-btn').style.display = 'block';
        });
    });

    document.querySelectorAll('.show-less-btn').forEach(button => {
        button.addEventListener('click', function() {
            const category = this.parentElement;
            toggleMenuItems(category, true);
            this.style.display = 'none';
            category.querySelector('.show-more-btn').style.display = 'block';
        });
    });

    // Initialize menu items display
    menuCategories.forEach(category => {
        const items = category.querySelectorAll('.menu-item');
        const showMoreBtn = category.querySelector('.show-more-btn');
        const showLessBtn = category.querySelector('.show-less-btn');

        if (items.length <= 3) {
            if (showMoreBtn) showMoreBtn.style.display = 'none';
            if (showLessBtn) showLessBtn.style.display = 'none';
        } else {
            toggleMenuItems(category, true);
        }
    });

    function toggleMenuItems(category, hideExtra) {
        const items = category.querySelectorAll('.menu-item');
        items.forEach((item, index) => {
            if (index >= 3) {
                item.classList.toggle('hidden-item', hideExtra);
            }
        });
    }

    function resetMenuItemsDisplay(tabId) {
        const currentCategory = document.getElementById(tabId);
        const showMoreBtn = currentCategory.querySelector('.show-more-btn');
        const showLessBtn = currentCategory.querySelector('.show-less-btn');
        const items = currentCategory.querySelectorAll('.menu-item');

        if (items.length > 3) {
            if (showMoreBtn) showMoreBtn.style.display = 'block';
            if (showLessBtn) showLessBtn.style.display = 'none';
            toggleMenuItems(currentCategory, true);
        }
    }

    // ========== GALLERY SLIDER ==========
    const gallerySlider = document.querySelector('.gallery-slider');
    const galleryTrack = document.querySelector('.gallery-track');
    const gallerySlides = document.querySelectorAll('.gallery-slide');
    const dotsContainer = document.querySelector('.gallery-dots');
    const prevArrow = document.querySelector('.gallery-arrow-left');
    const nextArrow = document.querySelector('.gallery-arrow-right');

    let currentIndex = 0;
    let slidesPerView = calculateSlidesPerView();
    let autoSlideInterval;

    // Calculate how many slides should be visible based on screen width
    function calculateSlidesPerView() {
        if (window.innerWidth >= 992) return 3;
        if (window.innerWidth >= 768) return 2;
        return 1;
    }

    // Initialize the gallery
    function initGallery() {
        slidesPerView = calculateSlidesPerView();
        createDots();
        updateGallery();
        startAutoSlide();
        
        // Recalculate on window resize
        window.addEventListener('resize', () => {
            slidesPerView = calculateSlidesPerView();
            updateGallery();
        });
    }

    // Create navigation dots
    function createDots() {
        dotsContainer.innerHTML = '';
        const dotCount = Math.ceil(gallerySlides.length / slidesPerView);
        
        for (let i = 0; i < dotCount; i++) {
            const dot = document.createElement('span');
            dot.className = 'dot';
            dot.setAttribute('data-index', i);
            if (i === 0) dot.classList.add('active');
            dot.addEventListener('click', () => goToSlide(i));
            dotsContainer.appendChild(dot);
        }
    }

    // Update gallery position and dots
    function updateGallery() {
        const slideWidth = 100 / slidesPerView;
        const offset = -currentIndex * slideWidth;
        galleryTrack.style.transform = `translateX(${offset}%)`;
        
        // Update dots
        const dots = document.querySelectorAll('.dot');
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
        
        // Disable arrows when at boundaries
        prevArrow.disabled = currentIndex === 0;
        nextArrow.disabled = currentIndex >= Math.ceil(gallerySlides.length / slidesPerView) - 1;
    }

    // Navigate to specific slide
    function goToSlide(index) {
        currentIndex = index;
        updateGallery();
        resetAutoSlide();
    }

    // Go to next slide
    function nextSlide() {
        const maxIndex = Math.ceil(gallerySlides.length / slidesPerView) - 1;
        currentIndex = (currentIndex >= maxIndex) ? 0 : currentIndex + 1;
        updateGallery();
    }

    // Go to previous slide
    function prevSlide() {
        const maxIndex = Math.ceil(gallerySlides.length / slidesPerView) - 1;
        currentIndex = (currentIndex <= 0) ? maxIndex : currentIndex - 1;
        updateGallery();
    }

    // Auto slide functionality
    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }

    // Event listeners for arrows
    prevArrow.addEventListener('click', () => {
        prevSlide();
        resetAutoSlide();
    });

    nextArrow.addEventListener('click', () => {
        nextSlide();
        resetAutoSlide();
    });

    // Initialize the gallery
    initGallery();

    // ========== ORDER SYSTEM ==========
    let cart = JSON.parse(localStorage.getItem('pizzeriaCart')) || [];

    // Quantity buttons
    document.querySelectorAll('.quantity-btn').forEach(button => {
        button.addEventListener('click', function() {
            const itemId = this.getAttribute('data-item');
            const input = document.querySelector(`.quantity-input[data-item="${itemId}"]`);
            let value = parseInt(input.value) || 0;

            if (this.classList.contains('minus')) {
                value = Math.max(0, value - 1);
            } else {
                value++;
            }

            input.value = value;
        });
    });

    // Add to cart
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', function() {
            const item = JSON.parse(this.getAttribute('data-item'));
            const quantityInput = document.querySelector(`.quantity-input[data-item="${item.id}"]`);
            const quantity = parseInt(quantityInput.value) || 0;

            if (quantity > 0) {
                addToCart(item, quantity);
                quantityInput.value = 0;
                showToast(`${quantity} x ${item.name} dodano u korpu!`);
            }
        });
    });

    // Cart functionality
    function addToCart(item, quantity) {
        const existingItemIndex = cart.findIndex(cartItem => cartItem.id === item.id);

        if (existingItemIndex >= 0) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push({
                ...item,
                quantity: quantity
            });
        }

        saveCart();
        updateCartDisplay();
    }

    function removeFromCart(itemId) {
        cart = cart.filter(item => item.id !== itemId);
        saveCart();
        updateCartDisplay();
    }

    function saveCart() {
        localStorage.setItem('pizzeriaCart', JSON.stringify(cart));
    }

    function updateCartDisplay() {
        const cartItemsContainer = document.querySelector('.cart-items');
        const totalAmountElement = document.querySelector('.total-amount');
        let total = 0;

        cartItemsContainer.innerHTML = cart.length === 0
            ? '<div class="empty-cart">Vaša korpa je prazna</div>'
            : cart.map(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;

                return `
                    <div class="cart-item">
                        <div class="cart-item-name">${item.name}</div>
                        <div class="cart-item-quantity">${item.quantity}x</div>
                        <div class="cart-item-price">${itemTotal.toFixed(2)} KM</div>
                        <button class="remove-item" data-id="${item.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
            }).join('');

        totalAmountElement.textContent = `${total.toFixed(2)} KM`;
        
        // Add event listeners to remove buttons
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', function() {
                removeFromCart(this.getAttribute('data-id'));
            });
        });
    }

    // Checkout process
    const checkoutBtn = document.querySelector('.checkout-btn');
    const checkoutForm = document.querySelector('.checkout-form');
    const orderSuccess = document.querySelector('.order-success');

    checkoutBtn.addEventListener('click', function() {
        if (cart.length === 0) {
            showToast('Vaša korpa je prazna. Dodajte proizvode prije narudžbe.', 'error');
            return;
        }

        checkoutForm.style.display = 'block';
        this.style.display = 'none';
    });

    document.querySelector('.cancel-order').addEventListener('click', function() {
        checkoutForm.style.display = 'none';
        checkoutBtn.style.display = 'block';
    });

    document.querySelector('.submit-order').addEventListener('click', function() {
        const name = document.getElementById('name').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const address = document.getElementById('address').value.trim();
        const notes = document.getElementById('notes').value.trim();

        if (!name || !phone || !address) {
            showToast('Molimo popunite sva obavezna polja označena sa *.', 'error');
            return;
        }

        // Calculate total
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // Send order to server
        fetch('http://localhost:3000/order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: name,
                phone: phone,
                address: address,
                note: notes,
                items: cart,
                total: total
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            checkoutForm.style.display = 'none';
            orderSuccess.style.display = 'block';
            showToast(`Narudžba #${data.orderId} uspješno poslana! Status: ${data.status}`);
            
            // Clear cart after successful order
            setTimeout(() => {
                cart = [];
                saveCart();
                updateCartDisplay();
                orderSuccess.style.display = 'none';
                checkoutBtn.style.display = 'block';
                document.getElementById('name').value = '';
                document.getElementById('phone').value = '';
                document.getElementById('address').value = '';
                document.getElementById('notes').value = '';
            }, 5000);
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Došlo je do greške pri slanju narudžbe.', 'error');
        });
    });

    // Toggle category items visibility
    document.querySelectorAll('.category-header').forEach(header => {
        header.addEventListener('click', function() {
            const categoryItems = this.closest('.order-category').querySelector('.category-items');
            const isHidden = categoryItems.style.display === 'none';

            categoryItems.style.display = isHidden ? 'block' : 'none';
            this.classList.toggle('active', isHidden);
        });
    });

    // Initialize all category items as hidden
    document.querySelectorAll('.category-items').forEach(items => {
        items.style.display = 'none';
    });

    // Toast notification
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }, 100);
    }

    // Initialize cart display
    updateCartDisplay();
});