from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain.chat_models import ChatOpenAI
from langchain.schema import SystemMessage, HumanMessage
import os
import re
from typing import Literal
from config import config

# =============================================================================
# FastAPI App Configuration
# =============================================================================

app = FastAPI(title="SQL Converter API", version="2.0.0")

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# Environment Configuration
# =============================================================================

# Validate configuration on startup
try:
    config.validate_config()
except ValueError as e:
    print(f"Configuration Error: {e}")
    print("Please create a .env file in the 'api' directory with your OpenAI API key.")
    print("Example: skj-XXXXXXXXXXXXX")
    exit(1)

# =============================================================================
# Example Code Templates
# =============================================================================

example_pg_function = """
CREATE OR REPLACE FUNCTION public.sales_summary_brands_by_sales_filters(
    year integer,
    month json,
    store json,
    state json,
    channel json,
    fromdate date,
    todate date)
    RETURNS SETOF refcursor 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
AS $BODY$
DECLARE 
    query1 refcursor := 'main';
    months integer[];
    stores text[];
    states text[];
    channels text[];
BEGIN
    -- Parse JSON arrays
    IF month IS NULL OR month::jsonb = '["all"]'::jsonb THEN 
        months := NULL;
    ELSE
        months := ARRAY(SELECT json_array_elements_text(month)::text);
    END IF;
    
    IF store IS NULL OR store::jsonb = '["all"]'::jsonb THEN 
        stores := NULL;
    ELSE
        stores := ARRAY(SELECT json_array_elements_text(store)::text);
    END IF;
    
    IF state IS NULL OR state::jsonb = '["all"]'::jsonb THEN 
        states := NULL;
    ELSE
        states := ARRAY(SELECT json_array_elements_text(state)::text);
    END IF;
    
    IF channel IS NULL OR channel::jsonb = '["all"]'::jsonb THEN 
        channels := NULL;
    ELSE
        channels := ARRAY(SELECT json_array_elements_text(channel)::text);
    END IF;
    
    -- Override filters if date range provided
    IF fromdate IS NOT NULL OR todate IS NOT NULL THEN
        year := NULL;
        months := NULL;
    END IF;
    
    -- Main query
    OPEN query1 FOR 
    SELECT 
        db.brandname AS y,
        SUM(fs.salesamount) AS x,
        currency_convert(SUM(fs.salesamount)) AS text,
        db.brandid AS id,
        'bar' AS type, 
        'h' AS orientation
    FROM factsales fs
    INNER JOIN DimProduct dp ON fs.productid = dp.productid 
    INNER JOIN DimBrand db ON db.brandid = dp.brandid
    INNER JOIN dimdate dd ON fs.OrderDate = dd.calendar
    INNER JOIN dimstore ds ON fs.storeid = ds.storeid
    INNER JOIN dimregion dr ON dr.regionid = ds.regionid 
    INNER JOIN dimchannel dc ON dc.channelid = fs.channelid
    WHERE (year IS NULL OR dd.financialyear = year)
        AND (months IS NULL OR date_part('MONTH', fs.OrderDate) = ANY(months))
        AND (states IS NULL OR dr.level3value = ANY(states))
        AND (stores IS NULL OR fs.storeid::text = ANY(stores))
        AND (channels IS NULL OR fs.channelid::text = ANY(channels))
        AND (fromdate IS NULL OR fs.OrderDate BETWEEN fromdate AND todate)
    GROUP BY db.brandname, db.brandid 
    ORDER BY x ASC;

    RETURN NEXT query1;
END;
$BODY$;
"""

