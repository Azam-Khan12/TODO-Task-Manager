// Modern JS for TODO Interactions - Smooth Animations, API Calls + Offline Support + Mobile Fixes + Stack UI
document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');

    // Load initial tasks
    loadTasks();

    // Add task
    addBtn.addEventListener('click', () => addTask());
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });
    // Mobile touch support for add button
    addBtn.addEventListener('touchstart', (e) => { e.preventDefault(); addTask(); });

    async function addTask() {
        const task = taskInput.value.trim();
        if (!task) return;
        let tasks;
        if (navigator.onLine) {
            // Online: Use API
            const response = await fetch('/tasks', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ action: 'add', task }) 
            });
            const data = await response.json();
            tasks = data.tasks;
            // Sync localStorage
            localStorage.setItem('tasks', JSON.stringify(tasks));
        } else {
            // Offline: Local Storage
            tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const date = new Date().toISOString().split('T')[0];
            tasks.push({task, date, completed: false});
            localStorage.setItem('tasks', JSON.stringify(tasks));
        }
        renderTasks(tasks);
        taskInput.value = '';
        // Stack animation trigger on new task
        if (taskList.lastElementChild) {
            taskList.lastElementChild.classList.add('stack-slide');
            setTimeout(() => taskList.lastElementChild.classList.remove('stack-slide'), 400);
        }
        // Micro-interaction on button
        addBtn.style.transform = 'scale(0.95)'; 
        setTimeout(() => addBtn.style.transform = '', 150);
    }

    // Load tasks
    async function loadTasks() {
        if (navigator.onLine) {
            try {
                const response = await fetch('/tasks');
                const data = await response.json();
                // Sync localStorage with server
                localStorage.setItem('tasks', JSON.stringify(data.tasks));
                renderTasks(data.tasks);
            } catch (e) {
                // Fallback to local
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

    // Render tasks with animations
    function renderTasks(tasks) {
        taskList.innerHTML = '';
        tasks.forEach((t, index) => {
            const li = document.createElement('li');
            li.className = `task-item ${t.completed ? 'completed' : ''}`;
            li.style.setProperty('--order', index);
            li.innerHTML = `
                <div>
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
        // Parallax on scroll
        let scrollHandler = () => {
            document.querySelectorAll('.float-orb').forEach(orb => {
                const speed = orb.classList.contains('orb1') ? 0.5 : orb.classList.contains('orb2') ? 0.3 : 0.7;
                orb.style.transform = `translateY(${window.scrollY * speed}px)`;
            });
        };
        window.removeEventListener('scroll', scrollHandler); // Avoid duplicates
        window.addEventListener('scroll', scrollHandler);
        // Update enhanced counter
        updateCounter(tasks);
    }

    // Enhanced Counter: Pending / Total Completed
    function updateCounter(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        taskCount.innerHTML = `<span class="pending">${pending}</span> / ${total} <span class="completed">${completed}</span>`;
    }

    // Toggle/Delete with event delegation (better for dynamic list, mobile touch)
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

    // Mobile touch support for buttons
    taskList.addEventListener('touchstart', (e) => {
        e.preventDefault(); // Prevent scroll on touch
        const btn = e.target.closest('.complete-btn, .delete-btn');
        if (!btn) return;
        const index = parseInt(btn.dataset.index);
        if (btn.classList.contains('complete-btn')) {
            toggleTask(index);
        } else if (btn.classList.contains('delete-btn')) {
            deleteTask(index);
        }
    });

    // Toggle complete (online/offline)
    window.toggleTask = async (index) => {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        if (0 <= index < tasks.length) {
            tasks[index].completed = !tasks[index].completed;
            localStorage.setItem('tasks', JSON.stringify(tasks));
            if (navigator.onLine) {
                await fetch('/tasks', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ action: 'complete', index }) 
                });
            }
            renderTasks(tasks);
        }
    };

    // Delete task (online/offline)
    window.deleteTask = async (index) => {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        if (0 <= index < tasks.length) {
            tasks.splice(index, 1);
            localStorage.setItem('tasks', JSON.stringify(tasks));
            if (navigator.onLine) {
                await fetch('/tasks', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ action: 'delete', index }) 
                });
            }
            renderTasks(tasks);
        }
    };

    // Online/offline sync events
    window.addEventListener('online', loadTasks);
    window.addEventListener('offline', loadFromLocal);
});