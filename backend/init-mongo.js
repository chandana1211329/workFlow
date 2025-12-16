// MongoDB initialization script for Render
db = db.getSiblingDB('document-generator');

// Create application user
db.createUser({
  user: "app_user",
  pwd: "app_password123",
  roles: [
    {
      role: "readWrite",
      db: "document-generator"
    }
  ]
});

// Create initial collections and indexes
db.createCollection("submissions");
db.createCollection("users");

// Create indexes for better performance
db.submissions.createIndex({ "createdAt": 1 });
db.submissions.createIndex({ "email": 1 });
db.users.createIndex({ "email": 1 }, { unique: true });

print("MongoDB initialization completed successfully");