example_ssms_procedure = """
CREATE PROCEDURE [dbo].[SALES_SUMMARY_BRANDS_BY_SALES_FILTERS](
    @year INT = NULL, 
    @month NVARCHAR(MAX) = NULL,
    @fromdate DATE = NULL,
    @todate DATE = NULL,
    @store NVARCHAR(MAX) = NULL,
    @state NVARCHAR(MAX) = NULL,
    @channel NVARCHAR(MAX) = NULL,
    @date DATE = NULL
)
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @months NVARCHAR(MAX);
    DECLARE @stores NVARCHAR(MAX);
    DECLARE @states NVARCHAR(MAX);
    DECLARE @channels NVARCHAR(MAX);
    
    -- Parse JSON-like strings
    SET @months = REPLACE(REPLACE(REPLACE(@month, '"', ''), '[', ''), ']', '');
    IF @months = 'all' SET @months = '0';
    
    SET @stores = REPLACE(REPLACE(REPLACE(@store, '"', ''''), '[', ''), ']', '');
    IF @stores = '''all''' SET @stores = '0';
    
    SET @states = REPLACE(REPLACE(REPLACE(@state, '"', ''''), '[', ''), ']', '');
    IF @states = '''all''' SET @states = '0';
    
    SET @channels = REPLACE(REPLACE(REPLACE(@channel, '"', ''), '[', ''), ']', '');
    IF @channels = 'all' SET @channels = '0';
    
    -- Override filters if date range provided
    IF @fromdate IS NOT NULL OR @todate IS NOT NULL OR @date IS NOT NULL
    BEGIN
        SET @year = '0';
        SET @months = '0';
    END;
    
    -- Dynamic SQL construction
    DECLARE @Sql NVARCHAR(MAX) = N'
    SELECT 
        db.BrandName AS y,
        SUM(fs.SalesAmount) AS x,
        CASE 
            WHEN SUM(fs.SalesAmount) < 99999 THEN ''$'' + FORMAT(SUM(fs.SalesAmount) / 1000, ''N2'') + ''K''
            ELSE FORMAT(SUM(fs.SalesAmount), ''$0,,.00M'')
        END AS text,
        db.BrandId AS id,
        ''bar'' AS type, 
        ''h'' AS orientation
    FROM FactSales fs WITH(NOLOCK)
    INNER JOIN DimProduct dp WITH(NOLOCK) ON fs.ProductID = dp.ProductID
    INNER JOIN DimBrand db WITH(NOLOCK) ON db.BrandId = dp.BrandId
    INNER JOIN DimDate dd WITH(NOLOCK) ON dd.Calendar = fs.OrderDate
    INNER JOIN DimStore ds WITH(NOLOCK) ON fs.StoreID = ds.StoreID
    INNER JOIN DimRegion dr WITH(NOLOCK) ON dr.RegionID = ds.RegionID
    INNER JOIN DimChannel dc WITH(NOLOCK) ON dc.ChannelID = fs.ChannelID
    WHERE 1=1';
    
    -- Add conditional filters
    IF @year IS NOT NULL AND @year != '0'
        SET @Sql = @Sql + N' AND dd.FinancialYear = @year';
    
    IF @months IS NOT NULL AND @months != '0'
        SET @Sql = @Sql + N' AND MONTH(fs.OrderDate) IN (' + @months + ')';
    
    IF @fromdate IS NOT NULL AND @todate IS NOT NULL
        SET @Sql = @Sql + N' AND fs.OrderDate BETWEEN @fromdate AND @todate';
    
    IF @date IS NOT NULL
        SET @Sql = @Sql + N' AND fs.OrderDate = @date';
    
    IF @states IS NOT NULL AND @states != '''0'''
        SET @Sql = @Sql + N' AND dr.Level3Value IN (' + @states + ')';
    
    IF @stores IS NOT NULL AND @stores != '''0'''
        SET @Sql = @Sql + N' AND ds.StoreID IN (' + @stores + ')';
    
    IF @channels IS NOT NULL AND @channels != '0'
        SET @Sql = @Sql + N' AND fs.ChannelID IN (' + @channels + ')';
    
    SET @Sql = @Sql + N' GROUP BY db.BrandName, db.BrandId ORDER BY x ASC';
    
    -- Execute dynamic SQL
    DECLARE @params NVARCHAR(MAX) = N'@year INT, @fromdate DATE, @todate DATE, @date DATE';
    EXEC sp_executesql @Sql, @params, @year, @fromdate, @todate, @date;
END
"""

