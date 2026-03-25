import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', () => {
    // --- Login Logic ---
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    const passwordInput = document.getElementById('admin-password');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Hardcoded simple password for testing (as requested)
    const ADMIN_PASS = 'admin123';

    // Check if already logged in
    if (sessionStorage.getItem('admin_logged_in') === 'true') {
        showDashboard();
    }

    loginBtn.addEventListener('click', () => {
        if (passwordInput.value === ADMIN_PASS) {
            sessionStorage.setItem('admin_logged_in', 'true');
            AppUtils.Toast.show('Login successful', 'success');
            showDashboard();
        } else {
            AppUtils.Toast.show('Incorrect password', 'error');
            passwordInput.value = '';
        }
    });

    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            loginBtn.click();
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('admin_logged_in');
        dashboard.style.display = 'none';
        loginScreen.style.display = 'flex';
        passwordInput.value = '';
    });

    function showDashboard() {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        loadOrders();
    }


    // --- Order Dashboard Logic ---
    const ordersBody = document.getElementById('orders-body');
    const ordersTable = document.getElementById('orders-table');
    const emptyState = document.getElementById('empty-state');
    const clearOrdersBtn = document.getElementById('clear-orders-btn');

    async function loadOrders() {
        try {
            const { data: ordersData, error } = await supabase
                .from('orders')
                .select('*')
                .order('date', { ascending: false });
            
            if (error) throw error;
            
            if (!ordersData || ordersData.length === 0) {
                ordersTable.style.display = 'none';
                emptyState.style.display = 'block';
                return;
            }

            ordersTable.style.display = 'table';
            emptyState.style.display = 'none';

            ordersBody.innerHTML = '';
            
            ordersData.forEach((order) => {
                const tr = document.createElement('tr');
                
                // Format Date
                const orderDate = new Date(order.date).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                });

                // Status dropdown options
                const statuses = ['Pending', 'Processing', 'Ready', 'Delivered'];
                const statusSelectHtml = `
                    <select class="status-select bg-${getStatusClass(order.status).bg} text-${getStatusClass(order.status).text}" 
                            data-id="${order.id}" 
                            style="outline: none; background-color: var(--bg-white); border: 2px solid ${getStatusClass(order.status).color}; padding: 0.25rem;">
                        ${statuses.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('')}
                    </select>
                `;

                tr.innerHTML = `
                    <td><strong>${order.id}</strong></td>
                    <td style="font-size: 0.9rem;">${orderDate}</td>
                    <td>
                        <div style="font-weight: 600;">${order.customerName}</div>
                        <div style="font-size: 0.85rem; color: var(--text-light);"><i data-lucide="phone" style="width: 12px; height: 12px;"></i> ${order.customerPhone}</div>
                    </td>
                    <td style="font-size: 0.9rem;">
                        <div>
                            <strong><i data-lucide="file" style="width: 14px; height: 14px; margin-bottom: -3px;"></i> ${order.fileName}</strong> (${order.fileSize})
                            ${order.fileUrl ? `<a href="${order.fileUrl}" target="_blank" style="margin-left: 0.5rem; font-size: 0.8rem; color: var(--primary-color);">[Download]</a>` : ''}
                        </div>
                        <div style="color: var(--text-light); margin-top: 0.25rem;">${order.pages} ${order.pages>1?'Pages':'Page'} × ${order.copies} ${order.copies>1?'Copies':'Copy'}, ${order.printType}, ${order.paperSize}, ${order.binding} Binding</div>
                        ${order.notes ? `<div style="margin-top: 0.25rem; font-style: italic; color: var(--warning);">Note: ${order.notes}</div>` : ''}
                    </td>
                    <td style="font-size: 1.1rem; font-weight: 700;">₹${order.totalPrice}</td>
                    <td>${statusSelectHtml}</td>
                    <td>
                        <button class="action-btn delete-btn" data-id="${order.id}">Delete</button>
                    </td>
                `;
                
                ordersBody.appendChild(tr);
            });

            // Re-bind lucide icons for dynamically added content
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }

            // Bind events for dynamically added inputs
            bindTableEvents();

        } catch (e) {
            console.error('Failed to load orders', e);
            AppUtils.Toast.show('Error loading orders from Supabase', 'error');
        }
    }


    function getStatusClass(status) {
        switch(status) {
            case 'Pending': return {color: '#f59e0b', bg: 'warning', text: 'dark'};
            case 'Processing': return {color: '#3b82f6', bg: 'primary', text: 'white'};
            case 'Ready': return {color: '#10b981', bg: 'success', text: 'white'};
            case 'Delivered': return {color: '#6b7280', bg: 'secondary', text: 'white'};
            default: return {color: '#e5e7eb', bg: 'light', text: 'dark'};
        }
    }

    function bindTableEvents() {
        // Status Change
        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async (e) => {
                const orderId = e.target.getAttribute('data-id');
                const newStatus = e.target.value;
                
                try {
                    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
                    if (error) throw error;
                    AppUtils.Toast.show(`Status updated to ${newStatus}`, 'success');
                    setTimeout(loadOrders, 300);
                } catch (error) {
                    console.error("Error updating status:", error);
                    AppUtils.Toast.show('Error updating status', 'error');
                }
            });
        });

        // Delete Order
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const orderId = e.target.getAttribute('data-id');
                if (confirm(`Are you sure you want to delete order ${orderId}?`)) {
                    try {
                        const { error } = await supabase.from('orders').delete().eq('id', orderId);
                        if (error) throw error;
                        AppUtils.Toast.show('Order deleted', 'success');
                        loadOrders();
                    } catch (error) {
                        console.error("Error deleting order:", error);
                        AppUtils.Toast.show('Error deleting order', 'error');
                    }
                }
            });
        });
    }

    // Clear all orders
    clearOrdersBtn.addEventListener('click', async () => {
        if (confirm('WARNING: Are you sure you want to delete ALL orders? This cannot be undone.')) {
            try {
                // Delete all rows in Supabase by matching where id is not null
                const { error } = await supabase.from('orders').delete().neq('id', 'dummy_val');
                if (error) throw error;
                
                AppUtils.Toast.show('All orders cleared', 'success');
                loadOrders();
            } catch (error) {
                console.error("Error clearing orders:", error);
                AppUtils.Toast.show('Error clearing orders', 'error');
            }
        }
    });
});
