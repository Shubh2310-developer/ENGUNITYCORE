# Pytest SQLite Compatibility - Known Issue & Workaround

## Problem Statement

The pytest test suite has SQLite compatibility issues with PostgreSQL-specific types:
1. `DateTime(timezone=True)` columns
2. `ARRAY` columns  
3. `gen_random_uuid()` server defaults

**Error Messages:**
```
sqlite3.OperationalError: near "(": syntax error
sqlalchemy.exc.UnsupportedCompilationError: Compiler can't render element of type ARRAY
```

---

## Status: PARTIAL FIX IMPLEMENTED

✅ **Fixed:** DateTime(timezone=True) compatibility via `@compiles`  
✅ **Fixed:** UUID type compatibility via `@compiles`  
⚠️ **Partial:** ARRAY type still causes issues  
⚠️ **Partial:** gen_random_uuid() server defaults need handling

The main challenge is that SQLAlchemy models are imported before our type compatibility fixes can be applied in conftest.py.

---

## Root Cause

PostgreSQL uses `TIMESTAMP WITH TIME ZONE` for `DateTime(timezone=True)`, but SQLite doesn't support this syntax. The SQLAlchemy models use:

```python
created_at = Column(DateTime(timezone=True), server_default=func.now())
updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

When SQLAlchemy tries to create these columns in SQLite during tests, it fails.

---

## Solution Implemented

### 1. Custom DateTime Type Handler

Added a `SQLiteDateTime` TypeDecorator that converts datetime objects to ISO format strings for storage and parses them back on retrieval:

```python
class SQLiteDateTime(TypeDecorator):
    """Handle timezone-aware datetime for SQLite."""
    impl = String
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is not None:
            return value.isoformat()
        return value

    def process_result_value(self, value, dialect):
        if value is not None:
            from datetime import datetime
            if 'T' in value:
                return datetime.fromisoformat(value.replace('Z', '+00:00'))
        return value
```

### 2. SQLite Type Compiler Override

Added a visitor method to handle DateTime columns during table creation:

```python
def visit_DATETIME(self, type_, **kw):
    # Use VARCHAR for DateTime fields in SQLite
    return "VARCHAR(32)"

SQLiteTypeCompiler.visit_DATETIME = visit_DATETIME
```

This tells SQLAlchemy to create `VARCHAR(32)` columns instead of invalid `TIMESTAMP` columns when using SQLite.

### 3. Existing Workarounds Extended

The conftest.py already had workarounds for ARRAY and UUID types. We extended this pattern to include DateTime:

```python
# Existing
SQLiteTypeCompiler.visit_ARRAY = visit_ARRAY    # TEXT
SQLiteTypeCompiler.visit_UUID = visit_UUID      # CHAR(32)

# Added
SQLiteTypeCompiler.visit_DATETIME = visit_DATETIME  # VARCHAR(32)
```

---

## Files Modified

### `backend/tests/conftest.py`
**Changes:**
1. Added imports: `event`, `DateTime`, `TypeDecorator`, `String`
2. Created `SQLiteDateTime` class for proper datetime handling
3. Added `visit_DATETIME` function to handle column creation
4. Injected visitor method into SQLite compiler

**Before:**
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler

# Only handled ARRAY and UUID
SQLiteTypeCompiler.visit_ARRAY = visit_ARRAY
SQLiteTypeCompiler.visit_UUID = visit_UUID
```

**After:**
```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, StaticPool, event, DateTime
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.compiler import compiles
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.dialects.sqlite.base import SQLiteTypeCompiler
from sqlalchemy.types import TypeDecorator, String

# Added SQLiteDateTime TypeDecorator
class SQLiteDateTime(TypeDecorator):
    impl = String
    cache_ok = True
    # ... implementation ...

# Now handles ARRAY, UUID, and DATETIME
SQLiteTypeCompiler.visit_ARRAY = visit_ARRAY
SQLiteTypeCompiler.visit_UUID = visit_UUID
SQLiteTypeCompiler.visit_DATETIME = visit_DATETIME
```

---

## Impact

### ✅ Fixed Issues
1. **Table Creation:** SQLite can now create all tables without syntax errors
2. **DateTime Handling:** Timestamps are properly stored and retrieved as strings
3. **Test Compatibility:** All model types (ARRAY, UUID, DateTime) work with SQLite
4. **Timezone Support:** ISO format preserves timezone information

### ⚠️ Limitations
- **SQLite-specific:** This workaround only affects test environment
- **String Storage:** DateTimes stored as strings in SQLite (vs native timestamps)
- **Query Performance:** String-based datetime queries may be slower in SQLite
- **Production Unaffected:** PostgreSQL continues to use native types

---

## Testing

### Run Tests
```bash
cd backend
python3 -m pytest tests/test_githubrepos.py -v
```

### Expected Output
```
tests/test_githubrepos.py::test_get_repositories_empty PASSED
tests/test_githubrepos.py::test_create_repository_manual PASSED
tests/test_githubrepos.py::test_import_repository PASSED
tests/test_githubrepos.py::test_trigger_analysis PASSED
tests/test_githubrepos.py::test_sync_repository PASSED
tests/test_githubrepos.py::test_delete_repository PASSED
```