example_mysql_procedure = """
DELIMITER $$
CREATE DEFINER=`mysql_sai_charan`@`%` PROCEDURE `SALES_SUMMARY_SALES_BY_PRODUCT_BEST_RANK_FILTERS`(
IN year int , 
IN month nvarchar(255) ,
IN store nvarchar(4000),
IN state nvarchar(4000),
IN channel nvarchar(4000),
IN product nvarchar(4000),
IN fromdate date ,
IN todate date 
)
BEGIN
	DECLARE latestdate date;
    DECLARE maxdate date;
    DECLARE latestmonth date;
	DECLARE length int;
    DECLARE lastyear date;
	DECLARE FinancialYearStart date;
        
	SET month = REPLACE(REPLACE(REPLACE(REPLACE(month, '"', ''), '[', ''), ']', ''),'''','');
    IF month = 'all' THEN
		SET month = REPLACE(month, 'all', null);
	END IF;
    
	SET store = REPLACE(REPLACE(REPLACE(store, '"', ''), '[', ''), ']', '');
    IF store = 'all' THEN
		SET store = REPLACE(store, 'all', null);
	END IF;
    
    SET state = REPLACE(REPLACE(REPLACE(state, '"', ''), '[', ''), ']', '');
    IF state = 'all' THEN
		SET state = REPLACE(state, 'all', null);
	END IF;
    
    SET channel = REPLACE(REPLACE(REPLACE(channel, '"', ''), '[', ''), ']', '');
    IF channel = 'all' THEN
		SET channel = REPLACE(channel, 'all', null);
	END IF; 

	SET product = REPLACE(REPLACE(REPLACE(product, '"', ''), '[', ''), ']', '');
    IF product = 'all' THEN
		SET product = REPLACE(product, 'all', null);
	END IF; 

    
    if fromdate is not null or todate is not null then
			set year = null;
			set month = null;
	end if;

	

	with cte as
	(
		SELECT dp.ProductID as ProductID,
		DENSE_RANK() OVER (ORDER BY sum(fs.Salesamount) DESC) AS SalesByYear
		FROM FactSales fs
		inner join DimStore ds on fs.StoreID = ds.StoreID
		inner join DimRegion dr on dr.RegionID = ds.RegionID
		inner join DimChannel dc on dc.ChannelID = fs.ChannelID
		inner join DimDate dd on dd.Calendar = fs.OrderDate
		inner join DimProduct dp on dp.ProductID = fs.ProductID
		where (dd.FinancialYear = year OR year IS NULL)
			and (FIND_IN_SET(MONTH(fs.OrderDate), month) OR month IS NULL)
    		and (FIND_IN_SET(ds.StoreID, store) OR store IS NULL)
    		and (FIND_IN_SET(dr.Level3Value, state) OR state IS NULL)
    	and (FIND_IN_SET(fs.ChannelID, channel) OR channel IS NULL)
    	and (fs.OrderDate BETWEEN fromdate AND todate OR fromdate IS NULL OR todate IS NULL)
		GROUP BY dp.ProductID,dp.ProductName
	)
		SELECT SalesByYear as 'Best Ranking Till Date' from cte
		where (FIND_IN_SET(ProductID, product) OR product IS NULL);


END$$
DELIMITER ;
"""

# =============================================================================
# Pydantic Models
# =============================================================================

class ConversionRequest(BaseModel):
    source_code: str
    source_type: Literal['sqlserver', 'postgresql', 'mysql']
    target_type: Literal['sqlserver', 'postgresql', 'mysql']

class ConversionResponse(BaseModel):
    converted_code: str
    source_type: str
    target_type: str

class OptimizationRequest(BaseModel):
    sql_code: str
    sql_type: Literal['sqlserver', 'postgresql', 'mysql']

class OptimizationResponse(BaseModel):
    optimized_code: str

# =============================================================================
# LangChain Configuration
# =============================================================================

llm = ChatOpenAI(
    temperature=0,
    model_name="gpt-4o-mini",
    openai_api_key=config.get_openai_key()
)

# =============================================================================
# Conversion Functions
# =============================================================================

