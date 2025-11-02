// Global Variables
let currentMode = 'single';
let uploadedFiles = [];
let currentUser = null;
let workHistory = [];
let currentWorkId = null;
let selectedText = '';

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showMainApp();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Load work history from localStorage
    loadWorkHistory();
}

function setupEventListeners() {
    const fileInput = document.getElementById('fileInput');
    const uploadArea = document.getElementById('uploadArea');
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Auth tabs
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const tabName = this.dataset.tab;
            switchTab(tabName);
        });
    });
}

// Authentication Functions
function switchTab(tabName) {
    // Update tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Update forms
    document.querySelectorAll('.auth-form').forEach(form => {
        form.classList.remove('active');
    });
    document.getElementById(tabName + 'Form').classList.add('active');
}

function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }
    
    // Simulate login (in production, this would call a backend API)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        currentUser = { name: user.name, email: user.email };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        showToast('Đăng nhập thành công!', 'success');
        showMainApp();
    } else {
        showToast('Email hoặc mật khẩu không đúng', 'error');
    }
}

function handleRegister() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showToast('Vui lòng điền đầy đủ thông tin', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showToast('Mật khẩu xác nhận không khớp', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Mật khẩu phải có ít nhất 6 ký tự', 'error');
        return;
    }
    
    // Save user (in production, this would call a backend API)
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (users.find(u => u.email === email)) {
        showToast('Email đã được sử dụng', 'error');
        return;
    }
    
    users.push({ name, email, password });
    localStorage.setItem('users', JSON.stringify(users));
    
    showToast('Đăng ký thành công! Vui lòng đăng nhập', 'success');
    switchTab('login');
}

function handleLogout() {
    localStorage.removeItem('currentUser');
    currentUser = null;
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('authModal').classList.add('active');
    showToast('Đã đăng xuất', 'success');
}

function showMainApp() {
    document.getElementById('authModal').classList.remove('active');
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('userName').textContent = currentUser.name;
    loadWorkHistory();
}

// Mode Selection
function selectMode(mode) {
    currentMode = mode;
    
    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    // Update upload info
    const uploadInfo = document.getElementById('uploadInfo');
    const fileInput = document.getElementById('fileInput');
    
    if (mode === 'single') {
        uploadInfo.textContent = 'Tối đa 1 hình ảnh';
        fileInput.removeAttribute('multiple');
    } else {
        uploadInfo.textContent = 'Tối đa 5 hình ảnh';
        fileInput.setAttribute('multiple', 'multiple');
    }
    
    // Clear current uploads
    uploadedFiles = [];
    updatePreview();
}

// File Upload Functions
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
        file.type.startsWith('image/')
    );
    
    addFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

function addFiles(files) {
    const maxFiles = currentMode === 'single' ? 1 : 5;
    
    if (currentMode === 'single') {
        uploadedFiles = [];
    }
    
    files.forEach(file => {
        if (uploadedFiles.length < maxFiles) {
            uploadedFiles.push(file);
        }
    });
    
    if (uploadedFiles.length > maxFiles) {
        uploadedFiles = uploadedFiles.slice(0, maxFiles);
        showToast(`Chỉ có thể upload tối đa ${maxFiles} hình ảnh`, 'warning');
    }
    
    updatePreview();
}

function updatePreview() {
    const previewContainer = document.getElementById('previewContainer');
    const uploadPlaceholder = document.querySelector('.upload-placeholder');
    const processBtn = document.getElementById('processBtn');
    
    if (uploadedFiles.length > 0) {
        uploadPlaceholder.style.display = 'none';
        previewContainer.style.display = 'grid';
        processBtn.disabled = false;
        
        previewContainer.innerHTML = '';
        uploadedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement('div');
                previewItem.className = 'preview-item';
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview ${index + 1}">
                    <button class="preview-item-remove" onclick="removeFile(${index})">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                previewContainer.appendChild(previewItem);
            };
            reader.readAsDataURL(file);
        });
    } else {
        uploadPlaceholder.style.display = 'block';
        previewContainer.style.display = 'none';
        processBtn.disabled = true;
    }
}

function removeFile(index) {
    uploadedFiles.splice(index, 1);
    updatePreview();
}

