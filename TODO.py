from flask import Flask, render_template, request, jsonify
import json, os
from datetime import datetime, date
from dateutil import parser  # pip install python-dateutil

app = Flask(__name__)
TASKS_FILE = 'tasks.json'

def load_tasks():
    if os.path.exists(TASKS_FILE):
        with open(TASKS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    return []

def save_tasks(tasks):
    with open(TASKS_FILE, 'w', encoding='utf-8') as f:
        json.dump(tasks, f, indent=2, ensure_ascii=False)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/tasks', methods=['GET', 'POST'])
def tasks():
    tasks = load_tasks()
    if request.method == 'POST':
        data = request.json
        action = data['action']
        if action == 'add':
            task = {
                'id': len(tasks) + 1,
                'title': data['title'],
                'category': data['category'],
                'due_date': data['due_date'],
                'time_slot': data['time_slot'],
                'completed': False,
                'priority': data['priority'],
                'reminder_set': data.get('reminder_set', False)
            }
            tasks.append(task)
            save_tasks(tasks)
            return jsonify({'tasks': tasks})
        elif action == 'edit':
            idx = next(i for i, t in enumerate(tasks) if t['id'] == data['id'])
            tasks[idx].update(data)
            save_tasks(tasks)
            return jsonify({'tasks': tasks})
        elif action == 'delete':
            tasks = [t for t in tasks if t['id'] != data['id']]
            save_tasks(tasks)
            return jsonify({'tasks': tasks})
        elif action == 'toggle':
            idx = next(i for i, t in enumerate(tasks) if t['id'] == data['id'])
            tasks[idx]['completed'] = not tasks[idx]['completed']
            save_tasks(tasks)
            return jsonify({'tasks': tasks})
        elif action == 'reorder':
            tasks[:] = data['tasks']
            save_tasks(tasks)
            return jsonify({'tasks': tasks})
    return jsonify({'tasks': tasks})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)