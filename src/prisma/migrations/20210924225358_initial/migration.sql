-- Test Suite for migration.sql
-- Verifying Article table schema for readingTime computed field support

-- Test 1: Verify Article table exists
DO $$
BEGIN
    ASSERT (SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Article'
    )), 'Article table must exist';
END $$;

-- Test 2: Verify Article table has body column
DO $$
BEGIN
    ASSERT (SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Article' 
        AND column_name = 'body'
    )), 'Article table must have body column';
END $$;

-- Test 3: Verify body column is of type TEXT
DO $$
BEGIN
    ASSERT (SELECT data_type = 'text' 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Article' 
        AND column_name = 'body'
    ), 'Article body column must be of type TEXT';
END $$;

-- Test 4: Verify body column is NOT NULL
DO $$
BEGIN
    ASSERT (SELECT is_nullable = 'NO' 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Article' 
        AND column_name = 'body'
    ), 'Article body column must be NOT NULL';
END $$;

-- Test 5: Verify Article table can store large text for word count calculation
DO $$
DECLARE
    test_user_id INTEGER;
    test_article_id INTEGER;
    large_body TEXT;
BEGIN
    -- Create test user
    INSERT INTO "User" (email, username, password) 
    VALUES ('test@test.com', 'testuser', 'password123') 
    RETURNING id INTO test_user_id;
    
    -- Generate large body text (approximately 10000 words)
    large_body := REPEAT('word ', 10000);
    
    -- Insert article with large body
    INSERT INTO "Article" (slug, title, description, body, "authorId") 
    VALUES ('test-slug', 'Test Title', 'Test Description', large_body, test_user_id)
    RETURNING id INTO test_article_id;
    
    -- Verify article was inserted
    ASSERT (SELECT COUNT(*) FROM "Article" WHERE id = test_article_id) = 1, 
        'Article with large body must be insertable';
    
    -- Verify body length
    ASSERT (SELECT LENGTH(body) FROM "Article" WHERE id = test_article_id) > 50000, 
        'Article body must support large text for word count calculation';
    
    -- Cleanup
    DELETE FROM "Article" WHERE id = test_article_id;
    DELETE FROM "User" WHERE id = test_user_id;
END $$;

-- Test 6: Verify Article table structure supports all required fields for readingTime calculation
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'Article' 
        AND column_name IN ('id', 'slug', 'title', 'description', 'body', 'createdAt', 'updatedAt', 'authorId')
    ) = 8, 'Article table must have all required columns';
END $$;

-- Test 7: Verify body column can handle empty strings
DO $$
DECLARE
    test_user_id INTEGER;
    test_article_id INTEGER;
BEGIN
    INSERT INTO "User" (email, username, password) 
    VALUES ('test2@test.com', 'testuser2', 'password123') 
    RETURNING id INTO test_user_id;
    
    INSERT INTO "Article" (slug, title, description, body, "authorId") 
    VALUES ('test-slug-2', 'Test Title', 'Test Description', '', test_user_id)
    RETURNING id INTO test_article_id;
    
    ASSERT (SELECT body FROM "Article" WHERE id = test_article_id) = '', 
        'Article body must handle empty strings';
    
    DELETE FROM "Article" WHERE id = test_article_id;
    DELETE FROM "User" WHERE id = test_user_id;
END $$;

-- Test 8: Verify body column can handle special characters and unicode
DO $$
DECLARE
    test_user_id INTEGER;
    test_article_id INTEGER;
    special_body TEXT;
BEGIN
    INSERT INTO "User" (email, username, password) 
    VALUES ('test3@test.com', 'testuser3', 'password123') 
    RETURNING id INTO test_user_id;
    
    special_body := 'Test with special chars: !@#$%^&*() and unicode: 你好世界 émojis: 😀🎉';
    
    INSERT INTO "Article" (slug, title, description, body, "authorId") 
    VALUES ('test-slug-3', 'Test Title', 'Test Description', special_body, test_user_id)
    RETURNING id INTO test_article_id;
    
    ASSERT (SELECT body FROM "Article" WHERE id = test_article_id) = special_body, 
        'Article body must handle special characters and unicode';
    
    DELETE FROM "Article" WHERE id = test_article_id;
    DELETE FROM "User" WHERE id = test_user_id;
END $$;