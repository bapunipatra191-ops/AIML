document.addEventListener('DOMContentLoaded', () => {
    // Initialise Lucide icons
    lucide.createIcons();

    // ----------------------------------------------------------------
    // STATE & CONFIG
    // ----------------------------------------------------------------
    let geminiApiKey = localStorage.getItem('gemini_api_key') || '';
    const geminiKeyInput = document.getElementById('gemini-key-input');
    const aiModeBadge = document.getElementById('ai-mode-badge');
    const dbStatusText = document.getElementById('db-status-text');
    const dbStatusDot = document.getElementById('db-status-dot');

    if (geminiKeyInput) {
        geminiKeyInput.value = geminiApiKey;
        updateAIModeBadge();
        geminiKeyInput.addEventListener('input', () => {
            geminiApiKey = geminiKeyInput.value.trim();
            localStorage.setItem('gemini_api_key', geminiApiKey);
            updateAIModeBadge();
        });
    }

    function updateAIModeBadge() {
        if (!aiModeBadge) return;
        if (geminiApiKey) {
            aiModeBadge.textContent = 'GEMINI ACTIVE';
            aiModeBadge.className = 'badge neon-blue';
            document.getElementById('copilot-status').textContent = 'Gemini Engine Online';
        } else {
            aiModeBadge.textContent = 'SIMULATED';
            aiModeBadge.className = 'badge neon-yellow';
            document.getElementById('copilot-status').textContent = 'Running Offline Simulation';
        }
    }

    // Check backend DB status
    async function checkDBStatus() {
        try {
            const res = await fetch('/api/db-status');
            const data = await res.json();
            if (data.connected) {
                dbStatusText.textContent = `MySQL Connected (${data.database})`;
                dbStatusDot.className = 'pulse-dot green-pulse';
            } else {
                dbStatusText.textContent = 'MySQL Disconnected (Fallback active)';
                dbStatusDot.className = 'pulse-dot red-pulse';
                console.warn("MySQL disconnected:", data.error);
            }
        } catch (e) {
            dbStatusText.textContent = 'Backend Offline';
            dbStatusDot.className = 'pulse-dot red-pulse';
            console.error("Backend offline:", e);
        }
    }
    checkDBStatus();

    // Helper for API headers
    function getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        if (geminiApiKey) {
            headers['X-Gemini-Key'] = geminiApiKey;
        }
        return headers;
    }

    // ----------------------------------------------------------------
    // TAB ROUTING SYSTEM
    // ----------------------------------------------------------------
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const pageTitle = document.getElementById('page-title');
    const pageSubtitle = document.getElementById('page-subtitle');

    const tabMetadata = {
        overview: { title: "Operations Control", subtitle: "Real-time deep learning analytics and cognitive automated management" },
        food: { title: "AI Menu Optimizer", subtitle: "Recalculate dish recommendation matching scores and predict order volume" },
        forecaster: { title: "ML Demand Forecaster", subtitle: "Train parametric regression models on historical restaurant variables" },
        nlp: { title: "NLP Sentiment Engine", subtitle: "Process customer text feedback, assess polarity, and map entity metrics" },
        vision: { title: "CV Kitchen Guard", subtitle: "Surveillance streams evaluated by convolutional neural networks for safety" },
        pricing: { title: "Dynamic Pricing Engine", subtitle: "Reinforcement Q-learning models optimizing hotel revenue limits" }
    };

    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');

            navButtons.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`${tabId}-panel`).classList.add('active');

            if (tabMetadata[tabId]) {
                pageTitle.textContent = tabMetadata[tabId].title;
                pageSubtitle.textContent = tabMetadata[tabId].subtitle;
            }

            if (tabId === 'forecaster') {
                drawRegression();
            } else if (tabId === 'pricing') {
                calculatePricing();
            } else if (tabId === 'vision') {
                startCVStream();
            } else if (tabId === 'food') {
                fetchAndRenderFood();
            }
        });
    });

    // ----------------------------------------------------------------
    // NEURAL NETWORK ACTIVITY FEED (Overview Dashboard)
    // ----------------------------------------------------------------
    const feedContainer = document.getElementById('activity-feed');
    const feedLogs = [
        { icon: "shield-alert", color: "green", text: "CV Kitchen Guard: Chef compliance verified (Confidence 98.4%)" },
        { icon: "trending-up", color: "blue", text: "ML Forecaster: Base demand weights refreshed. Today's forecast: 184 bookings." },
        { icon: "banknote", color: "yellow", text: "Dynamic Pricing: Room rates adjusted (+14.2% demand surcharge applied for Monsoon Weekend)." },
        { icon: "message-square-code", color: "purple", text: "NLP Engine: Positive feedback captured from Room 304. Service score: +0.92." },
        { icon: "user-check", color: "green", text: "CV Lobby Stream: Self check-in kiosk crowd density verified as optimal." },
        { icon: "chef-hat", color: "blue", text: "AI Chef: Suggested menu rotation of Tandoori Platter based on rising search queries." }
    ];

    function createFeedItem(log) {
        const item = document.createElement('div');
        item.className = 'feed-item';

        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');

        item.innerHTML = `
            <div class="feed-item-icon ${log.color}">
                <i data-lucide="${log.icon}"></i>
            </div>
            <div class="feed-item-details">
                <p>${log.text}</p>
                <span class="time">${timeStr} - Threads ID: ${Math.floor(Math.random() * 9000 + 1000)}</span>
            </div>
        `;
        return item;
    }

    if (feedContainer) {
        feedLogs.forEach(log => feedContainer.appendChild(createFeedItem(log)));
        lucide.createIcons({ attrs: { "class": "logo-icon" } });

        setInterval(() => {
            const randomLog = feedLogs[Math.floor(Math.random() * feedLogs.length)];
            const item = createFeedItem(randomLog);
            feedContainer.insertBefore(item, feedContainer.firstChild);

            if (feedContainer.children.length > 25) {
                feedContainer.removeChild(feedContainer.lastChild);
            }

            const iconElement = item.querySelector('[data-lucide]');
            if (iconElement) lucide.createIcons({ attrs: { "class": "logo-icon" } });

            document.getElementById('latency-val').textContent = `${Math.floor(Math.random() * 12 + 6)}ms`;
        }, 4500);
    }

    // Resync Models Animation
    const resyncBtn = document.getElementById('reseed-btn');
    if (resyncBtn) {
        resyncBtn.addEventListener('click', () => {
            const icon = resyncBtn.querySelector('i');
            icon.classList.add('animate-spin');
            resyncBtn.querySelector('span').textContent = 'Syncing Neurons...';

            setTimeout(() => {
                icon.classList.remove('animate-spin');
                resyncBtn.querySelector('span').textContent = 'Re-Sync Models';
                checkDBStatus();
                alert("AI Inference cores recalibrated successfully. All active weights re-seeded.");
            }, 1200);
        });
    }

    // ----------------------------------------------------------------
    // MODULE 1: ML DEMAND FORECASTER (REGRESSION IN PYTHON)
    // ----------------------------------------------------------------
    const rfCanvas = document.getElementById('regression-canvas');
    const rfCtx = rfCanvas ? rfCanvas.getContext('2d') : null;
    const btnTrain = document.getElementById('btn-train');
    const btnResetData = document.getElementById('btn-reset-data');
    const selectModel = document.getElementById('model-type');
    const sliderLR = document.getElementById('learning-rate');
    const lrVal = document.getElementById('lr-val');
    const sliderEpochs = document.getElementById('training-epochs');
    const epochsVal = document.getElementById('epochs-val');
    const forecasterLogs = document.getElementById('forecaster-logs');
    const trainingStatus = document.getElementById('training-status');
    const lossValEl = document.getElementById('loss-val');
    const r2ValEl = document.getElementById('r2-val');

    if (sliderLR) sliderLR.addEventListener('input', () => lrVal.textContent = sliderLR.value);
    if (sliderEpochs) sliderEpochs.addEventListener('input', () => epochsVal.textContent = sliderEpochs.value);

    let regressionDataPoints = [];
    let regressionWeights = [0, 0, 0, 0];

    function resizeCanvas(canvas) {
        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height || 300;
    }

    function predictRegression(normX, modelType, w) {
        if (modelType === 'linear') {
            return w[0] + w[1] * normX;
        } else if (modelType === 'quadratic') {
            return w[0] + w[1] * normX + w[2] * Math.pow(normX, 2);
        } else {
            return w[0] + w[1] * normX + w[2] * Math.pow(normX, 2) + w[3] * Math.pow(normX, 3);
        }
    }

    function drawRegression() {
        if (!rfCanvas || !rfCtx) return;
        resizeCanvas(rfCanvas);
        rfCtx.clearRect(0, 0, rfCanvas.width, rfCanvas.height);

        const padding = 45;
        const width = rfCanvas.width - padding * 2;
        const height = rfCanvas.height - padding * 2;
        const xMin = 10, xMax = 40;
        const yMin = 0, yMax = 300;

        // Draw grid
        rfCtx.strokeStyle = 'rgba(255,255,255,0.05)';
        rfCtx.lineWidth = 1;
        for (let i = 0; i <= 5; i++) {
            const x = padding + (width / 5) * i;
            const y = padding + (height / 5) * i;
            rfCtx.beginPath();
            rfCtx.moveTo(x, padding);
            rfCtx.lineTo(x, padding + height);
            rfCtx.stroke();

            rfCtx.beginPath();
            rfCtx.moveTo(padding, y);
            rfCtx.lineTo(padding + width, y);
            rfCtx.stroke();
        }

        rfCtx.fillStyle = '#64748b';
        rfCtx.font = '10px JetBrains Mono';
        rfCtx.textAlign = 'center';
        rfCtx.fillText("Temperature (°C)", rfCanvas.width / 2, rfCanvas.height - 10);

        rfCtx.save();
        rfCtx.translate(15, rfCanvas.height / 2);
        rfCtx.rotate(-Math.PI / 2);
        rfCtx.fillText("Daily Restaurant Orders", 0, 0);
        rfCtx.restore();

        function mapX(xVal) { return padding + ((xVal - xMin) / (xMax - xMin)) * width; }
        function mapY(yVal) { return padding + height - ((yVal - yMin) / (yMax - yMin)) * height; }

        // Draw Points
        regressionDataPoints.forEach(d => {
            rfCtx.beginPath();
            rfCtx.arc(mapX(d.x), mapY(d.y), 5, 0, Math.PI * 2);
            rfCtx.fillStyle = 'rgba(0, 242, 254, 0.8)';
            rfCtx.fill();
            rfCtx.lineWidth = 1;
            rfCtx.strokeStyle = '#00f2fe';
            rfCtx.stroke();
        });

        // Draw fit line
        const modelType = selectModel.value;
        rfCtx.beginPath();
        rfCtx.strokeStyle = '#9d4edd';
        rfCtx.lineWidth = 3;

        for (let screenX = padding; screenX <= padding + width; screenX++) {
            const pct = (screenX - padding) / width;
            const normY = predictRegression(pct, modelType, regressionWeights);
            const rawY = normY * (yMax - yMin) + yMin;
            const screenY = mapY(rawY);

            if (screenX === padding) rfCtx.moveTo(screenX, screenY);
            else rfCtx.lineTo(screenX, screenY);
        }
        rfCtx.stroke();
    }

    async function trainModel() {
        if (!btnTrain) return;
        trainingStatus.textContent = "Training...";
        trainingStatus.className = "badge neon-yellow";

        try {
            const res = await fetch('/api/regression/train', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model_type: selectModel.value,
                    learning_rate: parseFloat(sliderLR.value),
                    epochs: parseInt(sliderEpochs.value)
                })
            });
            const data = await res.json();

            regressionWeights = data.weights;
            regressionDataPoints = data.dataset;
            lossValEl.textContent = data.loss.toFixed(5);
            r2ValEl.textContent = data.r2.toFixed(3);
            forecasterLogs.textContent = data.logs + `\n\nFinal weights: ` + JSON.stringify(data.weights);
            forecasterLogs.scrollTop = forecasterLogs.scrollHeight;

            trainingStatus.textContent = "CONVERGED";
            trainingStatus.className = "badge neon-green";
            drawRegression();

            // Update forecast on dashboard
            const predictedVal = Math.round(predictRegression(0.5, selectModel.value, regressionWeights) * 300);
            document.getElementById('overview-predicted-orders').textContent = `${predictedVal} orders`;
        } catch (e) {
            console.error("Training error:", e);
            trainingStatus.textContent = "FAILED";
            trainingStatus.className = "badge neon-red";
        }
    }

    if (btnTrain) btnTrain.addEventListener('click', trainModel);

    if (btnResetData) {
        btnResetData.addEventListener('click', async () => {
            const res = await fetch('/api/regression/reset', { method: 'POST' });
            const data = await res.json();
            regressionDataPoints = data.dataset;
            regressionWeights = [0, 0, 0, 0];
            drawRegression();
            lossValEl.textContent = '--';
            r2ValEl.textContent = '--';
            forecasterLogs.textContent = 'Dataset refreshed. Ready to fit model.';
        });
    }

    // Load initial regression data
    async function loadRegressionData() {
        try {
            const res = await fetch('/api/regression/reset', { method: 'POST' });
            const data = await res.json();
            regressionDataPoints = data.dataset;
        } catch (e) {
            console.error("Failed to load regression points:", e);
        }
    }
    loadRegressionData();

    // ----------------------------------------------------------------
    // MODULE 2: NLP SENTIMENT ENGINE
    // ----------------------------------------------------------------
    const reviewInput = document.getElementById('review-input');
    const nlpPresets = document.querySelectorAll('.preset-btn');
    const sentimentFill = document.getElementById('sentiment-fill');
    const sentimentPercent = document.getElementById('sentiment-percent');
    const sentimentBadge = document.getElementById('sentiment-badge');
    const tokenCountEl = document.getElementById('token-count');
    const tokenWeightsEl = document.getElementById('token-weights');
    const entityTagsEl = document.getElementById('entity-tags');
    
    // New NLP containers
    const nlpSuggestedReply = document.getElementById('nlp-suggested-reply');
    const nlpActionItems = document.getElementById('nlp-action-items');

    let debounceTimer;
    function debounceAnalyzeText() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(analyzeText, 600);
    }

    async function analyzeText() {
        if (!reviewInput) return;
        const text = reviewInput.value.trim();
        if (!text) {
            sentimentFill.style.width = '50%';
            sentimentPercent.textContent = '50% Neutral';
            sentimentBadge.textContent = 'NEUTRAL';
            sentimentBadge.className = 'sentiment-badge neutral';
            tokenCountEl.textContent = '0 Words';
            tokenWeightsEl.innerHTML = '';
            entityTagsEl.innerHTML = '<div class="no-entities">No entities detected yet. Start typing a review above.</div>';
            nlpSuggestedReply.value = '';
            nlpActionItems.innerHTML = '<li style="display: flex; align-items: center; gap: 8px;"><i data-lucide="check-square" style="width: 14px; height: 14px; color: var(--text-muted);"></i> Waiting for input...</li>';
            lucide.createIcons();
            return;
        }

        tokenCountEl.textContent = 'Analyzing...';

        try {
            const res = await fetch('/api/sentiment/analyze', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ review: text })
            });
            const data = await res.json();

            // Word token representation
            tokenWeightsEl.innerHTML = '';
            const words = text.split(/\s+/);
            words.forEach(w => {
                const span = document.createElement('span');
                span.textContent = w + ' ';
                span.className = 'token-word neutral-word';
                tokenWeightsEl.appendChild(span);
            });

            tokenCountEl.textContent = `${words.length} Words`;

            // Sentiment Score
            sentimentFill.style.width = `${data.score}%`;
            sentimentPercent.textContent = `${Math.round(data.score)}% ${data.label}`;
            sentimentBadge.textContent = data.label;
            sentimentBadge.className = `sentiment-badge ${data.label.toLowerCase()}`;

            // Entities
            entityTagsEl.innerHTML = '';
            if (data.entities && data.entities.length > 0) {
                data.entities.forEach(ent => {
                    const tag = document.createElement('div');
                    tag.className = `entity-tag ${ent.type.toLowerCase()}`;
                    tag.innerHTML = `
                        ${ent.name}
                        <span>${ent.type}</span>
                        <span>${ent.conf}%</span>
                    `;
                    entityTagsEl.appendChild(tag);
                });
            } else {
                entityTagsEl.innerHTML = '<div class="no-entities">No specific entities matched.</div>';
            }

            // Suggested reply & Action items
            nlpSuggestedReply.value = data.reply || '';
            
            nlpActionItems.innerHTML = '';
            if (data.actions && data.actions.length > 0) {
                data.actions.forEach(act => {
                    const li = document.createElement('li');
                    li.style.display = 'flex';
                    li.style.alignItems = 'center';
                    li.style.gap = '8px';
                    li.innerHTML = `<i data-lucide="check-square" style="width: 14px; height: 14px; color: var(--neon-purple);"></i> <span>${act}</span>`;
                    nlpActionItems.appendChild(li);
                });
            } else {
                nlpActionItems.innerHTML = '<li>No actions recommended.</li>';
            }
            lucide.createIcons();
        } catch (e) {
            console.error("Sentiment API failed:", e);
            tokenCountEl.textContent = 'Error';
        }
    }

    if (reviewInput) {
        reviewInput.addEventListener('input', debounceAnalyzeText);
    }

    nlpPresets.forEach(btn => {
        btn.addEventListener('click', () => {
            reviewInput.value = btn.getAttribute('data-text');
            analyzeText();
        });
    });

    // ----------------------------------------------------------------
    // MODULE 3: CV SURVEILLANCE FEED SIMULATOR
    // ----------------------------------------------------------------
    const cvCanvas = document.getElementById('cv-canvas');
    const cvCtx = cvCanvas ? cvCanvas.getContext('2d') : null;
    const cvEventsContainer = document.getElementById('cv-events');
    const camButtons = document.querySelectorAll('.cam-btn');
    const btnGenerateCVReport = document.getElementById('btn-generate-cv-report');
    const cvReportContainer = document.getElementById('cv-report-container');

    let currentCam = 'kitchen';
    let cvAnimId = null;

    const cvEntities = {
        kitchen: [
            { id: 1, name: "Chef_Bapun", type: "Person", x: 120, y: 150, targetX: 200, targetY: 150, status: "Normal", wear: ["Mask (98%)", "Hairnet (95%)"], activeTime: 0 },
            { id: 2, name: "Helper_Ramesh", type: "Person", x: 450, y: 220, targetX: 450, targetY: 280, status: "Normal", wear: ["Mask (94%)", "Hairnet (90%)"], activeTime: 0 },
            { id: 3, name: "Hygiene_Zone_Prep_Table", type: "Cleanliness", x: 280, y: 110, w: 120, h: 80, rating: "99.2%" },
            { id: 4, name: "Plated_Biryani", type: "Item", x: 300, y: 125, status: "Fresh" }
        ],
        dining: [
            { id: 1, name: "Table_12", type: "Table", x: 100, y: 100, w: 90, h: 90, status: "Occupied (4 pax)", color: "rgba(0, 242, 254, 0.3)" },
            { id: 2, name: "Table_14", type: "Table", x: 380, y: 120, w: 90, h: 90, status: "Empty", color: "rgba(57, 255, 20, 0.2)" },
            { id: 3, name: "Table_15", type: "Table", x: 240, y: 220, w: 100, h: 100, status: "Awaiting Service", color: "rgba(255, 215, 0, 0.3)" },
            { id: 4, name: "Waiter_Anil", type: "Person", x: 280, y: 150, targetX: 240, targetY: 200, status: "Serving" }
        ],
        reception: [
            { id: 1, name: "Receptionist_Priya", type: "Person", x: 280, y: 110, targetX: 280, targetY: 130, status: "Active" },
            { id: 2, name: "Guest_Kiosk_A", type: "Kiosk", x: 100, y: 220, status: "In Use" },
            { id: 3, name: "Guest_Kiosk_B", type: "Kiosk", x: 440, y: 220, status: "Idle" }
        ]
    };

    camButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            camButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCam = btn.getAttribute('data-cam');
            document.querySelector('.cam-id').textContent = `FEED: CAM_0${currentCam === 'kitchen' ? 1 : currentCam === 'dining' ? 2 : 3}_${currentCam.toUpperCase()}`;
        });
    });

    async function loadCVLogs() {
        if (!cvEventsContainer) return;
        try {
            const res = await fetch('/api/vision/logs');
            const logs = await res.json();
            cvEventsContainer.innerHTML = '';
            logs.forEach(l => {
                const div = document.createElement('div');
                div.className = `cv-event ${l.is_alert ? 'alert' : ''}`;
                div.innerHTML = `
                    <span class="label">${l.event_label}</span>
                    <span class="confidence">${l.confidence}</span>
                    <span class="time">${l.timestamp}</span>
                `;
                cvEventsContainer.appendChild(div);
            });
        } catch (e) {
            console.error("Failed to fetch CV logs:", e);
        }
    }

    async function startCVStream() {
        if (!cvCanvas || !cvCtx) return;
        if (cvAnimId) cancelAnimationFrame(cvAnimId);

        await loadCVLogs();
        let counter = 0;

        function renderFrame() {
            if (!document.getElementById('vision-panel').classList.contains('active')) return;

            resizeCanvas(cvCanvas);
            cvCtx.clearRect(0, 0, cvCanvas.width, cvCanvas.height);

            // Grid lines
            cvCtx.strokeStyle = 'rgba(255,255,255,0.03)';
            cvCtx.lineWidth = 1;
            const spacing = 30;
            for (let x = 0; x < cvCanvas.width; x += spacing) {
                cvCtx.beginPath(); cvCtx.moveTo(x, 0); cvCtx.lineTo(x, cvCanvas.height); cvCtx.stroke();
            }
            for (let y = 0; y < cvCanvas.height; y += spacing) {
                cvCtx.beginPath(); cvCtx.moveTo(0, y); cvCtx.lineTo(cvCanvas.width, y); cvCtx.stroke();
            }

            const scaleX = cvCanvas.width / 600;
            const scaleY = cvCanvas.height / 350;
            const camEntities = cvEntities[currentCam];

            camEntities.forEach(ent => {
                if (ent.targetX !== undefined) {
                    ent.activeTime = (ent.activeTime || 0) + 0.01;
                    if (ent.activeTime > 1) {
                        ent.targetX = Math.floor(50 + Math.random() * 500);
                        ent.targetY = Math.floor(80 + Math.random() * 200);
                        ent.activeTime = 0;
                    }
                    ent.x += (ent.targetX - ent.x) * 0.01;
                    ent.y += (ent.targetY - ent.y) * 0.01;
                }

                const px = ent.x * scaleX;
                const py = ent.y * scaleY;
                cvCtx.lineWidth = 2;

                if (ent.type === 'Person') {
                    const w = 70 * scaleX;
                    const h = 120 * scaleY;
                    cvCtx.strokeStyle = '#00f2fe';
                    cvCtx.strokeRect(px - w/2, py - h/2, w, h);
                    cvCtx.fillStyle = 'rgba(0, 242, 254, 0.85)';
                    cvCtx.fillRect(px - w/2 - 1, py - h/2 - 18, w + 2, 18);
                    cvCtx.fillStyle = '#000';
                    cvCtx.font = '10px JetBrains Mono';
                    cvCtx.fillText(`${ent.name}`, px - w/2 + 5, py - h/2 - 5);
                    cvCtx.fillStyle = 'rgba(57, 255, 20, 0.8)';
                    ent.wear.forEach((wTag, idx) => {
                        cvCtx.font = '9px JetBrains Mono';
                        cvCtx.fillText(`✔ ${wTag}`, px - w/2 + 4, py - h/2 + 15 + idx * 12);
                    });
                } else if (ent.type === 'Cleanliness') {
                    const w = ent.w * scaleX;
                    const h = ent.h * scaleY;
                    cvCtx.strokeStyle = '#39ff14';
                    cvCtx.strokeRect(px, py, w, h);
                    cvCtx.fillStyle = 'rgba(57, 255, 20, 0.85)';
                    cvCtx.fillRect(px - 1, py - 18, w + 2, 18);
                    cvCtx.fillStyle = '#000';
                    cvCtx.font = '10px JetBrains Mono';
                    cvCtx.fillText(`${ent.name} [${ent.rating}]`, px + 5, py - 5);
                } else if (ent.type === 'Item') {
                    cvCtx.beginPath();
                    cvCtx.arc(px, py, 15, 0, Math.PI * 2);
                    cvCtx.strokeStyle = '#ffd700';
                    cvCtx.stroke();
                    cvCtx.fillStyle = '#ffd700';
                    cvCtx.font = '9px JetBrains Mono';
                    cvCtx.fillText(`${ent.name} [${ent.status}]`, px - 35, py - 20);
                } else if (ent.type === 'Table') {
                    const w = ent.w * scaleX;
                    const h = ent.h * scaleY;
                    cvCtx.strokeStyle = ent.color.includes('57, 255, 20') ? '#39ff14' : '#00f2fe';
                    cvCtx.strokeRect(px, py, w, h);
                    cvCtx.fillStyle = ent.color;
                    cvCtx.fillRect(px, py, w, h);
                    cvCtx.fillStyle = '#fff';
                    cvCtx.font = '10px JetBrains Mono';
                    cvCtx.fillText(`${ent.name}: ${ent.status}`, px + 5, py + 15);
                } else if (ent.type === 'Kiosk') {
                    const w = 60 * scaleX;
                    const h = 80 * scaleY;
                    cvCtx.strokeStyle = ent.status === 'In Use' ? '#39ff14' : '#64748b';
                    cvCtx.strokeRect(px, py, w, h);
                    cvCtx.fillStyle = ent.status === 'In Use' ? '#39ff14' : '#64748b';
                    cvCtx.font = '10px JetBrains Mono';
                    cvCtx.fillText(`${ent.name} (${ent.status})`, px - 10, py - 8);
                }
            });

            counter++;
            if (counter % 350 === 0) {
                loadCVLogs();
            }

            cvAnimId = requestAnimationFrame(renderFrame);
        }
        renderFrame();
    }

    if (btnGenerateCVReport) {
        btnGenerateCVReport.addEventListener('click', async () => {
            cvReportContainer.classList.remove('hidden');
            cvReportContainer.textContent = "Running Gemini safety audit. Generating report...";

            const maskRate = parseFloat(document.getElementById('mask-val').textContent);
            const hygieneRate = parseFloat(document.getElementById('hygiene-val').textContent);
            const distanceText = document.getElementById('distancing-val').textContent;

            try {
                const res = await fetch('/api/vision/report', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        compliance_mask: maskRate,
                        compliance_hygiene: hygieneRate,
                        distancing_status: distanceText,
                        camera_id: `CAM_01_${currentCam.toUpperCase()}`
                    })
                });
                const data = await res.json();
                cvReportContainer.textContent = data.report;
            } catch (e) {
                console.error(e);
                cvReportContainer.textContent = "Failed to generate AI Safety audit memo.";
            }
        });
    }

    // ----------------------------------------------------------------
    // MODULE 4: DYNAMIC PRICING ENGINE
    // ----------------------------------------------------------------
    const dpBaseRate = document.getElementById('base-rate');
    const dpBaseRateVal = document.getElementById('base-rate-val');
    const dpOccupancy = document.getElementById('hotel-occupancy');
    const dpOccupancyVal = document.getElementById('occupancy-val');
    const dpDemand = document.getElementById('demand-factor');
    const dpDemandVal = document.getElementById('demand-val');
    const dpWeather = document.getElementById('weather-impact');
    const dpFinalPrice = document.getElementById('final-price');
    const dpReasoning = document.getElementById('pricing-reasoning');
    const bookingProbVal = document.getElementById('booking-prob-val');
    const yieldVal = document.getElementById('yield-val');
    const pricingCanvas = document.getElementById('pricing-canvas');
    const pricingCtx = pricingCanvas ? pricingCanvas.getContext('2d') : null;

    if (dpBaseRate) {
        dpBaseRate.addEventListener('input', () => { dpBaseRateVal.textContent = dpBaseRate.value; calculatePricing(); });
        dpOccupancy.addEventListener('input', () => { dpOccupancyVal.textContent = `${dpOccupancy.value}%`; calculatePricing(); });
        dpDemand.addEventListener('input', () => {
            const val = parseFloat(dpDemand.value);
            let label = "Normal";
            if (val < 0.8) label = "Subdued";
            else if (val > 1.8) label = "Surging";
            else if (val > 1.3) label = "Elevated";
            dpDemandVal.textContent = `${label} (${val}x)`;
            calculatePricing();
        });
        dpWeather.addEventListener('change', calculatePricing);
    }

    async function calculatePricing() {
        if (!dpBaseRate) return;
        try {
            const res = await fetch('/api/pricing/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    base_rate: parseFloat(dpBaseRate.value),
                    occupancy: parseFloat(dpOccupancy.value) / 100,
                    demand_factor: parseFloat(dpDemand.value),
                    weather_impact: dpWeather.value
                })
            });
            const data = await res.json();

            dpFinalPrice.textContent = data.final_price.toFixed(2);
            dpReasoning.textContent = data.reasoning;
            bookingProbVal.textContent = `${data.booking_probability}%`;
            yieldVal.textContent = `$${data.daily_yield.toLocaleString()}`;

            drawPricingCurve(data.final_price, data.target_price, data.k);
        } catch (e) {
            console.error("Pricing API error:", e);
        }
    }

    function drawPricingCurve(currentPrice = 120, target = 150, k = 30) {
        if (!pricingCanvas || !pricingCtx) return;
        resizeCanvas(pricingCanvas);
        pricingCtx.clearRect(0, 0, pricingCanvas.width, pricingCanvas.height);

        const padding = 40;
        const width = pricingCanvas.width - padding * 2;
        const height = pricingCanvas.height - padding * 2;

        pricingCtx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        pricingCtx.lineWidth = 1;
        pricingCtx.beginPath();
        pricingCtx.moveTo(padding, padding);
        pricingCtx.lineTo(padding, padding + height);
        pricingCtx.lineTo(padding + width, padding + height);
        pricingCtx.stroke();

        pricingCtx.fillStyle = '#64748b';
        pricingCtx.font = '10px JetBrains Mono';
        pricingCtx.fillText("Room Rate ($)", pricingCanvas.width / 2, pricingCanvas.height - 8);

        pricingCtx.save();
        pricingCtx.translate(12, pricingCanvas.height / 2);
        pricingCtx.rotate(-Math.PI / 2);
        pricingCtx.fillText("Booking Prob (%)", 0, 0);
        pricingCtx.restore();

        pricingCtx.beginPath();
        pricingCtx.strokeStyle = 'rgba(0, 242, 254, 0.3)';
        pricingCtx.lineWidth = 2;

        const minP = 30, maxP = 400;
        for (let screenX = padding; screenX <= padding + width; screenX++) {
            const pct = (screenX - padding) / width;
            const evalPrice = minP + pct * (maxP - minP);
            const prob = 1 / (1 + Math.exp((evalPrice - target) / k));
            const screenY = padding + height - prob * height;

            if (screenX === padding) pricingCtx.moveTo(screenX, screenY);
            else pricingCtx.lineTo(screenX, screenY);
        }
        pricingCtx.stroke();

        const curPct = (currentPrice - minP) / (maxP - minP);
        if (curPct >= 0 && curPct <= 1) {
            const curProb = 1 / (1 + Math.exp((currentPrice - target) / k));
            const dotX = padding + curPct * width;
            const dotY = padding + height - curProb * height;

            pricingCtx.beginPath();
            pricingCtx.arc(dotX, dotY, 7, 0, Math.PI * 2);
            pricingCtx.fillStyle = '#00f2fe';
            pricingCtx.fill();
            pricingCtx.lineWidth = 2;
            pricingCtx.strokeStyle = '#fff';
            pricingCtx.stroke();

            pricingCtx.beginPath();
            pricingCtx.arc(dotX, dotY, 13, 0, Math.PI * 2);
            pricingCtx.strokeStyle = 'rgba(0, 242, 254, 0.5)';
            pricingCtx.lineWidth = 1;
            pricingCtx.stroke();
        }
    }

    // ----------------------------------------------------------------
    // MODULE 5: AI MENU OPTIMIZER
    // ----------------------------------------------------------------
    let liveFoodItems = [];
    let selectedFoodId = null;

    const foodGrid = document.getElementById('food-grid');
    const foodSearch = document.getElementById('food-search');
    const foodFilter = document.getElementById('food-filter');
    const prefSpice = document.getElementById('pref-spice');
    const prefSpiceVal = document.getElementById('pref-spice-val');
    const prefBudget = document.getElementById('pref-budget');
    const prefBudgetVal = document.getElementById('pref-budget-val');

    const weightSpicyBtn = document.getElementById('weight-spicy');
    const weightBudgetBtn = document.getElementById('weight-budget');
    const weightDessertBtn = document.getElementById('weight-dessert');

    const foodEmptyState = document.getElementById('selected-food-empty');
    const foodInfoState = document.getElementById('selected-food-info');

    const foodDiagName = document.getElementById('food-diag-name');
    const foodDiagCategory = document.getElementById('food-diag-category');
    const foodDiagMatch = document.getElementById('food-diag-match');
    const foodDiagCost = document.getElementById('food-diag-cost');
    const foodDiagPredicted = document.getElementById('food-diag-predicted');
    const foodDiagStatusBadge = document.getElementById('food-diag-status-badge');
    const foodDiagCal = document.getElementById('food-diag-cal');
    const foodDiagCalFill = document.getElementById('food-diag-cal-fill');
    const foodDiagProtein = document.getElementById('food-diag-protein');
    const foodDiagProteinFill = document.getElementById('food-diag-protein-fill');
    const foodDiagSentimentFill = document.getElementById('food-diag-sentiment-fill');
    const foodDiagSentimentPercent = document.getElementById('food-diag-sentiment-percent');
    const foodDiagAvatar = document.getElementById('food-diag-avatar');

    // Brainstorm Elements
    const brainstormPrompt = document.getElementById('brainstorm-prompt');
    const btnBrainstorm = document.getElementById('btn-brainstorm');
    const brainstormResultBox = document.getElementById('brainstorm-result-box');
    const brainstormName = document.getElementById('brainstorm-name');
    const brainstormMeta = document.getElementById('brainstorm-meta');
    const brainstormReason = document.getElementById('brainstorm-reason');
    const btnAddBrainstormed = document.getElementById('btn-add-brainstormed');

    let brainstormedDish = null;

    if (prefSpice) {
        prefSpice.addEventListener('input', () => { prefSpiceVal.textContent = prefSpice.value; renderFoodGrid(); });
        prefBudget.addEventListener('input', () => { prefBudgetVal.textContent = prefBudget.value; renderFoodGrid(); });
        foodSearch.addEventListener('input', renderFoodGrid);
        foodFilter.addEventListener('change', renderFoodGrid);
    }

    if (weightSpicyBtn) {
        weightSpicyBtn.addEventListener('click', () => { prefSpice.value = 5; prefSpiceVal.textContent = "5"; prefBudget.value = 18; prefBudgetVal.textContent = "18"; foodFilter.value = "all"; renderFoodGrid(); });
        weightBudgetBtn.addEventListener('click', () => { prefSpice.value = 2; prefSpiceVal.textContent = "2"; prefBudget.value = 9; prefBudgetVal.textContent = "9"; foodFilter.value = "all"; renderFoodGrid(); });
        weightDessertBtn.addEventListener('click', () => { prefSpice.value = 1; prefSpiceVal.textContent = "1"; prefBudget.value = 12; prefBudgetVal.textContent = "12"; foodFilter.value = "dessert"; renderFoodGrid(); });
    }

    async function fetchAndRenderFood() {
        if (!foodGrid) return;
        try {
            const res = await fetch('/api/menu');
            liveFoodItems = await res.json();
            renderFoodGrid();
        } catch (e) {
            console.error("Failed to fetch menu list:", e);
        }
    }

    function calculateMatchScore(food, userSpice, userBudget) {
        const spiceDiff = Math.abs(food.spice - userSpice);
        const spiceScore = Math.max(0, 100 - (spiceDiff * 25));

        let budgetScore = 100;
        if (food.price > userBudget) {
            const overDraft = food.price - userBudget;
            budgetScore = Math.max(0, 100 - (overDraft * 20));
        } else {
            budgetScore = 100 - ((userBudget - food.price) * 1.5);
            budgetScore = Math.max(70, budgetScore);
        }

        const match = Math.round((spiceScore * 0.55) + (budgetScore * 0.45));
        return Math.max(8, Math.min(100, match));
    }

    function selectFood(id) {
        selectedFoodId = id;
        const food = liveFoodItems.find(f => f.id === id);
        if (!food) return;

        foodEmptyState.classList.add('hidden');
        foodInfoState.classList.remove('hidden');

        foodDiagName.textContent = food.name;
        foodDiagCategory.textContent = food.category.toUpperCase();
        foodDiagCategory.className = `badge ${food.category === 'veg' ? 'neon-green' : 'neon-blue'}`;
        foodDiagCost.textContent = `$${food.price.toFixed(2)}`;

        const match = calculateMatchScore(food, parseInt(prefSpice.value), parseInt(prefBudget.value));
        foodDiagMatch.textContent = `${match}%`;
        if (match > 75) foodDiagMatch.className = "green-text";
        else if (match > 45) { foodDiagMatch.className = "text-mono"; foodDiagMatch.style.color = "var(--neon-yellow)"; }
        else { foodDiagMatch.className = "text-mono"; foodDiagMatch.style.color = "var(--neon-red)"; }

        foodDiagPredicted.textContent = `${food.predictedOrders} Orders (${food.status === 'PEAK' || food.status === 'SURGING' ? 'High' : 'Normal'})`;
        foodDiagStatusBadge.textContent = food.status;
        foodDiagStatusBadge.className = `sentiment-badge ${food.status === 'PEAK' || food.status === 'SURGING' ? 'positive' : food.status === 'SUBDUED' ? 'negative' : 'neutral'}`;

        foodDiagCal.textContent = `${food.cal} kcal`;
        const calPct = Math.min(100, Math.round((food.cal / 800) * 100));
        foodDiagCalFill.style.width = `${calPct}%`;
        foodDiagCalFill.className = `progress-fill ${calPct > 75 ? 'yellow' : 'green'}`;

        foodDiagProtein.textContent = `${food.protein}g`;
        const protPct = Math.min(100, Math.round((food.protein / 40) * 100));
        foodDiagProteinFill.style.width = `${protPct}%`;

        foodDiagSentimentPercent.textContent = `${food.positiveSentiment}% Positive`;
        foodDiagSentimentFill.style.width = `${food.positiveSentiment}%`;

        let lucideName = "soup";
        if (food.icon === 'pot') lucideName = "cooking-pot";
        else if (food.icon === 'salad') lucideName = "salad";
        else if (food.icon === 'flame') lucideName = "flame";
        else if (food.icon === 'ice-cream') lucideName = "ice-cream";
        foodDiagAvatar.innerHTML = `<i data-lucide="${lucideName}"></i>`;
        lucide.createIcons();

        document.querySelectorAll('.food-item-card').forEach(card => {
            if (card.getAttribute('data-id') === id) card.classList.add('selected');
            else card.classList.remove('selected');
        });
    }

    function renderFoodGrid() {
        if (!foodGrid) return;
        foodGrid.innerHTML = '';

        const searchVal = foodSearch.value.toLowerCase().trim();
        const categoryVal = foodFilter.value;
        const spice = parseInt(prefSpice.value);
        const budget = parseInt(prefBudget.value);

        let list = liveFoodItems.map(f => ({
            ...f,
            match: calculateMatchScore(f, spice, budget)
        }));

        if (searchVal) list = list.filter(f => f.name.toLowerCase().includes(searchVal));

        if (categoryVal !== 'all') {
            if (categoryVal === 'starter') {
                list = list.filter(f => f.sub === 'starter' || f.sub === 'bread' || f.sub === 'rice');
            } else {
                list = list.filter(f => f.category === categoryVal);
            }
        }

        list.sort((a, b) => b.match - a.match);

        if (list.length === 0) {
            foodGrid.innerHTML = '<div class="no-entities">No dishes matched current filters.</div>';
            return;
        }

        list.forEach(food => {
            const card = document.createElement('div');
            card.className = `food-item-card ${selectedFoodId === food.id ? 'selected' : ''}`;
            card.setAttribute('data-id', food.id);
            card.innerHTML = `
                <div>
                    <h4>${food.name}</h4>
                    <div class="food-meta">
                        <span>${food.category === 'veg' ? 'Veg' : 'Non-Veg'}</span>
                        <span class="cost">$${food.price.toFixed(2)}</span>
                    </div>
                </div>
                <div class="food-match-score">${food.match}% Match</div>
            `;
            card.addEventListener('click', () => selectFood(food.id));
            foodGrid.appendChild(card);
        });

        if (selectedFoodId && list.some(f => f.id === selectedFoodId)) {
            selectFood(selectedFoodId);
        } else if (list.length > 0) {
            selectFood(list[0].id);
        }
    }

    // Brainstorm Recipe Click handler
    if (btnBrainstorm) {
        btnBrainstorm.addEventListener('click', async () => {
            brainstormResultBox.classList.remove('hidden');
            brainstormReason.textContent = "Connecting to Gemini to formulate recipe recipe profile...";
            brainstormName.textContent = "Generating recipe...";
            brainstormMeta.textContent = "";
            btnAddBrainstormed.classList.add('hidden');

            try {
                const res = await fetch('/api/menu/brainstorm', {
                    method: 'POST',
                    headers: getHeaders(),
                    body: JSON.stringify({
                        category: foodFilter.value === 'all' ? 'non-veg' : foodFilter.value,
                        max_budget: parseFloat(prefBudget.value),
                        spice_factor: parseInt(prefSpice.value),
                        user_prompt: brainstormPrompt.value
                    })
                });
                const data = await res.json();
                brainstormedDish = data.item;

                brainstormName.textContent = brainstormedDish.name;
                brainstormMeta.textContent = `${brainstormedDish.category.toUpperCase()} | $${brainstormedDish.price.toFixed(2)} | Spice: ${brainstormedDish.spice}`;
                brainstormReason.textContent = data.reasoning;
                btnAddBrainstormed.classList.remove('hidden');
            } catch (e) {
                console.error(e);
                brainstormReason.textContent = "Failed to brainstorm. Make sure API key is configured or backend is running.";
            }
        });
    }

    if (btnAddBrainstormed) {
        btnAddBrainstormed.addEventListener('click', async () => {
            if (!brainstormedDish) return;
            try {
                const res = await fetch('/api/menu', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(brainstormedDish)
                });
                const data = await res.json();
                if (data.success) {
                    alert(`${brainstormedDish.name} added to the menu optimizer database!`);
                    brainstormResultBox.classList.add('hidden');
                    brainstormPrompt.value = '';
                    await fetchAndRenderFood();
                }
            } catch (e) {
                console.error(e);
                alert("Failed to save dish to backend database.");
            }
        });
    }

    // ----------------------------------------------------------------
    // MODULE 6: SYSTEM-WIDE FLOATING AI COPILOT
    // ----------------------------------------------------------------
    const aiCopilotBtn = document.getElementById('ai-copilot-btn');
    const aiCopilotWindow = document.getElementById('ai-copilot-window');
    const closeCopilotBtn = document.getElementById('close-copilot-btn');
    const copilotMessages = document.getElementById('copilot-messages');
    const copilotInput = document.getElementById('copilot-input');
    const copilotSendBtn = document.getElementById('copilot-send-btn');

    let chatHistory = [];

    if (aiCopilotBtn) {
        aiCopilotBtn.addEventListener('click', () => {
            aiCopilotWindow.classList.add('open');
            aiCopilotBtn.querySelector('.notification-dot').style.display = 'none';
            if (copilotMessages.children.length <= 1) {
                // Initial prompt
            }
        });

        closeCopilotBtn.addEventListener('click', () => {
            aiCopilotWindow.classList.remove('open');
        });

        copilotSendBtn.addEventListener('click', sendMessage);
        copilotInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    async function sendMessage() {
        const text = copilotInput.value.trim();
        if (!text) return;

        appendMessage("user", text);
        copilotInput.value = '';

        // Typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'message system-msg typing';
        typingDiv.innerHTML = '<p>Assistant is writing response...</p>';
        copilotMessages.appendChild(typingDiv);
        copilotMessages.scrollTop = copilotMessages.scrollHeight;

        // Collect current state
        const state = {
            occupancy: document.querySelector('.metric-card.card-gradient-cyan h2').textContent.replace('%', ''),
            predictedOrders: document.getElementById('overview-predicted-orders').textContent.split(' ')[0],
            hygieneRating: document.getElementById('hygiene-val') ? document.getElementById('hygiene-val').textContent.replace('%', '') : '98.5',
            menuItemsCount: liveFoodItems.length,
            latency: document.getElementById('latency-val').textContent
        };

        try {
            const res = await fetch('/api/copilot/chat', {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    message: text,
                    state: state,
                    chat_history: chatHistory
                })
            });
            const data = await res.json();

            // Remove typing indicator
            typingDiv.remove();

            appendMessage("system", data.response);
            chatHistory.push({ role: "user", text: text });
            chatHistory.push({ role: "system", text: data.response });

            if (chatHistory.length > 10) chatHistory.shift(); // keep history short
        } catch (e) {
            typingDiv.remove();
            appendMessage("system", "Failed to retrieve answer from operations engine. Check connection.");
            console.error(e);
        }
    }

    function appendMessage(role, text) {
        const div = document.createElement('div');
        div.className = `message ${role === 'user' ? 'user-msg' : 'system-msg'}`;
        div.innerHTML = `<p>${text}</p>`;
        copilotMessages.appendChild(div);
        copilotMessages.scrollTop = copilotMessages.scrollHeight;
    }

    // Initialize Menu Optimizer on load
    fetchAndRenderFood();
});
