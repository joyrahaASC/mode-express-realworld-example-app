# Chapter 3: Authentication & Authorization System

In [Chapter 2: Database Integration Layer](02_database_integration_layer_.md), we learned how our application communicates with the database to store and retrieve information. But here's a critical question: how do we know who is asking for this information, and should they be allowed to access it?

Imagine you're running a private members-only club. You need two things at the entrance: first, a way to verify that people are who they claim to be (checking their ID), and second, a way to control what areas of the club they can access (VIP members get different privileges than regular members). 

This is exactly what our Authentication & Authorization System does for our web application. It's like having a smart security checkpoint that remembers who you are and what you're allowed to do!

## What is Authentication & Authorization?

Think of these as two security guards working together:

- **Authentication** (Who are you?) - Like checking someone's ID at the door. "Are you really John Smith?"
- **Authorization** (What can you do?) - Like checking if someone has VIP access. "Okay John, you're allowed in the VIP area, but not the staff room."

Let's say Sarah wants to edit her blog post titled "My Cooking Adventures". Here's what happens:

1. **Authentication**: The system checks if Sarah is really Sarah (using her login token)
2. **Authorization**: The system checks if Sarah is allowed to edit this specific article (she can only edit her own posts)
3. **Access Granted**: Sarah can now edit her article

## Breaking Down the Key Concepts

### JWT Tokens: Your Digital ID Card

When you successfully log in, our system gives you a JWT (JSON Web Token) - think of it as a special digital ID card that proves who you are. This token contains your user information in a secure, encrypted format.

```javascript
// When you log in successfully, you get a token like this:
const token = "eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjp7ImlkIjoxMjN9fQ...";

// This token contains encrypted information about you:
// { user: { id: 123 } }
```

You include this token with every request to prove your identity, just like showing your ID card each time you enter a restricted area.

### Registration: Creating Your Account

Before you can log in, you need to create an account. This is like filling out a membership application:

```javascript
const newUser = {
  username: "sarah_chef",
  email: "sarah@email.com", 
  password: "mySecretPassword"
};

// The system creates your account and gives you a token
const result = await createUser(newUser);
// Returns: { username: "sarah_chef", email: "sarah@email.com", token: "..." }
```

The system securely stores your information and immediately gives you a token so you're logged in right away.

### Login: Proving Who You Are

When you return to the site, you need to prove your identity by providing your credentials:

```javascript
const loginData = {
  email: "sarah@email.com",
  password: "mySecretPassword"
};

// The system verifies your credentials
const user = await login(loginData);
// Returns: { username: "sarah_chef", email: "sarah@email.com", token: "..." }
```

If your email and password match what's stored in the database, you get a fresh token to use for future requests.

## Solving Our Use Case: Editing Your Own Article

Let's walk through what happens when Sarah wants to edit her cooking article:

```mermaid
sequenceDiagram
    participant Sarah
    participant Auth as Auth Middleware
    participant Controller
    participant Service
    participant DB as Database
    
    Sarah->>Auth: PUT /articles/my-cooking-tips (with token)
    Auth->>Auth: Verify token is valid
    Auth->>Controller: Request approved, user ID = 123
    Controller->>Service: updateArticle(slug, data, userId=123)
    Service->>DB: Check if article belongs to user 123
    DB->>Service: Yes, article is owned by user 123
    Service->>DB: Update the article
    DB->>Service: Return updated article
    Service->>Controller: Return formatted article
    Controller->>Sarah: Send updated article response
```

## Password Security: Keeping Secrets Safe

We never store passwords in plain text - that would be like writing down everyone's house key codes on a public bulletin board! Instead, we use a process called "hashing" that scrambles the password:

```javascript
// When Sarah registers, we don't store "mySecretPassword"
// Instead, we hash it into something unreadable:
const hashedPassword = await bcrypt.hash("mySecretPassword", 10);
// Stores: "$2a$10$N9qo8uLOickgx2ZMRZoMye..."

// When she logs in, we hash her input and compare:
const isValid = await bcrypt.compare("mySecretPassword", hashedPassword);
// Returns: true if passwords match
```

Even if someone breaks into our database, they can't see the actual passwords!

## Middleware: The Security Checkpoint

Middleware functions act like security guards that check every request before it reaches our controllers. We have two types:

### Required Authentication
For actions that definitely need a logged-in user:

```javascript
// This route requires authentication
router.put('/articles/:slug', auth.required, updateArticle);

// If no valid token is provided, the user gets an error
// If token is valid, the request continues with user info attached
```

### Optional Authentication
For actions that work better with authentication but don't require it:

```javascript
// This route works with or without authentication
router.get('/articles/:slug', auth.optional, getArticle);

// Without token: Shows public version of article
// With token: Shows personalized version (favorited status, etc.)
```

## Looking Under the Hood

When Sarah sends a request to edit her article, here's what happens step by step:

