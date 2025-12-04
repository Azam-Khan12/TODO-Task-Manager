# Flask Backend for Ultra-Modern GUI TODO App
# Yeh ek complete web-based GUI TODO app hai! Backend Flask (Python) mein hai, jo tasks ko JSON file mein save karta hai.
# Frontend HTML/CSS/JS mein hai with futuristic, minimal UI – glassmorphism, gradients, neon glows, smooth animations, parallax, etc.
# Run karne ke liye: pip install flask (agar nahi hai), phir `python app.py` run karo. Browser mein http://127.0.0.1:5000/ kholo.
# Features: Add task, view list with animations, complete/delete with micro-interactions. Responsive & cinematic feel!

from flask import Flask, render_template, request, jsonify
import json
import os
from datetime import datetime

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
        if data['action'] == 'add':
            task = data['task']
            date = datetime.now().strftime("%Y-%m-%d")
            tasks.append({"task": task, "date": date, "completed": False})
            save_tasks(tasks)
            return jsonify({"tasks": tasks})
        elif data['action'] == 'complete':
            idx = data['index']
            if 0 <= idx < len(tasks):
                tasks[idx]["completed"] = not tasks[idx]["completed"]
                save_tasks(tasks)
            return jsonify({"tasks": tasks})
        elif data['action'] == 'delete':
            idx = data['index']
            if 0 <= idx < len(tasks):
                tasks.pop(idx)
                save_tasks(tasks)
            return jsonify({"tasks": tasks})
    return jsonify({"tasks": tasks})

if __name__ == '__main__':
    app.run(debug=True , host='0.0.0.0')