def is_procedure_or_function(sql: str) -> bool:
    """Detect if the SQL code is a stored procedure or function definition."""
    sql = sql.strip().lower()
    return (
        sql.startswith("create procedure") or
        sql.startswith("alter procedure") or
        sql.startswith("create function") or
        sql.startswith("alter function") or
        sql.startswith("delimiter $$") or
        re.match(r"^create\s+(or\s+replace\s+)?function", sql)
    )

def convert_sql_code(source_code: str, source_type: str, target_type: str) -> str:
    """Convert SQL code between different database types."""
    try:
        if source_type == target_type:
            return source_code

        # Detect if input is a procedure/function or a plain query
        if not is_procedure_or_function(source_code):
            # Plain query: use a simple prompt
            messages = [
                SystemMessage(
                    content=f"You are an expert in SQL conversion. Convert the following {source_type} SQL query to {target_type} SQL. Return only the converted query, do not wrap it in a procedure or function."
                ),
                HumanMessage(
                    content=source_code
                )
            ]
            response = llm(messages)
            return response.content.strip()

        # Define conversion prompts based on source and target
        if source_type == 'sqlserver' and target_type == 'postgresql':
            messages = [
                SystemMessage(
                    content="You are an expert in SQL who specializes in converting SQL Server stored procedures to PostgreSQL functions. Provide only the converted code without any explanations."
                ),
                HumanMessage(
                    content=f"""
                    Convert the following SQL Server stored procedure into a PostgreSQL function using the rules below.
                    
                    Use this example PostgreSQL function as a reference for structure and style:
                    
                    --------------------------- EXAMPLE START ---------------------------
                    {example_pg_function}
                    --------------------------- EXAMPLE END -----------------------------
                    
                    Now convert the following SQL Server stored procedure:
                    
                    {source_code}

                    1. Use `CREATE OR REPLACE FUNCTION` syntax.
                    2. The PostgreSQL function **must define the same number of input parameters** as the SQL Server stored procedure. 
                       - Each parameter from SQL Server (e.g., `@year`, `@store`) should have a corresponding parameter in the PostgreSQL function.
                       - If SQL Server uses multiple individual parameters, do **not** collapse them into a single JSON input — keep one parameter per input as in the original.
                    3. Parse any array inputs (e.g., year, month) from JSON arrays using `json_array_elements_text(...)::INT` and aggregate them into PostgreSQL arrays using `ARRAY_AGG(...)`.
                    4. Treat `"all"` values as special: if a JSON input contains `"all"`, set the corresponding array to `NULL` to disable filtering.
                    5. If `fromdate` or `todate` is non-null, override `year` and `month` filters by setting those arrays to `NULL`.
                    6. Return `SETOF refcursor`. For each result set:
                       - Declare a cursor variable (e.g., `cursor1`, `cursor2`, etc.).
                       - Use `OPEN cursorX FOR SELECT ...` to assign the result.
                       - Use `RETURN NEXT cursorX;` to yield each result.
                    7. **Do NOT use `RETURN NEXT SELECT ...` — this is invalid syntax in PL/pgSQL. Always use `OPEN cursorX FOR ...` followed by `RETURN NEXT cursorX`.**
                    8. CTE Scope in Cursor Blocks:
                       PostgreSQL CTEs (e.g., cte1, cte2, cte4, etc.) are scoped only to the query in which they are defined.
                       If a CTE is used in multiple cursors (e.g., cte2 in both cursor1 and cursor2), then:
                       - You must duplicate the full CTE definition in each OPEN cursorX FOR block where it's needed.
                       - Do not exclude or skip any OPEN cursorX FOR queries. All declared cursors must remain and execute.
                       - Each cursor query must be fully self-contained. Never refer to a CTE from a previous cursor block.
                       - You are allowed (and expected) to repeat CTE definitions if multiple cursor queries use the same logic.
                    9. Replace SQL Server-specific syntax with PostgreSQL equivalents:
                       - Use `date_part('month', fs."OrderDate")` instead of `MONTH(fs.OrderDate)`.
                       - Use `= ANY(array_variable)` instead of `IN (...)`.
                       - Remove all `WITH (NOLOCK)` or other T-SQL-only constructs.
                    10. Do not use dynamic SQL (no `EXEC` or `sp_executesql`). Embed all logic inline.
                    11. When selecting multiple values into variables, use a **single `SELECT ... INTO var1, var2, ...`** — do not use multiple `INTO` clauses.
                    12. Add `LANGUAGE plpgsql VOLATILE COST 100 ROWS 1000` to the function signature.
                    13. Remove or replace any `dbo.` schema references — PostgreSQL does not use this convention.
                    14. All table names and column names in the PostgreSQL function must be in lowercase and Do not use double quotes if the names are already lowercase and contain no special characters or reserved words.
                    15. When converting JSON array parameters (e.g., month, year, etc.) into PostgreSQL arrays, use the simple := ARRAY(...) syntax with SELECT json_array_elements_text(...) instead of SELECT ARRAY_AGG(...) INTO ....

                    ### Output:
                    Return only the converted PostgreSQL function in clean, fully formatted PL/pgSQL. Ensure the function structure and behavior mirror the original procedure exactly.
                    """
                )
            ]
        elif source_type == 'postgresql' and target_type == 'sqlserver':
            messages = [
                SystemMessage(
                    content="You are an expert in SQL who specializes in converting PostgreSQL functions to SQL Server stored procedures. Provide only the converted code without any explanations."
                ),
                HumanMessage(
                    content=f"""
                    Convert the following PostgreSQL function to a SQL Server stored procedure using these conversion rules:

                    Use this example SQL Server stored procedure as a reference for structure and style:

                    --------------------------- EXAMPLE START ---------------------------
                    {example_ssms_procedure}
                    --------------------------- EXAMPLE END -----------------------------

                    Now convert the following PostgreSQL function:

                    {source_code}

                    1. Function to Procedure:
                    - Convert `CREATE OR REPLACE FUNCTION` to `CREATE PROCEDURE`.
                    - Replace `RETURNS SETOF refcursor` (used for returning multiple result sets) with dynamic scripting using `sp_executesql` in SQL Server.
                    - Do not use cursors in SQL Server — return the final result set via dynamic SELECT inside the procedure.

                    2. Parameter Conversion:
                    - Convert PostgreSQL `json` parameters to `nvarchar(max)` in SQL Server.
                    - Replace `json_array_elements_text(...)` with `REPLACE()`-based logic to clean the array-like JSON strings (remove brackets and quotes).
                    - Treat `"all"` as `'0'`, and use it to skip filtering (e.g., use `1=1`).

                    3. Array Handling:
                    - Convert `= ANY(array)` in PostgreSQL to `IN (...)` clause in SQL Server dynamic SQL.
                    - Use cleaned string lists (e.g., `'101','102'`) inside `IN (...)`.

                    4. Conditional Logic:
                    - Use `CASE WHEN ... THEN '1=1' ELSE actual condition` to simulate PostgreSQL's null and "all" checks.
                    - For dates:
                        - If `@fromdate` or `@todate` is NULL or empty, skip filtering.
                        - Otherwise, apply `OrderDate BETWEEN @fromdate AND @todate`.

                    5. Dynamic SQL:
                    - Construct the full SQL inside an `@sql` variable using string concatenation.
                    - Use `sp_executesql` with proper parameter declarations and values to execute the query securely.

                    6. Currency Formatting:
                    - Replace `currency_convert(sum(...))` in PostgreSQL with:
                        ```
                        CASE 
                        WHEN SUM(...) < 99999 THEN '$' + FORMAT(SUM(...)/1000, 'N2') + 'K'
                        ELSE FORMAT(SUM(...), '$0,,.00M')
                        END
                        ```
                    7. Output Handling:
                    - PostgreSQL refcursors (`OPEN query1 FOR ...; RETURN NEXT query1;`) should be replaced with just one dynamic query result in SQL Server.
                    - Do not declare or use cursors in SQL Server for this — all data should be returned as the result of the `sp_executesql` execution.

                    8. Boilerplate:
                    - Include `SET ANSI_NULLS ON`, `SET QUOTED_IDENTIFIER ON`, and `SET NOCOUNT ON`.
                    - Declare all variables at the top.

                    ### Output:
                    Return only the converted SQL Server stored procedure in clean, fully formatted T-SQL. Ensure the procedure structure and behavior mirror the original function exactly.
                    """
                )
            ]
        elif target_type == 'mysql':
            messages = [
                SystemMessage(
                    content="You are an expert in SQL who specializes in converting SQL Server and PostgreSQL stored procedures into MySQL stored procedures. Provide only the converted code without any explanations."
                ),
                HumanMessage(
                    content=f"""
                Convert the following {source_type} code into a MySQL stored procedure using the rules below.

                Use this example MySQL stored procedure as a reference for structure and style:

                --------------------------- EXAMPLE START ---------------------------
                {example_mysql_procedure}
                --------------------------- EXAMPLE END -----------------------------

                Now convert the following {source_type} code:

                {source_code}

                ## MySQL Conversion Rules:

                1. Always include `DROP PROCEDURE IF EXISTS procedure_name;` before `CREATE PROCEDURE`.

                2. Use `DELIMITER $$` to wrap the procedure definition, and reset to `DELIMITER ;` at the end.

                3. Procedure parameters:
                - Convert SQL Server `@param` or PostgreSQL `param` to MySQL `IN p_param`
                - Use MySQL data types: `INT`, `DECIMAL`, `DATE`, `JSON`, etc.

                4. Variable declarations:
                - Use `DECLARE var_name TYPE DEFAULT value;`
                - All `DECLARE` statements (variables, cursors, handlers) must be placed at the **top of the BEGIN block**, before any logic.

                5. Avoid `SELECT ... INTO var` if the query may return multiple rows.
                - Use `LIMIT 1` if one row is expected, or use a `CURSOR` only if row-by-row logic is truly needed.
                - For multiple rows, use `SELECT` directly to return the result set.

                6. JSON Handling:
                - Use `JSON_EXTRACT(json_column, '$.key')` or `JSON_UNQUOTE()` for accessing values.

                7. Arrays:
                - Simulate arrays using JSON parameters and `IN (SELECT ...)` pattern.

                8. Date logic:
                - Use MySQL-compatible functions: `YEAR()`, `MONTH()`, `CURDATE()`, `DATE_SUB()`, `BETWEEN ... AND ...`

                9. String formatting:
                - Use `FORMAT(number, 2)` and `CONCAT()` for percentages, currencies, etc.

                10. Error handling:
                    - If needed, use `DECLARE EXIT HANDLER FOR SQLEXCEPTION` for basic exception capture.

                11. Replace unsupported syntax:
                    - Remove `RETURN`, `RETURN QUERY`, `LANGUAGE plpgsql`, `refcursor`, `PERFORM`, etc.
                    - Replace `RAISE NOTICE` with `SELECT 'message';`

                12. Multiple result sets:
                    - Use multiple `SELECT` statements in sequence to simulate multiple cursors or result sets.

                13. Use MySQL conventions:
                    - Use PascalCase or camelCase for procedure names and identifiers.

                14. End the procedure with:
                    ```sql
                    END$$
                    DELIMITER ;
                    ```

                15. Final Requirements:
                    - Return a complete, syntactically correct MySQL stored procedure compatible with MySQL 8+.
                    - The output must be **clean, executable, and reflect the intent of the original procedure.**
                    - Avoid session-level variables like `@var`. Prefer local variables with `DECLARE`.

                ### Output:
                Return only the fully formatted, converted MySQL stored procedure. No comments, explanations, or mixed formatting.
                   """ )    
            ]
        elif source_type == 'mysql':
            # Convert MySQL to other databases
            if target_type == 'sqlserver':
                messages = [
                    SystemMessage(
                        content="You are an expert in SQL who specializes in converting MySQL stored procedures to SQL Server stored procedures. Provide only the converted code without any explanations."
                    ),
                    HumanMessage(
                        content=f"""
                        Convert the following MySQL stored procedure to SQL Server:
                        
                        {source_code}
                        
                        Use this SQL Server example as reference:
                        {example_ssms_procedure}
                        
                        Key conversion rules:
                        1. Remove DELIMITER syntax
                        2. Convert IN/OUT parameters to @parameters
                        3. Replace JSON functions with string manipulation
                        4. Use dynamic SQL with sp_executesql
                        5. Add SET NOCOUNT ON
                        6. Use PascalCase naming
                        7. Replace MySQL date functions with SQL Server equivalents
                        
                        Return only the converted SQL Server stored procedure.
                        """
                    )
                ]
            else:  # mysql to postgresql
                messages = [
                    SystemMessage(
                        content="You are an expert in SQL who specializes in converting MySQL stored procedures to PostgreSQL functions. Provide only the converted code without any explanations."
                    ),
                    HumanMessage(
                        content=f"""
                        Convert the following MySQL stored procedure to PostgreSQL function:
                        
                        {source_code}
                        
                        Use this PostgreSQL example as reference:
                        {example_pg_function}
                        
                        Key conversion rules:
                        1. Use CREATE OR REPLACE FUNCTION
                        2. Convert IN/OUT parameters to function parameters
                        3. Replace JSON functions with json_array_elements_text()
                        4. Use = ANY(array) for array operations
                        5. Replace MySQL date functions with PostgreSQL equivalents
                        6. Add LANGUAGE plpgsql VOLATILE COST 100 ROWS 1000
                        7. Use lowercase naming
                        
                        Return only the converted PostgreSQL function.
                        """
                    )
                ]
        else:
            raise ValueError(f"Unsupported conversion: {source_type} to {target_type}")
        
        response = llm(messages)
        return response.content.strip()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {str(e)}")

