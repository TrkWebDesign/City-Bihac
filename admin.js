document.addEventListener('DOMContentLoaded', () => {
    const ordersContainer = document.getElementById('orders-container');
    const modal = document.getElementById('confirmationModal');
    const confirmButton = document.getElementById('confirmButton');
    const cancelButton = document.getElementById('cancelButton');
    let currentOrderId = null;
    let refreshInterval;

    // Function to fetch and display orders
    function fetchAndDisplayOrders() {
        fetch('http://localhost:3000/orders')
            .then(res => res.json())
            .then(data => displayOrders(data))
            .catch(err => console.error('Greška pri dohvatu narudžbi:', err));
    }

    // Initial fetch
    fetchAndDisplayOrders();

    // Set up auto-refresh every 5 seconds
    function startAutoRefresh() {
        refreshInterval = setInterval(fetchAndDisplayOrders, 5000);
    }

    // Start the auto-refresh
    startAutoRefresh();

    // Display orders function
    function displayOrders(orders) {
        ordersContainer.innerHTML = '';
        orders.forEach(order => {
            if (order.status === 'completed') return;

            const statusClass = order.status === 'delivered' ? 'delivered' : 'waiting';
            const statusText = order.status === 'delivered' ? 'Dostavljeno' : 'U obradi';
            let itemsHTML = '';

            if (typeof order.items === 'string') {
                try {
                    order.items = JSON.parse(order.items);
                    if (!Array.isArray(order.items)) {
                        console.error('Parsed items is not an array');
                        order.items = [];
                    }
                } catch (error) {
                    console.error('Greška pri parsiranju stavki:', error);
                    order.items = [];
                }
            }

            if (Array.isArray(order.items)) {
                order.items.forEach(item => {
                    itemsHTML += `
                        <div class="order-item">
                            <div class="item-name">${item.name}</div>
                            <div class="item-quantity">x${item.quantity}</div>
                            <div class="item-price">${item.price} KM</div>
                        </div>
                    `;
                });

                // Calculate total price
                const total = order.items.reduce((sum, item) => {
                    return sum + (parseFloat(item.price) * parseInt(item.quantity));
                }, 0);
                
                // Add total price row
                itemsHTML += `
                    <div class="order-total">
                        <div class="total-label">Ukupno:</div>
                        <div class="total-price">${total.toFixed(2)} KM</div>
                    </div>
                `;
            } else {
                itemsHTML = '<div class="order-item">Nema stavki u narudžbi</div>';
            }

            const card = document.createElement('div');
            card.className = 'order-card';
            card.id = `order-${order.id}`;
            
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
                </div>
                
                <button class="deliver-button" data-order-id="${order.id}">
                    <i class="fas fa-truck"></i> Označi kao poslano
                </button>
            `;

            ordersContainer.appendChild(card);
        });

        // Add event listeners to all deliver buttons
        document.querySelectorAll('.deliver-button').forEach(button => {
            button.addEventListener('click', function() {
                currentOrderId = this.getAttribute('data-order-id');
                showConfirmationModal();
            });
        });
    }

    // Show confirmation modal
    function showConfirmationModal() {
        if (!modal) {
            console.error('Modal element not found');
            return;
        }
        // Clear the refresh interval while modal is open
        clearInterval(refreshInterval);
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
    }

    // Hide modal function
    function hideModal() {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
            // Restart the refresh interval after modal closes
            startAutoRefresh();
        }, 300);
    }

    // Confirm button click handler
    if (confirmButton) {
        confirmButton.addEventListener('click', () => {
            if (currentOrderId) {
                updateOrderStatus(currentOrderId);
                hideModal();
            }
        });
    } else {
        console.error('Confirm button not found');
    }

    // Cancel button click handler
    if (cancelButton) {
        cancelButton.addEventListener('click', hideModal);
    } else {
        console.error('Cancel button not found');
    }

    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal();
            }
        });
    }

    // Update order status
    function updateOrderStatus(id) {
        fetch(`http://localhost:3000/order/${id}`, {
            method: 'PUT',
        })
        .then(res => res.json())
        .then(data => {
            const cardToMark = document.getElementById(`order-${id}`);
            if (cardToMark) {
                const statusField = cardToMark.querySelector('.order-status');
                const deliverButton = cardToMark.querySelector('.deliver-button');
                if (statusField) {
                    statusField.classList.remove('waiting');
                    statusField.classList.add('delivered');
                    statusField.textContent = 'Dostavljeno';
                }
                if (deliverButton) {
                    deliverButton.disabled = true;
                    deliverButton.innerHTML = '<i class="fas fa-check"></i> Dostavljeno';
                }
                
                // Remove the card after 2 seconds
                setTimeout(() => {
                    cardToMark.style.opacity = '0';
                    setTimeout(() => {
                        cardToMark.remove();
                    }, 300);
                }, 2000);
            }
        })
        .catch(err => console.error('Greška pri ažuriranju statusa:', err));
    }

    // Clean up interval when page is unloaded
    window.addEventListener('beforeunload', () => {
        clearInterval(refreshInterval);
    });
});