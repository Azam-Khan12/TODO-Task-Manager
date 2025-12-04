// Complete & Fixed JS - Tasks Show After Add, No Duplicate Keys, Hamburger Working, Progress Animate
document.addEventListener('DOMContentLoaded', () => {
    let currentTasks = [];
    let editingId = null;

    // Notification Permission
    if ('Notification' in window) Notification.requestPermission();

    // Sample Data
    const sampleTasks = [
        { id: 1, title: 'Sir se milna', category: 'today', due_date: '2025-12-05', time_slot: '14:00', completed: false, priority: 'high', reminder_set: true },
        { id: 2, title: 'Dashboard project for school', category: 'upcoming', due_date: '2025-12-06', time_slot: '10:00', completed: false, priority: 'medium', reminder_set: false },
        { id: 3, title: 'Meeting Mr. Brian O\'Connor', category: 'today', due_date: '2025-12-05', time_slot: '16:00', completed: true, priority: 'low', reminder_set: true },
        { id: 4, title: 'Go to Bank Office', category: 'priority', due_date: '2025-12-05', time_slot: '11:00', completed: false, priority: 'high', reminder_set: true }
    ];

    // Theme Toggle
    const themeToggle = document.getElementById('themeToggle');
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        themeToggle.textContent = document.body.classList.contains('dark-theme') ? '☀️' : '🌙';
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
    });
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️';
    }

    // Hamburger Menu Toggle - FIXED (add event to close on outside click too)
    const menuBtn = document.getElementById('menuBtn');
    const sidebar = document.querySelector('.sidebar');
    menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', e => {
        if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) sidebar.classList.remove('open');
    });

    // Load Tasks - FIXED (sample save if empty, full fetch)
    async function loadTasks() {
        try {
            const response = await fetch('/tasks');
            let tasks = await response.json().tasks;
            if (tasks.length === 0) {
                tasks = sampleTasks;
                for (let task of tasks) {
                    await fetch('/tasks', { 
                        method: 'POST', 
                        headers: { 'Content-Type': 'application/json' }, 
                        body: JSON.stringify({ action: 'add', title: task.title, category: task.category, due_date: task.due_date, time_slot: task.time_slot, priority: task.priority, reminder_set: task.reminder_set }) 
                    });
                }
                // Reload after save
                const reloadResponse = await fetch('/tasks');
                tasks = await reloadResponse.json().tasks;
            }
            currentTasks = tasks;
            renderTasks();
            updateProgressBar(tasks);
            scheduleReminders(tasks);
        } catch (error) {
            console.error('Load tasks error:', error);
            currentTasks = sampleTasks; // Fallback
            renderTasks();
            updateProgressBar(currentTasks);
        }
    }
    loadTasks();

    // Render Tasks - FIXED (clear and re-append)
    function renderTasks() {
        const categories = { today: [], upcoming: [], completed: [], priority: [] };
        currentTasks.forEach(t => {
            if (t.completed) categories.completed.push(t);
            else if (t.category === 'today') categories.today.push(t);
            else if (t.category === 'upcoming') categories.upcoming.push(t);
            else if (t.priority === 'high') categories.priority.push(t);
        });
        ['today', 'upcoming', 'completed', 'priority'].forEach(cat => {
            const list = document.getElementById(`${cat}List`);
            list.innerHTML = ''; // Clear first
            categories[cat].forEach(t => list.appendChild(createTaskCard(t)));
        });
        makeDraggable();
    }

    function createTaskCard(t) {
        const li = document.createElement('li');
        li.className = 'task-card';
        li.draggable = true;
        li.dataset.id = t.id;
        const badge = t.priority === 'high' ? '<span class="badge priority">High</span>' : '';
        li.innerHTML = `
            <label class="checkbox ${t.completed ? 'checked' : ''}" data-id="${t.id}"></label>
            <div class="task-content">
                <span class="task-text">${t.title} ${badge}</span>
                <span class="task-date">${t.due_date} ${t.time_slot}</span>
            </div>
            <button onclick="editTask(${t.id})" class="edit-btn">✏️</button>
        `;
        return li;
    }

    // Drag-Drop
    function makeDraggable() {
        document.querySelectorAll('.task-list').forEach(list => {
            list.addEventListener('dragover', e => e.preventDefault());
            list.addEventListener('drop', e => {
                e.preventDefault();
                const dragged = document.querySelector('.dragging');
                list.appendChild(dragged);
                const newOrder = Array.from(document.querySelectorAll('.task-card')).map(card => parseInt(card.dataset.id));
                fetch('/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reorder', tasks: newOrder }) });
            });
        });
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('dragstart', () => card.classList.add('dragging'));
            card.addEventListener('dragend', () => card.classList.remove('dragging'));
        });
    }

    // Checkbox Toggle - FIXED
    document.addEventListener('click', async e => {
        if (e.target.classList.contains('checkbox')) {
            const id = parseInt(e.target.dataset.id);
            await fetch('/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', id }) });
            loadTasks(); // Reload to show changes
            if (Notification.permission === 'granted') new Notification('Task Updated!', { body: 'Status changed.' });
        }
    });

    // Modal Add/Edit - FIXED (no duplicate 'task', only 'title')
    const modal = document.getElementById('taskModal');
    document.getElementById('addTaskBtn').addEventListener('click', () => {
        editingId = null;
        document.getElementById('modalTitle').textContent = 'Add Task';
        modal.style.display = 'flex';
    });
    document.getElementById('saveTask').addEventListener('click', saveTask);
    document.getElementById('cancelTask').addEventListener('click', () => modal.style.display = 'none');

    async function saveTask() {
        const reminderSet = document.getElementById('taskReminder').checked;
        const title = document.getElementById('taskTitle').value.trim();
        if (!title) return; // FIXED: No empty add
        const data = {
            action: editingId ? 'edit' : 'add',
            title: title, // FIXED: Only 'title', no duplicate 'task'
            category: document.getElementById('taskCategory').value,
            due_date: document.getElementById('taskDueDate').value,
            time_slot: document.getElementById('taskTimeSlot').value,
            priority: document.getElementById('taskPriority').value,
            reminder_set: reminderSet
        };
        if (editingId) data.id = editingId;
        const response = await fetch('/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (response.ok) {
            modal.style.display = 'none';
            loadTasks(); // FIXED: Reload to show new task immediately
            if (Notification.permission === 'granted') new Notification('Task Saved!', { body: 'Task added with reminder.' });
        } else {
            alert('Error saving task');
        }
    }

    window.editTask = id => {
        editingId = id;
        const t = currentTasks.find(t => t.id === id);
        document.getElementById('modalTitle').textContent = 'Edit Task';
        document.getElementById('taskTitle').value = t.title;
        document.getElementById('taskCategory').value = t.category;
        document.getElementById('taskDueDate').value = t.due_date;
        document.getElementById('taskTimeSlot').value = t.time_slot;
        document.getElementById('taskPriority').value = t.priority;
        document.getElementById('taskReminder').checked = t.reminder_set;
        modal.style.display = 'flex';
    };

    // Search
    document.getElementById('searchInput').addEventListener('input', e => {
        const query = e.target.value.toLowerCase();
        currentTasks = sampleTasks.filter(t => t.title.toLowerCase().includes(query));
        renderTasks();
    });

    // Calendar (same as before)
    function initCalendar() {
        const calendar = document.getElementById('calendar');
        const today = new Date().toISOString().split('T')[0];
        calendar.innerHTML = `
            <div class="calendar-header">
                <button onclick="prevMonth()">‹</button>
                <span id="monthYear">${new Date().toLocaleDateString('en', { month: 'long', year: 'numeric' })}</span>
                <button onclick="nextMonth()">›</button>
            </div>
            <div id="calendarDays" class="calendar-days"></div>
        `;
        renderCalendar(today);
    }
    initCalendar();

    let currentDate = new Date();
    function renderCalendar(dateStr) {
        currentDate = new Date(dateStr);
        document.getElementById('monthYear').textContent = currentDate.toLocaleDateString('en', { month: 'long', year: 'numeric' });
        const days = document.getElementById('calendarDays');
        days.innerHTML = '';
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        for (let i = 0; i < firstDay; i++) days.innerHTML += '<div></div>';
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.textContent = day;
            dayDiv.onclick = () => document.getElementById('taskDueDate').value = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            days.appendChild(dayDiv);
        }
    }
    window.prevMonth = () => renderCalendar(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toISOString().split('T')[0]);
    window.nextMonth = () => renderCalendar(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toISOString().split('T')[0]);

    // Filters
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', e => {
            document.querySelectorAll('.category-item').forEach(i => i.classList.remove('active'));
            e.target.classList.add('active');
            loadTasks();
        });
    });

    // Animated Progress Bar
    function updateProgressBar(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        document.getElementById('tasksToday').textContent = total + ' Tasks Today';
        document.getElementById('completedCount').textContent = completed + ' Completed';
        document.getElementById('progressText').textContent = percentage + '%';
        const fill = document.getElementById('progressFill');
        fill.style.width = '0%';
        setTimeout(() => {
            fill.style.width = percentage + '%';
        }, 10); // Trigger animation
    }

    // Reminders
    function scheduleReminders(tasks) {
        tasks.forEach(t => {
            if (t.reminder_set && !t.completed) {
                const due = new Date(`${t.due_date}T${t.time_slot}`);
                const now = new Date();
                const timeToRemind = due.getTime() - now.getTime() - 5 * 60 * 1000; // 5 min before
                if (timeToRemind > 0) {
                    setTimeout(() => {
                        if (Notification.permission === 'granted') {
                            new Notification('Reminder!', { body: `"${t.title}" is due soon at ${t.time_slot}!` });
                        }
                    }, timeToRemind);
                }
            }
        });
    }

    scheduleReminders(currentTasks);
});