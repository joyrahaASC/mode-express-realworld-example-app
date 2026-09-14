# Repository Metadata Knowledge Base

## `src/app/routes/article`
| File Path | Core Purpose |
|-----------|--------------|
| `src/app/routes/article/article.controller.ts` | Defines Express router endpoints for article management operations including CRUD operations, comments, favorites, and feed retrieval. Routes requests to corresponding service layer functions with optional or required authentication middleware. |
| `src/app/routes/article/article.mapper.ts` | Transforms raw article data objects into a standardized format for API responses. Maps article properties including slug, title, description, body, tag list, timestamps, favorited status, favorites count, and delegates author mapping to a separate mapper. |
| `src/app/routes/article/article.model.ts` | Defines the Article data model interface representing an article entity with properties including id, title, slug, description, comments array, and favorited status. Serves as a TypeScript type definition for article objects used throughout the application. |
| `src/app/routes/article/article.service.ts` | Provides comprehensive article management services for a blogging platform, including CRUD operations for articles and comments, feed generation, favoriting/unfavoriting functionality, and complex query building with tag and author filtering. Orchestrates Prisma database operations and transforms raw data using mapper utilities. |
| `src/app/routes/article/author.mapper.ts` | Transforms raw author data into a standardized author object format with username, bio, image, and following status. Determines if a given user (by id) is following the author by checking the followedBy relationship array. |
| `src/app/routes/article/comment.model.ts` | Defines the Comment data model interface representing user comments in the system. Establishes the structure for comment entities including metadata fields (id, timestamps, body) and an optional relationship to an Article entity. |

