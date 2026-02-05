from flask import Flask, render_template, request, jsonify
import csv
import json
import os
from io import StringIO

app = Flask(__name__)

# Use /tmp for Vercel (serverless), fallback to local for development
DATA_FILE = '/tmp/data.json' if os.environ.get('VERCEL') else 'data.json'

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    # On Vercel, try to load from bundled data.json as initial data
    if os.environ.get('VERCEL') and os.path.exists('data.json'):
        with open('data.json', 'r') as f:
            return json.load(f)
    return {'attendees': [], 'packages': [], 'printed': []}

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/data', methods=['GET'])
def get_data():
    return jsonify(load_data())

@app.route('/api/attendees', methods=['POST'])
def upload_attendees():
    data = load_data()
    
    if 'file' in request.files:
        file = request.files['file']
        content = file.read().decode('utf-8')
        reader = csv.DictReader(StringIO(content))
        
        attendees = []
        for i, row in enumerate(reader):
            # Normalize column names (case-insensitive, strip whitespace)
            normalized = {k.lower().strip(): v.strip() for k, v in row.items()}
            attendees.append({
                'id': i,
                'firstName': normalized.get('first name', normalized.get('firstname', '')),
                'lastName': normalized.get('last name', normalized.get('lastname', '')),
                'tableNumber': normalized.get('table number', normalized.get('tablenumber', normalized.get('table #', normalized.get('table#', normalized.get('table', ''))))),
                'printed': False
            })
        data['attendees'] = attendees
    
    save_data(data)
    return jsonify({'success': True, 'data': data})

@app.route('/api/attendees/update', methods=['POST'])
def update_attendees():
    data = load_data()
    updates = request.json.get('attendees', [])
    data['attendees'] = updates
    save_data(data)
    return jsonify({'success': True, 'data': data})

@app.route('/api/attendees/add', methods=['POST'])
def add_attendee():
    data = load_data()
    new_attendee = request.json
    new_id = max([a['id'] for a in data['attendees']], default=-1) + 1
    new_attendee['id'] = new_id
    new_attendee['printed'] = False
    data['attendees'].append(new_attendee)
    save_data(data)
    return jsonify({'success': True, 'data': data})

@app.route('/api/attendees/clear', methods=['POST'])
def clear_attendees():
    data = load_data()
    data['attendees'] = []
    save_data(data)
    return jsonify({'success': True, 'data': data})

@app.route('/api/attendees/<int:attendee_id>', methods=['DELETE'])
def delete_attendee(attendee_id):
    data = load_data()
    data['attendees'] = [a for a in data['attendees'] if a['id'] != attendee_id]
    save_data(data)
    return jsonify({'success': True, 'data': data})

@app.route('/api/packages', methods=['POST'])
def upload_packages():
    data = load_data()
    
    if 'file' in request.files:
        file = request.files['file']
        content = file.read().decode('utf-8')
        reader = csv.DictReader(StringIO(content))
        
        packages = []
        for i, row in enumerate(reader):
            normalized = {k.lower().strip(): v.strip() for k, v in row.items()}
            packages.append({
                'id': i,
                'name': normalized.get('package name', normalized.get('packagename', normalized.get('name', list(row.values())[0] if row else ''))),
                'printed': False
            })
        data['packages'] = packages
    
    save_data(data)
    return jsonify({'success': True, 'data': data})

@app.route('/api/packages/add', methods=['POST'])
def add_package():
    data = load_data()
    new_package = request.json
    new_id = max([p['id'] for p in data['packages']], default=-1) + 1
    new_package['id'] = new_id
    new_package['printed'] = False
    data['packages'].append(new_package)
    save_data(data)
    return jsonify({'success': True, 'data': data})

@app.route('/api/packages/clear', methods=['POST'])
def clear_packages():
    data = load_data()
    data['packages'] = []
    save_data(data)
    return jsonify({'success': True, 'data': data})

@app.route('/api/packages/<int:package_id>', methods=['DELETE'])
def delete_package(package_id):
    data = load_data()
    data['packages'] = [p for p in data['packages'] if p['id'] != package_id]
    save_data(data)
    return jsonify({'success': True, 'data': data})

@app.route('/api/print', methods=['POST'])
def mark_printed():
    data = load_data()
    print_data = request.json
    
    attendee_id = print_data.get('attendeeId')
    package_ids = print_data.get('packageIds', [])
    
    # Mark attendee as printed
    for attendee in data['attendees']:
        if attendee['id'] == attendee_id:
            attendee['printed'] = True
            break
    
    # Mark packages as printed
    for package in data['packages']:
        if package['id'] in package_ids:
            package['printed'] = True
    
    # Record print history
    data['printed'].append({
        'attendeeId': attendee_id,
        'packageIds': package_ids,
        'timestamp': str(import_datetime())
    })
    
    save_data(data)
    return jsonify({'success': True, 'data': data})

def import_datetime():
    from datetime import datetime
    return datetime.now()

@app.route('/api/reset-status', methods=['POST'])
def reset_status():
    data = load_data()
    reset_data = request.json
    
    if reset_data.get('type') == 'attendee':
        for attendee in data['attendees']:
            if attendee['id'] == reset_data.get('id'):
                attendee['printed'] = False
                break
    elif reset_data.get('type') == 'package':
        for package in data['packages']:
            if package['id'] == reset_data.get('id'):
                package['printed'] = False
                break
    
    save_data(data)
    return jsonify({'success': True, 'data': data})

@app.route('/api/clear-all', methods=['POST'])
def clear_all():
    data = {'attendees': [], 'packages': [], 'printed': []}
    save_data(data)
    return jsonify({'success': True, 'data': data})

if __name__ == '__main__':
    app.run(debug=True, port=5001, host='0.0.0.0')
