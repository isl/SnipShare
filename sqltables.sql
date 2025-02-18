-- Table: comments
CREATE TABLE comments (
    comment_id INT AUTO_INCREMENT PRIMARY KEY,
    snip_id INT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: images
CREATE TABLE images (
    image_id INT AUTO_INCREMENT PRIMARY KEY,
    snip_id INT,
    image_data LONGBLOB
);

-- Table: snip
CREATE TABLE snip (
    snip_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    snip TEXT,
    language VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table: sniptag
CREATE TABLE sniptag (
    snip_id INT,
    tag_id INT,
    PRIMARY KEY (snip_id, tag_id)
);

-- Table: tags
CREATE TABLE tags (
    tag_id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(255)
);

-- Table: url
CREATE TABLE url (
    url_id INT AUTO_INCREMENT PRIMARY KEY,
    snip_id INT,
    url_link VARCHAR(2083)
);