// Image Processing Functions
function processImages() {
    if (uploadedFiles.length === 0) {
        showToast('Vui lòng chọn hình ảnh để xử lý', 'error');
        return;
    }
    
    showToast('Đang xử lý hình ảnh...', 'success');
    
    // Simulate OCR processing (in production, this would call an OCR API)
    setTimeout(() => {
        const textBoxesContainer = document.getElementById('textBoxesContainer');
        textBoxesContainer.innerHTML = '';
        
        uploadedFiles.forEach((file, index) => {
            const sampleTexts = [
                'Đây là văn bản mẫu được trích xuất từ hình ảnh. Công nghệ OCR (Optical Character Recognition) cho phép chuyển đổi hình ảnh chứa văn bản thành văn bản có thể chỉnh sửa được.',
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
                'Hệ thống AI của chúng tôi có khả năng nhận dạng và trích xuất văn bản từ nhiều loại hình ảnh khác nhau với độ chính xác cao.',
                'Văn bản này được trích xuất tự động từ hình ảnh bằng công nghệ học máy và xử lý ngôn ngữ tự nhiên.',
                'Machine learning và deep learning đã cách mạng hóa cách chúng ta xử lý và hiểu dữ liệu hình ảnh.'
            ];
            
            createTextBox(index + 1, sampleTexts[index % sampleTexts.length]);
        });
        
        // Save to work history
        saveCurrentWork();
        
        showToast('Xử lý hoàn tất!', 'success');
        
        // Enable text selection for processing
        enableTextSelection();
    }, 2000);
}

function createTextBox(number, content) {
    const textBoxesContainer = document.getElementById('textBoxesContainer');
    
    const textBox = document.createElement('div');
    textBox.className = 'text-box';
    textBox.innerHTML = `
        <div class="text-box-header">
            <span class="text-box-title">Văn bản ${number}</span>
            <div class="text-box-actions">
                <button onclick="copyTextBox(this)" title="Sao chép">
                    <i class="fas fa-copy"></i>
                </button>
                <button onclick="downloadTextBox(this)" title="Tải xuống">
                    <i class="fas fa-download"></i>
                </button>
                <button onclick="deleteTextBox(this)" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
        <div class="text-box-content" contenteditable="true">${content}</div>
    `;
    
    textBoxesContainer.appendChild(textBox);
}

function copyTextBox(button) {
    const content = button.closest('.text-box').querySelector('.text-box-content').textContent;
    navigator.clipboard.writeText(content);
    showToast('Đã sao chép văn bản', 'success');
}

function downloadTextBox(button) {
    const content = button.closest('.text-box').querySelector('.text-box-content').textContent;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'text-output.txt';
    a.click();
    showToast('Đang tải xuống...', 'success');
}

function deleteTextBox(button) {
    if (confirm('Bạn có chắc muốn xóa văn bản này?')) {
        button.closest('.text-box').remove();
        showToast('Đã xóa văn bản', 'success');
    }
}

// Text Selection and Processing
function enableTextSelection() {
    const textBoxes = document.querySelectorAll('.text-box-content');
    
    textBoxes.forEach(box => {
        box.addEventListener('mouseup', function() {
            const selection = window.getSelection();
            const text = selection.toString().trim();
            
            if (text.length > 0) {
                selectedText = text;
                updateSelectedText(text);
                showProcessingTools();
            }
        });
    });
}

function updateSelectedText(text) {
    const selectedTextDisplay = document.getElementById('selectedTextDisplay');
    selectedTextDisplay.textContent = text;
}

function showProcessingTools() {
    const processingTools = document.getElementById('processingTools');
    processingTools.style.display = 'block';
}

// Text Processing Tools
function textToSpeech() {
    if (!selectedText) {
        showToast('Vui lòng chọn văn bản trước', 'error');
        return;
    }
    
    // Use Web Speech API
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(selectedText);
        utterance.lang = 'vi-VN';
        window.speechSynthesis.speak(utterance);
        
        const toolResult = document.getElementById('toolResult');
        toolResult.className = 'tool-result active';
        toolResult.innerHTML = `
            <h4><i class="fas fa-volume-up"></i> Đang phát âm thanh</h4>
            <p>Đã chuyển văn bản thành giọng nói.</p>
        `;
        
        showToast('Đang phát âm thanh...', 'success');
    } else {
        showToast('Trình duyệt không hỗ trợ chức năng này', 'error');
    }
}

function translateText() {
    if (!selectedText) {
        showToast('Vui lòng chọn văn bản trước', 'error');
        return;
    }
    
    showToast('Đang dịch văn bản...', 'success');
    
    // Simulate translation (in production, this would call a translation API)
    setTimeout(() => {
        const translatedText = `Translated: ${selectedText}`;
        
        const toolResult = document.getElementById('toolResult');
        toolResult.className = 'tool-result active';
        toolResult.innerHTML = `
            <h4><i class="fas fa-language"></i> Kết quả dịch (Tiếng Anh)</h4>
            <p>${translatedText}</p>
            <button class="btn btn-primary" style="margin-top: 10px;" onclick="copyTranslation()">
                <i class="fas fa-copy"></i> Sao chép bản dịch
            </button>
        `;
        
        showToast('Dịch hoàn tất!', 'success');
    }, 1500);
}

