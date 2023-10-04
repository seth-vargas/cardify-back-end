-- Drop existing tables if they exist
DROP TABLE IF EXISTS favorites,
decks_tags,
cards,
decks,
tags,
follows,
users;

-- Create tables
CREATE TABLE
    users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(25) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email TEXT NOT NULL CHECK (position('@' IN email) > 1),
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT now ()
    );

CREATE TABLE
    decks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(50) NOT NULL,
        slug VARCHAR(255) NOT NULL,
        username TEXT NOT NULL REFERENCES users (username) ON DELETE CASCADE,
        is_public BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT now (),
        UNIQUE (username, title)
    );

CREATE TABLE
    cards (
        id SERIAL PRIMARY KEY,
        deck_id INTEGER NOT NULL REFERENCES decks (id) ON DELETE CASCADE,
        username TEXT NOT NULL REFERENCES users (username) ON DELETE CASCADE,
        front VARCHAR(50) NOT NULL,
        back VARCHAR(100) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT now ()
    );

CREATE TABLE
    tags (
        id SERIAL PRIMARY KEY,
        tag_name VARCHAR(15) UNIQUE NOT NULL
    );

CREATE TABLE
    decks_tags (
        deck_id INTEGER,
        tag_id INTEGER,
        PRIMARY KEY (deck_id, tag_id),
        FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
    );

CREATE TABLE
    favorites (
        user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
        deck_id INTEGER NOT NULL REFERENCES decks (id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT now ()
    );

CREATE TABLE
    follows (
        following_user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
        followed_user_id INTEGER REFERENCES users (id) ON DELETE CASCADE,
        created_at TIMESTAMP NOT NULL DEFAULT now ()
    );

-- Insert data into users table
INSERT INTO
    users (
        username,
        password,
        first_name,
        last_name,
        email,
        is_admin,
        is_public
    )
VALUES
    (
        'user1',
        'password1',
        'John',
        'Smith',
        'john@example.com',
        true,
        true
    ),
    (
        'user2',
        'password2',
        'Jane',
        'Doe',
        'jane@example.com',
        false,
        false
    ),
    (
        'admin1',
        'adminpass',
        'Admin',
        'User',
        'admin@example.com',
        true,
        true
    );

-- Insert data into decks table
INSERT INTO
    decks (title, slug, username, is_public)
VALUES
    (
        'Programming Basics',
        'programming-basics',
        'user1',
        true
    ),
    ('Science Trivia', 'science-trivia', 'user2', true),
    ('Math Quiz', 'math-quiz', 'user1', false);

-- Insert data into cards table for Programming Basics (Deck ID: 1)
INSERT INTO
    cards (deck_id, username, front, back)
VALUES
    (
        1,
        'user1',
        'What is a variable?',
        'A storage location with a name and a value.'
    ),
    (
        1,
        'user1',
        'What is a loop?',
        'A control structure for repeating a block of code.'
    ),
    (
        1,
        'user1',
        'What is an array?',
        'A data structure that stores a collection of elements.'
    ),
    (
        1,
        'user1',
        'What is a function?',
        'A reusable block of code that performs a specific task.'
    ),
    (
        1,
        'user1',
        'What is OOP?',
        'Object-Oriented Programming is a programming paradigm based on objects.'
    );

-- Insert data into cards table for Science Trivia (Deck ID: 2)
INSERT INTO
    cards (deck_id, username, front, back)
VALUES
    (
        2,
        'user2',
        'Who discovered penicillin?',
        'Alexander Fleming.'
    ),
    (
        2,
        'user2',
        'What is the chemical symbol for water?',
        'H2O'
    ),
    (
        2,
        'user2',
        'What is the largest planet in our solar system?',
        'Jupiter'
    ),
    (
        2,
        'user2',
        'What is the speed of light?',
        '299,792,458 meters per second'
    ),
    (
        2,
        'user2',
        'What is photosynthesis?',
        'The process by which plants convert sunlight into energy.'
    );

-- Insert data into cards table for Math Quiz (Deck ID: 3)
INSERT INTO
    cards (deck_id, username, front, back)
VALUES
    (3, 'user1', 'What is 2 + 2?', '4'),
    (3, 'user1', 'What is the square root of 16?', '4'),
    (
        3,
        'user1',
        'What is the value of π (pi)?',
        '3.14159265359'
    ),
    (
        3,
        'user1',
        'What is the area formula for a rectangle?',
        'Length x Width'
    ),
    (
        3,
        'user1',
        'What is the Pythagorean theorem?',
        'a^2 + b^2 = c^2'
    );

-- Insert data into tags table
INSERT INTO
    tags (tag_name)
VALUES
    ('Programming'),
    ('Science'),
    ('Math');

-- Insert data into decks_tags table
INSERT INTO
    decks_tags (deck_id, tag_id)
VALUES
    (1, 1),
    (2, 2),
    (3, 3);

-- Insert data into favorites table
INSERT INTO
    favorites (user_id, deck_id)
VALUES
    (1, 2),
    (2, 1),
    (1, 3);

-- Insert data into follows table
INSERT INTO
    follows (following_user_id, followed_user_id)
VALUES
    (1, 2),
    (2, 1);