// =================================================================
        // GLOBAL VARIABLES AND CONFIGURATION
        // =================================================================
        let currentUser = null;
        let authToken = null;
        let issues = [];
        let reportMap = null;
        let overviewMap = null;
        let adminMap = null;
        let currentLocation = null;
        let reportMarker = null;

        // Backend configuration
        const API_CONFIG = {
            BASE_URL: 'http://localhost:3000/api', // Change this to your backend URL
            TIMEOUT: 10000,
            RETRY_ATTEMPTS: 3
        };

        // Sample data for demo (backend simulation)
        const DEMO_USERS = [
            {
                id: '1',
                name: 'Admin User',
                email: 'admin@citysense.com',
                password: 'admin123',
                role: 'admin'
            },
            {
                id: '2',
                name: 'John Doe',
                email: 'user@example.com', 
                password: 'user123',
                role: 'user'
            }
        ];

        const DEMO_ISSUES = [
            {
                id: '1',
                title: 'Broken streetlight on Main Street',
                category: 'infrastructure',
                priority: 'high',
                status: 'submitted',
                description: 'Streetlight pole #45 has been non-functional for 3 days',
                location: { lat: 28.4089, lng: 77.3178, address: 'Main Street, Faridabad' },
                user: { name: 'John Doe', email: 'john@example.com' },
                assignedDepartment: 'Public Works',
                createdAt: new Date('2025-08-30T10:30:00'),
                updatedAt: new Date('2025-08-30T10:30:00')
            },
            {
                id: '2',
                title: 'Pothole causing traffic issues',
                category: 'infrastructure', 
                priority: 'medium',
                status: 'in-progress',
                description: 'Large pothole near intersection causing vehicle damage',
                location: { lat: 28.4094, lng: 77.3185, address: 'Sector 15, Faridabad' },
                user: { name: 'Jane Smith', email: 'jane@example.com' },
                assignedDepartment: 'Public Works',
                createdAt: new Date('2025-08-29T14:15:00'),
                updatedAt: new Date('2025-08-31T09:00:00')
            }
        ];

        // =================================================================
        // BACKEND API INTEGRATION
        // =================================================================
        
        class BackendAPI {
            static async request(endpoint, options = {}) {
                const url = `${API_CONFIG.BASE_URL}${endpoint}`;
                const config = {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
                        ...options.headers
                    },
                    timeout: API_CONFIG.TIMEOUT,
                    ...options
                };

                try {
                    // For demo purposes, simulate API calls
                    return await this.simulateAPICall(endpoint, config);
                } catch (error) {
                    console.error('API request failed:', error);
                    throw error;
                }
            }

            static async simulateAPICall(endpoint, config) {
                return new Promise((resolve, reject) => {
                    // Simulate network delay
                    const delay = 800 + Math.random() * 400;
                    
                    setTimeout(() => {
                        try {
                            const method = config.method || 'GET';
                            const body = config.body ? JSON.parse(config.body) : null;
                            
                            console.log(`🌐 API: ${method} ${endpoint}`, body);
                            
                            // Route to appropriate handler
                            if (endpoint === '/auth/login' && method === 'POST') {
                                resolve(this.handleLogin(body));
                            } else if (endpoint === '/auth/register' && method === 'POST') {
                                resolve(this.handleRegister(body));
                            } else if (endpoint === '/issues' && method === 'POST') {
                                resolve(this.handleCreateIssue(body));
                            } else if (endpoint === '/issues' && method === 'GET') {
                                resolve(this.handleGetIssues());
                            } else {
                                resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
                            }
                        } catch (error) {
                            reject({ error: error.message });
                        }
                    }, delay);
                });
            }

            static handleLogin(credentials) {
                const user = DEMO_USERS.find(u => 
                    u.email === credentials.email && u.password === credentials.password
                );
                
                if (user) {
                    return {
                        ok: true,
                        json: () => Promise.resolve({
                            success: true,
                            token: `jwt_token_${Date.now()}`,
                            user: {
                                id: user.id,
                                name: user.name,
                                email: user.email,
                                role: user.role
                            }
                        })
                    };
                } else {
                    throw new Error('Invalid credentials');
                }
            }

            static handleRegister(userData) {
                const existingUser = DEMO_USERS.find(u => u.email === userData.email);
                if (existingUser) {
                    throw new Error('User already exists');
                }

                const newUser = {
                    id: Date.now().toString(),
                    ...userData,
                    role: 'user'
                };
                
                DEMO_USERS.push(newUser);
                
                return {
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        token: `jwt_token_${Date.now()}`,
                        user: {
                            id: newUser.id,
                            name: newUser.name,
                            email: newUser.email,
                            role: newUser.role
                        }
                    })
                };
            }

            static handleCreateIssue(issueData) {
                const newIssue = {
                    id: Date.now().toString(),
                    ...issueData,
                    status: 'submitted',
                    assignedDepartment: this.getDepartmentByCategory(issueData.category),
                    user: currentUser,
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                issues.unshift(newIssue);
                
                return {
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        issue: newIssue
                    })
                };
            }

            static handleGetIssues() {
                return {
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        issues: issues
                    })
                };
            }

            static getDepartmentByCategory(category) {
                const departments = {
                    'infrastructure': 'Public Works',
                    'environment': 'Environmental Services',
                    'safety': 'Public Safety',
                    'services': 'Parks & Recreation',
                    'other': 'General Administration'
                };
                return departments[category] || 'General Administration';
            }
        }

        // =================================================================
        // AUTHENTICATION FUNCTIONS
        // =================================================================
        
        async function handleLogin(e) {
            e.preventDefault();
            console.log('🔑 Login form submitted');
            
            const submitBtn = document.getElementById('loginSubmitBtn');
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            // Clear previous alerts
            document.getElementById('loginAlert').innerHTML = '';
            
            // Validate input
            if (!email || !password) {
                showAlert('loginAlert', '❌ Please fill in all fields', 'error');
                return;
            }

            if (!validateEmail(email)) {
                showAlert('loginAlert', '❌ Please enter a valid email address', 'error');
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '🔄 Logging in...';
            
            try {
                const response = await BackendAPI.request('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    currentUser = result.user;
                    authToken = result.token;
                    
                    // Save to localStorage
                    localStorage.setItem('citysense_user', JSON.stringify(currentUser));
                    localStorage.setItem('citysense_token', authToken);
                    
                    updateAuthState();
                    closeModal('loginModal');
                    showNotification(`Welcome back, ${result.user.name}! 🎉`, 'success');
                    document.getElementById('loginForm').reset();
                    
                    console.log('✅ Login successful:', currentUser);
                } else {
                    showAlert('loginAlert', '❌ Login failed', 'error');
                }
                
            } catch (error) {
                console.error('❌ Login error:', error);
                showAlert('loginAlert', `❌ ${error.message || 'Login failed. Please try again.'}`, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '🚀 Login to Account';
            }
        }
        
        async function handleRegister(e) {
            e.preventDefault();
            console.log('👤 Register form submitted');
            
            const submitBtn = document.getElementById('registerSubmitBtn');
            const name = document.getElementById('registerName').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const phone = document.getElementById('registerPhone').value.trim();
            const password = document.getElementById('registerPassword').value;
            
            // Clear previous alerts
            document.getElementById('registerAlert').innerHTML = '';
            
            // Validate input
            if (!name || !email || !password) {
                showAlert('registerAlert', '❌ Please fill in all required fields', 'error');
                return;
            }
            
            if (name.length < 2) {
                showAlert('registerAlert', '❌ Name must be at least 2 characters long', 'error');
                return;
            }
            
            if (!validateEmail(email)) {
                showAlert('registerAlert', '❌ Please enter a valid email address', 'error');
                return;
            }
            
            if (password.length < 6) {
                showAlert('registerAlert', '❌ Password must be at least 6 characters long', 'error');
                return;
            }
            
            if (phone && !validatePhone(phone)) {
                showAlert('registerAlert', '❌ Please enter a valid phone number', 'error');
                return;
            }
            
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '🔄 Creating account...';
            
            try {
                const response = await BackendAPI.request('/auth/register', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, phone, password })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    currentUser = result.user;
                    authToken = result.token;
                    
                    // Save to localStorage
                    localStorage.setItem('citysense_user', JSON.stringify(currentUser));
                    localStorage.setItem('citysense_token', authToken);
                    
                    updateAuthState();
                    closeModal('registerModal');
                    showNotification(`Account created successfully! Welcome, ${result.user.name}! 🎉`, 'success');
                    document.getElementById('registerForm').reset();
                    
                    console.log('✅ Registration successful:', currentUser);
                } else {
                    showAlert('registerAlert', '❌ Registration failed', 'error');
                }
                
            } catch (error) {
                console.error('❌ Registration error:', error);
                showAlert('registerAlert', `❌ ${error.message || 'Registration failed. Please try again.'}`, 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '✨ Create Account';
            }
        }
        
        async function logout() {
            console.log('🚪 Logout initiated');
            
            currentUser = null;
            authToken = null;
            
            // Clear localStorage
            localStorage.removeItem('citysense_user');
            localStorage.removeItem('citysense_token');
            
            updateAuthState();
            clearLocationSelection();
            document.getElementById('issueForm').reset();
            
            showNotification('You have been logged out successfully', 'info');
            console.log('✅ Logout completed');
        }
        
        async function refreshData() {
            console.log('🔄 Refresh initiated');
            const refreshBtn = document.getElementById('refreshBtn');
            
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '🔄 Refreshing...';
            refreshBtn.classList.add('pulse');
            
            try {
                // Fetch fresh data from backend
                const response = await BackendAPI.request('/issues');
                const result = await response.json();
                
                if (result.success) {
                    // Add some live updates simulation
                    if (Math.random() > 0.7) {
                        const newIssue = generateRandomIssue();
                        issues.unshift(newIssue);
                    }
                    
                    // Update some existing issues
                    issues.forEach(issue => {
                        if (Math.random() > 0.85 && issue.status !== 'resolved') {
                            const statuses = ['submitted', 'assigned', 'in-progress', 'resolved'];
                            const currentIndex = statuses.indexOf(issue.status);
                            if (currentIndex < statuses.length - 1) {
                                issue.status = statuses[currentIndex + 1];
                                issue.updatedAt = new Date();
                            }
                        }
                    });
                    
                    // Update UI
                    updateIssueList();
                    updateStatistics();
                    plotIssuesOnMap();
                    
                    if (document.getElementById('adminModal').classList.contains('show')) {
                        updateAdminStatistics();
                        updateAdminIssueList();
                        plotAdminMapMarkers();
                    }
                    
                    showNotification('Data refreshed successfully! 📊', 'success');
                    console.log('✅ Refresh completed');
                }
                
            } catch (error) {
                console.error('❌ Refresh error:', error);
                showNotification('Refresh completed with local data', 'info');
            } finally {
                refreshBtn.disabled = false;
                refreshBtn.innerHTML = '🔄 Refresh';
                refreshBtn.classList.remove('pulse');
            }
        }

        // =================================================================
        // HELPER FUNCTIONS
        // =================================================================
        
        function validateEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }
        
        function validatePhone(phone) {
            return !phone || /^[\+]?[\d\s\-\(\)]{10,}$/.test(phone);
        }
        
        function showAlert(containerId, message, type) {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
            }
        }
        
        function showNotification(message, type) {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.innerHTML = message;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideInRight 0.3s ease reverse';
                setTimeout(() => notification.remove(), 300);
            }, 4000);
        }
        
        function updateAuthState() {
            const elements = {
                loginBtn: document.getElementById('loginBtn'),
                registerBtn: document.getElementById('registerBtn'),
                logoutBtn: document.getElementById('logoutBtn'),
                adminBtn: document.getElementById('adminBtn'),
                userInfo: document.getElementById('userInfo'),
                userName: document.getElementById('userName'),
                userRole: document.getElementById('userRole'),
                authMessage: document.getElementById('authMessage')
            };

            if (currentUser) {
                elements.loginBtn.classList.add('hidden');
                elements.registerBtn.classList.add('hidden');
                elements.logoutBtn.classList.remove('hidden');
                elements.userInfo.classList.remove('hidden');
                elements.userName.textContent = currentUser.name;
                elements.userRole.textContent = currentUser.role;
                elements.userRole.className = `status-badge status-${currentUser.role === 'admin' ? 'resolved' : 'assigned'}`;
                elements.authMessage.classList.add('hidden');
                
                if (currentUser.role === 'admin') {
                    elements.adminBtn.classList.remove('hidden');
                }
            } else {
                elements.loginBtn.classList.remove('hidden');
                elements.registerBtn.classList.remove('hidden');
                elements.logoutBtn.classList.add('hidden');
                elements.adminBtn.classList.add('hidden');
                elements.userInfo.classList.add('hidden');
                elements.authMessage.classList.remove('hidden');
            }
        }

        function openModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = 'flex';
                modal.classList.add('show');
                
                // Clear alerts
                const alerts = modal.querySelectorAll('[id$="Alert"]');
                alerts.forEach(alert => alert.innerHTML = '');
                
                // Focus first input
                setTimeout(() => {
                    const firstInput = modal.querySelector('input[type="text"], input[type="email"]');
                    if (firstInput) firstInput.focus();
                }, 300);
            }
        }

        function closeModal(modalId) {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.style.display = 'none', 300);
            }
        }

        function generateRandomIssue() {
            const titles = [
                'Traffic signal malfunction detected',
                'Water pipeline burst reported',
                'Illegal waste dumping observed',
                'Street lighting failure',
                'Road surface damage'
            ];
            
            return {
                id: Date.now().toString(),
                title: titles[Math.floor(Math.random() * titles.length)],
                category: ['infrastructure', 'safety', 'environment', 'services'][Math.floor(Math.random() * 4)],
                priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
                status: 'submitted',
                description: 'Auto-generated issue for demonstration',
                location: {
                    lat: 28.4089 + (Math.random() - 0.5) * 0.02,
                    lng: 77.3178 + (Math.random() - 0.5) * 0.02,
                    address: `Sector ${Math.floor(Math.random() * 20) + 1}, Faridabad`
                },
                user: { name: 'System Monitor', email: 'monitor@citysense.com' },
                assignedDepartment: 'Public Works',
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }

        // =================================================================
        // INITIALIZATION AND EVENT SETUP
        // =================================================================
        
        function checkUserSession() {
            try {
                const savedUser = localStorage.getItem('citysense_user');
                const savedToken = localStorage.getItem('citysense_token');
                
                if (savedUser && savedToken) {
                    currentUser = JSON.parse(savedUser);
                    authToken = savedToken;
                    console.log('✅ Session restored:', currentUser.name);
                }
            } catch (e) {
                console.log('No saved session found');
            }
            
            updateAuthState();
        }

        function initializeMaps() {
            // Report map
            reportMap = L.map('reportMap').setView([28.4089, 77.3178], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(reportMap);

            // Overview map
            overviewMap = L.map('overviewMap').setView([28.4089, 77.3178], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(overviewMap);

            reportMap.on('click', function(e) {
                if (currentUser) {
                    setReportLocation(e.latlng.lat, e.latlng.lng);
                } else {
                    showNotification('Please login first to select location', 'error');
                }
            });
        }

        function setReportLocation(lat, lng) {
            currentLocation = { lat, lng };
            
            if (reportMarker) {
                reportMap.removeLayer(reportMarker);
            }
            
            reportMarker = L.marker([lat, lng]).addTo(reportMap);
            
            const address = `Sector ${Math.floor(Math.random() * 20) + 1}, Faridabad, Haryana`;
            document.getElementById('locationInfo').innerHTML = `
                📍 <strong>Location Selected:</strong><br>
                <strong>Coordinates:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}<br>
                <strong>Address:</strong> ${address}
            `;
            document.getElementById('locationInfo').classList.remove('hidden');
        }

        function clearLocationSelection() {
            currentLocation = null;
            if (reportMarker) {
                reportMap.removeLayer(reportMarker);
                reportMarker = null;
            }
            document.getElementById('locationInfo').classList.add('hidden');
        }

        function getCurrentLocation() {
            if (!currentUser) {
                showNotification('Please login first', 'error');
                return;
            }

            if (navigator.geolocation) {
                const btn = document.getElementById('getCurrentLocation');
                btn.disabled = true;
                btn.innerHTML = '🔄 Getting location...';
                
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        reportMap.setView([lat, lng], 16);
                        setReportLocation(lat, lng);
                        btn.disabled = false;
                        btn.innerHTML = '🎯 Use My Current Location';
                        showNotification('Location detected successfully! 🎯', 'success');
                    },
                    (error) => {
                        console.error('Geolocation error:', error);
                        showNotification('Unable to get location. Please select on map.', 'error');
                        btn.disabled = false;
                        btn.innerHTML = '🎯 Use My Current Location';
                    }
                );
            }
        }

        async function handleIssueSubmit(e) {
            e.preventDefault();
            
            if (!currentUser) {
                showNotification('Please login to report issues', 'error');
                return;
            }

            if (!currentLocation) {
                showNotification('Please select location on map', 'error');
                return;
            }

            const submitBtn = document.getElementById('submitBtn');
            const title = document.getElementById('issueTitle').value.trim();
            const category = document.getElementById('issueCategory').value;
            const priority = document.getElementById('issuePriority').value;
            const description = document.getElementById('issueDescription').value.trim();

            if (!title || !category) {
                showNotification('Please fill required fields', 'error');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerHTML = '🔄 Submitting...';
            document.getElementById('loadingReport').classList.remove('hidden');

            try {
                const issueData = {
                    title,
                    category,
                    priority,
                    description: description || 'No description provided',
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng,
                    address_formatted: document.getElementById('locationInfo').textContent.split('Address: ')[1] || 'Address not available'
                };

                const response = await BackendAPI.request('/issues', {
                    method: 'POST',
                    body: JSON.stringify(issueData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    updateIssueList();
                    updateStatistics();
                    plotIssuesOnMap();

                    document.getElementById('issueForm').reset();
                    clearLocationSelection();
                    
                    const photoPreview = document.getElementById('photoPreview');
                    photoPreview.classList.add('hidden');
                    photoPreview.src = '';
                    document.getElementById('uploadText').innerHTML = '📸 Click to upload photo evidence';

                    showNotification(`Issue "${title}" reported successfully! 🎉`, 'success');
                }
                
            } catch (error) {
                console.error('Issue submission error:', error);
                showNotification('Failed to submit issue. Please try again.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '🚀 Submit Issue Report';
                document.getElementById('loadingReport').classList.add('hidden');
            }
        }

        function handlePhotoUpload(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showNotification('File too large. Max 5MB allowed.', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('photoPreview');
                    preview.src = e.target.result;
                    preview.classList.remove('hidden');
                    document.getElementById('uploadText').innerHTML = '✅ Photo uploaded successfully';
                    showNotification('Photo uploaded! 📸', 'success');
                };
                reader.readAsDataURL(file);
            }
        }

        function updateIssueList() {
            const issueList = document.getElementById('issueList');
            const filteredIssues = getFilteredIssues();

            if (filteredIssues.length === 0) {
                issueList.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #718096;">
                        <div style="font-size: 48px; margin-bottom: 16px;">📭</div>
                        <h3>No Issues Found</h3>
                        <p>No issues match your filters.</p>
                    </div>
                `;
                return;
            }

            issueList.innerHTML = filteredIssues.map(issue => `
                <div class="issue-item" onclick="viewIssueDetail('${issue.id}')">
                    <div class="issue-header">
                        <div class="issue-title">
                            ${getCategoryIcon(issue.category)} ${issue.title}
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="priority-badge priority-${issue.priority}">${issue.priority}</span>
                            <span class="status-badge status-${issue.status}">${issue.status}</span>
                        </div>
                    </div>
                    <div style="font-size: 14px; color: #4a5568; margin-bottom: 8px;">
                        📍 ${issue.location.address}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #718096;">
                        <span>👤 ${issue.user.name}</span>
                        <span>📅 ${formatDate(issue.createdAt)}</span>
                    </div>
                </div>
            `).join('');
        }

        function getFilteredIssues() {
            const statusFilter = document.getElementById('statusFilter').value;
            const categoryFilter = document.getElementById('categoryFilter').value;

            return issues.filter(issue => {
                if (statusFilter && issue.status !== statusFilter) return false;
                if (categoryFilter && issue.category !== categoryFilter) return false;
                return true;
            });
        }

        function getCategoryIcon(category) {
            const icons = {
                'infrastructure': '🏗️',
                'safety': '🚨',
                'environment': '🌱',
                'services': '🏛️',
                'other': '📋'
            };
            return icons[category] || '📋';
        }

        function formatDate(date) {
            return new Date(date).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        }

        function updateStatistics() {
            const stats = calculateStatistics();
            
            document.getElementById('totalIssues').textContent = stats.total;
            document.getElementById('resolvedIssues').textContent = stats.resolved;
            document.getElementById('inProgressIssues').textContent = stats.inProgress;
            document.getElementById('todayIssues').textContent = stats.today;
            document.getElementById('averageResolutionTime').textContent = stats.avgResolution;
            document.getElementById('highPriorityIssues').textContent = stats.highPriority;
        }

        function calculateStatistics() {
            const total = issues.length;
            const resolved = issues.filter(i => i.status === 'resolved').length;
            const inProgress = issues.filter(i => i.status === 'in-progress').length;
            const highPriority = issues.filter(i => i.priority === 'high').length;
            
            const today = new Date().toDateString();
            const todayIssues = issues.filter(i => new Date(i.createdAt).toDateString() === today).length;
            
            const resolvedIssues = issues.filter(i => i.status === 'resolved');
            let avgResolution = 0;
            if (resolvedIssues.length > 0) {
                const totalDays = resolvedIssues.reduce((sum, issue) => {
                    const created = new Date(issue.createdAt);
                    const updated = new Date(issue.updatedAt);
                    const days = Math.max(1, Math.floor((updated - created) / (1000 * 60 * 60 * 24)));
                    return sum + days;
                }, 0);
                avgResolution = Math.round(totalDays / resolvedIssues.length);
            }

            return { total, resolved, inProgress, today: todayIssues, avgResolution, highPriority };
        }

        function plotIssuesOnMap() {
            overviewMap.eachLayer(function(layer) {
                if (layer instanceof L.Marker || layer instanceof L.CircleMarker) {
                    overviewMap.removeLayer(layer);
                }
            });

            issues.forEach(issue => {
                const color = getStatusColor(issue.status);
                const marker = L.circleMarker([issue.location.lat, issue.location.lng], {
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.7,
                    radius: 10,
                    weight: 2
                }).addTo(overviewMap);

                marker.bindPopup(`
                    <strong>${getCategoryIcon(issue.category)} ${issue.title}</strong><br>
                    Status: ${issue.status}<br>
                    Priority: ${issue.priority}<br>
                    <button onclick="viewIssueDetail('${issue.id}')" style="margin-top: 5px; padding: 5px 10px; background: #667eea; color: white; border: none; border-radius: 5px; cursor: pointer;">View Details</button>
                `);
            });
        }

        function getStatusColor(status) {
            const colors = {
                'submitted': '#e53e3e',
                'assigned': '#dd6b20',
                'in-progress': '#3182ce',
                'resolved': '#38a169'
            };
            return colors[status] || '#718096';
        }

        function viewIssueDetail(issueId) {
            const issue = issues.find(i => i.id === issueId);
            if (!issue) {
                showNotification('Issue not found', 'error');
                return;
            }

            document.getElementById('issueDetailContent').innerHTML = `
                <div style="margin-bottom: 20px;">
                    <h3>${getCategoryIcon(issue.category)} ${issue.title}</h3>
                    <div style="display: flex; gap: 10px; margin: 10px 0;">
                        <span class="priority-badge priority-${issue.priority}">${issue.priority}</span>
                        <span class="status-badge status-${issue.status}">${issue.status}</span>
                    </div>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>Description:</strong><br>
                    ${issue.description}
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>📍 Location:</strong><br>
                    ${issue.location.address}
                </div>
                
                <div style="margin-bottom: 15px;">
                    <strong>Reported by:</strong> ${issue.user.name}<br>
                    <strong>Department:</strong> ${issue.assignedDepartment}<br>
                    <strong>Created:</strong> ${formatDate(issue.createdAt)}
                </div>
                
                ${currentUser && currentUser.role === 'admin' ? `
                    <div style="margin-top: 20px;">
                        <h4>Admin Actions:</h4>
                        <div style="display: flex; gap: 10px; margin-top: 10px;">
                            <button onclick="updateIssueStatus('${issue.id}', 'assigned')" class="btn btn-warning btn-sm">Assign</button>
                            <button onclick="updateIssueStatus('${issue.id}', 'in-progress')" class="btn btn-primary btn-sm">In Progress</button>
                            <button onclick="updateIssueStatus('${issue.id}', 'resolved')" class="btn btn-success btn-sm">Resolve</button>
                        </div>
                    </div>
                ` : ''}
            `;

            openModal('issueDetailModal');
        }

        function updateIssueStatus(issueId, newStatus) {
            if (!currentUser || currentUser.role !== 'admin') {
                showNotification('Admin access required', 'error');
                return;
            }

            const issue = issues.find(i => i.id === issueId);
            if (!issue) return;

            issue.status = newStatus;
            issue.updatedAt = new Date();

            updateIssueList();
            updateStatistics();
            plotIssuesOnMap();

            showNotification(`Issue status updated to "${newStatus}"`, 'success');
            closeModal('issueDetailModal');
        }

        function applyFilters() {
            updateIssueList();
            showNotification('Filters applied', 'info');
        }

        function openAdminDashboard() {
            if (!currentUser || currentUser.role !== 'admin') {
                showNotification('Admin access required', 'error');
                return;
            }

            updateAdminStatistics();
            updateAdminIssueList();
            openModal('adminModal');
        }

        function updateAdminStatistics() {
            const stats = calculateStatistics();
            
            document.getElementById('adminTotalIssues').textContent = stats.total;
            document.getElementById('adminPendingIssues').textContent = issues.filter(i => i.status === 'submitted' || i.status === 'assigned').length;
            document.getElementById('adminTodayIssues').textContent = stats.today;
            document.getElementById('adminHighPriority').textContent = stats.highPriority;
        }

        function updateAdminIssueList() {
            const adminIssueList = document.getElementById('adminIssueList');
            const statusFilter = document.getElementById('adminStatusFilter')?.value || '';
            
            let filteredIssues = issues;
            if (statusFilter) {
                filteredIssues = issues.filter(issue => issue.status === statusFilter);
            }

            if (filteredIssues.length === 0) {
                adminIssueList.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <h3>No Issues Found</h3>
                        <p>No issues match the selected filters.</p>
                    </div>
                `;
                return;
            }

            adminIssueList.innerHTML = filteredIssues.map(issue => `
                <div class="issue-item" onclick="viewIssueDetail('${issue.id}')">
                    <div class="issue-header">
                        <div class="issue-title">
                            #${issue.id.slice(-6)} - ${getCategoryIcon(issue.category)} ${issue.title}
                        </div>
                        <div style="display: flex; gap: 8px; align-items: center;">
                            <span class="priority-badge priority-${issue.priority}">${issue.priority}</span>
                            <span class="status-badge status-${issue.status}">${issue.status}</span>
                        </div>
                    </div>
                    <div style="font-size: 14px; color: #4a5568; margin-bottom: 8px;">
                        🏢 ${issue.assignedDepartment} | 📍 ${issue.location.address}
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #718096;">
                        <span>👤 ${issue.user.name}</span>
                        <span>📅 ${formatDate(issue.createdAt)}</span>
                    </div>
                </div>
            `).join('');
        }

        function plotAdminMapMarkers() {
            // Admin map functionality would go here
            console.log('Admin map markers updated');
        }

        function filterAdminIssues() {
            updateAdminIssueList();
            plotAdminMapMarkers();
        }

        function exportData() {
            if (!currentUser || currentUser.role !== 'admin') {
                showNotification('Admin access required', 'error');
                return;
            }

            const csvContent = generateCSVData();
            downloadCSV(csvContent, 'city_sense_issues_export.csv');
            showNotification('Data exported successfully! 📊', 'success');
        }

        function generateCSVData() {
            const headers = ['ID', 'Title', 'Category', 'Priority', 'Status', 'Department', 'Reporter', 'Location', 'Created Date'];
            
            const rows = issues.map(issue => [
                issue.id,
                issue.title,
                issue.category,
                issue.priority,
                issue.status,
                issue.assignedDepartment,
                issue.user.name,
                issue.location.address,
                formatDate(issue.createdAt)
            ]);

            return [headers, ...rows];
        }

        function downloadCSV(data, filename) {
            const csvContent = data.map(row => 
                row.map(field => `"${field}"`).join(',')
            ).join('\n');
            
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }

        // =================================================================
        // MAIN INITIALIZATION
        // =================================================================
        
        function initializeApp() {
            console.log('🚀 Initializing City Sense Reporter...');
            
            // Load demo data
            issues = [...DEMO_ISSUES];
            
            // Check for existing session
            checkUserSession();
            
            // Initialize maps
            initializeMaps();
            
            // Update initial UI
            updateIssueList();
            updateStatistics();
            plotIssuesOnMap();
            
            console.log('✅ Application initialized successfully');
            
            // Show welcome message
            setTimeout(() => {
                showNotification('Welcome to City Sense Reporter! 🏙️ Click Login to get started.', 'info');
            }, 1000);
        }

        // =================================================================
        // EVENT LISTENERS SETUP
        // =================================================================
        
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📋 Setting up event listeners...');
            
            // Navigation button handlers
            document.getElementById('loginBtn').addEventListener('click', function() {
                console.log('🔑 Login button clicked');
                openModal('loginModal');
            });
            
            document.getElementById('registerBtn').addEventListener('click', function() {
                console.log('👤 Register button clicked');
                openModal('registerModal');
            });
            
            document.getElementById('logoutBtn').addEventListener('click', function() {
                console.log('🚪 Logout button clicked');
                logout();
            });
            
            document.getElementById('adminBtn').addEventListener('click', function() {
                console.log('👨‍💼 Admin button clicked');
                openAdminDashboard();
            });
            
            document.getElementById('refreshBtn').addEventListener('click', function() {
                console.log('🔄 Refresh button clicked');
                refreshData();
            });
            
            // Form handlers
            document.getElementById('loginForm').addEventListener('submit', handleLogin);
            document.getElementById('registerForm').addEventListener('submit', handleRegister);
            document.getElementById('issueForm').addEventListener('submit', handleIssueSubmit);
            
            // Other handlers
            document.getElementById('getCurrentLocation').addEventListener('click', getCurrentLocation);
            document.getElementById('photoInput').addEventListener('change', handlePhotoUpload);
            document.getElementById('statusFilter').addEventListener('change', applyFilters);
            document.getElementById('categoryFilter').addEventListener('change', applyFilters);
            
            // Admin handlers
            const adminStatusFilter = document.getElementById('adminStatusFilter');
            if (adminStatusFilter) {
                adminStatusFilter.addEventListener('change', filterAdminIssues);
            }
            
            const exportBtn = document.getElementById('exportBtn');
            if (exportBtn) {
                exportBtn.addEventListener('click', exportData);
            }
            
            // Modal close handlers
            document.querySelectorAll('.modal').forEach(modal => {
                modal.addEventListener('click', function(e) {
                    if (e.target === modal) {
                        closeModal(modal.id);
                    }
                });
            });
            
            console.log('✅ All event listeners attached successfully');
            
            // Initialize the application
            initializeApp();
            
            // Visual feedback that buttons are working
            setTimeout(() => {
                const buttons = ['loginBtn', 'registerBtn', 'refreshBtn'];
                buttons.forEach(btnId => {
                    const btn = document.getElementById(btnId);
                    if (btn) {
                        btn.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.5)';
                        setTimeout(() => {
                            btn.style.boxShadow = '';
                        }, 2000);
                    }
                });
                showNotification('🎉 All buttons are now functional! Try Login, Register, or Refresh.', 'success');
            }, 2000);
        });

        // =================================================================
        // GLOBAL ERROR HANDLING
        // =================================================================
        
        window.addEventListener('error', function(e) {
            console.error('Application error:', e.error);
            showNotification('An error occurred. Please refresh if issues persist.', 'error');
        });

        // =================================================================
        // CONNECTION STATUS MONITORING
        // =================================================================
        
        function updateConnectionStatus(online) {
            const status = document.getElementById('connectionStatus');
            if (online) {
                status.className = 'connection-status connection-online';
                status.innerHTML = '🟢 Backend Connected';
            } else {
                status.className = 'connection-status connection-offline';  
                status.innerHTML = '🔴 Backend Offline';
            }
        }

        // Monitor connection status
        window.addEventListener('online', () => updateConnectionStatus(true));
        window.addEventListener('offline', () => updateConnectionStatus(false));
        updateConnectionStatus(navigator.onLine);

        // Auto-refresh data every 30 seconds
        setInterval(() => {
            if (!document.hidden && currentUser) {
                console.log('🔄 Auto-refreshing data...');
                refreshData();
            }
        }, 30000);

        console.log('🎯 City Sense Reporter loaded and ready!');