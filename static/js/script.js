// Modern JS for TODO Interactions - Smooth Animations, API Calls + Offline Support
document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('taskInput');
    const addBtn = document.getElementById('addBtn');
    const taskList = document.getElementById('taskList');
    const taskCount = document.getElementById('taskCount');

    // Load tasks (online or offline)
    loadTasks();

    // Add task
    addBtn.addEventListener('click', () => addTask());
    taskInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTask(); });

    async function addTask() {
        const task = taskInput.value.trim();
        if (!task) return;
        if (navigator.onLine) {
            // Online: Use API
            const response = await fetch('/tasks', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ action: 'add', task }) 
            });
            const data = await response.json();
            renderTasks(data.tasks);
        } else {
            // Offline: Local Storage
            let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
            const date = new Date().toISOString().split('T')[0];
            tasks.push({task, date, completed: false});
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks(tasks);
        }
        taskInput.value = '';
        addBtn.style.transform = 'scale(0.95)'; 
        setTimeout(() => addBtn.style.transform = '', 150); // Micro-interaction
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
        taskCount.textContent = tasks.length;
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
                    <button class="complete-btn" onclick="toggleTask(${index})">Toggle</button>
                    <button class="delete-btn" onclick="deleteTask(${index})">Delete</button>
                </div>
            `;
            taskList.appendChild(li);
        });
        // Parallax on scroll
        window.addEventListener('scroll', () => {
            document.querySelectorAll('.float-orb').forEach(orb => {
                const speed = orb.classList.contains('orb1') ? 0.5 : orb.classList.contains('orb2') ? 0.3 : 0.7;
                orb.style.transform = `translateY(${window.scrollY * speed}px)`;
            });
        });
    }

    // Toggle complete (online/offline)
    window.toggleTask = async (index) => {
        let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
        if (0 <= index < tasks.length) {
            tasks[index].completed = !tasks[index].completed;
            localStorage.setItem('tasks', JSON.stringify(tasks));
            if (navigator.onLine) {
                await fetch('/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'complete', index }) });
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
                await fetch('/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', index }) });
            }
            renderTasks(tasks);
        }
    };

    // Online status change sync
    window.addEventListener('online', loadTasks);
    window.addEventListener('offline', loadFromLocal);
});