def optimize_sql_code(sql_code: str, sql_type: str) -> str:
    """Optimize SQL code for the specified database type."""
    try:
        optimization_tips = {
            'sqlserver': [
                "Use SET NOCOUNT ON to reduce network overhead",
                "Use indexed views for frequently reused logic",
                "Use OPTION (RECOMPILE) for parameter sniffing issues",
                "Avoid calling sp_executesql repeatedly in loops",
                "Use TRY/CATCH for error handling"
            ],
            'postgresql': [
                "Use EXPLAIN (ANALYZE, BUFFERS) to inspect query plans",
                "Optimize JOIN order and use LATERAL joins",
                "Use CTEs to break down complex queries",
                "Set proper function volatility (IMMUTABLE, STABLE, VOLATILE)",
                "Use jsonb over json for better performance"
            ],
            'mysql': [
                "Use EXPLAIN FORMAT=JSON to analyze queries",
                "Optimize JSON operations and avoid repeated JSON_EXTRACT calls",
                "Use covering indexes on frequently filtered columns",
                "Consider using temporary tables for complex operations",
                "Use STRAIGHT_JOIN to enforce join order when needed"
            ]
        }
        
        tips = optimization_tips.get(sql_type, [])
        
        messages = [
            SystemMessage(content=f"You are an expert in {sql_type.upper()} optimization."),
            HumanMessage(content=f"""
            Optimize this {sql_type} code for better performance:
            
            {sql_code}
            
            Focus on these {sql_type}-specific optimizations:
            {chr(10).join(f"- {tip}" for tip in tips)}
            
            Return only the optimized code with brief inline comments explaining key optimizations.
            """)
        ]
        
        response = llm(messages)
        return response.content.strip()
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

# =============================================================================
# API Endpoints
# =============================================================================

@app.post("/convert", response_model=ConversionResponse)
async def convert_sql(request: ConversionRequest):
    """Convert SQL code between different database types."""
    converted_code = convert_sql_code(request.source_code, request.source_type, request.target_type)
    return ConversionResponse(
        converted_code=converted_code,
        source_type=request.source_type,
        target_type=request.target_type
    )

@app.post("/optimize", response_model=OptimizationResponse)
async def optimize_sql(request: OptimizationRequest):
    """Optimize SQL code for the specified database type."""
    optimized_code = optimize_sql_code(request.sql_code, request.sql_type)
    return OptimizationResponse(optimized_code=optimized_code)

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "message": "SQL Converter API",
        "version": "2.0.0",
        "supported_databases": ["sqlserver", "postgresql", "mysql"],
        "endpoints": {
            "/convert": "Convert SQL between databases",
            "/optimize": "Optimize SQL for specific database"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=config.API_HOST, port=config.API_PORT) 