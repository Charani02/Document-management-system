
CREATE DATABASE IF NOT EXISTS charani_document_management;

USE charani_document_management;

CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(255)
);

CREATE TABLE documents (
    document_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    title VARCHAR(150) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active',

    FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
);

CREATE TABLE document_access (
    access_id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT NOT NULL,
    user_id INT NOT NULL,
    permission VARCHAR(20) DEFAULT 'View',
    granted_date DATETIME DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (document_id, user_id),

    FOREIGN KEY (document_id)
        REFERENCES documents(document_id)
        ON DELETE CASCADE,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);

INSERT INTO categories (category_name, description)
VALUES
('Academic', 'Academic documents'),
('Personal', 'Personal documents'),
('Certificates', 'Educational certificates'),
('Projects', 'Project documents'),
('Other', 'Other documents');
