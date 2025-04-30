document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const ordersContainer = document.getElementById('orders-container');
    const reservationsContainer = document.getElementById('reservations-container');
    
    // Modals
    const orderModal = document.getElementById('confirmationModal');
    const reservationModal = document.getElementById('reservationConfirmationModal');
    
    // Buttons
    const orderConfirmButton = document.getElementById('confirmButton');
    const orderCancelButton = document.getElementById('cancelButton');
    const reservationConfirmButton = document.getElementById('reservationConfirmButton');
    const reservationCancelButton = document.getElementById('reservationCancelButton');
    
    // State
    let currentOrderId = null;
    let currentReservationId = null;
    let currentAction = null; // 'confirm' or 'cancel'
    let refreshIntervals = [];
    let newOrdersCount = 0;
    let newReservationsCount = 0;
    let orders = [];
    let reservations = [];
    let lastUpdateTime = new Date();

    // Initialize the admin panel
    function initAdminPanel() {
        fetchAndDisplayOrders();
        fetchAndDisplayReservations();
        setupEventListeners();
        startAutoRefresh();
    }

    // Setup all event listeners
    function setupEventListeners() {
        // Order modal buttons
        if (orderConfirmButton) {
            orderConfirmButton.addEventListener('click', () => handleOrderAction('delivered'));
        }
        if (orderCancelButton) {
            orderCancelButton.addEventListener('click', () => hideModal(orderModal));
        }

        // Reservation modal buttons
        if (reservationConfirmButton) {
            reservationConfirmButton.addEventListener('click', () => {
                currentAction = 'confirm';
                handleReservationAction();
            });
        }
        if (reservationCancelButton) {
            reservationCancelButton.addEventListener('click', () => {
                currentAction = 'cancel';
                handleReservationAction();
            });
        }

        // Modal close handlers
        if (orderModal) {
            orderModal.addEventListener('click', (e) => {
                if (e.target === orderModal) hideModal(orderModal);
            });
        }
        if (reservationModal) {
            reservationModal.addEventListener('click', (e) => {
                if (e.target === reservationModal) hideModal(reservationModal);
            });
        }

        // Notification badge click
        document.getElementById('ordersNotification').addEventListener('click', () => {
            document.getElementById('orders-container').scrollIntoView({ behavior: 'smooth' });
        });
        
        document.getElementById('reservationsNotification').addEventListener('click', () => {
            document.getElementById('reservations-container').scrollIntoView({ behavior: 'smooth' });
        });
        
        // Close notification panel
        document.querySelector('.notification-close').addEventListener('click', () => {
            document.getElementById('notificationPanel').classList.remove('show');
        });
        
        // Click outside to close panel
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notificationPanel');
            if (panel.classList.contains('show') && !panel.contains(e.target)) {
                panel.classList.remove('show');
            }
        });

        // Clean up on page unload
        window.addEventListener('beforeunload', cleanupIntervals);
    }

    // ========== NOTIFICATION SYSTEM ==========
    function updateNotifications() {
        const now = new Date();
        
        // Check for new orders
        const newOrders = orders.filter(order => 
            new Date(order.createdAt) > lastUpdateTime && 
            order.status !== 'delivered'
        );
        newOrdersCount = newOrders.length;
        
        // Check for new reservations
        const newReservations = reservations.filter(reservation => 
            new Date(reservation.createdAt) > lastUpdateTime && 
            reservation.status === 'pending'
        );
        newReservationsCount = newReservations.length;
        
        // Update notification badges
        const ordersBadge = document.getElementById('ordersNotification');
        const reservationsBadge = document.getElementById('reservationsNotification');
        
        if (newOrdersCount > 0) {
            ordersBadge.style.display = 'flex';
            ordersBadge.textContent = newOrdersCount;
        } else {
            ordersBadge.style.display = 'none';
        }
        
        if (newReservationsCount > 0) {
            reservationsBadge.style.display = 'flex';
            reservationsBadge.textContent = newReservationsCount;
        } else {
            reservationsBadge.style.display = 'none';
        }
        
        // Play sound if there are new items
        if (newOrdersCount > 0 || newReservationsCount > 0) {
            document.getElementById('notificationSound').play();
            
            // Add to notification panel
            updateNotificationPanel(newOrders, newReservations);
        }
        
        lastUpdateTime = now;
    }

    function updateNotificationPanel(newOrders, newReservations) {
        const content = document.getElementById('notificationContent');
        content.innerHTML = '';
        
        newOrders.forEach(order => {
            const item = document.createElement('div');
            item.className = 'notification-item new';
            item.innerHTML = `
                <div>New Order #${order.id}</div>
                <div class="notification-item-time">${new Date(order.createdAt).toLocaleTimeString()}</div>
            `;
            content.appendChild(item);
        });
        
        newReservations.forEach(reservation => {
            const item = document.createElement('div');
            item.className = 'notification-item new';
            item.innerHTML = `
                <div>New Reservation #${reservation.id}</div>
                <div class="notification-item-time">${new Date(reservation.createdAt).toLocaleTimeString()}</div>
            `;
            content.appendChild(item);
        });
        
        // Show panel if there are notifications
        if (newOrders.length > 0 || newReservations.length > 0) {
            document.getElementById('notificationPanel').classList.add('show');
        }
    }

    // ========== ORDER MANAGEMENT ==========
    function fetchAndDisplayOrders() {
        if (!ordersContainer) return;
        
        fetch('http://192.168.0.111:3000/orders')
            .then(res => res.json())
            .then(data => {
                orders = data;
                displayOrders(data);
                updateNotifications();
            })
            .catch(err => console.error('Error fetching orders:', err));
    }

    function displayOrders(orders) {
        ordersContainer.innerHTML = '';
        
        const pendingOrders = orders.filter(order => order.status !== 'delivered');
        if (pendingOrders.length === 0) {
            ordersContainer.innerHTML = '<div class="no-orders">Nema narudžbi na čekanju</div>';
            return;
        }

        pendingOrders.forEach(order => {
            try {
                // Ensure items is an array
                if (typeof order.items === 'string') {
                    order.items = JSON.parse(order.items);
                }
                if (!Array.isArray(order.items)) {
                    order.items = [];
                }

                const orderCard = createOrderCard(order);
                ordersContainer.appendChild(orderCard);
            } catch (error) {
                console.error('Error processing order:', error);
            }
        });

        setupOrderCardEvents();
    }

    function createOrderCard(order) {
        const card = document.createElement('div');
        card.className = 'order-card';
        card.id = `order-${order.id}`;
        
        const statusClass = order.status === 'delivered' ? 'delivered' : 'waiting';
        const statusText = order.status === 'delivered' ? 'Dostavljeno' : 'Na Čekanju';
        
        // Calculate total
        const total = order.items.reduce((sum, item) => {
            return sum + (parseFloat(item.price) * parseInt(item.quantity));
        }, 0);

        // Format items HTML
        const itemsHTML = order.items.map(item => `
            <div class="order-item">
                <div class="item-name">${item.name}</div>
                <div class="item-quantity">x${item.quantity}</div>
                <div class="item-price">${item.price} KM</div>
            </div>
        `).join('');

        card.innerHTML = `
            <div class="card-header">
                <span>Narudžba #${order.id}</span>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="order-details">
                <strong><i class="fas fa-user"></i> Ime i prezime:</strong> ${order.name}
            </div>
            
            <div class="order-details">
                <strong><i class="fas fa-phone"></i> Broj telefona:</strong> ${order.phone}
            </div>
            
            <div class="order-details">
                <strong><i class="fas fa-map-marker-alt"></i> Adresa:</strong> ${order.address}
            </div>
            
            ${order.note ? `
            <div class="order-details">
                <strong><i class="fas fa-sticky-note"></i> Napomena:</strong> ${order.note}
            </div>
            ` : ''}
            
            <div class="order-items-list">
                ${itemsHTML}
                <div class="order-total">
                    <div class="total-label">Ukupno:</div>
                    <div class="total-price">${total.toFixed(2)} KM</div>
                </div>
            </div>
            
            <button class="deliver-button" data-order-id="${order.id}">
                <i class="fas fa-truck"></i> Označi kao poslano
            </button>
        `;

        return card;
    }

    function setupOrderCardEvents() {
        document.querySelectorAll('.deliver-button').forEach(button => {
            button.addEventListener('click', function() {
                currentOrderId = this.getAttribute('data-order-id');
                showModal(orderModal, 'Potvrdi dostavu', 'Da li ste sigurni da želite označiti ovu narudžbu kao dostavljenu?');
            });
        });
    }

    function handleOrderAction(status) {
        if (!currentOrderId) return;
        
        updateOrderStatus(currentOrderId, status)
            .then(() => {
                hideModal(orderModal);
                markOrderAsCompleted(currentOrderId);
            })
            .catch(err => {
                console.error('Error updating order:', err);
                showToast('Došlo je do greške pri ažuriranju narudžbe', 'error');
            });
    }

    function updateOrderStatus(id, status) {
        return fetch(`http://192.168.0.111:3000/order/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: status })
        })
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        });
    }

    function markOrderAsCompleted(id) {
        const card = document.getElementById(`order-${id}`);
        if (!card) return;

        const statusField = card.querySelector('.order-status');
        const deliverButton = card.querySelector('.deliver-button');
        
        if (statusField) {
            statusField.classList.remove('waiting');
            statusField.classList.add('delivered');
            statusField.textContent = 'Dostavljeno';
        }
        
        if (deliverButton) {
            deliverButton.disabled = true;
            deliverButton.innerHTML = '<i class="fas fa-check"></i> Dostavljeno';
        }
        
        // Remove the card after animation
        setTimeout(() => {
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 300);
        }, 2000);
    }

    // ========== RESERVATION MANAGEMENT ==========
    function fetchAndDisplayReservations() {
        if (!reservationsContainer) return;
        
        fetch('http://192.168.0.111:3000/reservations')
            .then(res => res.json())
            .then(data => {
                reservations = data;
                displayReservations(data);
                updateNotifications();
            })
            .catch(err => console.error('Error fetching reservations:', err));
    }

    function displayReservations(reservations) {
        reservationsContainer.innerHTML = '';
        
        const pendingReservations = reservations.filter(r => r.status === 'pending');
        if (pendingReservations.length === 0) {
            reservationsContainer.innerHTML = '<div class="no-reservations">Nema rezervacija na čekanju</div>';
            return;
        }

        pendingReservations.forEach(reservation => {
            const reservationCard = createReservationCard(reservation);
            reservationsContainer.appendChild(reservationCard);
        });

        setupReservationCardEvents();
    }

    function createReservationCard(reservation) {
        const card = document.createElement('div');
        card.className = 'reservation-card';
        card.id = `reservation-${reservation.id}`;
        
        const statusClass = reservation.status === 'cancelled' ? 'cancelled' : 
                          reservation.status === 'confirmed' ? 'confirmed' : 'pending';
        const statusText = reservation.status === 'cancelled' ? 'Otkazano' : 
                         reservation.status === 'confirmed' ? 'Potvrđeno' : 'Na čekanju';
        
        card.innerHTML = `
            <div class="card-header">
                <span>Rezervacija #${reservation.id}</span>
                <span class="reservation-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="reservation-details">
                <strong><i class="fas fa-user"></i> Ime i prezime:</strong> ${reservation.name}
            </div>
            
            <div class="reservation-details">
                <strong><i class="fas fa-envelope"></i> Email:</strong> ${reservation.email}
            </div>
            
            <div class="reservation-details">
                <strong><i class="fas fa-phone"></i> Broj telefona:</strong> ${reservation.phone}
            </div>
            
            <div class="reservation-details">
                <strong><i class="fas fa-calendar-day"></i> Datum:</strong> ${formatDate(reservation.date)}
            </div>
            
            <div class="reservation-details">
                <strong><i class="fas fa-clock"></i> Vrijeme:</strong> ${reservation.time}
            </div>
            
            <div class="reservation-details">
                <strong><i class="fas fa-users"></i> Broj gostiju:</strong> ${reservation.guests}
            </div>
            
            ${reservation.note ? `
            <div class="reservation-details">
                <strong><i class="fas fa-sticky-note"></i> Napomena:</strong> ${reservation.note}
            </div>
            ` : ''}
            
            <div class="reservation-actions">
                <button class="confirm-reservation" data-reservation-id="${reservation.id}">
                    <i class="fas fa-check"></i> Potvrdi
                </button>
                <button class="cancel-reservation" data-reservation-id="${reservation.id}">
                    <i class="fas fa-times"></i> Otkaži
                </button>
            </div>
        `;

        return card;
    }

    function setupReservationCardEvents() {
        document.querySelectorAll('.confirm-reservation').forEach(button => {
            button.addEventListener('click', function() {
                currentReservationId = this.getAttribute('data-reservation-id');
                showModal(reservationModal, 'Potvrdi rezervaciju', 'Da li ste sigurni da želite potvrditi ovu rezervaciju?');
            });
        });

        document.querySelectorAll('.cancel-reservation').forEach(button => {
            button.addEventListener('click', function() {
                currentReservationId = this.getAttribute('data-reservation-id');
                showModal(reservationModal, 'Otkaži rezervaciju', 'Da li ste sigurni da želite otkazati ovu rezervaciju?');
            });
        });
    }

    function handleReservationAction() {
        if (!currentReservationId || !currentAction) return;
        
        if (currentAction === 'confirm') {
            const status = document.querySelector('.modal-title').textContent.includes('Potvrdi') ? 'confirmed' : 'cancelled';
            
            updateReservationStatus(currentReservationId, status)
                .then(() => {
                    hideModal(reservationModal);
                    markReservationAsProcessed(currentReservationId, status);
                })
                .catch(err => {
                    console.error('Error updating reservation:', err);
                    showToast('Došlo je do greške pri ažuriranju rezervacije', 'error');
                });
        } else {
            // Just hide the modal if action is cancel
            hideModal(reservationModal);
        }
        
        // Reset the current action
        currentAction = null;
    }

    function updateReservationStatus(id, status) {
        return fetch(`http://192.168.0.111:3000/reservation/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: status })
        })
        .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
        });
    }

    function markReservationAsProcessed(id, status) {
        const card = document.getElementById(`reservation-${id}`);
        if (!card) return;

        const statusField = card.querySelector('.reservation-status');
        const buttonsContainer = card.querySelector('.reservation-actions');
        
        if (statusField) {
            statusField.classList.remove('pending');
            statusField.classList.add(status === 'confirmed' ? 'confirmed' : 'cancelled');
            statusField.textContent = status === 'confirmed' ? 'Potvrđeno' : 'Otkazano';
        }
        
        if (buttonsContainer) {
            buttonsContainer.innerHTML = `
                <div class="status-updated">
                    <i class="fas fa-check-circle"></i> Status ažuriran
                </div>
            `;
        }
        
        // Remove the card after animation
        setTimeout(() => {
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 300);
        }, 2000);
    }

    // ========== HELPER FUNCTIONS ==========
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        return new Date(dateString).toLocaleDateString('bs-BA', options);
    }

    function showModal(modal, title, message) {
        if (!modal) return;
        
        const modalTitle = modal.querySelector('h3');
        const modalMessage = modal.querySelector('p');
        
        if (modalTitle) modalTitle.textContent = title;
        if (modalMessage) modalMessage.textContent = message;
        
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    function hideModal(modal) {
        if (!modal) return;
        
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }

    function startAutoRefresh() {
        // Clear any existing intervals
        cleanupIntervals();
        
        // Add new intervals
        refreshIntervals.push(setInterval(fetchAndDisplayOrders, 5000));
        refreshIntervals.push(setInterval(fetchAndDisplayReservations, 5000));
    }

    function cleanupIntervals() {
        refreshIntervals.forEach(interval => clearInterval(interval));
        refreshIntervals = [];
    }

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

    // Initialize the admin panel
    initAdminPanel();
});
