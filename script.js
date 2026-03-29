document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const categorySelect = document.getElementById('category-select');
    const manageCategoriesBtn = document.getElementById('manage-categories-btn');
    const taskInput = document.getElementById('task-input');
    const taskList = document.getElementById('task-list');
    const timeDisplay = document.getElementById('time-display');
    const setMinutesInput = document.getElementById('set-minutes');
    const setSecondsInput = document.getElementById('set-seconds');
    const applyTimeBtn = document.getElementById('apply-time-btn');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    
    // Tabs Elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    const dateInput = document.getElementById('date-input');
    const monthInput = document.getElementById('month-input');
    const historyMonthInput = document.getElementById('history-month-input');
    const statsContent = document.getElementById('stats-content');
    const alarmAudio = document.getElementById('alarm-audio');
    
    // Custom Modal Elements
    const alarmModal = document.getElementById('alarm-modal');
    const alarmMessage = document.getElementById('alarm-message');
    const alarmStopBtn = document.getElementById('alarm-stop-btn');
    
    const editModal = document.getElementById('edit-modal');
    const editTitle = document.getElementById('edit-title');
    const editInput = document.getElementById('edit-input');
    const editCancelBtn = document.getElementById('edit-cancel-btn');
    const editSaveBtn = document.getElementById('edit-save-btn');
    
    const categoryModal = document.getElementById('category-modal');
    const newCategoryInput = document.getElementById('new-category-input');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryManagerList = document.getElementById('category-manager-list');
    const categoryCloseBtn = document.getElementById('category-close-btn');

    const editTaskModal = document.getElementById('edit-task-modal');
    const editTaskTitle = document.getElementById('edit-task-title');
    const editTaskCategorySelect = document.getElementById('edit-task-category-select');
    const editTaskNameInput = document.getElementById('edit-task-name-input');
    const editTaskCancelBtn = document.getElementById('edit-task-cancel-btn');
    const editTaskSaveBtn = document.getElementById('edit-task-save-btn');
    
    const editTimeModal = document.getElementById('edit-time-modal');
    const editTimeTitle = document.getElementById('edit-time-title');
    const editTimeCurrent = document.getElementById('edit-time-current');
    const editTimeInput = document.getElementById('edit-time-input');
    const editTimeCancelBtn = document.getElementById('edit-time-cancel-btn');
    const editTimeSaveBtn = document.getElementById('edit-time-save-btn');
    
    let currentEditCallback = null;
    let currentEditTaskContext = null;
    let currentEditTimeContext = null;
    
    // Progress Ring Elements
    const circle = document.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = 0;

    // State Variables
    let originalDuration = 20 * 60; // default 20 minutes
    let remainingTime = originalDuration;
    let timerInterval = null;
    let isPlaying = false;
    
    // Load records and categories from LocalStorage
    let records = JSON.parse(localStorage.getItem('timerRecords')) || [];
    let defaultCategories = ['未分類', '仕事', '学習', 'その他'];
    let userCategories = JSON.parse(localStorage.getItem('timerCategories')) || defaultCategories;

    // Initialization
    initDateInputs();
    updateDisplay();
    populateCategorySelects();
    updateTaskSuggestions();
    updateDashboard();

    // Event Listeners
    applyTimeBtn.addEventListener('click', () => {
        if (isPlaying) return;
        let m = parseInt(setMinutesInput.value) || 0;
        let s = parseInt(setSecondsInput.value) || 0;
        if (m === 0 && s === 0) {
            alert('時間を設定してください。');
            return;
        }
        originalDuration = m * 60 + s;
        remainingTime = originalDuration;
        updateDisplay();
        setProgress(1); // 100% full ring
    });

    startBtn.addEventListener('click', () => {
        if (isPlaying || remainingTime <= 0) return;
        
        let categoryName = categorySelect.value || '未分類';
        let taskName = taskInput.value.trim();
        if (!taskName) {
            alert('タスク名を入力してください');
            taskInput.focus();
            return;
        }

        // 念のためアラームを停止
        stopAlarm();

        isPlaying = true;
        startBtn.style.display = 'none';
        pauseBtn.style.display = 'inline-block';
        
        // Timer Loop logic
        timerInterval = setInterval(() => {
            remainingTime--;
            updateDisplay();
            setProgress(remainingTime / originalDuration);

            if (remainingTime <= 0) {
                completeTimer();
            }
        }, 1000);
    });

    pauseBtn.addEventListener('click', () => {
        if (!isPlaying) return;
        isPlaying = false;
        clearInterval(timerInterval);
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        stopAlarm();
    });

    resetBtn.addEventListener('click', () => {
        const elapsed = originalDuration - remainingTime;
        if (elapsed > 0) {
            let categoryName = categorySelect.value || '未分類';
            let taskName = taskInput.value.trim() || '名称未定義';
            const now = new Date();
            const record = {
                id: Date.now(),
                date: now.toISOString(),
                category: categoryName,
                taskName: taskName,
                duration: elapsed
            };
            records.push(record);
            localStorage.setItem('timerRecords', JSON.stringify(records));
        }

        isPlaying = false;
        clearInterval(timerInterval);
        remainingTime = originalDuration;
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        updateDisplay();
        setProgress(1); // reset ring to full
        stopAlarm();
        updateTaskSuggestions();
        updateDashboard();
    });

    // Tabs Logic
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class to clicked
            btn.classList.add('active');
            const targetId = `tab-${btn.dataset.tab}`;
            document.getElementById(targetId).classList.add('active');

            updateDashboard();
        });
    });

    dateInput.addEventListener('change', updateDashboard);
    monthInput.addEventListener('change', updateDashboard);
    if (historyMonthInput) historyMonthInput.addEventListener('change', updateDashboard);

    // Modal Event Listener
    alarmStopBtn.addEventListener('click', () => {
        alarmModal.style.display = 'none';
        stopAlarm();
        
        // 入力欄をクリアしてフォーカスを当てる（次のタスクを入力しやすくする）
        taskInput.value = '';
        taskInput.focus();
    });

    // Custom Prompt Logic
    function showPrompt(title, defaultValue, callback) {
        editTitle.textContent = title;
        editInput.value = defaultValue;
        currentEditCallback = callback;
        editModal.style.display = 'flex';
        editInput.focus();
    }

    editCancelBtn.addEventListener('click', () => {
        editModal.style.display = 'none';
        currentEditCallback = null;
    });

    editSaveBtn.addEventListener('click', () => {
        if (currentEditCallback) {
            currentEditCallback(editInput.value);
        }
        editModal.style.display = 'none';
        currentEditCallback = null;
    });

    editInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            editSaveBtn.click();
        }
    });

    // Helpers
    function updateDisplay() {
        let m = Math.floor(remainingTime / 60);
        let s = remainingTime % 60;
        timeDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function setProgress(percent) {
        // As percent goes from 1 to 0, offset goes from 0 to circumference
        const offset = circumference - percent * circumference;
        circle.style.strokeDashoffset = offset;
    }

    function completeTimer() {
        isPlaying = false;
        clearInterval(timerInterval);
        startBtn.style.display = 'inline-block';
        pauseBtn.style.display = 'none';
        remainingTime = 0;
        updateDisplay();
        setProgress(0);
        
        // Play notification sound
        playAlarm();

        // Save Record
        let categoryName = categorySelect.value || '未分類';
        let taskName = taskInput.value.trim();
        const now = new Date();
        const record = {
            id: Date.now(),
            date: now.toISOString(), // saving as ISO string
            category: categoryName,
            taskName: taskName,
            duration: originalDuration // length of session in seconds
        };

        records.push(record);
        localStorage.setItem('timerRecords', JSON.stringify(records));

        // OSのデスクトップ通知（ポップアップ）を表示
        if (Notification.permission === 'granted') {
            new Notification('Task Timer', { body: `お疲れ様でした！「${taskName}」が完了しました。` });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('Task Timer', { body: `お疲れ様でした！「${taskName}」が完了しました。` });
                }
            });
        }
        
        // Small delay so it doesn't block the UI update instantly
        setTimeout(() => {
            // alertの代わりにカスタムモーダルを表示
            alarmMessage.textContent = `「${taskName}」が完了しました。`;
            alarmModal.style.display = 'flex';

            // Reset state for next session
            remainingTime = originalDuration;
            updateDisplay();
            setProgress(1);
            updateTaskSuggestions();
            updateDashboard();
        }, 100);
    }

    // カスタムアラーム音の再生
    function playAlarm() {
        // 設定されたオーディオファイルを再生。ファイルが無い場合は従来の音を鳴らす
        alarmAudio.play().catch(e => {
            console.log("Audio play failed or file missing, falling back to beep:", e);
            playNotificationSound();
        });
    }

    // カスタムアラーム音の停止
    function stopAlarm() {
        alarmAudio.pause();
        alarmAudio.currentTime = 0;
    }

    // Web Audio API for a modern beep sound (Fallback)
    function playNotificationSound() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioContext();
            
            // Create two oscillators for a chord-like pleasant chime
            const playNote = (frequency, startTime, duration) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency, ctx.currentTime + startTime);
                
                gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
                gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + startTime + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.start(ctx.currentTime + startTime);
                osc.stop(ctx.currentTime + startTime + duration);
            };

            playNote(880.00, 0, 0.4); // A5
            playNote(1046.50, 0.15, 0.6); // C6
            playNote(1318.51, 0.3, 0.8); // E6
            
        } catch (e) {
            console.warn('Web Audio API is not supported or was blocked', e);
        }
    }

    // Set initial dates to current date
    function initDateInputs() {
        const now = new Date();
        const y = now.getFullYear();
        const m = (now.getMonth() + 1).toString().padStart(2, '0');
        const d = now.getDate().toString().padStart(2, '0');
        monthInput.value = `${y}-${m}`;
        dateInput.value = `${y}-${m}-${d}`;
        if (historyMonthInput) historyMonthInput.value = `${y}-${m}`;
    }

    // Dynamically update HTML datalist for autocomplete
    function updateTaskSuggestions() {
        const tasks = [...new Set(records.map(r => r.taskName).filter(Boolean))];
        taskList.innerHTML = '';
        tasks.sort().forEach(t => {
            const option = document.createElement('option');
            option.value = t;
            taskList.appendChild(option);
        });
    }

    function populateCategorySelects() {
        categorySelect.innerHTML = '';
        editTaskCategorySelect.innerHTML = '';
        
        userCategories.forEach(cat => {
            const opt1 = document.createElement('option');
            opt1.value = cat;
            opt1.textContent = escapeHTML(cat);
            categorySelect.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = cat;
            opt2.textContent = escapeHTML(cat);
            editTaskCategorySelect.appendChild(opt2);
        });
    }

    function renderCategoryManager() {
        categoryManagerList.innerHTML = '';
        userCategories.forEach((cat, index) => {
            const li = document.createElement('li');
            li.className = 'list-item';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.draggable = true;
            li.style.cursor = 'grab';

            li.innerHTML = `
                <div style="display: flex; align-items: center; gap: 0.5rem; pointer-events: none;">
                    <span style="color: var(--text-secondary);">☰</span>
                    <span class="task-name">${escapeHTML(cat)}</span>
                </div>
                <button class="btn-icon delete-cat-btn" data-index="${index}" title="削除" style="pointer-events: auto;">🗑️</button>
            `;
            
            li.addEventListener('dragstart', (e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', index);
                setTimeout(() => li.style.opacity = '0.5', 0);
            });
            
            li.addEventListener('dragend', () => {
                li.style.opacity = '1';
                document.querySelectorAll('#category-manager-list li').forEach(el => {
                    el.style.borderTop = '';
                    el.style.borderBottom = '';
                });
            });
            
            li.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                const bounding = li.getBoundingClientRect();
                const offset = bounding.y + (bounding.height / 2);
                if (e.clientY - offset > 0) {
                    li.style.borderBottom = '2px solid var(--primary-color)';
                    li.style.borderTop = '';
                } else {
                    li.style.borderTop = '2px solid var(--primary-color)';
                    li.style.borderBottom = '';
                }
            });
            
            li.addEventListener('dragleave', () => {
                li.style.borderTop = '';
                li.style.borderBottom = '';
            });
            
            li.addEventListener('drop', (e) => {
                e.preventDefault();
                li.style.borderTop = '';
                li.style.borderBottom = '';
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                let toIndex = index;
                
                const bounding = li.getBoundingClientRect();
                const offset = bounding.y + (bounding.height / 2);
                if (e.clientY - offset > 0) {
                    toIndex++; // drop below
                }
                
                if (fromIndex !== toIndex && !isNaN(fromIndex)) {
                    if (toIndex > fromIndex) toIndex--; // adjust index because array shifts after splice
                    const item = userCategories.splice(fromIndex, 1)[0];
                    userCategories.splice(toIndex, 0, item);
                    saveCategories();
                    populateCategorySelects();
                    renderCategoryManager();
                }
            });

            li.querySelector('.delete-cat-btn').addEventListener('click', () => {
                userCategories.splice(index, 1);
                saveCategories();
                populateCategorySelects();
                renderCategoryManager();
            });
            categoryManagerList.appendChild(li);
        });
    }

    function saveCategories() {
        localStorage.setItem('timerCategories', JSON.stringify(userCategories));
    }

    manageCategoriesBtn.addEventListener('click', () => {
        renderCategoryManager();
        categoryModal.style.display = 'flex';
    });

    categoryCloseBtn.addEventListener('click', () => {
        categoryModal.style.display = 'none';
        updateDashboard();
    });

    addCategoryBtn.addEventListener('click', () => {
        const val = newCategoryInput.value.trim();
        if (val && !userCategories.includes(val)) {
            userCategories.push(val);
            saveCategories();
            populateCategorySelects();
            renderCategoryManager();
            newCategoryInput.value = '';
        }
    });

    newCategoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCategoryBtn.click();
    });

    // Edit Task Modal Logic
    editTaskCancelBtn.addEventListener('click', () => {
        editTaskModal.style.display = 'none';
        currentEditTaskContext = null;
    });

    editTaskSaveBtn.addEventListener('click', () => {
        if (currentEditTaskContext) {
            const newCat = editTaskCategorySelect.value;
            const newTName = editTaskNameInput.value.trim();
            if (newTName) {
                if (currentEditTaskContext.recordId !== undefined) {
                    const targetRec = records.find(r => r.id === currentEditTaskContext.recordId);
                    if (targetRec) {
                        targetRec.category = newCat;
                        targetRec.taskName = newTName;
                        localStorage.setItem('timerRecords', JSON.stringify(records));
                        updateTaskSuggestions();
                        updateDashboard();
                    }
                } else {
                    renameTaskAndCategory(
                        currentEditTaskContext.oldCat, 
                        currentEditTaskContext.oldTask, 
                        newCat, 
                        newTName, 
                        currentEditTaskContext.reportType
                    );
                }
                editTaskModal.style.display = 'none';
                currentEditTaskContext = null;
            }
        }
    });

    // Edit Time Modal Logic
    editTimeCancelBtn.addEventListener('click', () => {
        editTimeModal.style.display = 'none';
        currentEditTimeContext = null;
    });

    editTimeSaveBtn.addEventListener('click', () => {
        if (currentEditTimeContext) {
            const newMinutes = parseInt(editTimeInput.value);
            if (!isNaN(newMinutes) && newMinutes >= 0) {
                const newDurSec = newMinutes * 60;
                const diffSec = newDurSec - currentEditTimeContext.currentDur;
                
                if (diffSec !== 0) {
                    let adjustmentDateStr = new Date().toISOString();
                    if (currentEditTimeContext.reportType === 'daily') {
                        const d = new Date(currentEditTimeContext.filterVal);
                        if (!isNaN(d.getTime())) {
                            d.setHours(12, 0, 0, 0);
                            adjustmentDateStr = d.toISOString();
                        }
                    } else if (currentEditTimeContext.reportType === 'monthly') {
                        const parts = currentEditTimeContext.filterVal.split('-');
                        if (parts.length === 2) {
                            const d = new Date(parts[0], parseInt(parts[1]) - 1, 1, 12, 0, 0);
                            adjustmentDateStr = d.toISOString();
                        }
                    }

                    const record = {
                        id: Date.now() + Math.floor(Math.random() * 1000),
                        date: adjustmentDateStr,
                        category: currentEditTimeContext.catName,
                        taskName: currentEditTimeContext.tName,
                        duration: diffSec
                    };
                    records.push(record);
                    localStorage.setItem('timerRecords', JSON.stringify(records));
                    updateDashboard();
                }
                editTimeModal.style.display = 'none';
                currentEditTimeContext = null;
            } else {
                alert('有効な分数を入力してください。');
            }
        }
    });

    editTimeInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') editTimeSaveBtn.click();
    });

    // Render stats and history
    function updateDashboard() {
        const activeTabBtn = document.querySelector('.tab-btn.active');
        const reportType = activeTabBtn ? activeTabBtn.dataset.tab : 'daily';
        let filteredRecords = [];

        if (reportType === 'daily') {
            const selectedDate = dateInput.value; // Format: "YYYY-MM-DD"
            if (!selectedDate) return;
            filteredRecords = records.filter(r => {
                const d = new Date(r.date);
                const y = d.getFullYear();
                const m = (d.getMonth() + 1).toString().padStart(2, '0');
                const day = d.getDate().toString().padStart(2, '0');
                return `${y}-${m}-${day}` === selectedDate;
            });
        } else if (reportType === 'monthly') {
            const selectedMonth = monthInput.value; // Format: "YYYY-MM"
            if (!selectedMonth) return;
            filteredRecords = records.filter(r => {
                const d = new Date(r.date);
                const y = d.getFullYear();
                const m = (d.getMonth() + 1).toString().padStart(2, '0');
                return `${y}-${m}` === selectedMonth;
            });
        } else if (reportType === 'history') {
            const selectedHistoryMonth = historyMonthInput ? historyMonthInput.value : '';
            if (!selectedHistoryMonth) return;
            filteredRecords = records.filter(r => {
                const d = new Date(r.date);
                const y = d.getFullYear();
                const m = (d.getMonth() + 1).toString().padStart(2, '0');
                return `${y}-${m}` === selectedHistoryMonth;
            });
        }

        let grandTotalSec = 0;
        const categoryStats = {};
        
        filteredRecords.forEach(r => {
            let cat = r.category || '未分類';
            let tName = r.taskName || '名称未定義';
            let dur = r.duration;

            if (!categoryStats[cat]) {
                categoryStats[cat] = { total: 0, tasks: {} };
            }
            categoryStats[cat].total += dur;
            
            if (!categoryStats[cat].tasks[tName]) {
                categoryStats[cat].tasks[tName] = 0;
            }
            categoryStats[cat].tasks[tName] += dur;
            
            grandTotalSec += dur;
        });

        const summaryDiv = document.getElementById('stats-summary');
        if (summaryDiv) {
            const h = Math.floor(grandTotalSec / 3600);
            const m = Math.floor((grandTotalSec % 3600) / 60);
            const timeStr = h > 0 ? `${h}時間${m}分` : `${m}分`;
            let labelStr = '日計';
            if (reportType === 'monthly') labelStr = '月計';
            else if (reportType === 'history') labelStr = '履歴内合計';
            
            summaryDiv.innerHTML = `
                <span class="summary-label">${labelStr}</span>
                <span class="summary-time">${timeStr}</span>
            `;
        }

        if (!statsContent) return;
        statsContent.innerHTML = '';

        if (reportType === 'daily') {
            statsContent.appendChild(createCategorySectionDiv('カテゴリ別内訳', categoryStats));
        } else if (reportType === 'monthly') {
            const dailyStats = {};
            filteredRecords.forEach(r => {
                const d = new Date(r.date);
                const dayStr = `${d.getMonth() + 1}月${d.getDate()}日`;
                if (!dailyStats[dayStr]) dailyStats[dayStr] = 0;
                dailyStats[dayStr] += r.duration;
            });

            // Sort chronologically by day
            const sortedDaily = Object.entries(dailyStats).sort((a, b) => {
                const dayA = parseInt(a[0].match(/(\d+)日/)[1]);
                const dayB = parseInt(b[0].match(/(\d+)日/)[1]);
                return dayA - dayB;
            });
            statsContent.appendChild(createSectionDiv('日別内訳', sortedDaily));
            statsContent.appendChild(createCategorySectionDiv('カテゴリ別内訳', categoryStats));
        } else if (reportType === 'history') {
            statsContent.appendChild(createHistorySectionDiv(filteredRecords));
        }

        function createCategorySectionDiv(title, categoryStatsObj) {
            const section = document.createElement('div');
            section.className = 'stats-section-block';
            
            const h3 = document.createElement('h3');
            h3.textContent = title;
            section.appendChild(h3);
            
            const ul = document.createElement('ul');
            ul.className = 'stats-list';

            const sortedCategories = Object.entries(categoryStatsObj).sort((a, b) => b[1].total - a[1].total);

            if (sortedCategories.length === 0) {
                ul.innerHTML = '<li class="list-item"><span class="text-secondary">データがありません</span></li>';
            } else {
                sortedCategories.forEach(([catName, catData], index) => {
                    const h = Math.floor(catData.total / 3600);
                    const m = Math.floor((catData.total % 3600) / 60);
                    const timeStr = h > 0 ? `${h}時間${m}分` : `${m}分`;

                    const li = document.createElement('li');
                    li.className = 'list-item category-item';
                    
                    const catRow = document.createElement('div');
                    catRow.className = 'category-row';
                    catRow.innerHTML = `
                        <div class="category-info">
                            <span class="task-name">${escapeHTML(catName)}</span>
                            <span class="task-time">${timeStr}</span>
                        </div>
                        <div class="category-actions">
                            <button class="btn-icon btn-edit-cat" title="カテゴリ名の変更">✏️</button>
                            <button class="btn-details">詳細を見る</button>
                        </div>
                    `;
                    
                    const detailsDiv = document.createElement('div');
                    detailsDiv.className = 'category-details';
                    detailsDiv.style.display = 'none';

                    const sortedTasks = Object.entries(catData.tasks).sort((a, b) => b[1] - a[1]);
                    const subUl = document.createElement('ul');
                    subUl.className = 'sub-task-list';
                    sortedTasks.forEach(([tName, tDur]) => {
                        const th = Math.floor(tDur / 3600);
                        const tm = Math.floor((tDur % 3600) / 60);
                        const tTimeStr = th > 0 ? `${th}時間${tm}分` : `${tm}分`;
                        const subLi = document.createElement('li');
                        subLi.className = 'sub-task-item';
                        subLi.innerHTML = `
                            <span class="sub-task-name">${escapeHTML(tName)}</span>
                            <div class="sub-task-actions">
                                <span class="sub-task-time">${tTimeStr}</span>
                                <button class="btn-icon btn-edit-time" title="合計時間を修正">🕒</button>
                                <button class="btn-icon btn-edit-task" title="タスク名の変更">✏️</button>
                            </div>
                        `;
                        
                        // Edit Time
                        const editTimeBtn = subLi.querySelector('.btn-edit-time');
                        editTimeBtn.addEventListener('click', () => {
                            editTimeTitle.textContent = `時間の修正: ${tName}`;
                            editTimeCurrent.textContent = `現在の合計: ${tTimeStr} (${Math.floor(tDur/60)}分)`;
                            editTimeInput.value = Math.floor(tDur / 60);
                            
                            const activeTabBtn = document.querySelector('.tab-btn.active');
                            const repType = activeTabBtn ? activeTabBtn.dataset.tab : 'daily';
                            const filterVal = repType === 'daily' ? dateInput.value : monthInput.value;
                            
                            currentEditTimeContext = {
                                catName, tName, currentDur: tDur, reportType: repType, filterVal
                            };
                            editTimeModal.style.display = 'flex';
                            editTimeInput.focus();
                        });

                        // Edit Task
                        const editTaskBtn = subLi.querySelector('.btn-edit-task');
                        editTaskBtn.addEventListener('click', () => {
                            editTaskTitle.textContent = 'タスクの編集・移動';
                            // もし現在のカテゴリがドロップダウンになければ追加しておく（互換性確保用）
                            if (!userCategories.includes(catName)) {
                                const opt = document.createElement('option');
                                opt.value = catName;
                                opt.textContent = escapeHTML(catName);
                                editTaskCategorySelect.appendChild(opt);
                            }
                            editTaskCategorySelect.value = catName;
                            editTaskNameInput.value = tName;
                            currentEditTaskContext = { oldCat: catName, oldTask: tName, reportType: reportType };
                            editTaskModal.style.display = 'flex';
                            editTaskNameInput.focus();
                        });

                        subUl.appendChild(subLi);
                    });
                    detailsDiv.appendChild(subUl);

                    const btn = catRow.querySelector('.btn-details');
                    btn.addEventListener('click', () => {
                        const isHidden = detailsDiv.style.display === 'none';
                        detailsDiv.style.display = isHidden ? 'block' : 'none';
                        btn.textContent = isHidden ? '閉じる' : '詳細を見る';
                    });

                    // Edit Category
                    const editCatBtn = catRow.querySelector('.btn-edit-cat');
                    editCatBtn.addEventListener('click', () => {
                        showPrompt(`カテゴリ「${catName}」の新しい名前:`, catName, (newCName) => {
                            if (newCName && newCName.trim() !== '' && newCName !== catName) {
                                renameCategory(catName, newCName.trim(), reportType);
                            }
                        });
                    });

                    li.appendChild(catRow);
                    li.appendChild(detailsDiv);
                    ul.appendChild(li);
                });
            }
            section.appendChild(ul);
            return section;
        }

        function createSectionDiv(title, sortedData) {
            const section = document.createElement('div');
            section.className = 'stats-section-block';
            
            const h3 = document.createElement('h3');
            h3.textContent = title;
            section.appendChild(h3);
            
            const ul = document.createElement('ul');
            ul.className = 'stats-list';
            
            if (sortedData.length === 0) {
                ul.innerHTML = '<li class="list-item"><span class="text-secondary">データがありません</span></li>';
            } else {
                sortedData.forEach(([label, totalSec]) => {
                    const h = Math.floor(totalSec / 3600);
                    const m = Math.floor((totalSec % 3600) / 60);
                    const timeStr = h > 0 ? `${h}時間${m}分` : `${m}分`;
                    
                    const li = document.createElement('li');
                    li.className = 'list-item';
                    li.innerHTML = `
                        <span class="task-name">${escapeHTML(label)}</span>
                        <span class="task-time">${timeStr}</span>
                    `;
                    ul.appendChild(li);
                });
            }
            section.appendChild(ul);
            return section;
        }
    }

        function createHistorySectionDiv(historyRecords) {
            const section = document.createElement('div');
            section.className = 'stats-section-block';
            
            const h3 = document.createElement('h3');
            h3.textContent = '生データ履歴 (新しい順)';
            section.appendChild(h3);
            
            const ul = document.createElement('ul');
            ul.className = 'stats-list';

            const sortedRecords = [...historyRecords].sort((a, b) => new Date(b.date) - new Date(a.date));

            if (sortedRecords.length === 0) {
                ul.innerHTML = '<li class="list-item"><span class="text-secondary">データがありません</span></li>';
            } else {
                sortedRecords.forEach(r => {
                    const absDur = Math.abs(r.duration);
                    const h = Math.floor(absDur / 3600);
                    const m = Math.floor((absDur % 3600) / 60);
                    let timeStr = h > 0 ? `${h}時間${m}分` : `${m}分`;
                    if (r.duration < 0) timeStr = '-' + timeStr;

                    const li = document.createElement('li');
                    li.className = 'list-item';
                    li.style.display = 'flex';
                    li.style.justifyContent = 'space-between';
                    li.style.alignItems = 'center';

                    const dateObj = new Date(r.date);
                    const dateStr = `${dateObj.getMonth()+1}/${dateObj.getDate()} ${dateObj.getHours().toString().padStart(2,'0')}:${dateObj.getMinutes().toString().padStart(2,'0')}`;

                    li.innerHTML = `
                        <div style="display: flex; flex-direction: column; gap: 0.2rem; text-align: left; flex: 1; min-width: 0; margin-right: 0.5rem;">
                            <span style="font-size: 0.75rem; color: var(--text-secondary);">${dateStr}</span>
                            <span style="font-size: 0.85rem; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                <span style="color: var(--primary-color); font-size: 0.75rem; margin-right: 0.3rem;">[${escapeHTML(r.category || '未分類')}]</span>${escapeHTML(r.taskName)}
                            </span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;">
                            <span style="font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: ${r.duration < 0 ? '#ff6b6b' : 'var(--text-secondary)'};">${timeStr}</span>
                            <button class="btn-icon btn-edit-history" title="設定の変更">✏️</button>
                            <button class="btn-icon btn-delete-history" title="削除">🗑️</button>
                        </div>
                    `;

                    li.querySelector('.btn-edit-history').addEventListener('click', () => {
                        document.getElementById('edit-task-title').textContent = '記録の編集・移動';
                        const selectEl = document.getElementById('edit-task-category-select');
                        const catValue = r.category || '未分類';
                        if (!userCategories.includes(catValue)) {
                            const opt = document.createElement('option');
                            opt.value = catValue;
                            opt.textContent = escapeHTML(catValue);
                            selectEl.appendChild(opt);
                        }
                        selectEl.value = catValue;
                        document.getElementById('edit-task-name-input').value = r.taskName || '名称未定義';
                        
                        currentEditTaskContext = { recordId: r.id };
                        document.getElementById('edit-task-modal').style.display = 'flex';
                        document.getElementById('edit-task-name-input').focus();
                    });

                    li.querySelector('.btn-delete-history').addEventListener('click', () => {
                        if (confirm('この記録を削除してもよろしいですか？（※時間調整で追加された見えないデータも一緒に消えます）')) {
                            records = records.filter(rec => rec.id !== r.id);
                            localStorage.setItem('timerRecords', JSON.stringify(records));
                            updateTaskSuggestions();
                            updateDashboard();
                        }
                    });

                    ul.appendChild(li);
                });
            }
            section.appendChild(ul);
            return section;
        }

        function escapeHTML(str) {
            return str.replace(/[&<>'"]/g, 
                tag => ({
                    '&': '&amp;',
                    '<': '&lt;',
                    '>': '&gt;',
                    "'": '&#39;',
                    '"': '&quot;'
                }[tag])
            );
        }

    // CSV Export Logic
    const exportCsvBtn = document.getElementById('export-csv-btn');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', () => {
            const selectedMonth = monthInput.value;
            if (!selectedMonth) {
                alert('月を選択してください。');
                return;
            }

            const filteredRecords = records.filter(r => {
                const d = new Date(r.date);
                const y = d.getFullYear();
                const m = (d.getMonth() + 1).toString().padStart(2, '0');
                return `${y}-${m}` === selectedMonth;
            });

            if (filteredRecords.length === 0) {
                alert('この月のデータはありません。');
                return;
            }

            // Aggregate by category and task
            const stats = {};
            filteredRecords.forEach(r => {
                let cat = r.category || '未分類';
                let tName = r.taskName || '名称未定義';
                if (!stats[cat]) stats[cat] = {};
                if (!stats[cat][tName]) stats[cat][tName] = 0;
                stats[cat][tName] += r.duration;
            });

            let csvContent = '\uFEFFタスクカテゴリ,タスク名,時間(分)\n';
            
            for (const cat in stats) {
                for (const tName in stats[cat]) {
                    const durSec = stats[cat][tName];
                    const durMin = Math.round(durSec / 60);

                    const safeCat = `"${cat.replace(/"/g, '""')}"`;
                    const safeTask = `"${tName.replace(/"/g, '""')}"`;
                    
                    csvContent += `${safeCat},${safeTask},${durMin}\n`;
                }
            }

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `月間集計_${selectedMonth}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

        function getFilterDates(repType) {
            if (repType === 'daily') {
                return { type: 'daily', val: dateInput.value };
            } else {
                return { type: 'monthly', val: monthInput.value };
            }
        }

        function isRecordInCurrentFilter(r, filter) {
            const d = new Date(r.date);
            const y = d.getFullYear();
            const m = (d.getMonth() + 1).toString().padStart(2, '0');
            if (filter.type === 'daily') {
                const day = d.getDate().toString().padStart(2, '0');
                return `${y}-${m}-${day}` === filter.val;
            } else {
                return `${y}-${m}` === filter.val;
            }
        }

        function renameCategory(oldCat, newCat, repType) {
            const filter = getFilterDates(repType);
            records.forEach(r => {
                if (isRecordInCurrentFilter(r, filter)) {
                    let cat = r.category || '未分類';
                    if (cat === oldCat) r.category = newCat;
                }
            });
            localStorage.setItem('timerRecords', JSON.stringify(records));
            updateTaskSuggestions();
            updateDashboard();
        }

        function renameTaskAndCategory(oldCat, oldTask, newCat, newTask, repType) {
            const filter = getFilterDates(repType);
            records.forEach(r => {
                if (isRecordInCurrentFilter(r, filter)) {
                    let cat = r.category || '未分類';
                    let tName = r.taskName || '名称未定義';
                    if (cat === oldCat && tName === oldTask) {
                        r.category = newCat;
                        r.taskName = newTask;
                    }
                }
            });
            localStorage.setItem('timerRecords', JSON.stringify(records));
            updateTaskSuggestions();
            updateDashboard();
        }
});
