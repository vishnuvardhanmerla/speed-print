import { supabase } from './supabase-config.js';
document.addEventListener('DOMContentLoaded', () => {
    // --- File Upload Logic ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');
    const fileNameEl = document.getElementById('file-name');
    const fileSizeEl = document.getElementById('file-size');
    const removeFileBtn = document.getElementById('remove-file-btn');
    const configSection = document.getElementById('config-section');
    const pageCountWrapper = document.getElementById('page-count-wrapper');
    const pageCountInput = document.getElementById('page-count');

    let currentFile = null;

    // Allowed extensions
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png'];

    const handleFile = (file) => {
        if (!file) return;

        // Basic validation
        if (!allowedTypes.includes(file.type)) {
            AppUtils.Toast.show('Invalid file type. Please upload a PDF, Word, or Image file.', 'error');
            return;
        }

        if (file.size > 25 * 1024 * 1024) { // 25MB limit
            AppUtils.Toast.show('File is too large. Maximum size is 25MB.', 'error');
            return;
        }

        currentFile = file;

        // Update UI
        fileNameEl.textContent = file.name;
        fileSizeEl.textContent = (file.size / 1024 / 1024).toFixed(2) + ' MB';
        dropZone.style.display = 'none';
        fileList.style.display = 'block';
        
        // Show page count input
        pageCountWrapper.style.display = 'block';
        pageCountInput.value = '1';
        
        // Enable config section
        configSection.style.opacity = '1';
        configSection.style.pointerEvents = 'auto';
        
        AppUtils.Toast.show('File uploaded successfully!');
        calculatePrice();
    };

    removeFileBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        dropZone.style.display = 'block';
        fileList.style.display = 'none';
        pageCountWrapper.style.display = 'none';
        
        // Disable config section
        configSection.style.opacity = '0.5';
        configSection.style.pointerEvents = 'none';
        
        calculatePrice();
    });

    fileInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    // Drag and Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });


    // --- Price Calculation Logic ---
    const colorModeRadios = document.querySelectorAll('input[name="color-mode"]');
    const sidesRadios = document.querySelectorAll('input[name="print-sides"]');
    const paperSizeSelect = document.getElementById('paper-size');
    const bindingSelect = document.getElementById('binding-option');
    const copiesInput = document.getElementById('copies-count');
    const qtyMinusBtn = document.getElementById('qty-minus');
    const qtyPlusBtn = document.getElementById('qty-plus');
    
    // Summary elements
    const summaryCopies = document.getElementById('summary-copies');
    const summaryPages = document.getElementById('summary-pages');
    const summaryType = document.getElementById('summary-type');
    const summaryBinding = document.getElementById('summary-binding');
    const totalPriceEl = document.getElementById('total-price');
    const submitBtn = document.getElementById('submit-order-btn');

    let currentTotal = 0;

    const calculatePrice = () => {
        if (!currentFile) {
            totalPriceEl.textContent = '₹0';
            submitBtn.disabled = true;
            return;
        }

        const pages = parseInt(pageCountInput.value) || 1;
        const copies = parseInt(copiesInput.value) || 1;
        const colorMode = document.querySelector('input[name="color-mode"]:checked').value;
        const sides = document.querySelector('input[name="print-sides"]:checked').value;
        const binding = bindingSelect.value;
        
        let costPerPage = 0;
        let bindingCost = 0;

        // Pricing logic
        if (colorMode === 'color') {
            costPerPage = 10;
        } else {
            // B&W Logic
            if (copies === 1) {
                costPerPage = 5; // Single copy B&W
            } else {
                // Multiple copies B&W
                if (sides === 'double') {
                    costPerPage = 3; // Both-sided
                } else {
                    costPerPage = 2; // One-sided
                }
            }
        }

        // Binding cost
        if (binding === 'staple') bindingCost = 5;
        if (binding === 'spiral') bindingCost = 30;

        // Total cost calculation
        currentTotal = (pages * copies * costPerPage) + bindingCost;

        // Update Summary UI
        summaryPages.textContent = pages;
        summaryCopies.textContent = copies;
        
        let typeText = colorMode === 'color' ? 'Color' : 'Black & White';
        typeText += sides === 'double' ? ' (Both-Sided)' : ' (One-Sided)';
        summaryType.textContent = typeText;
        
        const bindingTextMap = { none: 'None', staple: 'Corner Staple', spiral: 'Spiral Binding' };
        summaryBinding.textContent = bindingTextMap[binding];
        
        totalPriceEl.textContent = `₹${currentTotal}`;
        
        // Validate before enabling submit
        validateForm();
    };

    // Quantity controls
    qtyMinusBtn.addEventListener('click', () => {
        let val = parseInt(copiesInput.value) || 1;
        if (val > 1) {
            copiesInput.value = val - 1;
            calculatePrice();
        }
    });

    qtyPlusBtn.addEventListener('click', () => {
        let val = parseInt(copiesInput.value) || 1;
        copiesInput.value = val + 1;
        calculatePrice();
    });

    // Event listeners for recalculation
    const inputsToWatch = [
        ...colorModeRadios, 
        ...sidesRadios, 
        paperSizeSelect, 
        bindingSelect, 
        copiesInput,
        pageCountInput
    ];
    inputsToWatch.forEach(input => {
        input.addEventListener('change', calculatePrice);
        input.addEventListener('input', calculatePrice);
    });

    // Color mode UI toggle (Hide sides option if color is selected, though color implies one-side usually, we'll keep sides available but ignore it for pricing, or let's assume color is always per page regardless of sides)
    const sidesContainer = document.getElementById('sides-container');
    colorModeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'color') {
                sidesContainer.style.opacity = '1'; // Keeping it visible to allow selection, though price is fixed ₹10
            } else {
                sidesContainer.style.opacity = '1';
            }
        });
    });


    // --- Submit / WhatsApp Integration ---
    const customerNameInput = document.getElementById('customer-name');
    const customerPhoneInput = document.getElementById('customer-phone');
    const orderNotesInput = document.getElementById('order-notes');

    const validateForm = () => {
        const hasFile = currentFile !== null;
        const hasName = customerNameInput.value.trim() !== '';
        const hasPhone = customerPhoneInput.value.trim().length >= 10;
        
        submitBtn.disabled = !(hasFile && hasName && hasPhone);
    };

    customerNameInput.addEventListener('input', validateForm);
    customerPhoneInput.addEventListener('input', validateForm);

    submitBtn.addEventListener('click', async () => {
        if (submitBtn.disabled) return;
        
        // Show Loading State
        const originalBtnHtml = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.textContent = "Uploading File & Preparing Order...";

        try {
            // Generate ID
            const orderId = 'ORD-' + Math.floor(Math.random() * 90000 + 10000);
            
            const customerName = customerNameInput.value.trim();
            const customerPhone = customerPhoneInput.value.trim();
            const paperSize = paperSizeSelect.options[paperSizeSelect.selectedIndex].text;
            
            // 1. Upload File to Supabase Storage
            const filePath = `orders/${orderId}_${currentFile.name}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('orders')
                .upload(filePath, currentFile);
            
            if (uploadError) throw uploadError;

            // Get Supabase public URL
            const { data: publicData } = supabase.storage
                .from('orders')
                .getPublicUrl(filePath);
            const downloadUrl = publicData.publicUrl;

            // 2. Build the order object
            const order = {
                id: orderId,
                date: new Date().toISOString(),
                status: 'Pending',
                customerName: customerName,
                customerPhone: customerPhone,
                fileName: currentFile.name,
                fileUrl: downloadUrl,
                fileSize: (currentFile.size / 1024 / 1024).toFixed(2) + ' MB',
                pages: parseInt(pageCountInput.value),
                copies: parseInt(copiesInput.value),
                printType: summaryType.textContent,
                paperSize: paperSize,
                binding: summaryBinding.textContent,
                notes: orderNotesInput.value.trim(),
                totalPrice: currentTotal
            };

            // 3. Save to Supabase DB (Table 'orders')
            const { error: dbError } = await supabase
                .from('orders')
                .insert([order]);
                
            if (dbError) throw dbError;

            // WhatsApp Shop Number
        const shopWhatsAppNumber = '917386155528'; 

        // Construct structured WhatsApp message
        let message = `*SPEEDPRINT NEW ORDER* 🖨️\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `*Order ID:* ${orderId}\n`;
        message += `*Customer:* ${customerName}\n`;
        message += `*Phone:* ${customerPhone}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `*📄 DOCUMENT SPECS:*\n`;
        message += `➢ *File Name:* ${order.fileName}\n`;
        message += `➢ *Download Link:* ${order.fileUrl}\n`;
        message += `➢ *Total Pages:* ${order.pages} ${order.pages === 1 ? 'page' : 'pages'}\n`;
        message += `➢ *Print Type:* ${order.printType}\n`;
        message += `➢ *Paper Size:* ${order.paperSize}\n`;
        message += `➢ *No. of Copies:* ${order.copies}\n`;
        message += `➢ *Binding Add-on:* ${order.binding}\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━\n`;
        
        if (order.notes) {
            message += `*📝 SPECIAL INSTRUCTIONS:*\n${order.notes}\n`;
            message += `━━━━━━━━━━━━━━━━━━━━━\n`;
        }

        message += `*💰 TOTAL AMOUNT DUE: ₹${currentTotal}*\n`;
        message += `━━━━━━━━━━━━━━━━━━━━━\n`;
        message += `_Please confirm receipt and share payment details._`;

        // Encode and open link
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${shopWhatsAppNumber}?text=${encodedMessage}`;
        
        AppUtils.Toast.show('Order recorded! Redirecting to WhatsApp...', 'success');
        
        setTimeout(() => {
            window.open(whatsappUrl, '_blank');
            // Reset form
            removeFileBtn.click();
            customerNameInput.value = '';
            customerPhoneInput.value = '';
            orderNotesInput.value = '';
            submitBtn.innerHTML = originalBtnHtml; // Restore button
        }, 1500);

        } catch (error) {
            console.error("Supabase Error:", error);
            AppUtils.Toast.show("Error connecting to Supabase. Did you add your config?", "error", 5000);
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
        }
    });
});
