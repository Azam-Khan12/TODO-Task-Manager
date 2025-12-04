// Full JS - Bug Fixes (Add/Toggle/Delete Working), Counter Fixed, Past Section Demo
document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');
    const pastList = document.getElementById('pastList');
    const taskCount = document.createElement('div');
    taskCount.id = 'taskCount';
    document.querySelector('.section-header').appendChild(taskCount); // Add counter to header

    // Demo past activities (like screenshot)
    const demoPast = [
        { task: 'Stikom Library Project', date: '5 Mon', status: 'missed', icon: '📚' },
        { task: 'Design Thinking Workshop', date: '5 Mon', status: 'success', icon: '💡' }
    ];
    renderPast(demoPast);

    // Load tasks
    loadTasks();

    // Add task
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    addBtn.addEventListener('touchstart', (e) => { e.preventDefault(); addTask(); });

    async function addTask() {
        const task = taskInput.value.trim();
        if (!task) return;
        let tasks;
        if (navigator.onLine) {
            const response = await fetch('/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add', task }) });
            const data = await response.json();
            tasks = data.tasks;
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } else {
            tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const date = new Date().toISOString().split('T')[0];
            tasks.push({task, date, completed: false});
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
        renderTasks(tasks);
        taskInput.value = '';
        // Stack animation
        const newItem = taskList.lastElementChild;
        if (newItem) {
            newItem.classList.add('stack-slide');
            setTimeout(() => newItem.classList.remove('stack-slide'), 400);
        }
        // Micro-interaction
        addBtn.style.transform = 'scale(0.95)';
        setTimeout(() => addBtn.style.transform = '', 150);
    }

    async function loadTasks() {
        if (navigator.onLine) {
            try {
                const response = await fetch('/tasks');
                const data = await response.json();
                localStorage.setItem('tasks', JSON.stringify(data.tasks));
                renderTasks(data.tasks);
            } catch (e) {
                loadFromLocal();
            }
        } else {
            loadFromLocal();
        }
    }

    function loadFromLocal() {
        const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        renderTasks(tasks);
    }

    // Render current tasks
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        tasks.forEach((t, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${t.completed ? 'completed' : ''}`;
            li.style.setProperty('--order', index);
            const icon = getIcon(t.task); // Auto icon
            li.innerHTML = `
                <span class="icon">${icon}</span>
                <div class="task-content">
                    <span class="task-text">${t.task}</span>
                    <span class="task-date">${t.date}</span>
                </div>
                <div>
                    <button class="complete-btn" data-index="${index}">Toggle</button>
                    <button class="delete-btn" data-index="${index}">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
        });
        updateCounter(tasks);
    }

    // Render past (demo)
    function renderPast(past) {
        pastList.innerHTML = '';
        past.forEach(p => {
            const li = document.createElement('li');
            li.className = 'past-item';
            li.innerHTML = `
                <span class="icon">${p.icon}</span>
                <div class="task-content">
                    <span class="task-text">${p.task}</span>
                    <span class="task-date">${p.date}</span>
                </div>
                <span class="status ${p.status}">${p.status.charAt(0).toUpperCase() + p.status.slice(1)}</span>
            `;
            pastList.appendChild(li);
        });
    }

    // Auto icon based on task
    function getIcon(task) {
        if (task.toLowerCase().includes('project') || task.toLowerCase().includes('school')) return '📋';
        if (task.toLowerCase().includes('meeting') || task.toLowerCase().includes('sir')) return '👤';
        if (task.toLowerCase().includes('bank') || task.toLowerCase().includes('office')) return '🏦';
        return '📝';
    }

    // Fixed Counter - No Glitch
    function updateCounter(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        taskCount.innerHTML = `<span class="pending">${pending}</span> / <span class="completed">${completed}</span>`;
    }

    // Event delegation for toggle/delete (fixed for dynamic list)
    taskList.addEventListener('click', async (e) => {
        const btn = e.target.closest('.complete-btn, .delete-btn');
        if (!btn) return;
        const index = parseInt(btn.dataset.index);
        if (btn.classList.contains('complete-btn')) {
            await toggleTask(index);
        } else if (btn.classList.contains('delete-btn')) {
            await deleteTask(index);
        }
    });

    taskList.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const btn = e.target.closest('.complete-btn, .delete-btn');
        if (!btn) return;
        const index = parseInt(btn.dataset.index);
        if (btn.classList.contains('complete-btn')) {
            toggleTask(index);
        } else if (btn.classList.contains('delete-btn')) {
            deleteTask(index);
        }
    });

    async function toggleTask(index) {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        if (0 <= index < tasks.length) {
            tasks[index].completed = !tasks[index].completed;
            localStorage.setItem('tasks', JSON.stringify(tasks));
            if (navigator.onLine) {
                await fetch('/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete', index }) });
            }
            renderTasks(tasks);
        }
    }

    async function deleteTask(index) {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        if (0 <= index < tasks.length) {
            tasks.splice(index, 1);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            if (navigator.onLine) {
                await fetch('/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', index }) });
            }
            renderTasks(tasks);
        }
    }

    // Parallax & Sync
    window.addEventListener('scroll', () => {
        document.querySelectorAll('.float-orb').forEach(orb => {
            const speed = orb.classList.contains('orb1') ? 0.5 : orb.classList.contains('orb2') ? 0.3 : 0.7;
            orb.style.transform = `translateY(${window.scrollY * speed}px)`;
        });
    });
    window.addEventListener('online', loadTasks);
    window.addEventListener('offline', loadFromLocal);
});