### Step 1: Token Extraction
The authentication middleware looks for Sarah's token in the request headers:

```javascript
const getTokenFromHeaders = (req) => {
  // Looks for: "Authorization: Token eyJhbGciOiJIUzI1NiJ9..."
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token') {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
};
```

### Step 2: Token Verification
The system checks if the token is valid and not expired:

```javascript
// Verify the token and extract user information
const decoded = jwt.verify(token, process.env.JWT_SECRET);
// Returns: { user: { id: 123 } }
```

If the token is valid, the user's ID (123) gets attached to the request so controllers and services can use it.

### Step 3: Authorization Check
The service checks if Sarah is allowed to edit this specific article:

```javascript
export const updateArticle = async (slug, articleData, userId) => {
  // First, find the article
  const article = await prisma.article.findUnique({
    where: { slug }
  });
  
  // Check if this user owns the article
  if (article.authorId !== userId) {
    throw new Error('You can only edit your own articles');
  }
  
  // If authorized, update the article
  return await prisma.article.update({
    where: { slug },
    data: articleData
  });
};
```

## Registration Process: Creating New Users

When someone wants to join our platform, we need to safely create their account:

```javascript
export const createUser = async (input) => {
  const { email, username, password } = input;
  
  // Check if email/username already exist
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });
  
  if (existingUser) {
    throw new Error('Email already taken');
  }
  
  // Hash the password for security
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Create the new user
  const user = await prisma.user.create({
    data: {
      username,
      email, 
      password: hashedPassword
    }
  });
  
  // Return user info with a login token
  return {
    username: user.username,
    email: user.email,
    token: generateToken(user.id)
  };
};
```

This process ensures each user has unique credentials and immediately provides them with a token for a smooth experience.

## Login Process: Verifying Returning Users

When users return to log in, we need to verify their credentials:

```javascript
export const login = async (userPayload) => {
  const { email, password } = userPayload;
  
  // Find the user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });
  
  if (!user) {
    throw new Error('Email or password is invalid');
  }
  
  // Check if password matches
  const passwordValid = await bcrypt.compare(password, user.password);
  
  if (!passwordValid) {
    throw new Error('Email or password is invalid');
  }
  
  // Return user info with fresh token
  return {
    username: user.username,
    email: user.email,
    token: generateToken(user.id)
  };
};
```

Notice how we give the same error message whether the email doesn't exist or the password is wrong - this prevents attackers from figuring out which emails have accounts.

## Token Generation: Creating Digital ID Cards

When users successfully log in or register, we create a JWT token for them:

```javascript
const generateToken = (userId) => {
  return jwt.sign(
    { user: { id: userId } },           // The payload (user info)
    process.env.JWT_SECRET,             // Secret key for encryption
    { expiresIn: '60d' }                // Token expires in 60 days
  );
};
```

This token acts like a temporary ID card that proves who the user is for the next 60 days.

## Putting It All Together: A Complete Flow

Let's see how all these pieces work together when Sarah edits her article:

1. **Sarah's Request**: She sends a PUT request to `/articles/my-cooking-tips` with her token in the headers
2. **Middleware Check**: The `auth.required` middleware extracts and verifies her token
3. **User Identification**: The middleware adds her user ID (123) to the request
4. **Controller Action**: The controller calls the service with the article slug, new data, and Sarah's user ID
5. **Authorization**: The service checks that Sarah owns this article before allowing the update
6. **Database Update**: If authorized, the article gets updated in the database
7. **Response**: Sarah receives the updated article data

```javascript
// The complete flow in the controller:
router.put('/articles/:slug', auth.required, async (req, res) => {
  try {
    // auth.required has already verified the user and added req.auth.user.id
    const updatedArticle = await updateArticle(
      req.params.slug,     // "my-cooking-tips"
      req.body.article,    // New article data
      req.auth.user.id     // Sarah's user ID (123)
    );
    
    res.json({ article: updatedArticle });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});
```

## Error Handling: When Things Go Wrong

Our authentication system handles various error cases gracefully:

- **No token provided**: "Authentication required"
- **Invalid token**: "Invalid token"  
- **Expired token**: "Token expired, please log in again"
- **Wrong permissions**: "You don't have permission to perform this action"

This gives users clear feedback about what went wrong and how to fix it.

## Conclusion

The Authentication & Authorization System is like having a smart, reliable security team for your application. It verifies user identities through login credentials and JWT tokens, then controls access to resources based on ownership and permissions. We learned how users register and log in to get tokens, how middleware checks these tokens on every request, and how services verify that users can only access and modify their own content.

This security layer builds perfectly on top of our [MVC Route Architecture](01_mvc_route_architecture_.md) and [Database Integration Layer](02_database_integration_layer_.md), ensuring that our well-organized application also keeps user data safe and private.

With authentication and authorization in place, we now have all the core building blocks needed to create a secure, scalable web application where users can safely manage their own content while enjoying personalized experiences.

