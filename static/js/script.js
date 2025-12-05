// Data Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let searchQuery = '';

// Clean invalid tasks on load (fix for undefined text)
tasks = tasks.filter(task => task && task.text && typeof task.text === 'string');

// DOM Elements
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const taskCount = document.getElementById('taskCount');
const fab = document.getElementById('fab');
const inputContainer = document.getElementById('inputContainer');
const taskInput = document.getElementById('taskInput');
const addBtn = document.getElementById('addBtn');
const searchBar = document.getElementById('searchBar');
const filterBtns = document.querySelectorAll('.filter-btn');

// Debug: Check if elements loaded
console.log('JS Loaded! Elements:', { taskInput, addBtn, taskList });

if (addBtn) {
    addBtn.addEventListener('click', addTask);
    console.log('Add button listener attached');
} else {
    console.error('Add button not found!');
}

if (taskInput) {
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
} 

taskInput.addEventListener('blur', () => {
    setTimeout(() => inputContainer.classList.remove('show'), 200);
});

if (searchBar) {
    searchBar.addEventListener('input', filterTasks);
}

filterBtns.forEach(btn => btn.addEventListener('click', (e) => {
    filterBtns.forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    currentFilter = e.target.dataset.filter;
    renderTasks();
}));

if (fab) {
    fab.addEventListener('click', () => {
        inputContainer.classList.add('show');
        taskInput.focus();
        console.log('FAB clicked, input shown');
    });
}

// Functions
function addTask() {
    console.log('addTask called! Input value:', taskInput.value);
    const text = taskInput.value.trim();
    if (!text) {
        console.warn('Empty task, ignoring');
        return;
    }

    const task = {
        id: Date.now(),
        text: text,
        completed: false
    };

    tasks.unshift(task);
    console.log('New task added:', task);
    saveTasks();
    renderTasks();
    taskInput.value = '';
    inputContainer.classList.remove('show');
    console.log('Task added, rendered. Total tasks now:', tasks.length);
}

function editTask(id, newText) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.text = newText.trim();
        saveTasks();
        renderTasks();
    }
}

function toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

function deleteTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index > -1) {
        const card = document.querySelector(`[data-id="${id}"]`);
        if (card) card.classList.add('fade-out');
        setTimeout(() => {
            tasks.splice(index, 1);
            saveTasks();
            renderTasks();
        }, 300);
    }
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    console.log('Saved to localStorage:', tasks);
}

function filterTasks() {
    searchQuery = searchBar ? searchBar.value.toLowerCase() : '';
    renderTasks();
}

function renderTasks() {
    console.log('Rendering tasks. Filter:', currentFilter, 'Search:', searchQuery, 'All tasks:', tasks);
    const filteredTasks = tasks.filter(task => {
        if (!task || !task.text || typeof task.text !== 'string') return false; // Safety check
        const matchesFilter = currentFilter === 'all' || 
            (currentFilter === 'active' && !task.completed) || 
            (currentFilter === 'completed' && task.completed);
        const matchesSearch = task.text.toLowerCase().includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    taskList.innerHTML = filteredTasks.map(task => `
        <div class="task-card ${task.completed ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-content">
                <input type="checkbox" class="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleComplete(${task.id})">
                <div class="task-text" contenteditable="false" ondblclick="this.contenteditable=true; this.focus()" onblur="editTask(${task.id}, this.textContent); this.contenteditable=false;">${task.text}</div>
                <div class="actions">
                    <button class="action-btn edit-btn" onclick="document.querySelector('[data-id=\"${task.id}\"] .task-text').focus(); document.querySelector('[data-id=\"${task.id}\"] .task-text').contenteditable=true;">✏️</button>
                    <button class="action-btn delete-btn" onclick="deleteTask(${task.id})">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');

    updateTaskCount(filteredTasks.length);
    toggleEmptyState(filteredTasks.length === 0);
    
    // Bug fix: Force hide empty state if tasks present
    if (filteredTasks.length > 0) {
        emptyState.classList.remove('show');
        console.log('Empty state hidden');
    } else {
        emptyState.classList.add('show');
        console.log('Empty state shown');
    }
}

function updateTaskCount(count) {
    taskCount.textContent = `Total Tasks: ${count}`;
}

function toggleEmptyState(show) {
    emptyState.classList.toggle('show', show);
}

// Initialize
console.log('Initializing app...');
renderTasks();
console.log('Init complete. Initial tasks:', tasks);