function researchText() {
    if (!selectedText) {
        showToast('Vui lòng chọn văn bản trước', 'error');
        return;
    }
    
    showToast('Đang nghiên cứu...', 'success');
    
    // Simulate research (in production, this would call an AI research API)
    setTimeout(() => {
        const toolResult = document.getElementById('toolResult');
        toolResult.className = 'tool-result active';
        toolResult.innerHTML = `
            <h4><i class="fas fa-search"></i> Kết quả nghiên cứu</h4>
            <p><strong>Chủ đề:</strong> ${selectedText.substring(0, 50)}...</p>
            <p><strong>Phân tích:</strong> Đây là nội dung được phân tích bởi AI. Văn bản có vẻ liên quan đến chủ đề công nghệ và xử lý dữ liệu.</p>
            <p><strong>Từ khóa chính:</strong> AI, Machine Learning, OCR, Xử lý ảnh</p>
            <p><strong>Độ tin cậy:</strong> 95%</p>
        `;
        
        showToast('Nghiên cứu hoàn tất!', 'success');
    }, 2000);
}

function copyTranslation() {
    const translationText = document.querySelector('#toolResult p').textContent;
    navigator.clipboard.writeText(translationText);
    showToast('Đã sao chép bản dịch', 'success');
}

// Work History Functions
function loadWorkHistory() {
    const savedHistory = localStorage.getItem(`workHistory_${currentUser.email}`);
    workHistory = savedHistory ? JSON.parse(savedHistory) : [];
    updateHistoryList();
}

function saveCurrentWork() {
    const textBoxes = document.querySelectorAll('.text-box-content');
    const texts = Array.from(textBoxes).map(box => box.textContent);
    
    const work = {
        id: Date.now(),
        title: `Công việc ${new Date().toLocaleDateString('vi-VN')}`,
        date: new Date().toISOString(),
        texts: texts
    };
    
    workHistory.unshift(work);
    
    // Keep only last 20 works
    if (workHistory.length > 20) {
        workHistory = workHistory.slice(0, 20);
    }
    
    localStorage.setItem(`workHistory_${currentUser.email}`, JSON.stringify(workHistory));
    updateHistoryList();
}

function updateHistoryList() {
    const historyList = document.getElementById('historyList');
    
    if (workHistory.length === 0) {
        historyList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 20px;">Chưa có lịch sử</p>';
        return;
    }
    
    historyList.innerHTML = '';
    workHistory.forEach(work => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        if (currentWorkId === work.id) {
            historyItem.classList.add('active');
        }
        
        const date = new Date(work.date);
        historyItem.innerHTML = `
            <div class="history-item-content" onclick="loadWork(${work.id})">
                <div class="history-item-title">${work.title}</div>
                <div class="history-item-date">${date.toLocaleString('vi-VN')}</div>
            </div>
            <div class="history-item-actions">
                <button onclick="event.stopPropagation(); renameWork(${work.id})" title="Đổi tên">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="event.stopPropagation(); deleteWork(${work.id})" title="Xóa">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        historyList.appendChild(historyItem);
    });
}

function loadWork(workId) {
    const work = workHistory.find(w => w.id === workId);
    if (!work) return;
    
    currentWorkId = workId;
    
    const textBoxesContainer = document.getElementById('textBoxesContainer');
    textBoxesContainer.innerHTML = '';
    
    work.texts.forEach((text, index) => {
        createTextBox(index + 1, text);
    });
    
    updateHistoryList();
    enableTextSelection();
    showToast('Đã tải công việc', 'success');
}

function createNewWork() {
    currentWorkId = null;
    document.getElementById('textBoxesContainer').innerHTML = '';
    uploadedFiles = [];
    updatePreview();
    updateHistoryList();
    showToast('Đã tạo công việc mới', 'success');
}

function renameWork(workId) {
    const work = workHistory.find(w => w.id === workId);
    if (!work) return;
    
    const newTitle = prompt('Nhập tên mới:', work.title);
    if (newTitle && newTitle.trim()) {
        work.title = newTitle.trim();
        localStorage.setItem(`workHistory_${currentUser.email}`, JSON.stringify(workHistory));
        updateHistoryList();
        showToast('Đã đổi tên công việc', 'success');
    }
}

function deleteWork(workId) {
    if (!confirm('Bạn có chắc muốn xóa công việc này?')) return;
    
    workHistory = workHistory.filter(w => w.id !== workId);
    localStorage.setItem(`workHistory_${currentUser.email}`, JSON.stringify(workHistory));
    
    if (currentWorkId === workId) {
        currentWorkId = null;
        document.getElementById('textBoxesContainer').innerHTML = '';
    }
    
    updateHistoryList();
    showToast('Đã xóa công việc', 'success');
}

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}