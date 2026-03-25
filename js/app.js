/**
 * Shared Utilities and UI Logic
 */

// Format currency (INR)
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
};

// Toast Notification System
const Toast = {
    init() {
        if (!document.querySelector('.toast-container')) {
            const container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
    },

    show(message, type = 'success', duration = 3000) {
        this.init();
        
        const container = document.querySelector('.toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'check-circle';
        if (type === 'error') icon = 'x-circle';
        if (type === 'warning') icon = 'alert-triangle';

        toast.innerHTML = `
            <i data-lucide="${icon}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Initialize lucide icon if available
        if (typeof lucide !== 'undefined') {
            lucide.createIcons({ root: toast });
        }

        // Remove after duration
        setTimeout(() => {
            toast.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                if (toast.parentNode === container) {
                    container.removeChild(toast);
                }
            }, 300);
        }, duration);
    }
};

// Navbar/Mobile Menu Logic
const initNavbar = () => {
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    
    if (mobileBtn && navLinks) {
        mobileBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open');
            
            // Toggle icon
            const icon = mobileBtn.querySelector('i');
            if (icon) {
                const currentIcon = icon.getAttribute('data-lucide');
                icon.setAttribute('data-lucide', currentIcon === 'menu' ? 'x' : 'menu');
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (navLinks.classList.contains('active') && !e.target.closest('.navbar')) {
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
                
                const icon = mobileBtn.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            }
        });
    }

    // Highlight active nav link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.nav-links a');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPath || (href === './' && currentPath === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
};

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Initialize components
    initNavbar();
});

// Export globally
window.AppUtils = {
    formatCurrency,
    Toast
};
