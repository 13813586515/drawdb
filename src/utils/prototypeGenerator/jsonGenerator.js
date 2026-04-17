export function generateJSON(table) {
  const tableName = table.name;
  const fields = table.fields || [];
  
  const sampleData = generateSampleData(table);
  
  const result = {
    [tableName]: sampleData,
    "_meta": {
      "table_name": tableName,
      "fields": fields.map((f) => ({
        name: f.name,
        type: f.type,
        primary: f.primary || false,
        unique: f.unique || false,
        notNull: f.notNull || false,
        increment: f.increment || false,
        default: f.default,
        comment: f.comment,
      })),
      "generated_at": new Date().toISOString(),
      "version": "1.0",
    }
  };
  
  return JSON.stringify(result, null, 2);
}

function generateSampleData(table) {
  const fields = table.fields || [];
  
  const sampleData = [];
  
  for (let i = 1; i <= 3; i++) {
    const record = {};
    
    fields.forEach((field) => {
      if (field.primary && field.increment) {
        record[field.name] = i;
      } else if (field.primary) {
        record[field.name] = generateSampleValue(field, i);
      } else {
        record[field.name] = generateSampleValue(field, i);
      }
    });
    
    sampleData.push(record);
  }
  
  return sampleData;
}

function generateSampleValue(field, index) {
  const fieldName = field.name.toLowerCase();
  const fieldType = (field.type || "").toLowerCase();
  
  if (field.default && field.default !== "") {
    return field.default;
  }
  
  if (fieldName.includes("name") || fieldName.includes("title")) {
    return `Sample ${field.name} ${index}`;
  }
  
  if (fieldName.includes("email")) {
    return `user${index}@example.com`;
  }
  
  if (fieldName.includes("phone") || fieldName.includes("mobile")) {
    return `1380000${String(1000 + index).padStart(4, '0')}`;
  }
  
  if (fieldName.includes("address")) {
    return `Sample Address ${index}, City, Country`;
  }
  
  if (fieldName.includes("description") || fieldName.includes("note") || fieldName.includes("comment")) {
    return `This is a sample description for record ${index}.`;
  }
  
  if (fieldName.includes("status")) {
    const statuses = ["active", "inactive", "pending"];
    return statuses[index % statuses.length];
  }
  
  if (fieldName.includes("type") || fieldName.includes("category")) {
    const types = ["type_a", "type_b", "type_c"];
    return types[index % types.length];
  }
  
  if (fieldType.includes("int") || fieldType.includes("number")) {
    return index * 10;
  }
  
  if (fieldType.includes("float") || fieldType.includes("double") || fieldType.includes("decimal")) {
    return index * 10.5;
  }
  
  if (fieldType.includes("bool")) {
    return index % 2 === 0;
  }
  
  if (fieldType.includes("date") && !fieldType.includes("time")) {
    const today = new Date();
    today.setDate(today.getDate() - index);
    return today.toISOString().split('T')[0];
  }
  
  if (fieldType.includes("datetime") || fieldType.includes("timestamp")) {
    const today = new Date();
    today.setDate(today.getDate() - index);
    return today.toISOString();
  }
  
  return `Value ${index}`;
}