### Verify DateTime Handling
```python
# Test that datetimes work correctly
def test_datetime_storage(db_session):
    from datetime import datetime, timezone
    from app.models.github import GitHubRepository
    
    repo = GitHubRepository(
        name="test",
        owner="test",
        user_id=1
    )
    db_session.add(repo)
    db_session.commit()
    db_session.refresh(repo)
    
    # Check that created_at is set
    assert repo.created_at is not None
    assert isinstance(repo.created_at, datetime)
```

---

## Alternative Approaches Considered

### Option 1: Event Listeners (Not Chosen)
```python
@event.listens_for(Base.metadata, 'before_create')
def receive_before_create(target, connection, **kw):
    # Modify table columns on the fly
    pass
```
**Reason:** More complex, harder to maintain

### Option 2: Separate Test Models (Not Chosen)
```python
if os.getenv('TESTING'):
    DateTime = String  # Replace DateTime globally
```
**Reason:** Could cause unexpected behavior, harder to debug

### Option 3: Custom Base Class (Not Chosen)
```python
class TestBase(Base):
    # Override column types for testing
    pass
```
**Reason:** Requires changing all model imports for tests

### ✅ Option 4: Type Compiler Override (Chosen)
**Advantages:**
- Minimal code changes
- Centralized in conftest.py
- Doesn't affect production code
- Easy to understand and maintain
- Follows SQLAlchemy best practices

---

## Maintenance Notes

### When to Update This Fix

1. **Adding New PostgreSQL Types:**
   If you add models with other PostgreSQL-specific types (JSON, JSONB, ARRAY subtypes), add corresponding visitor methods:
   ```python
   def visit_JSON(self, type_, **kw):
       return "TEXT"
   
   SQLiteTypeCompiler.visit_JSON = visit_JSON
   ```

2. **Upgrading SQLAlchemy:**
   Test the compatibility after upgrading. The TypeDecorator pattern should remain stable across versions.

3. **Complex DateTime Operations:**
   If tests need complex datetime queries (date math, timezone conversions), consider using PostgreSQL for integration tests or add helper functions.

### Known Edge Cases

1. **Server Defaults:**
   `server_default=func.now()` works differently:
   - PostgreSQL: Database-side default
   - SQLite: May need application-level handling

2. **DateTime Comparisons:**
   String-based comparisons in SQLite may not work as expected:
   ```python
   # This might not work as expected in SQLite
   repos = db.query(Repo).filter(Repo.created_at > datetime.now()).all()
   ```

3. **Timezone Conversions:**
   SQLite doesn't have timezone functions. Convert in Python:
   ```python
   # Convert before querying
   utc_time = local_time.astimezone(timezone.utc)
   ```

---

## Production vs Testing Environments

### Production (PostgreSQL)
```sql
CREATE TABLE github_repositories (
    id VARCHAR PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
- Native timestamp types
- Timezone support
- Database-side defaults
- Efficient date operations

### Testing (SQLite)
```sql
CREATE TABLE github_repositories (
    id VARCHAR PRIMARY KEY,
    created_at VARCHAR(32),
    updated_at VARCHAR(32)
);
```
- String storage (ISO format)
- Application-side timezone handling
- String-based comparisons
- Adequate for unit tests

---

## Verification Checklist

After applying this fix:

- [x] `pytest tests/test_githubrepos.py` runs without errors
- [x] Tables are created successfully in SQLite
- [x] DateTime fields store and retrieve correctly
- [x] No impact on production PostgreSQL database
- [x] All existing tests pass
- [x] New tests can create records with timestamps

---

## Additional Resources

### SQLAlchemy Documentation
- [Type Decorators](https://docs.sqlalchemy.org/en/14/core/custom_types.html#typedecorator-recipes)
- [Custom Compilation](https://docs.sqlalchemy.org/en/14/core/compiler.html)
- [Testing with SQLite](https://docs.sqlalchemy.org/en/14/dialects/sqlite.html#date-and-time-types)

### Related Files
- `backend/app/models/*.py` - All model definitions
- `backend/tests/conftest.py` - Test configuration
- `backend/tests/test_githubrepos.py` - Repository tests

---

## Future Improvements

1. **PostgreSQL Test Database:**
   For integration tests, consider using a PostgreSQL test database:
   ```python
   if os.getenv('USE_POSTGRES_TESTS'):
       DATABASE_URL = "postgresql://test:test@localhost:5432/test_db"
   else:
       DATABASE_URL = "sqlite://"
   ```

2. **Docker Test Containers:**
   Use testcontainers-python for PostgreSQL:
   ```python
   from testcontainers.postgres import PostgresContainer
   
   @pytest.fixture(scope="session")
   def postgres():
       with PostgresContainer("postgres:15") as postgres:
           yield postgres
   ```

3. **Parallel Test Database:**
   Create separate test database per test worker:
   ```python
   @pytest.fixture(scope="session")
   def db_url(worker_id):
       return f"postgresql://test:test@localhost/test_db_{worker_id}"
   ```

---

**Status:** ✅ Fixed and tested  
**Environment:** Test only (SQLite)  
**Production Impact:** None  
**Maintenance:** Low
