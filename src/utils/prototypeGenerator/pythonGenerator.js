export function generatePython(table, allTables) {
  const fields = table.fields || [];
  const primaryKeyField = fields.find((f) => f.primary) || fields[0];
  const port = 5000 + (allTables.findIndex((t) => t.id === table.id) + 1);
  
  return `#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auto-generated Flask API for ${table.name} table
Prototype Verification Server
"""

import json
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DATA_FILE = os.path.join(os.path.dirname(__file__), '${table.name}.json')
TABLE_NAME = '${table.name}'
PRIMARY_KEY = '${primaryKeyField ? primaryKeyField.name : fields[0]?.name || 'id'}'
PORT = ${port}
FIELDS = [
${fields.map((f) => `    '${f.name}',`).join('\n')}
]

def load_data():
    """Load data from JSON file"""
    if not os.path.exists(DATA_FILE):
        return []
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            if isinstance(data, dict) and TABLE_NAME in data:
                return data.get(TABLE_NAME, [])
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, IOError):
        return []

def save_data(data):
    """Save data to JSON file"""
    try:
        with open(DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump({TABLE_NAME: data}, f, indent=2, ensure_ascii=False)
        return True
    except IOError:
        return False

def get_next_id(data):
    """Get next ID for auto-increment"""
    if not data:
        return 1
    try:
        max_id = max(int(item.get(PRIMARY_KEY, 0)) for item in data if item.get(PRIMARY_KEY))
        return max_id + 1
    except (ValueError, TypeError):
        return 1

def validate_record(record, is_update=False):
    """Validate incoming record data"""
    errors = []
    
    # Check required fields (not null, unless it's an update with partial data)
${fields.filter(f => f.notNull && !f.primary).map((f) => `    if not is_update and '${f.name}' not in record:
        errors.append('Field "${f.name}" is required')
`).join('')}
    
    # Type validation
${fields.map((f) => {
  const typeLower = (f.type || '').toLowerCase();
  if (typeLower.includes('int')) {
    return `    if '${f.name}' in record and record['${f.name}'] not in (None, ''):
        try:
            record['${f.name}'] = int(record['${f.name}'])
        except (ValueError, TypeError):
            errors.append('Field "${f.name}" must be an integer')
`;
  }
  if (typeLower.includes('float') || typeLower.includes('double') || typeLower.includes('decimal') || typeLower.includes('numeric')) {
    return `    if '${f.name}' in record and record['${f.name}'] not in (None, ''):
        try:
            record['${f.name}'] = float(record['${f.name}'])
        except (ValueError, TypeError):
            errors.append('Field "${f.name}" must be a number')
`;
  }
  return '';
}).join('')}
    
    return record, errors

@app.route(f'/api/{TABLE_NAME}', methods=['GET'])
def get_all():
    """Get all records"""
    data = load_data()
    return jsonify(data)

@app.route(f'/api/{TABLE_NAME}/<id_value>', methods=['GET'])
def get_one(id_value):
    """Get single record by ID"""
    data = load_data()
    
    # Try to match as integer first, then string
    try:
        id_int = int(id_value)
        record = next((item for item in data if str(item.get(PRIMARY_KEY)) == str(id_int)), None)
    except ValueError:
        record = next((item for item in data if str(item.get(PRIMARY_KEY)) == str(id_value)), None)
    
    if record is None:
        return jsonify({'error': 'Record not found'}), 404
    
    return jsonify(record)

@app.route(f'/api/{TABLE_NAME}', methods=['POST'])
def create():
    """Create new record"""
    data = load_data()
    
    try:
        new_record = request.get_json() if request.is_json else request.form.to_dict()
    except Exception:
        return jsonify({'error': 'Invalid JSON'}), 400
    
    # Validate
    new_record, errors = validate_record(new_record, is_update=False)
    if errors:
        return jsonify({'error': errors[0]}), 400
    
    # Handle auto-increment primary key
${primaryKeyField?.increment ? `    if PRIMARY_KEY not in new_record or not new_record[PRIMARY_KEY]:
        new_record[PRIMARY_KEY] = get_next_id(data)
    else:
        # Check if ID already exists
        try:
            existing = next((item for item in data if str(item.get(PRIMARY_KEY)) == str(new_record[PRIMARY_KEY])), None)
            if existing:
                return jsonify({'error': f'Record with {PRIMARY_KEY} = {new_record[PRIMARY_KEY]} already exists'}), 400
        except Exception:
            pass
` : `    # Check if primary key is provided and unique
    if PRIMARY_KEY not in new_record:
        return jsonify({'error': f'Field "{PRIMARY_KEY}" is required'}), 400
    
    existing = next((item for item in data if str(item.get(PRIMARY_KEY)) == str(new_record[PRIMARY_KEY])), None)
    if existing:
        return jsonify({'error': f'Record with {PRIMARY_KEY} = {new_record[PRIMARY_KEY]} already exists'}), 400
`}
    
    data.append(new_record)
    
    if save_data(data):
        return jsonify(new_record), 201
    else:
        return jsonify({'error': 'Failed to save data'}), 500

@app.route(f'/api/{TABLE_NAME}/<id_value>', methods=['PUT'])
def update(id_value):
    """Update record by ID"""
    data = load_data()
    
    # Find record
    try:
        id_int = int(id_value)
        record_index = next((i for i, item in enumerate(data) if str(item.get(PRIMARY_KEY)) == str(id_int)), -1)
    except ValueError:
        record_index = next((i for i, item in enumerate(data) if str(item.get(PRIMARY_KEY)) == str(id_value)), -1)
    
    if record_index == -1:
        return jsonify({'error': 'Record not found'}), 404
    
    try:
        update_data = request.get_json() if request.is_json else request.form.to_dict()
    except Exception:
        return jsonify({'error': 'Invalid JSON'}), 400
    
    # Validate
    update_data, errors = validate_record(update_data, is_update=True)
    if errors:
        return jsonify({'error': errors[0]}), 400
    
    # Don't allow changing primary key
    if PRIMARY_KEY in update_data:
        del update_data[PRIMARY_KEY]
    
    # Apply updates
    data[record_index].update(update_data)
    
    if save_data(data):
        return jsonify(data[record_index])
    else:
        return jsonify({'error': 'Failed to save data'}), 500

@app.route(f'/api/{TABLE_NAME}/<id_value>', methods=['DELETE'])
def delete(id_value):
    """Delete record by ID"""
    data = load_data()
    
    # Find record
    try:
        id_int = int(id_value)
        record_index = next((i for i, item in enumerate(data) if str(item.get(PRIMARY_KEY)) == str(id_int)), -1)
    except ValueError:
        record_index = next((i for i, item in enumerate(data) if str(item.get(PRIMARY_KEY)) == str(id_value)), -1)
    
    if record_index == -1:
        return jsonify({'error': 'Record not found'}), 404
    
    deleted_record = data.pop(record_index)
    
    if save_data(data):
        return jsonify({'message': 'Record deleted successfully', 'record': deleted_record})
    else:
        return jsonify({'error': 'Failed to save data'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'table': TABLE_NAME,
        'primary_key': PRIMARY_KEY,
        'fields': FIELDS,
        'data_file': DATA_FILE,
        'port': PORT
    })

@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API info"""
    return jsonify({
        'message': f'{TABLE_NAME} API Server',
        'port': PORT,
        'endpoints': {
            'GET': [
                f'/api/{TABLE_NAME}',
                f'/api/{TABLE_NAME}/<id>',
                '/api/health'
            ],
            'POST': [
                f'/api/{TABLE_NAME}'
            ],
            'PUT': [
                f'/api/{TABLE_NAME}/<id>'
            ],
            'DELETE': [
                f'/api/{TABLE_NAME}/<id>'
            ]
        }
    })

if __name__ == '__main__':
    # Initialize data file if it doesn't exist
    if not os.path.exists(DATA_FILE):
        save_data([])
    
    print('========================================')
    print(f'  {TABLE_NAME} API Server')
    print('========================================')
    print(f'Port: {PORT}')
    print(f'Table: {TABLE_NAME}')
    print(f'Primary Key: {PRIMARY_KEY}')
    print(f'Data File: {DATA_FILE}')
    print('========================================')
    print('Available endpoints:')
    print(f'  GET    /api/{TABLE_NAME}         - Get all records')
    print(f'  GET    /api/{TABLE_NAME}/<id>    - Get single record')
    print(f'  POST   /api/{TABLE_NAME}         - Create new record')
    print(f'  PUT    /api/{TABLE_NAME}/<id>    - Update record')
    print(f'  DELETE /api/{TABLE_NAME}/<id>    - Delete record')
    print(f'  GET    /api/health                 - Health check')
    print('========================================')
    print(f'Server running at: http://localhost:{PORT}')
    print(f'Open ${table.name}.html in your browser to use the UI')
    print('========================================')
    
    app.run(host='0.0.0.0', port=PORT, debug=True)
`;
}
